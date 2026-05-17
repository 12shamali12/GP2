"use client";

import type { SupervisorWorkspaceData } from "../../types";
import { supervisorWorkspaceViewLabels, type SupervisorWorkspaceViewKey } from "./supervisor-workspace-types";

type Props = {
  view: SupervisorWorkspaceViewKey;
  workspace: SupervisorWorkspaceData | null;
  tabClass: string;
  onChange: (view: SupervisorWorkspaceViewKey) => void;
};

export function SupervisorWorkspaceHero({ view, workspace, tabClass, onChange }: Props) {
  return (
    <section className="frozen-stage relative overflow-hidden rounded-[38px] border border-white/10 px-6 py-7 text-white shadow-[0_34px_90px_rgba(4,11,26,0.3)] md:px-8 md:py-8">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,34,0.86),rgba(11,24,42,0.58),rgba(15,50,78,0.34))]" />
      <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="denty-kicker !text-white/62">Supervisor clinical workspace</p>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
            Search any student, supervise clinic duties, and review work from one desk.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            This workspace now follows the real supervision model: clinic duties drive visibility, students are searchable by ID, and exam and freeze actions are tied to the student you choose.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {(Object.entries(supervisorWorkspaceViewLabels) as Array<[SupervisorWorkspaceViewKey, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={`${tabClass} ${view === key ? "!border-white/26 !bg-white/18 !text-white" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Clinic duties</p><p className="mt-3 text-2xl font-semibold text-white">{workspace?.clinicOverview.length || 0}</p></div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Visible groups</p><p className="mt-3 text-2xl font-semibold text-white">{workspace?.stats.groups || 0}</p></div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Pending reports</p><p className="mt-3 text-2xl font-semibold text-white">{workspace?.stats.pendingReports || 0}</p></div>
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">Active freezes</p><p className="mt-3 text-2xl font-semibold text-white">{workspace?.activeFreezes.length || 0}</p></div>
        </div>
      </div>
    </section>
  );
}
