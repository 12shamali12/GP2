"use client";

import type { AdminGroupItem } from "@/features/supervision/types";

type GroupDirectoryPanelProps = {
  loading: boolean;
  query: string;
  filteredGroups: AdminGroupItem[];
  onQueryChange: (value: string) => void;
  onSelectGroup: (groupId: string) => void;
};

export function GroupDirectoryPanel({
  loading,
  query,
  filteredGroups,
  onQueryChange,
  onSelectGroup,
}: GroupDirectoryPanelProps) {
  return (
    <div className="denty-panel-strong p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="denty-kicker">Directory</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Groups overview
          </h2>
        </div>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="denty-field max-w-[360px] text-sm"
          placeholder="Search by group, student name, or student ID"
        />
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-[var(--muted-foreground)]">
          Loading groups...
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectGroup(group.id)}
              className="denty-dashboard-card cursor-pointer p-5 text-left transition hover:-translate-y-1"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="denty-kicker">Group</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    {group.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {group.semesterLabel}
                  </p>
                </div>
                <span className="denty-pill">{group.members.length} students</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="denty-pill">
                  {group.partnerPairs?.length || 0} pairs
                </span>
                <span className="denty-pill">
                  {group.currentPlan ? "1 current plan" : "No active plan"}
                </span>
                <span className="denty-pill">
                  {group.nextPlans?.length || 0} next plans
                </span>
              </div>
              <div className="mt-4 rounded-[22px] border border-white/12 bg-[rgba(10,22,40,0.08)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="denty-kicker">Plan window</p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      The card stays focused on the active window and what is
                      queued next.
                    </p>
                  </div>
                  <span className="denty-pill">
                    {(group.joinRequests.length || 0) +
                      (group.partnerRequests?.length || 0)}{" "}
                    pending
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.52)]">
                      Current
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {group.currentPlan?.plan.label || "No active plan"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.52)]">
                      Next
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {group.nextPlans?.[0]?.plan.label || "No queued plan"}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
