"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { SupervisorWorkspaceData } from "../../types";

type Props = {
  workspace: SupervisorWorkspaceData | null;
  selectedStudentName: string;
  taskForm: {
    title: string;
    description: string;
    dueAt: string;
    targetType: "doctor" | "group";
    groupId: string;
  };
  setTaskForm: Dispatch<SetStateAction<{
    title: string;
    description: string;
    dueAt: string;
    targetType: "doctor" | "group";
    groupId: string;
  }>>;
  submitTask: () => Promise<void>;
  unfreezeDoctor: (doctorId: string) => Promise<void>;
};

export function SupervisorWorkspaceStudentsView({
  workspace,
  selectedStudentName,
  taskForm,
  setTaskForm,
  submitTask,
  unfreezeDoctor,
}: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="denty-panel-strong p-6">
        <p className="denty-kicker">Tasks</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Assign tasks</h2>
        <div className="mt-5 grid gap-3">
          <select value={taskForm.targetType} onChange={(e) => setTaskForm((prev) => ({ ...prev, targetType: e.target.value as "doctor" | "group" }))} className="denty-field text-sm">
            <option value="doctor">Single student</option>
            <option value="group">Whole group</option>
          </select>
          {taskForm.targetType === "group" ? (
            <select value={taskForm.groupId} onChange={(e) => setTaskForm((prev) => ({ ...prev, groupId: e.target.value }))} className="denty-field text-sm">
              <option value="">Choose group</option>
              {workspace?.groupDirectory.map((group) => <option key={group.id} value={group.id}>{group.name} - {group.semesterLabel}</option>)}
            </select>
          ) : (
            <input value={selectedStudentName} readOnly className="denty-field text-sm" placeholder="Choose a student from Student finder" />
          )}
          <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="denty-field text-sm" placeholder="Task title" />
          <textarea value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} className="denty-field min-h-[110px] text-sm" placeholder="Task description" />
          <input type="datetime-local" value={taskForm.dueAt} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueAt: e.target.value }))} className="denty-field text-sm" />
          <button onClick={submitTask} className="denty-button-primary px-4 py-3 text-sm font-semibold">Assign task</button>
        </div>

        <div className="mt-5 space-y-3">
          {workspace?.activeFreezes.map((freeze) => (
            <div key={freeze.id} className="denty-dashboard-card-soft p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/profiles/${freeze.doctor.id}`}
                    className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                  >
                    {freeze.doctor.name}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    @{freeze.doctor.username}
                    {freeze.doctor.doctorIdNumber ? ` - ${freeze.doctor.doctorIdNumber}` : ""}
                  </p>
                </div>
                <button onClick={() => unfreezeDoctor(freeze.doctor.id)} className="rounded-full border border-emerald-600/28 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                  Unfreeze
                </button>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">Until {new Date(freeze.blockedUntil).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="denty-panel-strong p-6">
        <p className="denty-kicker">Group directory</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Browse groups and pairs</h2>
        <div className="mt-5 space-y-4">
          {workspace?.groupDirectory.map((group) => (
            <div key={group.id} className="denty-dashboard-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{group.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{group.semesterLabel}</p>
                </div>
                <span className="denty-pill">{group.members.length} students</span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="denty-dashboard-card-soft p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">Students</p>
                  <div className="mt-3 space-y-2">
                    {group.members.map((member) => (
                      <p key={member.doctor.id} className="text-sm text-[var(--foreground)]">
                        <Link
                          href={`/profiles/${member.doctor.id}`}
                          className="hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {member.doctor.name}
                        </Link>{" "}
                        <span className="text-[var(--muted-foreground)]">@{member.doctor.username}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="denty-dashboard-card-soft p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">Pairs</p>
                  <div className="mt-3 space-y-2">
                    {group.partnerPairs?.map((pair) => (
                      <p key={pair.id} className="text-sm text-[var(--foreground)]">
                        <Link
                          href={`/profiles/${pair.doctorOne.id}`}
                          className="hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {pair.doctorOne.name}
                        </Link>{" "}
                        +{" "}
                        <Link
                          href={`/profiles/${pair.doctorTwo.id}`}
                          className="hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {pair.doctorTwo.name}
                        </Link>
                      </p>
                    ))}
                    {!group.partnerPairs?.length ? <p className="text-sm text-[var(--muted-foreground)]">No confirmed pairs yet.</p> : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
