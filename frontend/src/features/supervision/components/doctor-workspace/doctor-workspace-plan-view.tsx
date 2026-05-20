"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { DoctorWorkspaceData } from "../../types";

type Props = {
  workspace: DoctorWorkspaceData | null;
};

export function DoctorWorkspacePlanView({ workspace }: Props) {
  const t = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">{t("supervision.plan.plan_eyebrow")}</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.plan.plan_title")}
            </h3>
          </div>
          <span className="denty-pill">
            {t("supervision.plan.shifts_count", {
              count: workspace?.schedule.length || 0,
            })}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.schedule.map((assignment) => (
            <div key={assignment.id} className="denty-dashboard-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-[var(--foreground)]">{assignment.clinic.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {new Date(assignment.assignmentDate).toLocaleDateString()} - {assignment.shift.name} - {assignment.shift.startsAt} - {assignment.shift.endsAt}
                  </p>
                </div>
                {assignment.plan ? <span className="denty-pill">{assignment.plan.label}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {assignment.supervisors.length ? (
                  assignment.supervisors.map((link) => (
                    <span key={link.id} className="denty-pill">{link.supervisor.name}</span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {t("supervision.plan.supervisors_not_published")}
                  </span>
                )}
              </div>
            </div>
          ))}
          {workspace && workspace.schedule.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">
                {t("supervision.plan.schedule_eyebrow")}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("supervision.plan.no_plan")}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">{t("supervision.plan.exams_eyebrow")}</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.plan.exams_title")}
            </h3>
          </div>
          <span className="denty-pill">{workspace?.exams.length || 0}</span>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.exams.map((exam) => (
            <div key={exam.id} className="denty-dashboard-card-soft p-4">
              <p className="text-lg font-semibold text-[var(--foreground)]">{exam.title}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {exam.clinic.name} - {new Date(exam.scheduledAt).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("supervision.plan.exam_supervisor", {
                  value: exam.supervisor?.name || "-",
                })}
              </p>
              {exam.cases ? (
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {t("supervision.plan.exam_cases", { value: exam.cases })}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="denty-pill">{exam.status}</span>
                {exam.mark !== undefined && exam.mark !== null ? (
                  <span className="denty-pill">
                    {t("supervision.plan.exam_mark", { value: exam.mark })}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {workspace && workspace.exams.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">
                {t("supervision.plan.exams_eyebrow")}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("supervision.plan.no_exams")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
