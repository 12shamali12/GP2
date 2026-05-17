"use client";

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
  return (
    <div className="denty-panel-strong p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="denty-kicker">Inbox</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Review incoming admin updates
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Join requests, partner approvals, and account-review events stay
            visible here.
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
            All
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
            Unread
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
          Mark all read
        </button>
        <button
          type="button"
          onClick={onRemoveAll}
          className="cursor-pointer rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          Remove all
        </button>
      </div>
    </div>
  );
}
