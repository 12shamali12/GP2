"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation, type Translator } from "@/features/i18n/language-provider";
import { ProfilePopup } from "@/features/profiles/components/profile-popup";
import type { FlexibleCaseReportFormData, SupervisorWorkspaceData } from "../../types";

const STAR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

type ReviewDraft = {
  mark: string;
  rating: string;
  feedback: string;
  outcome: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED";
};

type Props = {
  workspace: SupervisorWorkspaceData | null;
  reviewForms: Record<string, ReviewDraft>;
  setReviewForms: Dispatch<SetStateAction<Record<string, ReviewDraft>>>;
  submitReview: (reportId: string) => Promise<void>;
  viewerIdentifier: string;
};

type Report = NonNullable<SupervisorWorkspaceData["reports"]>[number];

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function collectSections(
  t: Translator,
  formData?: FlexibleCaseReportFormData | null,
) {
  if (!formData) return [];

  const diagnosis = Array.isArray(formData.diagnosisLines)
    ? formData.diagnosisLines.filter((line): line is string => Boolean(textValue(line)))
    : [];

  const treatment = Array.isArray(formData.treatmentVisits)
    ? formData.treatmentVisits.filter(
        (visit) => Boolean(textValue(visit?.tooth) || textValue(visit?.procedure)),
      )
    : [];

  const radiographicViews = Array.isArray(formData.radiographicViews)
    ? formData.radiographicViews.filter((value): value is string => Boolean(textValue(value)))
    : [];

  return [
    { label: t("supervision.sup.reviews.section.chief_complaint"), value: textValue(formData.chiefComplaint) },
    { label: t("supervision.sup.reviews.section.medical_history"), value: textValue(formData.medicalHistory) },
    { label: t("supervision.sup.reviews.section.dental_history"), value: textValue(formData.dentalHistory) },
    { label: t("supervision.sup.reviews.section.social_history"), value: textValue(formData.socialHistory) },
    { label: t("supervision.sup.reviews.section.extra_oral"), value: textValue(formData.extraOralFindings) },
    { label: t("supervision.sup.reviews.section.intra_oral"), value: textValue(formData.intraOralFindings) },
    { label: t("supervision.sup.reviews.section.radiographic_views"), value: radiographicViews.join(", ") },
    { label: t("supervision.sup.reviews.section.radiographic_findings"), value: textValue(formData.radiographicFindings) },
    { label: t("supervision.sup.reviews.section.diagnosis"), value: diagnosis.join(" | ") },
    { label: t("supervision.sup.reviews.section.faculty_notes"), value: textValue(formData.facultyNotes) },
    {
      label: t("supervision.sup.reviews.section.treatment_visits"),
      value: treatment
        .map((visit) => {
          const label = textValue(visit?.visitLabel) || t("supervision.sup.reviews.visit_fallback");
          const tooth = textValue(visit?.tooth);
          const procedure = textValue(visit?.procedure);
          return [label, tooth, procedure].filter(Boolean).join(": ");
        })
        .join(" | "),
    },
  ].filter((section) => Boolean(section.value));
}

function clinicName(report: Report, t: Translator) {
  return (
    report.appointment?.clinicCase?.clinic?.name ||
    report.appointment?.slot?.purpose ||
    t("supervision.sup.reviews.clinic_fallback")
  );
}

function patientName(report: Report, t: Translator) {
  return (
    report.appointment?.patient?.name ||
    report.patientName ||
    t("supervision.sup.reviews.unknown_patient")
  );
}

function visitTime(report: Report) {
  const startTime = report.appointment?.slot?.startTime;
  if (!startTime) return "";
  return new Date(startTime).toLocaleString();
}

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "report";
}

type JsPdf = import("jspdf").jsPDF;

async function loadPdfDeps() {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const JsPdfCtor = jspdfModule.default ?? jspdfModule.jsPDF;
  const autoTable = (autoTableModule.default ?? autoTableModule) as (
    doc: JsPdf,
    opts: Record<string, unknown>,
  ) => void;
  return { JsPdfCtor, autoTable };
}

const TEAL: [number, number, number] = [15, 118, 110];
const TEAL_LIGHT: [number, number, number] = [8, 145, 178];
const PANEL_BG: [number, number, number] = [243, 246, 248];
const PANEL_BG_SOFT: [number, number, number] = [249, 251, 252];
const INK: [number, number, number] = [26, 43, 58];
const MUTED: [number, number, number] = [90, 112, 128];

function renderReportToPdf(doc: JsPdf, autoTable: (d: JsPdf, o: Record<string, unknown>) => void, report: Report, t: Translator) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // ── Teal header band ─────────────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageWidth, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CASE REPORT", margin, 28);
  doc.setFontSize(18);
  const title = report.title || "—";
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const badge = report.rating
    ? `${report.status || ""}   ·   ${report.rating}/5`
    : report.status || "";
  doc.text(badge, margin, 78);
  doc.setTextColor(...INK);

  const ensureSpace = (needed: number) => {
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
    if (finalY + needed > pageHeight - margin) {
      doc.addPage();
      // reset header position on new page
      return margin;
    }
    return finalY + 10;
  };

  // ── 2x2 Info grid: Student / Clinic / Patient / Visit ────────────
  const clinic = clinicName(report, t);
  const patient = patientName(report, t);
  const visit = visitTime(report) || "—";
  const phone = report.appointment?.patient?.phone || report.patientPhone || "";
  const caseTitle =
    report.appointment?.clinicCase?.title || report.appointment?.slot?.purpose || "";

  const infoCell = (label: string, value: string, sub: string) => ({
    content: `${label.toUpperCase()}\n${value || "—"}${sub ? `\n${sub}` : ""}`,
    styles: { fillColor: PANEL_BG, cellPadding: 10, valign: "top" as const },
  });

  autoTable(doc, {
    startY: 110,
    body: [
      [infoCell("Student", report.doctor?.name || "", ""), infoCell("Clinic", clinic, "")],
      [infoCell("Patient", patient, phone), infoCell("Visit", visit, caseTitle)],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      textColor: INK,
      lineWidth: 0,
      minCellHeight: 50,
    },
    columnStyles: { 0: { cellWidth: contentWidth / 2 - 4 }, 1: { cellWidth: contentWidth / 2 - 4 } },
    margin: { left: margin, right: margin },
    didParseCell: (data: { cell: { text: string[]; styles: Record<string, unknown> } }) => {
      // Style first line (label) differently — bold uppercase, smaller, muted
      const lines = data.cell.text;
      if (lines.length >= 1) {
        // We can't style per-line in autoTable easily, so we leave plain.
        // Workaround: render label via didDrawCell as overlay (skipped for simplicity).
      }
    },
  });

  // Section helper: draws a heading + content area, returns Y after
  const drawSection = (
    headingLabel: string,
    drawBody: (startY: number) => void,
  ) => {
    const startY = ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text(headingLabel.toUpperCase(), margin, startY + 8);
    doc.setTextColor(...INK);
    drawBody(startY + 16);
  };

  // ── Supervisor Review block ──────────────────────────────────────
  const hasReview =
    (report.mark !== null && report.mark !== undefined && String(report.mark) !== "") ||
    !!report.rating ||
    !!report.feedback;
  if (hasReview) {
    drawSection("Supervisor Review", (startY) => {
      const cells: Array<{ content: string; styles: Record<string, unknown> }> = [];
      if (report.mark !== null && report.mark !== undefined && String(report.mark) !== "") {
        cells.push({
          content: `MARK\n${report.mark}`,
          styles: { fillColor: PANEL_BG_SOFT, cellPadding: 10 },
        });
      }
      if (report.rating) {
        cells.push({
          content: `RATING\n${report.rating}/5`,
          styles: { fillColor: PANEL_BG_SOFT, cellPadding: 10 },
        });
      }
      if (report.feedback) {
        cells.push({
          content: `FEEDBACK\n${report.feedback}`,
          styles: { fillColor: PANEL_BG_SOFT, cellPadding: 10 },
        });
      }
      if (cells.length === 0) return;
      // pad to row
      while (cells.length < 3) cells.push({ content: "", styles: { fillColor: PANEL_BG_SOFT } });
      autoTable(doc, {
        startY,
        body: [cells],
        theme: "plain",
        styles: { fontSize: 10, textColor: INK, lineWidth: 0, minCellHeight: 44 },
        margin: { left: margin, right: margin },
      });
    });
  }

  // ── Doctor notes ─────────────────────────────────────────────────
  const drawTextPanel = (label: string, text: string) => {
    drawSection(label, (startY) => {
      autoTable(doc, {
        startY,
        body: [[{ content: text, styles: { fillColor: PANEL_BG, cellPadding: 12 } }]],
        theme: "plain",
        styles: { fontSize: 10, textColor: INK, lineWidth: 0 },
        margin: { left: margin, right: margin },
      });
    });
  };

  if (report.appointment?.doctorCompletionNotes) {
    drawTextPanel("Doctor Completion Notes", report.appointment.doctorCompletionNotes);
  }
  if (report.description) {
    drawTextPanel("Case Summary", report.description);
  }

  // ── Linked tasks ─────────────────────────────────────────────────
  const tasks = report.taskLinks ?? [];
  if (tasks.length) {
    const taskText = tasks
      .map((link) => `• ${link.clinicTask?.title || "Task"}  (${link.role})`)
      .join("\n");
    drawTextPanel("Linked Tasks", taskText);
  }

  // ── Clinical findings: 2-col label/value table ───────────────────
  const sections = collectSections(t, report.formData);
  if (sections.length) {
    drawSection("Clinical Findings", (startY) => {
      autoTable(doc, {
        startY,
        body: sections.map((s) => [
          { content: s.label.toUpperCase(), styles: { fontStyle: "bold" as const, textColor: TEAL_LIGHT, fillColor: PANEL_BG_SOFT, cellPadding: 10 } },
          { content: s.value, styles: { fillColor: PANEL_BG_SOFT, cellPadding: 10 } },
        ]),
        theme: "plain",
        styles: { fontSize: 10, textColor: INK, lineWidth: 0 },
        columnStyles: { 0: { cellWidth: 140 } },
        margin: { left: margin, right: margin },
      });
    });
  }

  // ── Footer (last page) ───────────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 110;
  if (finalY < pageHeight - 30) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Exported ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" },
    );
  }
}

async function downloadSingleReportPdf(report: Report, t: Translator) {
  const { JsPdfCtor, autoTable } = await loadPdfDeps();
  const doc = new JsPdfCtor({ unit: "pt", format: "a4" });
  renderReportToPdf(doc, autoTable, report, t);
  doc.save(`report-${safeSlug(report.doctor?.name || "")}-${safeSlug(report.title || "")}.pdf`);
}

async function downloadReportsPdf(reports: Report[], t: Translator) {
  if (!reports.length) return;
  const { JsPdfCtor, autoTable } = await loadPdfDeps();
  const doc = new JsPdfCtor({ unit: "pt", format: "a4" });
  reports.forEach((r, i) => {
    if (i > 0) doc.addPage();
    renderReportToPdf(doc, autoTable, r, t);
  });
  doc.save(`reports-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Word .doc generation (HTML packaged as Word) ─────────────────────

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadDoc(bodyHtml: string, filename: string) {
  const fullHtml =
    `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>Case Report</title></head><body>${bodyHtml}</body></html>`;
  const blob = new Blob([`﻿${fullHtml}`], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function renderReportHtml(report: Report, t: Translator): string {
  const sections = collectSections(t, report.formData);
  const tasks = report.taskLinks ?? [];
  const clinic = clinicName(report, t);
  const patient = patientName(report, t);
  const visit = visitTime(report);
  const phone = report.appointment?.patient?.phone || report.patientPhone || "";
  const caseTitle =
    report.appointment?.clinicCase?.title || report.appointment?.slot?.purpose || "";

  const infoCell = (label: string, value: string, sub?: string) =>
    `<td style="background:#f3f6f8;padding:14px 16px;width:50%;vertical-align:top;">` +
    `<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a7080;text-transform:uppercase;">${escapeHtml(label)}</div>` +
    `<div style="font-size:15px;font-weight:600;margin-top:4px;color:#1a2b3a;">${escapeHtml(value || "—")}</div>` +
    (sub ? `<div style="font-size:12px;color:#5a7080;margin-top:2px;">${escapeHtml(sub)}</div>` : "") +
    `</td>`;

  const sectionCellsHtml = sections
    .map((s, i, arr) => {
      const cell =
        `<td style="background:#f9fbfc;padding:12px 14px;vertical-align:top;width:50%;border-left:3px solid #0891b2;">` +
        `<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a7080;text-transform:uppercase;">${escapeHtml(s.label)}</div>` +
        `<div style="margin-top:6px;font-size:13px;line-height:1.7;color:#1a2b3a;">${escapeHtml(s.value)}</div>` +
        `</td>`;
      const open = i % 2 === 0 ? "<tr>" : "";
      const close = i % 2 === 1 || i === arr.length - 1 ? "</tr>" : "";
      return `${open}${cell}${close}`;
    })
    .join("");

  return (
    `<div style="font-family:Calibri,Arial,sans-serif;color:#1a2b3a;max-width:760px;margin:0 auto;">` +
      `<div style="background:#0f766e;color:#fff;padding:22px 26px;">` +
        `<div style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;opacity:0.85;">Case Report</div>` +
        `<div style="font-size:24px;font-weight:700;margin-top:6px;">${escapeHtml(report.title)}</div>` +
        `<div style="margin-top:10px;">` +
          `<span style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(report.status)}</span>` +
          (report.rating
            ? `<span style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;font-size:11px;font-weight:600;letter-spacing:1.5px;margin-left:6px;">${escapeHtml(report.rating)}/5</span>`
            : "") +
        `</div>` +
      `</div>` +
      `<table style="width:100%;border-collapse:separate;border-spacing:8px;margin-top:14px;">` +
        `<tr>${infoCell("Student", report.doctor?.name || "")}${infoCell("Clinic", clinic)}</tr>` +
        `<tr>${infoCell("Patient", patient, phone)}${infoCell("Visit", visit, caseTitle)}</tr>` +
      `</table>` +
      ((report.mark != null && String(report.mark) !== "") || report.rating || report.feedback
        ? `<div style="margin-top:14px;padding:14px 18px;border-left:4px solid #0f766e;background:#f9fbfc;">` +
            `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0f766e;text-transform:uppercase;">Supervisor Review</div>` +
            `<table style="margin-top:8px;"><tr>` +
              (report.mark != null && String(report.mark) !== ""
                ? `<td style="padding-right:28px;"><div style="font-size:10px;color:#5a7080;text-transform:uppercase;letter-spacing:1px;">Mark</div><div style="font-size:18px;font-weight:700;">${escapeHtml(report.mark)}</div></td>`
                : "") +
              (report.rating
                ? `<td style="padding-right:28px;"><div style="font-size:10px;color:#5a7080;text-transform:uppercase;letter-spacing:1px;">Rating</div><div style="font-size:18px;font-weight:700;">${escapeHtml(report.rating)}/5</div></td>`
                : "") +
            `</tr></table>` +
            (report.feedback ? `<div style="margin-top:10px;font-size:13px;line-height:1.7;">${escapeHtml(report.feedback)}</div>` : "") +
          `</div>`
        : "") +
      (report.appointment?.doctorCompletionNotes
        ? `<div style="margin-top:14px;padding:14px 18px;background:#f3f6f8;"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a7080;text-transform:uppercase;">Doctor Completion Notes</div><div style="margin-top:6px;font-size:13px;line-height:1.7;">${escapeHtml(report.appointment.doctorCompletionNotes)}</div></div>`
        : "") +
      (report.description
        ? `<div style="margin-top:14px;padding:14px 18px;background:#f3f6f8;"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a7080;text-transform:uppercase;">Case Summary</div><div style="margin-top:6px;font-size:13px;line-height:1.7;">${escapeHtml(report.description)}</div></div>`
        : "") +
      (tasks.length
        ? `<div style="margin-top:14px;padding:14px 18px;background:#f3f6f8;"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a7080;text-transform:uppercase;">Linked Tasks</div><div style="margin-top:8px;">${tasks.map((link) => `<span style="display:inline-block;background:#fff;border:1px solid #d9e1e7;padding:4px 12px;font-size:12px;margin:0 6px 6px 0;">${escapeHtml(link.clinicTask?.title || "Task")} · ${escapeHtml(link.role)}</span>`).join("")}</div></div>`
        : "") +
      (sections.length
        ? `<div style="margin-top:18px;"><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0f766e;text-transform:uppercase;margin-bottom:8px;">Clinical Findings</div><table style="width:100%;border-collapse:separate;border-spacing:6px;">${sectionCellsHtml}</table></div>`
        : "") +
      `<div style="margin-top:22px;font-size:10px;color:#a0adb9;text-align:center;">Exported ${new Date().toLocaleString()}</div>` +
    `</div>`
  );
}

function downloadSingleReportDoc(report: Report, t: Translator) {
  downloadDoc(
    renderReportHtml(report, t),
    `report-${safeSlug(report.doctor?.name || "")}-${safeSlug(report.title || "")}.doc`,
  );
}

function downloadReportsDoc(reports: Report[], t: Translator) {
  if (!reports.length) return;
  const html =
    `<div style="font-family:Calibri,Arial,sans-serif;max-width:760px;margin:0 auto;">` +
      `<div style="font-size:22px;font-weight:700;color:#0f766e;margin-bottom:4px;">Case Reports</div>` +
      `<div style="font-size:12px;color:#5a7080;margin-bottom:20px;">${reports.length} report${reports.length === 1 ? "" : "s"} · ${escapeHtml(new Date().toLocaleString())}</div>` +
      reports
        .map((r, i) => (i > 0 ? `<div style="page-break-before:always;height:1px;"></div>` : "") + renderReportHtml(r, t))
        .join("") +
    `</div>`;
  downloadDoc(html, `reports-${new Date().toISOString().slice(0, 10)}.doc`);
}

/** Section header inside the expanded report — teal accent bar + uppercase label. */
function ExpandedSectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        aria-hidden
        className="h-[18px] w-[3px] rounded-full bg-teal-300/80"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
        {label}
      </p>
    </div>
  );
}

/** Single report card — collapsed by default, expanded on click. */
function ReportCard({
  report,
  draft,
  t,
  setReviewForms,
  submitReview,
  onOpenProfile,
}: {
  report: Report;
  draft: ReviewDraft;
  t: Translator;
  setReviewForms: Props["setReviewForms"];
  submitReview: Props["submitReview"];
  onOpenProfile: (doctorId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sections = collectSections(t, report.formData);
  const clinic = clinicName(report, t);
  const patient = patientName(report, t);
  const visit = visitTime(report);
  const studentName = report.doctor?.name || "—";
  const studentId = report.doctor?.id;
  const patientId = report.appointment?.patient?.id;

  const openStudent = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (studentId) onOpenProfile(studentId);
  };
  const openPatient = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (patientId) onOpenProfile(patientId);
  };

  const isPending = report.status === "SUBMITTED";

  return (
    <div className="denty-dashboard-card relative overflow-hidden transition hover:border-white/20">
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-[3px] ${
          isPending ? "bg-teal-300/80" : "bg-white/20"
        }`}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="flex w-full cursor-pointer items-start justify-between gap-3 p-5 pl-6 text-left transition hover:bg-white/5"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-[var(--foreground)] sm:text-lg">
              {report.title}
            </p>
            <span className="denty-pill">{report.status}</span>
            {report.rating ? <span className="denty-pill">{report.rating}/5</span> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 17h14M5 17V7l5-3 5 3v10M8 11h4M8 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="opacity-70">clinic ·</span>
              <span className="font-semibold text-[var(--foreground)]">{clinic}</span>
            </span>

            {studentId ? (
              <button
                type="button"
                onClick={openStudent}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openStudent(e);
                }}
                className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-teal-300/60 hover:bg-teal-400/22 hover:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
                title="View student profile"
              >
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/30 text-teal-50"
                >
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>{studentName}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                  className="opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <span className="opacity-70">student ·</span>
                <span className="font-semibold text-[var(--foreground)]">{studentName}</span>
              </span>
            )}

            {patientId ? (
              <button
                type="button"
                onClick={openPatient}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPatient(e);
                }}
                className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-teal-300/60 hover:bg-teal-400/22 hover:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
                title="View patient profile"
              >
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/30 text-teal-50"
                >
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>{patient}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                  className="opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <span className="opacity-70">patient ·</span>
                <span className="font-semibold text-[var(--foreground)]">{patient}</span>
              </span>
            )}

            {visit ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="opacity-85">{visit}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void downloadSingleReportPdf(report, t);
            }}
            title="Download this report as PDF"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-white/15"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 3V13M10 13L6 9M10 13L14 9M4 16H16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            PDF
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadSingleReportDoc(report, t);
            }}
            title="Download this report as Word document"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-white/15"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 3V13M10 13L6 9M10 13L14 9M4 16H16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Word
          </button>
          <span
            aria-hidden
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[var(--foreground)] transition ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-6 border-t border-white/10 p-5">
          <section>
            <ExpandedSectionHeader label="Visit overview" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("supervision.sup.reviews.patient")}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{patient}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {report.appointment?.patient?.phone ||
                    report.patientPhone ||
                    t("supervision.sup.reviews.no_phone")}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("supervision.sup.reviews.case")}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {report.appointment?.clinicCase?.title ||
                    report.appointment?.slot?.purpose ||
                    t("supervision.sup.reviews.case_general")}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {visit || t("supervision.sup.reviews.no_time")}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("supervision.sup.reviews.doctor_notes")}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                  {report.appointment?.doctorCompletionNotes ||
                    t("supervision.sup.reviews.no_post_visit_notes")}
                </p>
              </div>
            </div>
          </section>

          {report.description ? (
            <section>
              <ExpandedSectionHeader label={t("supervision.sup.reviews.case_summary")} />
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-sm leading-7 text-[var(--foreground)]">
                  {report.description}
                </p>
              </div>
            </section>
          ) : null}

          {report.taskLinks?.length ? (
            <section>
              <ExpandedSectionHeader label={t("supervision.sup.reviews.tasks_linked")} />
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <div className="flex flex-wrap gap-2">
                  {report.taskLinks.map((link) => (
                    <span key={link.id} className="denty-pill">
                      {link.clinicTask?.title ||
                        t("supervision.sup.reviews.clinic_task_fallback")}{" "}
                      · {link.role}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {sections.length ? (
            <section>
              <ExpandedSectionHeader label="Clinical findings" />
              <div className="grid gap-3 md:grid-cols-2">
                {sections.map((section) => (
                  <div
                    key={section.label}
                    className="rounded-[22px] border border-white/10 bg-white/18 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      {section.label}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {section.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3 rounded-[22px] border border-white/10 bg-white/8 p-5">
            <ExpandedSectionHeader label="Your review" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={draft.mark}
                onChange={(e) =>
                  setReviewForms((prev) => ({
                    ...prev,
                    [report.id]: { ...draft, mark: e.target.value },
                  }))
                }
                className="denty-field text-sm"
                placeholder={t("supervision.sup.reviews.mark_placeholder")}
              />
              <select
                value={draft.rating}
                onChange={(e) =>
                  setReviewForms((prev) => ({
                    ...prev,
                    [report.id]: { ...draft, rating: e.target.value },
                  }))
                }
                className="denty-field cursor-pointer text-sm"
              >
                {STAR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.toFixed(1)} / 5
                  </option>
                ))}
              </select>
              <select
                value={draft.outcome}
                onChange={(e) =>
                  setReviewForms((prev) => ({
                    ...prev,
                    [report.id]: {
                      ...draft,
                      outcome: e.target.value as ReviewDraft["outcome"],
                    },
                  }))
                }
                className="denty-field cursor-pointer text-sm"
              >
                <option value="REVIEWED">
                  {t("supervision.sup.reviews.outcome_approve")}
                </option>
                <option value="NEEDS_EDIT">
                  {t("supervision.sup.reviews.outcome_needs_edit")}
                </option>
                <option value="CASE_REJECTED">
                  {t("supervision.sup.reviews.outcome_reject")}
                </option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <textarea
                value={draft.feedback}
                onChange={(e) =>
                  setReviewForms((prev) => ({
                    ...prev,
                    [report.id]: { ...draft, feedback: e.target.value },
                  }))
                }
                className="denty-field min-h-[96px] text-sm"
                placeholder={t("supervision.sup.reviews.feedback_placeholder")}
              />
              <button
                onClick={() => submitReview(report.id)}
                className="denty-button-secondary w-full px-4 py-3 text-sm font-semibold sm:w-auto"
              >
                {t("supervision.sup.reviews.save_review")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function SupervisorWorkspaceReviewsView({
  workspace,
  reviewForms,
  setReviewForms,
  submitReview,
  viewerIdentifier,
}: Props) {
  const t = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "SUBMITTED" | "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7d" | "30d" | "older">("all");
  const [profileTargetId, setProfileTargetId] = useState<string | null>(null);
  const reports = workspace?.reports ?? [];

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const passesTimeFilter = (r: Report) => {
    if (timeFilter === "all") return true;
    const startTime = r.appointment?.slot?.startTime;
    const ts = startTime ? new Date(startTime).getTime() : NaN;
    if (Number.isNaN(ts)) return timeFilter === "older";
    switch (timeFilter) {
      case "today":
        return ts >= startOfTodayMs;
      case "7d":
        return ts >= sevenDaysAgo;
      case "30d":
        return ts >= thirtyDaysAgo;
      case "older":
        return ts < thirtyDaysAgo;
      default:
        return true;
    }
  };

  const needle = searchTerm.trim().toLowerCase();
  const filtered = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!passesTimeFilter(r)) return false;
    if (!needle) return true;
    const haystack = [
      r.title,
      r.doctor?.name,
      clinicName(r, t),
      patientName(r, t),
      r.appointment?.clinicCase?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  const pending = filtered.filter((r) => r.status === "SUBMITTED");
  const done = filtered.filter((r) => r.status !== "SUBMITTED");

  const makeDraft = (report: Report): ReviewDraft =>
    reviewForms[report.id] || {
      mark: String(report.mark ?? ""),
      rating: report.rating ? String(report.rating) : "4.5",
      feedback: report.feedback || "",
      outcome:
        report.status === "CASE_REJECTED" || report.status === "NEEDS_EDIT"
          ? report.status
          : "REVIEWED",
    };

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="denty-kicker">
            {t("supervision.sup.reviews.reports_eyebrow")}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("supervision.sup.reviews.reports_title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("supervision.sup.reviews.reports_description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="denty-pill">
            {filtered.length}
            {filtered.length !== reports.length ? ` / ${reports.length}` : ""}
          </span>
          <button
            type="button"
            onClick={() => void downloadReportsPdf(filtered, t)}
            disabled={!filtered.length}
            className="denty-button-secondary px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => downloadReportsDoc(filtered, t)}
            disabled={!filtered.length}
            className="denty-button-secondary px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Word
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, clinic, patient, or title"
            className="denty-field w-full pl-10 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="denty-field cursor-pointer text-sm sm:min-w-[180px]"
          title="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="SUBMITTED">Pending review</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="NEEDS_EDIT">Needs edit</option>
          <option value="CASE_REJECTED">Case rejected</option>
        </select>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
          className="denty-field cursor-pointer text-sm sm:min-w-[160px]"
          title="Filter by visit time"
        >
          <option value="all">Any time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="older">Older than 30 days</option>
        </select>
      </div>

      <div className="mt-5 max-h-[72vh] space-y-7 overflow-y-auto pr-1">
        <section>
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden className="h-5 w-[3px] rounded-full bg-teal-300/70" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
              Awaiting your review
            </p>
            <span className="denty-pill">{pending.length}</span>
            <span className="ml-auto h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
          </div>
          {pending.length ? (
            <div className="space-y-3">
              {pending.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  draft={makeDraft(report)}
                  t={t}
                  setReviewForms={setReviewForms}
                  submitReview={submitReview}
                  onOpenProfile={setProfileTargetId}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No reports waiting for your review.
            </p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden className="h-5 w-[3px] rounded-full bg-teal-300/70" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
              Marked &amp; done
            </p>
            <span className="denty-pill">{done.length}</span>
            <span className="ml-auto h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
          </div>
          {done.length ? (
            <div className="space-y-3">
              {done.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  draft={makeDraft(report)}
                  t={t}
                  setReviewForms={setReviewForms}
                  submitReview={submitReview}
                  onOpenProfile={setProfileTargetId}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No reviewed reports yet.
            </p>
          )}
        </section>
      </div>

      <ProfilePopup
        targetId={profileTargetId}
        viewerIdentifier={viewerIdentifier}
        onClose={() => setProfileTargetId(null)}
      />
    </div>
  );
}
