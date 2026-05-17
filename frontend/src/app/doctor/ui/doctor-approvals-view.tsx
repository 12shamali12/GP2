"use client";

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
  return (
    <div className="denty-dashboard-card overflow-hidden p-6 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="denty-kicker">Approval desk</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Pending reservations
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Review incoming requests without leaving the main doctor workspace.
          </p>
        </div>
        <span className="denty-pill">{pendingAppointments.length} pending</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {pendingAppointments.length === 0 ? (
          <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)] xl:col-span-2">
            No pending approvals right now.
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
                  "Unknown patient"}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleString()
                  : "No time assigned"}
              </p>
              {appointment.note ? (
                <p className="rounded-[18px] border border-[rgba(148,163,184,0.16)] bg-white/60 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  Note: {appointment.note}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onApprove(appointment.id)}
                className="denty-action denty-action-success disabled:opacity-60"
                disabled={loadingAction}
              >
                Approve
              </button>
              <button
                onClick={() => {
                  const note =
                    typeof window !== "undefined"
                      ? window.prompt("Add a rejection note (optional):") || ""
                      : "";
                  onReject(appointment.id, note);
                }}
                className="denty-action denty-action-danger disabled:opacity-60"
                disabled={loadingAction}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
