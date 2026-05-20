"use client";

import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="denty-kicker">{t("admin.groups.directory_eyebrow")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("admin.groups.directory_heading")}
          </h2>
        </div>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="denty-field text-sm sm:max-w-[360px]"
          placeholder={t("admin.groups.directory_search")}
        />
      </div>
      {loading ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="denty-skeleton denty-skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="denty-enter-stagger mt-5 grid gap-4 lg:grid-cols-2">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectGroup(group.id)}
              className="denty-dashboard-card cursor-pointer p-5 text-left transition hover:-translate-y-1"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="denty-kicker">{t("admin.groups.group")}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {group.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {group.semesterLabel}
                  </p>
                </div>
                <span className="denty-pill">
                  {t("admin.groups.students_count", {
                    count: group.members.length,
                  })}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="denty-pill">
                  {t("admin.groups.pairs_count", {
                    count: group.partnerPairs?.length || 0,
                  })}
                </span>
                <span className="denty-pill">
                  {group.currentPlan
                    ? t("admin.groups.one_current_plan")
                    : t("admin.groups.no_active_plan")}
                </span>
                <span className="denty-pill">
                  {t("admin.groups.next_plans_count", {
                    count: group.nextPlans?.length || 0,
                  })}
                </span>
              </div>
              <div className="mt-4 rounded-[22px] border border-white/12 bg-[rgba(10,22,40,0.08)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="denty-kicker">{t("admin.groups.plan_window")}</p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {t("admin.groups.plan_window_note")}
                    </p>
                  </div>
                  <span className="denty-pill">
                    {t("admin.mod.pending_count", {
                      count:
                        (group.joinRequests.length || 0) +
                        (group.partnerRequests?.length || 0),
                    })}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.52)]">
                      {t("admin.groups.current")}
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {group.currentPlan?.plan.label ||
                        t("admin.groups.no_active_plan")}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.52)]">
                      {t("admin.groups.next")}
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {group.nextPlans?.[0]?.plan.label ||
                        t("admin.groups.no_queued_plan")}
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
