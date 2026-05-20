"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type DoctorDashboardSummaryProps = {
  userName: string;
  todayAppointments: number;
  pendingAppointments: number;
  unreadNotifications: number;
  showLegacyOps: boolean;
  onToggleLegacy: () => void;
};

function SummaryMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="denty-dashboard-card p-5">
      <p className="denty-kicker !tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{note}</p>
    </div>
  );
}

export function DoctorDashboardSummary({
  userName,
  todayAppointments,
  pendingAppointments,
  unreadNotifications,
  showLegacyOps,
  onToggleLegacy,
}: DoctorDashboardSummaryProps) {
  const t = useTranslation();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.16fr_0.72fr_0.72fr_0.72fr]">
        <div className="denty-panel-strong p-5 sm:col-span-2 md:p-6 xl:col-span-1">
          <p className="denty-kicker">{t("doctor.common.workspace")}</p>
          <h1 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("doctor.summary.welcome", {
              name: userName || t("doctor.common.doctor"),
            })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            {t("doctor.summary.intro")}
          </p>
        </div>

        <SummaryMetric
          label={t("doctor.summary.today")}
          value={todayAppointments}
          note={t("doctor.summary.today_note")}
        />
        <SummaryMetric
          label={t("doctor.summary.pending")}
          value={pendingAppointments}
          note={t("doctor.summary.pending_note")}
        />
        <SummaryMetric
          label={t("doctor.summary.unread")}
          value={unreadNotifications}
          note={t("doctor.summary.unread_note")}
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onToggleLegacy}
          className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-white/16 bg-[rgba(255,255,255,0.42)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.68)] shadow-[0_18px_34px_rgba(7,18,34,0.08)] backdrop-blur-[16px] transition hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.54)]"
        >
          {showLegacyOps
            ? t("doctor.summary.hide_legacy")
            : t("doctor.summary.open_legacy")}
        </button>
      </div>
    </>
  );
}
