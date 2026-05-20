"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";

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
  const t = useTranslation();
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
    t("patient.common.doctor");
  const clinicName =
    appointment.clinicCase?.clinic?.name ||
    appointment.slot?.clinic?.name ||
    t("patient.common.clinic");
  const caseTitle =
    appointment.clinicCase?.title ||
    appointment.slot?.purpose ||
    t("patient.common.general");
  const reportRejected = appointment.report?.status === "CASE_REJECTED";
  const canRate = appointment.status === "COMPLETED" && !reportRejected;

  return (
    <div className="denty-backdrop-enter fixed inset-0 z-30 flex items-center justify-center bg-[rgba(19,37,58,0.22)] p-3 backdrop-blur-md sm:p-4">
      <div className="denty-modal denty-modal-enter max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl space-y-5 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="denty-kicker">{t("patient.appt.history")}</p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              {caseTitle}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.appt.with_doctor", {
                clinic: clinicName,
                doctor: doctorName,
              })}
            </p>
          </div>
          <button onClick={onClose} className="denty-action shrink-0 px-3 py-2 text-[11px]">
            {t("patient.common.close")}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="denty-dashboard-card-soft space-y-4 p-4 sm:p-5">
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
                    {t("patient.appt.doctor_prefix", { name: doctorName })}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    {t("patient.appt.doctor_prefix", { name: doctorName })}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {appointment.doctor?.doctorIdNumber
                    ? t("patient.appt.student_id", {
                        value: appointment.doctor.doctorIdNumber,
                      })
                    : t("patient.appt.student_clinic_doctor")}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-[var(--foreground)]">
              <p>
                <span className="font-semibold">{t("patient.appt.date")}</span>{" "}
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : t("patient.common.unknown")}
              </p>
              <p>
                <span className="font-semibold">{t("patient.appt.time")}</span>{" "}
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
                <span className="font-semibold">{t("patient.appt.status")}</span>{" "}
                {appointment.status}
              </p>
              <p>
                <span className="font-semibold">{t("patient.appt.clinic")}</span>{" "}
                {clinicName}
              </p>
              <p>
                <span className="font-semibold">{t("patient.appt.case")}</span>{" "}
                {caseTitle}
              </p>
              {appointment.partnerDoctor?.name ? (
                <p>
                  <span className="font-semibold">
                    {t("patient.appt.paired_with")}
                  </span>{" "}
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
                  {t("patient.appt.visit_notes")}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  {appointment.doctorCompletionNotes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="denty-kicker">{t("patient.appt.feedback")}</p>
                <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                  {t("patient.appt.rate_appointment")}
                </h4>
              </div>
              {patientRating ? (
                <span className="denty-pill shrink-0">
                  {t("patient.appt.saved_rating", {
                    stars: patientRating.stars,
                  })}
                </span>
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
                        {t("patient.appt.stars", { value: value.toFixed(1) })}
                      </option>
                    ))}
                  </select>
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="denty-field text-sm"
                    placeholder={t("patient.appt.comment_placeholder")}
                  />
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("patient.appt.why_matters")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                    {t("patient.appt.why_matters_note")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onRateDoctor(Number(stars), comment)}
                    className="denty-button-primary px-4 py-3 text-sm font-semibold"
                  >
                    {patientRating
                      ? t("patient.appt.update_rating")
                      : t("patient.appt.submit_rating")}
                  </button>
                  <button
                    onClick={onClose}
                    className="denty-button-secondary px-4 py-3 text-sm font-semibold"
                  >
                    {t("patient.appt.later")}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
                <p className="text-sm leading-7 text-[var(--foreground)]">
                  {reportRejected
                    ? t("patient.appt.rating_rejected")
                    : t("patient.appt.rating_locked")}
                </p>
              </div>
            )}

            {appointment.status !== "COMPLETED" ? (
              <button
                onClick={onCancelReservation}
                disabled={cancellingId === appointment.id}
                className="denty-action denty-action-danger w-full px-3 py-3 text-sm disabled:opacity-60"
              >
                {cancellingId === appointment.id
                  ? t("patient.appt.cancelling")
                  : t("patient.appt.cancel_reservation")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
