"use client";

import type { NotificationItem } from "@/features/notifications/types/notification";

type NotificationsStreamProps = {
  loading: boolean;
  filteredItems: NotificationItem[];
  onUpdateItem: (id: string, action: "read" | "delete", read?: boolean) => void;
};

export function NotificationsStream({
  loading,
  filteredItems,
  onUpdateItem,
}: NotificationsStreamProps) {
  return (
    <div className="denty-panel-strong max-h-[50rem] overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Inbox stream
        </h2>
        <span className="denty-pill">{filteredItems.length} shown</span>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-[var(--muted-foreground)]">
          Loading notifications...
        </p>
      ) : null}

      <div className="mt-5 max-h-[40rem] space-y-3 overflow-y-auto pr-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-[26px] border p-5 shadow-[0_20px_44px_rgba(7,18,34,0.1)] ${
              item.read
                ? "border-white/12 bg-white/26"
                : "border-[rgba(137,219,255,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(230,240,247,0.32))]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.body}
                </p>
              </div>
              <span className="denty-pill">{item.read ? "Read" : "Unread"}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgba(10,22,40,0.48)]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateItem(item.id, "read", !item.read)}
                  className="denty-button-secondary px-4 py-2 text-xs font-semibold"
                >
                  {item.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateItem(item.id, "delete")}
                  className="cursor-pointer rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-2 text-xs font-semibold text-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredItems.length === 0 ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Inbox</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No notifications in this view.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
