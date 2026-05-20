"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { SupervisorWorkspaceData } from "@/features/supervision/types";

type SupervisorCalendarViewProps = {
  workspace: SupervisorWorkspaceData | null;
  loading?: boolean;
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "";

export function SupervisorCalendarView({
  workspace,
  loading = false,
}: SupervisorCalendarViewProps) {
  const t = useTranslation();
  const duties = [...(workspace?.clinicOverview || [])].sort(
    (a, b) => new Date(a.assignmentDate).getTime() - new Date(b.assignmentDate).getTime(),
  );
  const exams = [...(workspace?.upcomingExams || [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="denty-kicker">{t("supervisor.calendar.eyebrow")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervisor.calendar.title")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("supervisor.calendar.description")}
            </p>
          </div>
          <span className="denty-pill shrink-0">
            {t("supervisor.calendar.duties_count", { count: duties.length })}
          </span>
        </div>

        <div className="mt-6 max-h-[42rem] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
              {t("supervisor.calendar.loading")}
            </div>
          ) : null}

          {!loading && duties.length === 0 ? (
            <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
              {t("supervisor.calendar.empty")}
            </div>
          ) : null}

          {duties.map((duty) => (
            <article key={duty.id} className="denty-dashboard-card-soft space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    {formatDate(duty.assignmentDate)}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {duty.clinic.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {duty.shift.name} • {duty.shift.startsAt} - {duty.shift.endsAt}
                  </p>
                  {duty.plan?.label ? (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {t("supervisor.calendar.plan", { value: duty.plan.label })}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="denty-pill">
                    {t("supervisor.calendar.groups_count", {
                      count: duty.groupAssignments.length,
                    })}
                  </span>
                  <span className="denty-pill">
                    {t("supervisor.calendar.supervisors_count", {
                      count: duty.supervisors.length,
                    })}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {duty.groupAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[1.35rem] border border-[rgba(148,163,184,0.12)] bg-white/45 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--foreground)]">
                          {assignment.group.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {assignment.group.semesterLabel}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {t("supervisor.calendar.students_count", {
                          count: assignment.group.members.length,
                        })}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                      {t("supervisor.calendar.slots_summary", {
                        slots: assignment.slots.filter((slot) => slot.appointment)
                          .length,
                        pairs: assignment.group.partnerPairs.length,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="denty-kicker">{t("supervisor.calendar.assessments")}</p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {t("supervisor.calendar.upcoming_exams")}
              </h2>
            </div>
            <span className="denty-pill shrink-0">
              {t("supervisor.calendar.scheduled_count", { count: exams.length })}
            </span>
          </div>

          <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-1">
            {exams.length === 0 ? (
              <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
                {t("supervisor.calendar.exams_empty")}
              </div>
            ) : null}

            {exams.map((exam) => (
              <div key={exam.id} className="denty-dashboard-card-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{exam.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {exam.student?.name || t("supervisor.calendar.student_fallback")}{" "}
                      • {exam.clinic.name}
                    </p>
                  </div>
                  <span className="denty-pill">{exam.status}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                  {formatDateTime(exam.scheduledAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
          <p className="denty-kicker">{t("supervisor.calendar.coverage")}</p>
          <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            {t("supervisor.calendar.clinic_snapshot")}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="denty-dashboard-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {t("supervisor.calendar.clinics")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {workspace?.clinics.length || 0}
              </p>
            </div>
            <div className="denty-dashboard-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {t("supervisor.calendar.reports_pending")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {workspace?.stats.pendingReports || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
