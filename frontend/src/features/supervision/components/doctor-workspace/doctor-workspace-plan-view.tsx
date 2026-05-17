"use client";

import type { DoctorWorkspaceData } from "../../types";

type Props = {
  workspace: DoctorWorkspaceData | null;
};

export function DoctorWorkspacePlanView({ workspace }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Two-week plan</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Published clinic schedule</h3>
          </div>
          <span className="denty-pill">{workspace?.schedule.length || 0} shifts</span>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.schedule.map((assignment) => (
            <div key={assignment.id} className="denty-dashboard-card p-5">
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
                  <span className="text-sm text-[var(--muted-foreground)]">Supervisors not published yet.</span>
                )}
              </div>
            </div>
          ))}
          {workspace && workspace.schedule.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">Schedule</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">The admin has not assigned a two-week plan to your group yet.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Exams</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Clinic exams</h3>
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
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Supervisor: {exam.supervisor?.name || "-"}</p>
              {exam.cases ? <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">Cases: {exam.cases}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="denty-pill">{exam.status}</span>
                {exam.mark !== undefined && exam.mark !== null ? <span className="denty-pill">Mark {exam.mark}</span> : null}
              </div>
            </div>
          ))}
          {workspace && workspace.exams.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">Exams</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">No exams are scheduled for you yet.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
