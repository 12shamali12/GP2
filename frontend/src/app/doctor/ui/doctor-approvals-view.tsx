"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type DoctorApprovalsViewProps = {
  pendingAppointments: any[];
  loadingAction: boolean;
  onApprove: (appointmentId: string) => void;
  onReject: (appointmentId: string, note?: string) => void;
};

export function DoctorApprovalsView({
  pendingAppointments,
  loadingAction,
  onApprove,
  onReject,
}: DoctorApprovalsViewProps) {
  const t = useTranslation();

  return (
    <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="denty-kicker">{t("doctor.approvals.eyebrow")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("doctor.approvals.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("doctor.approvals.description")}
          </p>
        </div>
        <span className="denty-pill">
          {t("doctor.approvals.pending_count", {
            count: pendingAppointments.length,
          })}
        </span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {pendingAppointments.length === 0 ? (
          <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)] xl:col-span-2">
            {t("doctor.approvals.empty")}
          </div>
        ) : null}

        {pendingAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="denty-dashboard-card-soft space-y-4 p-5"
          >
            <div className="space-y-2">
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {appointment.patient?.name ||
                  appointment.patientId?.slice(0, 6) ||
                  t("doctor.common.unknown_patient")}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleString()
                  : t("doctor.common.no_time")}
              </p>
              {appointment.note ? (
                <p className="rounded-[18px] border border-[rgba(148,163,184,0.16)] bg-white/60 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {t("doctor.approvals.note", { value: appointment.note })}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onApprove(appointment.id)}
                className="denty-action denty-action-success disabled:opacity-60"
                disabled={loadingAction}
              >
                {t("doctor.common.approve")}
              </button>
              <button
                onClick={() => {
                  const note =
                    typeof window !== "undefined"
                      ? window.prompt(t("doctor.approvals.reject_prompt")) || ""
                      : "";
                  onReject(appointment.id, note);
                }}
                className="denty-action denty-action-danger disabled:opacity-60"
                disabled={loadingAction}
              >
                {t("doctor.common.reject")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
