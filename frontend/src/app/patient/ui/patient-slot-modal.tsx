"use client";

import Link from "next/link";

type PatientSlotModalProps = {
  slot: any | null;
  selectedCaseId: string;
  loading: boolean;
  pendingSlotId: string;
  onClose: () => void;
  onCancel: () => void;
  onReserve: () => void;
};

export function PatientSlotModal({
  slot,
  selectedCaseId,
  loading,
  pendingSlotId,
  onClose,
  onCancel,
  onReserve,
}: PatientSlotModalProps) {
  if (!slot) return null;

  const selectedCase =
    (slot.caseOptions || []).find((item: any) => item.id === selectedCaseId) ||
    (slot.caseOptions || [])[0] ||
    null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(19,37,58,0.22)] p-4 backdrop-blur-md">
      <div className="denty-modal w-full max-w-2xl space-y-5 rounded-[30px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="denty-kicker">Reservation summary</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {selectedCase?.title || slot.purpose || "Clinic appointment"}
            </h3>
          </div>
          <button onClick={onClose} className="denty-action px-3 py-2 text-[11px]">
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center gap-3">
              {slot.doctor?.id ? (
                <Link
                  href={`/profiles/${slot.doctor.id}`}
                  className="denty-avatar-shell h-12 w-12 text-lg font-bold hover:scale-[1.02]"
                >
                  {slot.doctor?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.doctor.avatar}
                      alt={slot.doctor.name || "Doctor"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (slot.doctor?.name || "D").charAt(0).toUpperCase()
                  )}
                </Link>
              ) : (
                <div className="denty-avatar-shell h-12 w-12 text-lg font-bold">
                  {slot.doctor?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.doctor.avatar}
                      alt={slot.doctor.name || "Doctor"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (slot.doctor?.name || "D").charAt(0).toUpperCase()
                  )}
                </div>
              )}
              <div>
                {slot.doctor?.id ? (
                  <Link
                    href={`/profiles/${slot.doctor.id}`}
                    className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                  >
                    Dr. {slot.doctor?.name || "Unknown"}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    Dr. {slot.doctor?.name || "Unknown"}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {slot.doctor?.doctorIdNumber
                    ? `Student ID ${slot.doctor.doctorIdNumber}`
                    : "Student clinic doctor"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-white/10 bg-white/22 p-4 text-sm text-[var(--foreground)]">
              <p>
                {new Date(slot.startTime).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p>
                {new Date(slot.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(slot.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>Clinic: {slot.clinic?.name || "Clinic"}</p>
              <p>Doctor phone: {slot.doctor?.phone || "Not provided"}</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Pair-aware booking
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                This reservation locks the paired student on the same shift too, so the case stays
                with one working pair only.
              </p>
              {slot.doctor?.id ? (
                <Link
                  href={`/profiles/${slot.doctor.id}`}
                  className="mt-4 inline-flex rounded-full border border-white/12 bg-white/28 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.62)] hover:bg-white/38"
                >
                  View profile
                </Link>
              ) : null}
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Case selection</p>
                <h4 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {selectedCase?.title || "Choose a clinic case"}
                </h4>
              </div>
              <span className="denty-pill">
                {(slot.caseOptions || []).length} open case
                {(slot.caseOptions || []).length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(slot.caseOptions || []).map((item: any) => (
                <span
                  key={item.id}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                    item.id === selectedCase?.id
                      ? "border-[rgba(7,111,133,0.18)] bg-[rgba(227,244,247,0.94)] text-[rgba(7,83,96,0.94)]"
                      : "border-white/12 bg-white/22 text-[var(--muted-foreground)]"
                  }`}
                >
                  {item.title}
                </span>
              ))}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Booking outcome
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                The request stays pending until the student approves it. If the visit is cancelled,
                both paired slots become visible again.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="denty-button-secondary flex-1 px-3 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onReserve}
            disabled={loading || pendingSlotId === slot.id}
            className="denty-button-primary flex-1 px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {pendingSlotId === slot.id ? "Pending" : loading ? "Reserving..." : "Reserve"}
          </button>
        </div>
      </div>
    </div>
  );
}
