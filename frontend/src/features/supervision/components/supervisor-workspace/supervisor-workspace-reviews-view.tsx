"use client";

import type { Dispatch, SetStateAction } from "react";
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
  selectedStudentName: string;
  examForm: {
    clinicId: string;
    shiftId: string;
    scheduledAt: string;
    title: string;
    cases: string;
  };
  examDrafts: Record<string, { mark: string; notes: string }>;
  reviewForms: Record<string, ReviewDraft>;
  setExamForm: Dispatch<
    SetStateAction<{
      clinicId: string;
      shiftId: string;
      scheduledAt: string;
      title: string;
      cases: string;
    }>
  >;
  setExamDrafts: Dispatch<
    SetStateAction<Record<string, { mark: string; notes: string }>>
  >;
  setReviewForms: Dispatch<SetStateAction<Record<string, ReviewDraft>>>;
  submitExam: () => Promise<void>;
  submitExamGrade: (examId: string) => Promise<void>;
  submitReview: (reportId: string) => Promise<void>;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function collectSections(formData?: FlexibleCaseReportFormData | null) {
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
    {
      label: "Chief complaint",
      value: textValue(formData.chiefComplaint),
    },
    {
      label: "Medical history",
      value: textValue(formData.medicalHistory),
    },
    {
      label: "Dental history",
      value: textValue(formData.dentalHistory),
    },
    {
      label: "Social history",
      value: textValue(formData.socialHistory),
    },
    {
      label: "Extra-oral findings",
      value: textValue(formData.extraOralFindings),
    },
    {
      label: "Intra-oral findings",
      value: textValue(formData.intraOralFindings),
    },
    {
      label: "Radiographic views",
      value: radiographicViews.join(", "),
    },
    {
      label: "Radiographic findings",
      value: textValue(formData.radiographicFindings),
    },
    {
      label: "Diagnosis",
      value: diagnosis.join(" | "),
    },
    {
      label: "Faculty notes",
      value: textValue(formData.facultyNotes),
    },
    {
      label: "Treatment visits",
      value: treatment
        .map((visit) => {
          const label = textValue(visit?.visitLabel) || "Visit";
          const tooth = textValue(visit?.tooth);
          const procedure = textValue(visit?.procedure);
          return [label, tooth, procedure].filter(Boolean).join(": ");
        })
        .join(" | "),
    },
  ].filter((section) => Boolean(section.value));
}

export function SupervisorWorkspaceReviewsView({
  workspace,
  selectedStudentName,
  examForm,
  examDrafts,
  reviewForms,
  setExamForm,
  setExamDrafts,
  setReviewForms,
  submitExam,
  submitExamGrade,
  submitReview,
}: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Reports</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Report review lane
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              Inspect the completed visit, read the structured case report, and decide whether the
              student passes the case, needs edits, or must repeat the case entirely.
            </p>
          </div>
          <span className="denty-pill">{workspace?.reports.length || 0}</span>
        </div>

        <div className="mt-5 space-y-4">
          {workspace?.reports.map((report) => {
            const draft = reviewForms[report.id] || {
              mark: String(report.mark ?? ""),
              rating: report.rating ? String(report.rating) : "4.5",
              feedback: report.feedback || "",
              outcome:
                report.status === "CASE_REJECTED" || report.status === "NEEDS_EDIT"
                  ? report.status
                  : "REVIEWED",
            };
            const sections = collectSections(report.formData);

            return (
              <div key={report.id} className="denty-dashboard-card space-y-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-[var(--foreground)]">
                      {report.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {report.doctor?.name} ·{" "}
                      {report.appointment?.clinicCase?.clinic?.name ||
                        report.appointment?.slot?.purpose ||
                        "Clinic"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="denty-pill">{report.status}</span>
                    {report.rating ? (
                      <span className="denty-pill">{report.rating}/5</span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Patient
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                      {report.appointment?.patient?.name || report.patientName || "Unknown"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {report.appointment?.patient?.phone || report.patientPhone || "No phone"}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Case
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                      {report.appointment?.clinicCase?.title ||
                        report.appointment?.slot?.purpose ||
                        "General"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {report.appointment?.slot?.startTime
                        ? new Date(report.appointment.slot.startTime).toLocaleString()
                        : "No time"}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Doctor notes
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                      {report.appointment?.doctorCompletionNotes ||
                        "No post-visit notes were attached."}
                    </p>
                  </div>
                </div>

                {report.description ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Case summary
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {report.description}
                    </p>
                  </div>
                ) : null}

                {report.taskLinks?.length ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Tasks linked to the report
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.taskLinks.map((link) => (
                        <span key={link.id} className="denty-pill">
                          {link.clinicTask?.title || "Clinic task"} · {link.role}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {sections.length ? (
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
                ) : null}

                <div className="grid gap-3 md:grid-cols-[0.22fr_0.24fr_0.28fr_1fr_auto]">
                  <input
                    value={draft.mark}
                    onChange={(e) =>
                      setReviewForms((prev) => ({
                        ...prev,
                        [report.id]: { ...draft, mark: e.target.value },
                      }))
                    }
                    className="denty-field text-sm"
                    placeholder="Mark / 100"
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
                        [
                          report.id
                        ]: { ...draft, outcome: e.target.value as ReviewDraft["outcome"] },
                      }))
                    }
                    className="denty-field cursor-pointer text-sm"
                  >
                    <option value="REVIEWED">Approve case</option>
                    <option value="NEEDS_EDIT">Needs edit</option>
                    <option value="CASE_REJECTED">Reject case</option>
                  </select>
                  <textarea
                    value={draft.feedback}
                    onChange={(e) =>
                      setReviewForms((prev) => ({
                        ...prev,
                        [report.id]: { ...draft, feedback: e.target.value },
                      }))
                    }
                    className="denty-field min-h-[96px] text-sm"
                    placeholder="Supervisor feedback, requested edits, or rejection reason"
                  />
                  <button
                    onClick={() => submitReview(report.id)}
                    className="denty-button-secondary px-4 py-3 text-sm font-semibold"
                  >
                    Save review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Exams</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Schedule and grade exams
            </h2>
          </div>
          <span className="denty-pill">{workspace?.upcomingExams.length || 0}</span>
        </div>
        <div className="mt-5 grid gap-3">
          <input
            value={selectedStudentName}
            readOnly
            className="denty-field text-sm"
            placeholder="Choose a student from Student finder"
          />
          <select
            value={examForm.clinicId}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, clinicId: e.target.value }))
            }
            className="denty-field text-sm"
          >
            <option value="">Choose clinic</option>
            {workspace?.clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
          <select
            value={examForm.shiftId}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, shiftId: e.target.value }))
            }
            className="denty-field text-sm"
          >
            <option value="">Optional shift</option>
            {workspace?.shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} - {shift.startsAt} - {shift.endsAt}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={examForm.scheduledAt}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
            }
            className="denty-field text-sm"
          />
          <input
            value={examForm.title}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, title: e.target.value }))
            }
            className="denty-field text-sm"
            placeholder="Exam title"
          />
          <textarea
            value={examForm.cases}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, cases: e.target.value }))
            }
            className="denty-field min-h-[110px] text-sm"
            placeholder="Cases or procedures"
          />
          <button
            onClick={submitExam}
            className="denty-button-primary px-4 py-3 text-sm font-semibold"
          >
            Schedule exam
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.upcomingExams.map((exam) => {
            const draft = examDrafts[exam.id] || { mark: "", notes: "" };
            return (
              <div key={exam.id} className="denty-dashboard-card-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {exam.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {exam.student?.name} - {exam.clinic.name} -{" "}
                      {new Date(exam.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="denty-pill">{exam.status}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
                  <input
                    value={draft.mark}
                    onChange={(e) =>
                      setExamDrafts((prev) => ({
                        ...prev,
                        [exam.id]: { ...draft, mark: e.target.value },
                      }))
                    }
                    className="denty-field text-sm"
                    placeholder="Mark / 100"
                  />
                  <input
                    value={draft.notes}
                    onChange={(e) =>
                      setExamDrafts((prev) => ({
                        ...prev,
                        [exam.id]: { ...draft, notes: e.target.value },
                      }))
                    }
                    className="denty-field text-sm"
                    placeholder="Notes"
                  />
                  <button
                    onClick={() => submitExamGrade(exam.id)}
                    className="denty-button-secondary px-4 py-3 text-sm font-semibold"
                  >
                    Grade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
