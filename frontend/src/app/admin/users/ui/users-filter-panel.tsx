"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type UsersFilterPanelProps = {
  query: string;
  loading: boolean;
  matchCount: number;
  totalCount: number;
  activeFilterCount: number;
  onQueryChange: (value: string) => void;
  onOpenFilter: () => void;
};

export function UsersFilterPanel({
  query,
  loading,
  matchCount,
  totalCount,
  activeFilterCount,
  onQueryChange,
  onOpenFilter,
}: UsersFilterPanelProps) {
  const t = useTranslation();

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="denty-kicker !tracking-[0.18em]">
            {t("admin.users.search_label")}
          </label>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("admin.users.search_placeholder")}
            className="denty-field mt-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenFilter}
            className="relative inline-flex min-h-[2.9rem] cursor-pointer items-center gap-2 rounded-[16px] border border-white/16 bg-white/45 px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/65"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-[rgba(9,20,38,0.86)] px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onOpenFilter}
            className="inline-flex min-h-[2.9rem] cursor-pointer items-center gap-2 rounded-[16px] border border-white/14 bg-[rgba(9,20,38,0.86)] px-4 text-sm font-semibold text-white transition hover:bg-[rgba(9,20,38,0.95)]"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("admin.export.csv")}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-[var(--muted-foreground)]">
        {loading
          ? t("admin.common.loading")
          : matchCount === totalCount
            ? t("admin.common.accounts_count", { count: totalCount })
            : `${matchCount} of ${totalCount} accounts`}
      </p>
    </div>
  );
}
