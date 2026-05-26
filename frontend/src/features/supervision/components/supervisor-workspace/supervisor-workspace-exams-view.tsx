"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
import { ProfilePopup } from "@/features/profiles/components/profile-popup";
import type { SupervisorWorkspaceData } from "../../types";

type ExamForm = {
  clinicId: string;
  shiftId: string;
  scheduledAt: string;
  title: string;
  cases: string;
};

type Props = {
  workspace: SupervisorWorkspaceData | null;
  examForm: ExamForm;
  examDrafts: Record<string, { mark: string; notes: string }>;
  setExamForm: Dispatch<SetStateAction<ExamForm>>;
  setExamDrafts: Dispatch<
    SetStateAction<Record<string, { mark: string; notes: string }>>
  >;
  submitExam: (studentIds: string[]) => Promise<void>;
  submitExamGrade: (examId: string) => Promise<void>;
  viewerIdentifier: string;
};

type DoctorRow = {
  id: string;
  name: string;
  username: string;
  groupName: string;
  semesterLabel: string;
};

export function SupervisorWorkspaceExamsView({
  workspace,
  examForm,
  examDrafts,
  setExamForm,
  setExamDrafts,
  submitExam,
  submitExamGrade,
  viewerIdentifier,
}: Props) {
  const t = useTranslation();
  type Mode = "semester" | "group" | "student";
  const [mode, setMode] = useState<Mode>("semester");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [profileTargetId, setProfileTargetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allDoctors = useMemo<DoctorRow[]>(() => {
    const map = new Map<string, DoctorRow>();
    workspace?.groupDirectory.forEach((group) => {
      group.members.forEach((member) => {
        if (!map.has(member.doctor.id)) {
          map.set(member.doctor.id, {
            id: member.doctor.id,
            name: member.doctor.name,
            username: member.doctor.username,
            groupName: group.name,
            semesterLabel: group.semesterLabel,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace]);

  const allSemesters = useMemo(() => {
    const set = new Set<string>();
    workspace?.groupDirectory.forEach((g) => set.add(g.semesterLabel));
    return Array.from(set).sort();
  }, [workspace]);

  const filteredDoctors = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase();
    if (!needle) return allDoctors;
    return allDoctors.filter(
      (d) =>
        d.name.toLowerCase().includes(needle) ||
        d.username.toLowerCase().includes(needle) ||
        d.groupName.toLowerCase().includes(needle) ||
        d.semesterLabel.toLowerCase().includes(needle),
    );
  }, [allDoctors, studentSearch]);

  // Compute the resolved unique student IDs from all 3 selection methods
  const resolvedStudentIds = useMemo(() => {
    const ids = new Set<string>(selectedStudentIds);
    workspace?.groupDirectory.forEach((group) => {
      if (selectedGroupIds.includes(group.id) || selectedSemesters.includes(group.semesterLabel)) {
        group.members.forEach((m) => ids.add(m.doctor.id));
      }
    });
    return Array.from(ids);
  }, [selectedStudentIds, selectedGroupIds, selectedSemesters, workspace]);

  const toggleStudent = (id: string) =>
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleGroup = (id: string) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleSemester = (label: string) =>
    setSelectedSemesters((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );

  const clearSelection = () => {
    setSelectedStudentIds([]);
    setSelectedGroupIds([]);
    setSelectedSemesters([]);
  };

  const handleSubmit = async () => {
    if (!resolvedStudentIds.length) return;
    setSubmitting(true);
    try {
      await submitExam(resolvedStudentIds);
      clearSelection();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      {/* ── Left: schedule form with multi-target picker ────────────────── */}
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">
              {t("supervision.sup.reviews.exams_eyebrow")}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.sup.reviews.exams_title")}
            </h2>
          </div>
          <span className="denty-pill">{resolvedStudentIds.length} target{resolvedStudentIds.length === 1 ? "" : "s"}</span>
        </div>

        {/* ── Mode selector: semester → group → student ───────────────── */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <span aria-hidden className="h-3 w-[2px] rounded-full bg-teal-300/70" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Assign to
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-[14px] border border-white/10 bg-white/5 p-1">
            {(["semester", "group", "student"] as const).map((m, i) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    // Clear other modes so the resolved target stays unambiguous
                    if (m !== "semester") setSelectedSemesters([]);
                    if (m !== "group") setSelectedGroupIds([]);
                    if (m !== "student") setSelectedStudentIds([]);
                  }}
                  className={`cursor-pointer rounded-[10px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    active
                      ? "bg-teal-400/22 text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.4)]"
                      : "text-[var(--muted-foreground)] hover:bg-white/10"
                  }`}
                >
                  <span className="opacity-60">{i + 1}.</span> By {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 1: Semester ────────────────────────────────────────── */}
        {mode === "semester" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Pick one or more semesters — every student in every group under those semesters gets the exam.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allSemesters.length ? (
                allSemesters.map((label) => {
                  const checked = selectedSemesters.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleSemester(label)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        checked
                          ? "border-teal-300/55 bg-teal-400/22 text-[var(--foreground)]"
                          : "border-white/15 bg-white/5 text-[var(--muted-foreground)] hover:bg-white/12"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })
              ) : (
                <p className="px-1 text-xs text-[var(--muted-foreground)]">No semesters.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Step 2: Group ───────────────────────────────────────────── */}
        {mode === "group" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Pick one or more groups — every student in each selected group gets the exam.
            </p>
            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-[14px] border border-white/10 bg-white/5 p-2">
              {workspace?.groupDirectory.length ? (
                workspace.groupDirectory.map((g) => {
                  const checked = selectedGroupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        checked
                          ? "border-teal-300/55 bg-teal-400/22 text-[var(--foreground)]"
                          : "border-white/15 bg-white/5 text-[var(--muted-foreground)] hover:bg-white/12"
                      }`}
                    >
                      {g.name} <span className="opacity-60">· {g.semesterLabel}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-1 text-xs text-[var(--muted-foreground)]">No groups.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Step 3: Student ─────────────────────────────────────────── */}
        {mode === "student" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Search and pick individual students.
            </p>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name, username, group, or semester"
                className="denty-field w-full pl-9 text-sm"
              />
            </div>
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
              {filteredDoctors.length ? (
                filteredDoctors.map((d) => {
                  const checked = selectedStudentIds.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-[14px] border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-teal-300/55 bg-teal-400/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(d.id)}
                        className="mt-1 cursor-pointer accent-teal-400"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--foreground)]">{d.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          @{d.username} · {d.groupName} · {d.semesterLabel}
                        </p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No students found.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Summary chip + clear ────────────────────────────────────── */}
        {resolvedStudentIds.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-teal-300/25 bg-teal-400/8 px-3 py-2 text-xs">
            <span className="text-[var(--foreground)]">
              <span className="font-semibold">{resolvedStudentIds.length}</span> unique student
              {resolvedStudentIds.length === 1 ? "" : "s"} will be scheduled.
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[var(--muted-foreground)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
            >
              clear all
            </button>
          </div>
        ) : null}

        {/* ── Exam details ────────────────────────────────────────────── */}
        <div className="mt-5 grid gap-3">
          <select
            value={examForm.clinicId}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, clinicId: e.target.value }))
            }
            className="denty-field text-sm"
          >
            <option value="">{t("supervision.sup.reviews.choose_clinic")}</option>
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
            <option value="">{t("supervision.sup.reviews.optional_shift")}</option>
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
            placeholder={t("supervision.sup.reviews.exam_title_placeholder")}
          />
          <textarea
            value={examForm.cases}
            onChange={(e) =>
              setExamForm((prev) => ({ ...prev, cases: e.target.value }))
            }
            className="denty-field min-h-[100px] text-sm"
            placeholder={t("supervision.sup.reviews.exam_cases_placeholder")}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || resolvedStudentIds.length === 0}
            className="denty-button-primary px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Scheduling…"
              : resolvedStudentIds.length > 1
                ? `Schedule exam for ${resolvedStudentIds.length} students`
                : t("supervision.sup.reviews.schedule_exam")}
          </button>
        </div>
      </div>

      {/* ── Right: scheduled exams list (unchanged but styled) ─────────── */}
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="denty-kicker">Scheduled exams</p>
          <span className="denty-pill">{workspace?.upcomingExams.length || 0}</span>
        </div>
        <div className="mt-5 max-h-[68vh] space-y-3 overflow-y-auto pr-1">
          {workspace?.upcomingExams.length ? (
            workspace.upcomingExams.map((exam) => {
              const draft = examDrafts[exam.id] || { mark: "", notes: "" };
              return (
                <div key={exam.id} className="denty-dashboard-card-soft relative overflow-hidden p-4">
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-teal-300/70" />
                  <div className="pl-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">{exam.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {exam.student?.id ? (
                            <button
                              type="button"
                              onClick={() => exam.student?.id && setProfileTargetId(exam.student.id)}
                              className="cursor-pointer underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
                            >
                              {exam.student.name}
                            </button>
                          ) : (
                            exam.student?.name
                          )}{" "}
                          · {exam.clinic.name} · {new Date(exam.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="denty-pill">{exam.status}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[0.4fr_1fr_auto] sm:items-center">
                      <input
                        value={draft.mark}
                        onChange={(e) =>
                          setExamDrafts((prev) => ({
                            ...prev,
                            [exam.id]: { ...draft, mark: e.target.value },
                          }))
                        }
                        className="denty-field text-sm"
                        placeholder={t("supervision.sup.reviews.mark_placeholder")}
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
                        placeholder={t("supervision.sup.reviews.notes_placeholder")}
                      />
                      <button
                        onClick={() => submitExamGrade(exam.id)}
                        className="denty-button-secondary w-full px-4 py-3 text-sm font-semibold sm:w-auto"
                      >
                        {t("supervision.sup.reviews.grade")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No upcoming exams.</p>
          )}
        </div>
      </div>

      <ProfilePopup
        targetId={profileTargetId}
        viewerIdentifier={viewerIdentifier}
        onClose={() => setProfileTargetId(null)}
      />
    </div>
  );
}
