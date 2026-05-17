"use client";

import type { AdminGroupItem, PlanningWorkspaceData } from "@/features/supervision/types";

type PlanningPlan = PlanningWorkspaceData["plans"][number];

type PlanningAssignmentsViewProps = {
  panelClass: string;
  primaryAction: string;
  assignmentForm: {
    planId: string;
    groupId: string;
    notes: string;
  };
  sortedPlans: PlanningPlan[];
  sortedGroups: AdminGroupItem[];
  selectedAssignmentPlan: PlanningPlan | null;
  formatDateLabel: (value: string, options?: Intl.DateTimeFormatOptions) => string;
  onAssignmentFieldChange: (
    field: "planId" | "groupId" | "notes",
    value: string
  ) => void;
  onSubmitAssignment: () => void;
};

export function PlanningAssignmentsView({
  panelClass,
  primaryAction,
  assignmentForm,
  sortedPlans,
  sortedGroups,
  selectedAssignmentPlan,
  formatDateLabel,
  onAssignmentFieldChange,
  onSubmitAssignment,
}: PlanningAssignmentsViewProps) {
  const scheduledGroups = sortedGroups.filter(
    (group) => group.currentPlan || (group.nextPlans?.length || 0) > 0
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.64fr_1.36fr]">
      <div className={panelClass}>
        <p className="denty-kicker">Assignment desk</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
          Queue one plan for one group
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          A group can keep its current plan and queue the next one after it.
          Conflict checks still prevent two groups from occupying the same clinic
          during the same shift and day.
        </p>

        <div className="mt-6 space-y-3">
          <select
            value={assignmentForm.planId}
            onChange={(e) => onAssignmentFieldChange("planId", e.target.value)}
            className="denty-field cursor-pointer text-sm"
          >
            {sortedPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.label}
              </option>
            ))}
          </select>

          <select
            value={assignmentForm.groupId}
            onChange={(e) => onAssignmentFieldChange("groupId", e.target.value)}
            className="denty-field cursor-pointer text-sm"
          >
            {sortedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} | {group.semesterLabel}
              </option>
            ))}
          </select>

          <textarea
            value={assignmentForm.notes}
            onChange={(e) => onAssignmentFieldChange("notes", e.target.value)}
            className="denty-field min-h-[120px] text-sm"
            placeholder="Optional note for the assignment"
          />
        </div>

        {selectedAssignmentPlan ? (
          <div className="mt-5 rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_54px_rgba(6,17,34,0.24)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">
                  {selectedAssignmentPlan.label}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {
                    selectedAssignmentPlan.days.filter((day) => !day.isVacation)
                      .length
                  }{" "}
                  clinic days and{" "}
                  {
                    selectedAssignmentPlan.days.filter((day) => day.isVacation)
                      .length
                  }{" "}
                  free days.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
                Ready to queue
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/54">
              Queue window: {formatDateLabel(selectedAssignmentPlan.startsOn)} -{" "}
              {formatDateLabel(selectedAssignmentPlan.endsOn)}
            </p>
          </div>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            onClick={onSubmitAssignment}
            className={primaryAction}
          >
            Assign plan to group
          </button>
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="denty-kicker">Planning wall</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Current and next plans
            </h2>
          </div>
          <span className="rounded-full border border-white/14 bg-[rgba(255,255,255,0.28)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
            {scheduledGroups.length} scheduled groups
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {scheduledGroups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(229,237,243,0.18))] shadow-[0_20px_54px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
            >
              <div className="grid gap-4 border-b border-white/10 px-5 py-4 xl:grid-cols-[0.36fr_0.64fr] xl:items-center">
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">
                    {group.name}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {group.semesterLabel}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[22px] border border-[rgba(7,111,133,0.14)] bg-[rgba(7,111,133,0.08)] px-4 py-3">
                    <p className="denty-kicker !tracking-[0.16em]">Current</p>
                    {group.currentPlan ? (
                      <>
                        <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                          {group.currentPlan.plan.label}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {formatDateLabel(group.currentPlan.plan.startsOn)} - {formatDateLabel(group.currentPlan.plan.endsOn)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        No active plan right now.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/24 px-4 py-3">
                    <p className="denty-kicker !tracking-[0.16em]">Next queued</p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {group.nextPlans?.length || 0} upcoming
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {(group.nextPlans || [])[0]
                        ? `${formatDateLabel(group.nextPlans![0].plan.startsOn)} - ${formatDateLabel(group.nextPlans![0].plan.endsOn)}`
                        : "No future plan queued yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 px-5 py-4">
                {(group.nextPlans || []).slice(0, 3).map((entry, index) => (
                  <div
                    key={entry.plan.id}
                    className="grid gap-3 rounded-[22px] border border-white/10 bg-white/24 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] text-sm font-semibold text-[var(--foreground)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {entry.plan.label}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {formatDateLabel(entry.plan.startsOn)} - {formatDateLabel(entry.plan.endsOn)}
                      </p>
                    </div>
                    {entry.plan.shift ? (
                      <span className="denty-pill">{entry.plan.shift.name}</span>
                    ) : null}
                  </div>
                ))}
                {group.nextPlans && group.nextPlans.length > 3 ? (
                  <p className="text-xs uppercase tracking-[0.14em] text-[rgba(10,22,40,0.48)]">
                    +{group.nextPlans.length - 3} more queued plans
                  </p>
                ) : null}
                {!group.nextPlans?.length ? (
                  <div className="rounded-[20px] border border-dashed border-white/14 bg-white/16 px-4 py-3">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No queued plans after the current window.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {!scheduledGroups.length ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">Planning board</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                No active or upcoming group plans yet.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
