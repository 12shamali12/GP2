"use client";

import { doctorWorkspaceViewLabels, type DoctorWorkspaceViewKey } from "./doctor-workspace-types";

type Props = {
  view: DoctorWorkspaceViewKey;
  onChange: (view: DoctorWorkspaceViewKey) => void;
  tabBaseClass: string;
  tabActiveClass: string;
  tabInactiveClass: string;
};

export function DoctorWorkspaceViewSwitch({
  view,
  onChange,
  tabBaseClass,
  tabActiveClass,
  tabInactiveClass,
}: Props) {
  return (
    <section className="denty-panel-strong px-5 py-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="denty-kicker">Workspace views</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Switch focus without leaving the page
          </h3>
        </div>
        <span className="denty-pill">{doctorWorkspaceViewLabels[view]}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {(Object.entries(doctorWorkspaceViewLabels) as Array<[DoctorWorkspaceViewKey, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`${tabBaseClass} ${view === key ? tabActiveClass : tabInactiveClass}`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
