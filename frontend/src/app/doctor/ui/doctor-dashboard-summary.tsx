"use client";

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
      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
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
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.16fr_0.72fr_0.72fr_0.72fr]">
        <div className="denty-panel-strong p-6 md:p-7">
          <p className="denty-kicker">Doctor workspace</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
            Welcome back, {userName || "Doctor"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            The page now starts from your actual clinical workflow first, then leaves the older
            dense operations behind one optional toggle instead of pushing everything into the
            opening view.
          </p>
        </div>

        <SummaryMetric
          label="Today"
          value={todayAppointments}
          note="Scheduled appointments"
        />
        <SummaryMetric
          label="Pending"
          value={pendingAppointments}
          note="Requests waiting for action"
        />
        <SummaryMetric
          label="Unread"
          value={unreadNotifications}
          note="Notifications in your queue"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onToggleLegacy}
          className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-white/16 bg-[rgba(255,255,255,0.42)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.68)] shadow-[0_18px_34px_rgba(7,18,34,0.08)] backdrop-blur-[16px] transition hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.54)]"
        >
          {showLegacyOps ? "Hide legacy operations" : "Open legacy operations"}
        </button>
      </div>
    </>
  );
}
