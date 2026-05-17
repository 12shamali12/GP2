"use client";

import type { DoctorWorkspaceData } from "../../types";

type Props = {
  workspace: DoctorWorkspaceData | null;
};

export function DoctorWorkspaceTasksView({ workspace }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Clinic tasks</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Semester checklist</h3>
          </div>
          <span className="denty-pill">{workspace?.clinicTasks.length || 0}</span>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.clinicTasks.map((task) => (
            <div key={task.id} className="denty-dashboard-card-soft p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--foreground)]">{task.title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">{task.clinic.name}</p>
                </div>
                <span className="denty-pill">{task.progress?.status || "PENDING"}</span>
              </div>
              {task.description ? <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{task.description}</p> : null}
              {task.progress?.mark !== undefined && task.progress?.mark !== null ? (
                <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">Mark: {task.progress.mark}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Report history</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Reviewed work</h3>
          </div>
          <span className="denty-pill">{workspace?.reports.length || 0}</span>
        </div>
        <div className="mt-5 space-y-3">
          {workspace?.reports.map((report) => (
            <div key={report.id} className="denty-dashboard-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--foreground)]">{report.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{new Date(report.submittedAt).toLocaleDateString()}</p>
                </div>
                <span className="denty-pill">{report.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{report.description}</p>
              {(report.mark !== undefined && report.mark !== null) || (report.rating !== undefined && report.rating !== null) ? (
                <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                  Mark: {report.mark ?? "-"} - Rating: {report.rating ?? "-"}
                </p>
              ) : null}
              {report.feedback ? <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{report.feedback}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
