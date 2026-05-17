"use client";

import type { DoctorWorkspaceData } from "../../types";
import { doctorWorkspaceViewLabels, type DoctorWorkspaceViewKey } from "./doctor-workspace-types";

type Props = {
  view: DoctorWorkspaceViewKey;
  workspace: DoctorWorkspaceData | null;
  currentPartner:
    | {
        name: string;
        username: string;
      }
    | null
    | undefined;
};

export function DoctorWorkspaceHero({ view, workspace, currentPartner }: Props) {
  return (
    <section className="frozen-stage relative overflow-hidden rounded-[38px] border border-white/10 px-6 py-7 text-white shadow-[0_34px_90px_rgba(4,11,26,0.3)] md:px-8 md:py-8">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,34,0.86),rgba(11,24,42,0.58),rgba(15,50,78,0.34))]" />
      <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="denty-kicker !text-white/62">Student clinical workspace</p>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
            Academic clinic desk built around the real student workflow.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            Move between clinic duties, rotation planning, semester tasks, and the group feed without the old wall of cards. The view switch now sits below as its own control lane.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
              Active view - {doctorWorkspaceViewLabels[view]}
            </span>
            {workspace?.groupMembership?.group ? (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                {workspace.groupMembership.group.name}
              </span>
            ) : null}
            {currentPartner ? (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                Partner - {currentPartner.name}
              </span>
            ) : (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                Partner pending
              </span>
            )}
            <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
              {workspace?.schedule.length || 0} scheduled duties
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Group</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {workspace?.groupMembership?.group.name || "Waiting for assignment"}
            </p>
            <p className="mt-2 text-sm text-white/66">
              {workspace?.groupMembership?.group.semesterLabel || "Request your semester group from admin."}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Partner</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {currentPartner?.name || "Pending"}
            </p>
            <p className="mt-2 text-sm text-white/66">
              {currentPartner ? `@${currentPartner.username}` : "Pairing becomes active after admin confirmation."}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Upcoming shifts</p>
            <p className="mt-3 text-2xl font-semibold text-white">{workspace?.schedule.length || 0}</p>
            <p className="mt-2 text-sm text-white/66">Availability comes from the assigned plan.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Clinic tasks</p>
            <p className="mt-3 text-2xl font-semibold text-white">{workspace?.clinicTasks.length || 0}</p>
            <p className="mt-2 text-sm text-white/66">Marks stay attached to reviewed task reports.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
