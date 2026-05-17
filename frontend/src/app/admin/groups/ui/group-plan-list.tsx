"use client";

import type { AdminGroupItem } from "@/features/supervision/types";

type GroupPlanListProps = {
  currentPlan?: AdminGroupItem["currentPlan"];
  nextPlans?: AdminGroupItem["nextPlans"];
};

export function GroupPlanList({
  currentPlan,
  nextPlans,
}: GroupPlanListProps) {
  return (
    <div className="space-y-3">
      {currentPlan ? (
        <div className="denty-dashboard-card-soft p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="denty-kicker">Current plan</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {currentPlan.plan.label}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {new Date(currentPlan.plan.startsOn).toLocaleDateString()} -{" "}
                {new Date(currentPlan.plan.endsOn).toLocaleDateString()}
              </p>
            </div>
            {currentPlan.plan.shift ? (
              <span className="denty-pill">{currentPlan.plan.shift.name}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="denty-placeholder p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            No active plan right now.
          </p>
        </div>
      )}

      <div className="rounded-[24px] border border-white/12 bg-white/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="denty-kicker">Next plans</p>
          <span className="denty-pill">{nextPlans?.length || 0} queued</span>
        </div>
        <div className="mt-3 space-y-3">
          {(nextPlans || []).slice(0, 3).map((entry) => (
            <div
              key={entry.plan.id}
              className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">
                    {entry.plan.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {new Date(entry.plan.startsOn).toLocaleDateString()} -{" "}
                    {new Date(entry.plan.endsOn).toLocaleDateString()}
                  </p>
                </div>
                {entry.plan.shift ? (
                  <span className="denty-pill">{entry.plan.shift.name}</span>
                ) : null}
              </div>
            </div>
          ))}
          {!nextPlans?.length ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No queued plans after the current window.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
