"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="denty-panel-strong p-4 sm:p-6">
        <p className="denty-kicker">{t("supervision.sup.students.tasks_eyebrow")}</p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {t("supervision.sup.students.tasks_title")}
        </h2>
        <div className="mt-5 grid gap-3">
          <select value={taskForm.targetType} onChange={(e) => setTaskForm((prev) => ({ ...prev, targetType: e.target.value as "doctor" | "group" }))} className="denty-field text-sm">
            <option value="doctor">
              {t("supervision.sup.students.target_single")}
            </option>
            <option value="group">
              {t("supervision.sup.students.target_group")}
            </option>
          </select>
          {taskForm.targetType === "group" ? (
            <select value={taskForm.groupId} onChange={(e) => setTaskForm((prev) => ({ ...prev, groupId: e.target.value }))} className="denty-field text-sm">
              <option value="">
                {t("supervision.sup.students.choose_group")}
              </option>
              {workspace?.groupDirectory.map((group) => <option key={group.id} value={group.id}>{group.name} - {group.semesterLabel}</option>)}
            </select>
          ) : (
            <input value={selectedStudentName} readOnly className="denty-field text-sm" placeholder={t("supervision.sup.students.choose_student")} />
          )}
          <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="denty-field text-sm" placeholder={t("supervision.sup.students.task_title_placeholder")} />
          <textarea value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} className="denty-field min-h-[110px] text-sm" placeholder={t("supervision.sup.students.task_desc_placeholder")} />
          <input type="datetime-local" value={taskForm.dueAt} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueAt: e.target.value }))} className="denty-field text-sm" />
          <button onClick={submitTask} className="denty-button-primary px-4 py-3 text-sm font-semibold">
            {t("supervision.sup.students.assign_task")}
          </button>
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
                  {t("supervision.sup.students.unfreeze")}
                </button>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {t("supervision.sup.students.frozen_until", {
                  date: new Date(freeze.blockedUntil).toLocaleString(),
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="denty-panel-strong p-4 sm:p-6">
        <p className="denty-kicker">
          {t("supervision.sup.students.directory_eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {t("supervision.sup.students.directory_title")}
        </h2>
        <div className="mt-5 space-y-4">
          {workspace?.groupDirectory.map((group) => (
            <div key={group.id} className="denty-dashboard-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-[var(--foreground)]">{group.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{group.semesterLabel}</p>
                </div>
                <span className="denty-pill">
                  {t("supervision.sup.students.students_count", {
                    count: group.members.length,
                  })}
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="denty-dashboard-card-soft p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                    {t("supervision.sup.students.students")}
                  </p>
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
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                    {t("supervision.sup.students.pairs")}
                  </p>
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
                    {!group.partnerPairs?.length ? (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {t("supervision.sup.students.no_pairs")}
                      </p>
                    ) : null}
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
