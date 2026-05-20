"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type SupervisorGlobalWorkspaceProps = {
  userName: string;
  globalMessages: { sender: string; text: string; createdAt: Date }[];
  globalText: string;
  onGlobalTextChange: (value: string) => void;
  onSend: () => void;
};

export function SupervisorGlobalWorkspace({
  userName,
  globalMessages,
  globalText,
  onGlobalTextChange,
  onSend,
}: SupervisorGlobalWorkspaceProps) {
  const t = useTranslation();
  return (
    <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="denty-kicker">{t("supervisor.global.eyebrow")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("supervisor.global.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("supervisor.global.description")}
          </p>
        </div>
        <span className="denty-pill">
          {userName || t("supervisor.common.supervisor")}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="denty-dashboard-card-soft max-h-[28rem] space-y-3 overflow-y-auto p-5">
          {globalMessages.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("supervisor.global.empty")}
            </p>
          ) : null}
          {globalMessages.map((message, index) => (
            <div
              key={`${message.createdAt.toISOString()}-${index}`}
              className="denty-list-row px-4 py-3"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
                <span>{message.sender || t("supervisor.global.user_fallback")}</span>
                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                  {message.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{message.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={globalText}
            onChange={(event) => onGlobalTextChange(event.target.value)}
            placeholder={t("supervisor.global.placeholder")}
            className="denty-field flex-1 text-sm"
          />
          <button onClick={onSend} className="denty-button-primary px-5 py-3 text-sm">
            {t("supervisor.common.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
