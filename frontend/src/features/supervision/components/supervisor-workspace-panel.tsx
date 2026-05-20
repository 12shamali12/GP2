"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupervisorWorkspaceData } from "../types";
import { useTranslation } from "@/features/i18n/language-provider";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { SupervisorWorkspaceHero } from "./supervisor-workspace/supervisor-workspace-hero";
import { SupervisorWorkspaceLiveView } from "./supervisor-workspace/supervisor-workspace-live-view";
import { SupervisorWorkspaceReviewsView } from "./supervisor-workspace/supervisor-workspace-reviews-view";
import { SupervisorWorkspaceStudentsView } from "./supervisor-workspace/supervisor-workspace-students-view";
import type { SearchDoctorItem, SupervisorWorkspaceViewKey } from "./supervisor-workspace/supervisor-workspace-types";

type Props = {
  apiUrl: string;
  identifier: string;
  onWorkspaceChange?: (workspace: SupervisorWorkspaceData | null) => void;
};

const tabClass =
  "rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/20 hover:bg-white/14";

export function SupervisorWorkspacePanel({ apiUrl, identifier, onWorkspaceChange }: Props) {
  const t = useTranslation();
  const [workspace, setWorkspace] = useState<SupervisorWorkspaceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<SupervisorWorkspaceViewKey>("live");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchDoctorItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SearchDoctorItem | null>(null);
  const [freezeUntil, setFreezeUntil] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    targetType: "doctor" as "doctor" | "group",
    groupId: "",
  });
  const [examForm, setExamForm] = useState({
    clinicId: "",
    shiftId: "",
    scheduledAt: "",
    title: "",
    cases: "",
  });
  const [examDrafts, setExamDrafts] = useState<Record<string, { mark: string; notes: string }>>({});
  const [reviewForms, setReviewForms] = useState<
    Record<
      string,
      {
        mark: string;
        rating: string;
        feedback: string;
        outcome: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED";
      }
    >
  >({});

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("supervisor.common.toast_workspace"),
    errorTitle: t("supervisor.common.toast_workspace"),
  });

  const loadWorkspace = async () => {
    if (!identifier) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/supervisor/workspace?identifier=${encodeURIComponent(identifier)}`,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.load_workspace"));
      setWorkspace(data);
      onWorkspaceChange?.(data);
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.load_workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2 || !identifier) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `${apiUrl}/supervisor/doctor-search?identifier=${encodeURIComponent(identifier)}&q=${encodeURIComponent(searchTerm.trim())}`,
        );
        const data = await res.json();
        if (res.ok) setSearchResults(data || []);
      } catch {
        // ignore live-search errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [apiUrl, identifier, searchTerm]);

  const submitTask = async () => {
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      setError(t("supervision.sup.error.task_required"));
      return;
    }
    if (taskForm.targetType === "doctor" && !selectedStudent?.id) {
      setError(t("supervision.sup.error.choose_student"));
      return;
    }
    if (taskForm.targetType === "group" && !taskForm.groupId) {
      setError(t("supervision.sup.error.choose_group"));
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorIdentifier: identifier,
          title: taskForm.title,
          description: taskForm.description,
          dueAt: taskForm.dueAt || undefined,
          doctorId: taskForm.targetType === "doctor" ? selectedStudent?.id : undefined,
          groupId: taskForm.targetType === "group" ? taskForm.groupId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.create_task"));
      setMessage(t("supervision.sup.msg.task_assigned"));
      setTaskForm({ title: "", description: "", dueAt: "", targetType: "doctor", groupId: "" });
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.create_task"));
    }
  };

  const submitFreeze = async () => {
    if (!selectedStudent?.id) {
      setError(t("supervision.sup.error.choose_student"));
      return;
    }
    if (!freezeUntil) {
      setError(t("supervision.sup.error.freeze_date"));
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/doctors/${selectedStudent.id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorIdentifier: identifier,
          blockedUntil: freezeUntil,
          reason: freezeReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.freeze"));
      setMessage(t("supervision.sup.msg.account_frozen"));
      setFreezeUntil("");
      setFreezeReason("");
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.freeze"));
    }
  };

  const unfreezeDoctor = async (doctorId: string) => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/doctors/${doctorId}/unfreeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorIdentifier: identifier }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.unfreeze"));
      setMessage(t("supervision.sup.msg.account_unfrozen"));
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.unfreeze"));
    }
  };

  const submitExam = async () => {
    if (!selectedStudent?.id || !examForm.clinicId || !examForm.scheduledAt || !examForm.title.trim()) {
      setError(t("supervision.sup.error.exam_required"));
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorIdentifier: identifier,
          studentId: selectedStudent.id,
          clinicId: examForm.clinicId,
          shiftId: examForm.shiftId || undefined,
          scheduledAt: examForm.scheduledAt,
          title: examForm.title,
          cases: examForm.cases || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.schedule_exam"));
      setMessage(t("supervision.sup.msg.exam_scheduled"));
      setExamForm({ clinicId: "", shiftId: "", scheduledAt: "", title: "", cases: "" });
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.schedule_exam"));
    }
  };

  const submitExamGrade = async (examId: string) => {
    const draft = examDrafts[examId];
    if (!draft?.mark) {
      setError(t("supervision.sup.error.mark_required"));
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/exams/${examId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorIdentifier: identifier,
          mark: Number(draft.mark),
          notes: draft.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.grade_exam"));
      setMessage(t("supervision.sup.msg.exam_graded"));
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.grade_exam"));
    }
  };

  const submitReview = async (reportId: string) => {
    const draft = reviewForms[reportId];
    if (!draft?.mark || !draft?.rating) {
      setError(t("supervision.sup.error.mark_rating_required"));
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/reports/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorIdentifier: identifier,
          mark: Number(draft.mark),
          rating: Number(draft.rating),
          feedback: draft.feedback || undefined,
          outcome: draft.outcome || "REVIEWED",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || t("supervision.sup.error.review_report"));
      setMessage(
        draft.outcome === "CASE_REJECTED"
          ? t("supervision.sup.msg.case_rejected")
          : draft.outcome === "NEEDS_EDIT"
            ? t("supervision.sup.msg.report_returned")
            : t("supervision.sup.msg.report_reviewed"),
      );
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || t("supervision.sup.error.review_report"));
    }
  };

  const selectedStudentFreeze = useMemo(
    () => workspace?.activeFreezes.find((freeze) => freeze.doctor.id === selectedStudent?.id),
    [workspace, selectedStudent],
  );

  return (
    <div className="space-y-5">
      <SupervisorWorkspaceHero view={view} workspace={workspace} tabClass={tabClass} onChange={setView} />

      {loading ? (
        <div className="space-y-3">
          <div className="denty-skeleton denty-skeleton-card" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="denty-skeleton denty-skeleton-card" />
            <div className="denty-skeleton denty-skeleton-card" />
          </div>
        </div>
      ) : null}

      {view === "live" ? (
        <SupervisorWorkspaceLiveView
          workspace={workspace}
          searchTerm={searchTerm}
          searchResults={searchResults}
          selectedStudent={selectedStudent}
          freezeUntil={freezeUntil}
          freezeReason={freezeReason}
          selectedStudentFreeze={selectedStudentFreeze}
          setSearchTerm={setSearchTerm}
          setSelectedStudent={setSelectedStudent}
          setFreezeUntil={setFreezeUntil}
          setFreezeReason={setFreezeReason}
          submitFreeze={submitFreeze}
          unfreezeDoctor={unfreezeDoctor}
        />
      ) : null}

      {view === "reviews" ? (
        <SupervisorWorkspaceReviewsView
          workspace={workspace}
          selectedStudentName={selectedStudent?.name || ""}
          examForm={examForm}
          examDrafts={examDrafts}
          reviewForms={reviewForms}
          setExamForm={setExamForm}
          setExamDrafts={setExamDrafts}
          setReviewForms={setReviewForms}
          submitExam={submitExam}
          submitExamGrade={submitExamGrade}
          submitReview={submitReview}
        />
      ) : null}

      {view === "students" ? (
        <SupervisorWorkspaceStudentsView
          workspace={workspace}
          selectedStudentName={selectedStudent?.name || ""}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          submitTask={submitTask}
          unfreezeDoctor={unfreezeDoctor}
        />
      ) : null}
    </div>
  );
}
