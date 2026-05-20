"use client";

import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="denty-panel-strong max-h-[50rem] overflow-hidden p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {t("admin.notif.stream")}
        </h2>
        <span className="denty-pill shrink-0">
          {t("admin.notif.shown_count", { count: filteredItems.length })}
        </span>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-[var(--muted-foreground)]">
          {t("admin.notif.loading")}
        </p>
      ) : null}

      <div className="mt-5 max-h-[40rem] space-y-3 overflow-y-auto pr-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-[20px] border p-4 shadow-[0_20px_44px_rgba(7,18,34,0.1)] sm:p-5 ${
              item.read
                ? "border-white/12 bg-white/26"
                : "border-[rgba(137,219,255,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(230,240,247,0.32))]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 max-w-3xl break-words text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.body}
                </p>
              </div>
              <span className="denty-pill shrink-0">
                {item.read
                  ? t("admin.notif.read")
                  : t("admin.notif.unread")}
              </span>
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
                  {item.read
                    ? t("admin.notif.mark_unread")
                    : t("admin.notif.mark_read")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateItem(item.id, "delete")}
                  className="cursor-pointer rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-2 text-xs font-semibold text-rose-700"
                >
                  {t("admin.common.delete")}
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredItems.length === 0 ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">{t("admin.notif.inbox")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.notif.empty")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
