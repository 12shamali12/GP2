"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type SupervisorNotificationsViewProps = {
  notifications: any[];
  unreadNotifications: number;
  prettifyBody: (text: string) => string;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onNotificationClick: (notification: any) => void;
  onDeleteNotification: (notificationId: string) => void;
  onGoToWorkspace: () => void;
};

export function SupervisorNotificationsView({
  notifications,
  unreadNotifications,
  prettifyBody,
  onMarkAllRead,
  onDeleteAll,
  onNotificationClick,
  onDeleteNotification,
  onGoToWorkspace,
}: SupervisorNotificationsViewProps) {
  const t = useTranslation();
  return (
    <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="denty-kicker">{t("supervisor.notif.eyebrow")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("supervisor.notif.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("supervisor.notif.description")}
          </p>
        </div>
        <span className="denty-pill">
          {t("supervisor.notif.unread_count", { count: unreadNotifications })}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onMarkAllRead} className="denty-action denty-action-primary">
          {t("supervisor.notif.mark_all_read")}
        </button>
        <button type="button" onClick={onDeleteAll} className="denty-action denty-action-danger">
          {t("supervisor.notif.remove_all")}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
            {t("supervisor.notif.empty")}
          </div>
        ) : null}

        {notifications.map((notification) => {
          const body = prettifyBody(notification.body || notification.text || "");
          const created =
            notification.createdAt || notification.time
              ? new Date(
                  notification.createdAt || notification.time || Date.now(),
                ).toLocaleString()
              : "";
          const read = notification.read ?? false;
          const isActionable = `${notification.title || ""} ${body}`
            .toLowerCase()
            .includes("request");

          return (
            <div
              key={notification.id}
              className="denty-dashboard-card-soft flex flex-col gap-3 p-5"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <button onClick={() => onNotificationClick(notification)} className="min-w-0 flex-1 text-left">
                  <p
                    className={`break-words text-sm leading-7 text-[var(--foreground)] ${
                      read ? "" : "font-semibold"
                    }`}
                  >
                    {body}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    {created || notification.time}
                  </p>
                </button>

                <div className="flex items-center gap-3">
                  {!read ? (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-info)]" />
                  ) : null}
                  <button
                    onClick={() => notification.id && onDeleteNotification(notification.id)}
                    className="denty-action denty-action-danger px-3 py-1.5 text-[11px]"
                    aria-label={t("supervisor.notif.delete_aria")}
                  >
                    {t("supervisor.common.delete")}
                  </button>
                </div>
              </div>

              {isActionable ? (
                <button onClick={onGoToWorkspace} className="denty-link-button self-start">
                  {t("supervisor.notif.go_to_workspace")}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
