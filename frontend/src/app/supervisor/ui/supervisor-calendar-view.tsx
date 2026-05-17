"use client";

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
  const duties = [...(workspace?.clinicOverview || [])].sort(
    (a, b) => new Date(a.assignmentDate).getTime() - new Date(b.assignmentDate).getTime(),
  );
  const exams = [...(workspace?.upcomingExams || [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <div className="denty-dashboard-card overflow-hidden p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">Calendar</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Clinic duties
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              Review upcoming clinic coverage, groups on duty, and the shift assigned for each day.
            </p>
          </div>
          <span className="denty-pill">{duties.length} duties</span>
        </div>

        <div className="mt-6 max-h-[42rem] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
              Loading schedule...
            </div>
          ) : null}

          {!loading && duties.length === 0 ? (
            <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
              No clinic duties are assigned yet.
            </div>
          ) : null}

          {duties.map((duty) => (
            <article key={duty.id} className="denty-dashboard-card-soft space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    {formatDate(duty.assignmentDate)}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {duty.clinic.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {duty.shift.name} • {duty.shift.startsAt} - {duty.shift.endsAt}
                  </p>
                  {duty.plan?.label ? (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Plan: {duty.plan.label}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="denty-pill">{duty.groupAssignments.length} groups</span>
                  <span className="denty-pill">{duty.supervisors.length} supervisors</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {duty.groupAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[1.35rem] border border-[rgba(148,163,184,0.12)] bg-white/45 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">
                          {assignment.group.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {assignment.group.semesterLabel}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {assignment.group.members.length} students
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                      {assignment.slots.filter((slot) => slot.appointment).length} booked slots •{" "}
                      {assignment.group.partnerPairs.length} pairs on file
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="denty-dashboard-card overflow-hidden p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="denty-kicker">Assessments</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                Upcoming exams
              </h2>
            </div>
            <span className="denty-pill">{exams.length} scheduled</span>
          </div>

          <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-1">
            {exams.length === 0 ? (
              <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
                No exams are scheduled yet.
              </div>
            ) : null}

            {exams.map((exam) => (
              <div key={exam.id} className="denty-dashboard-card-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{exam.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {exam.student?.name || "Student"} • {exam.clinic.name}
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

        <div className="denty-dashboard-card overflow-hidden p-6">
          <p className="denty-kicker">Coverage</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Clinic snapshot</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="denty-dashboard-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Clinics
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {workspace?.clinics.length || 0}
              </p>
            </div>
            <div className="denty-dashboard-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Reports pending
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {workspace?.stats.pendingReports || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
