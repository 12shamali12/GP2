"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PatientAppointmentModalProps = {
  appointment: any | null;
  cancellingId: string;
  onClose: () => void;
  onCancelReservation: () => void;
  onRateDoctor: (stars: number, comment?: string) => void;
};

const STAR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function PatientAppointmentModal({
  appointment,
  cancellingId,
  onClose,
  onCancelReservation,
  onRateDoctor,
}: PatientAppointmentModalProps) {
  const [stars, setStars] = useState("5");
  const [comment, setComment] = useState("");

  const patientRating = useMemo(
    () =>
      appointment?.ratings?.find(
        (rating: any) => rating.kind === "PATIENT_TO_DOCTOR" && rating.active !== false,
      ) || null,
    [appointment],
  );

  useEffect(() => {
    if (!appointment) return;
    setStars(String(patientRating?.stars ?? 5));
    setComment(patientRating?.comment ?? "");
  }, [appointment, patientRating]);

  if (!appointment) return null;

  const doctorName =
    appointment.slot?.doctor?.name ||
    appointment.doctor?.name ||
    "Doctor";
  const clinicName =
    appointment.clinicCase?.clinic?.name || appointment.slot?.clinic?.name || "Clinic";
  const caseTitle = appointment.clinicCase?.title || appointment.slot?.purpose || "General";
  const reportRejected = appointment.report?.status === "CASE_REJECTED";
  const canRate = appointment.status === "COMPLETED" && !reportRejected;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(19,37,58,0.22)] p-4 backdrop-blur-md">
      <div className="denty-modal w-full max-w-2xl space-y-5 rounded-[30px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Appointment history</p>
            <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {caseTitle}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {clinicName} with Dr. {doctorName}
            </p>
          </div>
          <button onClick={onClose} className="denty-action px-3 py-2 text-[11px]">
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center gap-3">
              {appointment.slot?.doctor?.id || appointment.doctor?.id ? (
                <Link
                  href={`/profiles/${appointment.slot?.doctor?.id || appointment.doctor?.id}`}
                  className="denty-avatar-shell h-12 w-12 text-lg font-bold hover:scale-[1.02]"
                >
                  {appointment.slot?.doctor?.avatar || appointment.doctor?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={appointment.slot?.doctor?.avatar || appointment.doctor?.avatar}
                      alt={doctorName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    doctorName.charAt(0).toUpperCase()
                  )}
                </Link>
              ) : (
                <div className="denty-avatar-shell h-12 w-12 text-lg font-bold">
                  {appointment.slot?.doctor?.avatar || appointment.doctor?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={appointment.slot?.doctor?.avatar || appointment.doctor?.avatar}
                      alt={doctorName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    doctorName.charAt(0).toUpperCase()
                  )}
                </div>
              )}
              <div>
                {appointment.slot?.doctor?.id || appointment.doctor?.id ? (
                  <Link
                    href={`/profiles/${appointment.slot?.doctor?.id || appointment.doctor?.id}`}
                    className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                  >
                    Dr. {doctorName}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    Dr. {doctorName}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {appointment.doctor?.doctorIdNumber
                    ? `Student ID ${appointment.doctor.doctorIdNumber}`
                    : "Student clinic doctor"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-[var(--foreground)]">
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "Unknown"}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
                {appointment.slot?.endTime
                  ? ` - ${new Date(appointment.slot.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {appointment.status}
              </p>
              <p>
                <span className="font-semibold">Clinic:</span> {clinicName}
              </p>
              <p>
                <span className="font-semibold">Case:</span> {caseTitle}
              </p>
              {appointment.partnerDoctor?.name ? (
                <p>
                  <span className="font-semibold">Paired with:</span>{" "}
                  {appointment.partnerDoctor.id ? (
                    <Link
                      href={`/profiles/${appointment.partnerDoctor.id}`}
                      className="hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {appointment.partnerDoctor.name}
                    </Link>
                  ) : (
                    appointment.partnerDoctor.name
                  )}
                </p>
              ) : null}
            </div>

            {appointment.doctorCompletionNotes ? (
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Visit notes
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  {appointment.doctorCompletionNotes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Feedback</p>
                <h4 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Rate this appointment
                </h4>
              </div>
              {patientRating ? (
                <span className="denty-pill">Saved {patientRating.stars}/5</span>
              ) : null}
            </div>

            {canRate ? (
              <>
                <div className="grid gap-3 md:grid-cols-[0.4fr_1fr]">
                  <select
                    value={stars}
                    onChange={(event) => setStars(event.target.value)}
                    className="denty-field cursor-pointer text-sm"
                  >
                    {STAR_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value.toFixed(1)} stars
                      </option>
                    ))}
                  </select>
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="denty-field text-sm"
                    placeholder="Add a comment about the visit"
                  />
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Why this matters
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                    Your rating updates the student profile plus the overall and
                    semester leaderboards after the case is accepted by the supervisor.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onRateDoctor(Number(stars), comment)}
                    className="denty-button-primary px-4 py-3 text-sm font-semibold"
                  >
                    {patientRating ? "Update rating" : "Submit rating"}
                  </button>
                  <button
                    onClick={onClose}
                    className="denty-button-secondary px-4 py-3 text-sm font-semibold"
                  >
                    Later
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-sm leading-7 text-[var(--foreground)]">
                  {reportRejected
                    ? "The case is still under faculty correction, so this rating is temporarily unavailable."
                    : "Ratings open after the doctor marks the appointment as completed."}
                </p>
              </div>
            )}

            {appointment.status !== "COMPLETED" ? (
              <button
                onClick={onCancelReservation}
                disabled={cancellingId === appointment.id}
                className="denty-action denty-action-danger w-full px-3 py-3 text-sm disabled:opacity-60"
              >
                {cancellingId === appointment.id ? "Cancelling..." : "Cancel reservation"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
