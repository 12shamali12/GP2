"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { NotificationsFilter } from "../hooks/use-admin-notifications-workspace";

type NotificationsFilterPanelProps = {
  itemsCount: number;
  unreadCount: number;
  filter: NotificationsFilter;
  onFilterChange: (filter: NotificationsFilter) => void;
  onMarkAllRead: () => void;
  onRemoveAll: () => void;
};

export function NotificationsFilterPanel({
  itemsCount,
  unreadCount,
  filter,
  onFilterChange,
  onMarkAllRead,
  onRemoveAll,
}: NotificationsFilterPanelProps) {
  const t = useTranslation();
  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="denty-kicker">{t("admin.notif.inbox")}</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {t("admin.notif.review_heading")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            {t("admin.notif.review_intro")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold ${
              filter === "all"
                ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white"
                : "border-white/12 bg-white/26 text-[var(--foreground)]"
            }`}
          >
            {t("admin.notif.filter_all")}
            <span className="rounded-full bg-white/14 px-2 py-1 text-xs">
              {itemsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("unread")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold ${
              filter === "unread"
                ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white"
                : "border-white/12 bg-white/26 text-[var(--foreground)]"
            }`}
          >
            {t("admin.notif.filter_unread")}
            <span className="rounded-full bg-white/14 px-2 py-1 text-xs">
              {unreadCount}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onMarkAllRead}
          className="denty-button-secondary px-4 py-3 text-sm font-semibold"
        >
          {t("admin.notif.mark_all_read")}
        </button>
        <button
          type="button"
          onClick={onRemoveAll}
          className="cursor-pointer rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {t("admin.notif.remove_all")}
        </button>
      </div>
    </div>
  );
}
