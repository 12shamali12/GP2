"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { useTranslation } from "@/features/i18n/language-provider";

type PatientCareDeskViewProps = {
  uniqueUpcoming: any[];
  availableSlots: any[];
  history: any[];
  unreadNotifications: number;
  selectedType: string;
  selectedMonth: number | "all";
  selectedYear: number | "all";
  selectedDay: Date | null;
  filteredDays: Date[];
  clinicOptions: Array<{ id: string; name: string }>;
  caseOptions: Array<{ id: string; title: string; clinicName: string }>;
  selectedClinicId: string;
  selectedClinicCaseId: string;
  bookingForm: {
    slotId: string;
    clinicCaseId: string;
    clinicName: string;
    caseTitle: string;
    reason: string;
    doctor: string;
  };
  error: string | null;
  message: string | null;
  reservationRef: RefObject<HTMLDivElement | null>;
  onReserveClick: () => void;
  onSelectedTypeChange: (value: string) => void;
  onSelectedMonthChange: (value: number | "all") => void;
  onSelectedYearChange: (value: number | "all") => void;
  onSelectedDayChange: (value: Date) => void;
  onSelectedClinicChange: (value: string) => void;
  onSelectedClinicCaseChange: (value: string) => void;
  onSelectSlot: (slot: any) => void;
  onSelectAppointment: (appointment: any) => void;
};

export function PatientCareDeskView({
  uniqueUpcoming,
  availableSlots,
  history,
  unreadNotifications,
  selectedType,
  selectedMonth,
  selectedYear,
  selectedDay,
  filteredDays,
  clinicOptions,
  caseOptions,
  selectedClinicId,
  selectedClinicCaseId,
  bookingForm,
  error,
  message,
  reservationRef,
  onReserveClick,
  onSelectedTypeChange,
  onSelectedMonthChange,
  onSelectedYearChange,
  onSelectedDayChange,
  onSelectedClinicChange,
  onSelectedClinicCaseChange,
  onSelectSlot,
  onSelectAppointment,
}: PatientCareDeskViewProps) {
  const t = useTranslation();
  const selectedClinic =
    selectedClinicId === "all"
      ? null
      : clinicOptions.find((clinic) => clinic.id === selectedClinicId) || null;
  const selectedCase =
    selectedClinicCaseId === "all"
      ? null
      : caseOptions.find((clinicCase) => clinicCase.id === selectedClinicCaseId) || null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="denty-panel-strong space-y-5 px-4 py-5 sm:px-6 md:py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="denty-kicker">{t("patient.care.upcoming_eyebrow")}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {t("patient.care.upcoming_title")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                {t("patient.care.upcoming_description")}
              </p>
            </div>
            <button
              onClick={onReserveClick}
              className="denty-button-primary px-5 py-3 text-sm font-semibold"
            >
              {t("patient.care.reserve_button")}
            </button>
          </div>

          <div className="space-y-3">
            {uniqueUpcoming.length === 0 ? (
              <div className="denty-dashboard-card-soft p-5 text-sm text-[var(--muted-foreground)]">
                {t("patient.care.no_appointments")}
              </div>
            ) : null}

            {uniqueUpcoming.map((appointment) => {
              const start = appointment.slot?.startTime
                ? new Date(appointment.slot.startTime)
                : null;
              const end = appointment.slot?.endTime
                ? new Date(appointment.slot.endTime)
                : null;
              const doctorName =
                appointment.slot?.doctor?.name || t("patient.common.doctor");
              const avatar = appointment.slot?.doctor?.avatar || "";
              const initial = doctorName.charAt(0).toUpperCase();

              return (
                <div
                  key={appointment.id}
                  className="denty-list-row flex w-full flex-col gap-4 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="denty-avatar-shell h-12 w-12 shrink-0 text-lg font-bold">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatar}
                          alt={doctorName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div>
                      {appointment.slot?.doctor?.id ? (
                        <Link
                          href={`/profiles/${appointment.slot.doctor.id}`}
                          className="font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {t("patient.appt.doctor_prefix", {
                            name: doctorName,
                          })}
                        </Link>
                      ) : (
                        <p className="font-semibold text-[var(--foreground)]">
                          {t("patient.appt.doctor_prefix", {
                            name: doctorName,
                          })}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {start
                          ? `${start.toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })} ${start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}${
                              end
                                ? ` - ${end.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : ""
                            }`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {t("patient.care.status_label", {
                          value: appointment.status,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={`denty-status-chip ${
                        appointment.status === "APPROVED"
                          ? "border-[rgba(16,185,129,0.18)] bg-[rgba(236,253,245,0.96)] text-[#047857]"
                          : appointment.status === "REJECTED"
                            ? "border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.96)] text-[#b91c1c]"
                            : "denty-status-chip-strong"
                      }`}
                    >
                      {appointment.slot?.purpose || t("patient.common.general")}
                    </span>
                    <div className="flex items-center gap-2">
                      {appointment.slot?.doctor?.id ? (
                        <Link
                          href={`/profiles/${appointment.slot.doctor.id}`}
                          className="denty-pill hover:bg-white/36"
                        >
                          {t("patient.common.profile")}
                        </Link>
                      ) : null}
                      <button
                        onClick={() => onSelectAppointment(appointment)}
                        className="denty-action px-3 py-2 text-[11px]"
                      >
                        {t("patient.care.view_details")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_upcoming")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {uniqueUpcoming.length}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.stat_upcoming_note")}
            </p>
          </div>
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_availability")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {availableSlots.length}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.stat_availability_note")}
            </p>
          </div>
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_history")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {history.length}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.stat_history_note")}
            </p>
          </div>
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_alerts")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {unreadNotifications}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.stat_alerts_note")}
            </p>
          </div>
        </div>
      </div>

      <div ref={reservationRef} className="denty-dashboard-card space-y-5 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="denty-kicker">{t("patient.care.booking_eyebrow")}</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("patient.care.booking_title")}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("patient.care.booking_description")}
            </p>
          </div>
          <span className="denty-pill">{t("patient.care.live_filtering")}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.visit_intent")}
            </label>
            <select
              value={selectedType}
              onChange={(event) => onSelectedTypeChange(event.target.value)}
              className="denty-field"
            >
              <option value="">{t("patient.care.all_visit_intents")}</option>
              <option value="General">{t("patient.care.intent_general")}</option>
              <option value="Check-up">{t("patient.care.intent_checkup")}</option>
              <option value="Cleaning">{t("patient.care.intent_cleaning")}</option>
              <option value="Pain/Urgent">{t("patient.care.intent_pain")}</option>
              <option value="Whitening">{t("patient.care.intent_whitening")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.clinic")}
            </label>
            <select
              value={selectedClinicId}
              onChange={(event) => onSelectedClinicChange(event.target.value)}
              className="denty-field"
            >
              <option value="all">{t("patient.care.all_clinics")}</option>
              {clinicOptions.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.case")}
            </label>
            <select
              value={selectedClinicCaseId}
              onChange={(event) => onSelectedClinicCaseChange(event.target.value)}
              className="denty-field"
            >
              <option value="all">{t("patient.care.all_cases")}</option>
              {caseOptions.map((clinicCase) => (
                <option key={clinicCase.id} value={clinicCase.id}>
                  {clinicCase.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.month_year")}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(event) =>
                  onSelectedMonthChange(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
                className="denty-field flex-1"
              >
                <option value="all">{t("patient.care.all_months")}</option>
                {[...Array(12).keys()].map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month, 1).toLocaleString(undefined, {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(event) =>
                  onSelectedYearChange(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
                className="denty-field w-32"
              >
                <option value="all">{t("patient.care.all_years")}</option>
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.clinic_focus")}
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {selectedClinic?.name || t("patient.care.all_clinics")}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.clinic_focus_note")}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.case_focus")}
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {selectedCase?.title || t("patient.care.all_available_cases")}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.case_focus_note")}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/22 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.pair_booking")}
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {t("patient.care.pair_booking_value")}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("patient.care.pair_booking_note")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {t("patient.care.pick_day")}
          </p>
          <div className="grid max-h-72 grid-cols-7 gap-2 overflow-y-auto rounded-[22px] border border-[rgba(148,163,184,0.14)] bg-[rgba(244,245,247,0.88)] p-3">
            {filteredDays.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => onSelectedDayChange(date)}
                className={`rounded-lg border px-2 py-3 text-sm ${
                  selectedDay?.toDateString() === date.toDateString()
                    ? "border-[rgba(11,123,138,0.18)] bg-[rgba(230,244,246,0.9)] text-[rgba(8,68,78,0.96)]"
                    : "border-[rgba(148,163,184,0.16)] bg-white text-[var(--foreground)] hover:border-[rgba(11,123,138,0.18)]"
                }`}
              >
                <span className="block text-xs">
                  {date.toLocaleString(undefined, { month: "short" })}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedDay ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.slots_for", {
                date: selectedDay.toDateString(),
                intent: selectedType || t("patient.care.any_visit_intent"),
              })}
            </p>
            <div className="space-y-2">
              {availableSlots
                .filter((slot) => {
                  const date = new Date(slot.startTime);
                  const sameDay = date.toDateString() === selectedDay.toDateString();
                  const purpose = (slot.purpose || "").toLowerCase();
                  const matchesType =
                    !selectedType || purpose.includes(selectedType.toLowerCase());
                  const matchesClinic =
                    selectedClinicId === "all" || slot.clinic?.id === selectedClinicId;
                  const matchesCase =
                    selectedClinicCaseId === "all" ||
                    (slot.caseOptions || []).some(
                      (item: any) => item.id === selectedClinicCaseId,
                    );
                  return sameDay && matchesType && matchesClinic && matchesCase;
                })
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
                )
                .map((slot) => (
                  <div
                    key={slot.id}
                    className={`denty-list-row px-3 py-3 ${
                      bookingForm.slotId === slot.id
                        ? "border-[rgba(11,123,138,0.2)] bg-[rgba(230,244,246,0.92)]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="denty-avatar-shell h-11 w-11 shrink-0 text-lg font-bold">
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
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--foreground)]">
                            <span className="font-semibold">
                              {new Date(slot.startTime).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              {new Date(slot.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(slot.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {slot.doctor?.id ? (
                              <Link
                                href={`/profiles/${slot.doctor.id}`}
                                className="hover:text-[rgba(7,111,133,0.96)]"
                              >
                                {t("patient.appt.doctor_prefix", {
                                  name:
                                    slot.doctor?.name ||
                                    t("patient.common.unknown"),
                                })}
                              </Link>
                            ) : (
                              <>
                                {t("patient.appt.doctor_prefix", {
                                  name:
                                    slot.doctor?.name ||
                                    t("patient.common.unknown"),
                                })}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {slot.clinic?.name || t("patient.common.clinic")} |{" "}
                            {slot.doctor?.doctorIdNumber ||
                              t("patient.care.student_fallback")}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {t("patient.care.eligible_cases", {
                              count: (slot.caseOptions || []).length,
                              plural:
                                (slot.caseOptions || []).length === 1 ? "" : "s",
                            })}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(slot.caseOptions || []).slice(0, 4).map((item: any) => (
                              <span
                                key={item.id}
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  selectedClinicCaseId !== "all" && item.id === selectedClinicCaseId
                                    ? "border-[rgba(7,111,133,0.18)] bg-[rgba(227,244,247,0.94)] text-[rgba(7,83,96,0.94)]"
                                    : "border-white/12 bg-white/24 text-[var(--muted-foreground)]"
                                }`}
                              >
                                {item.title}
                              </span>
                            ))}
                            {(slot.caseOptions || []).length > 4 ? (
                              <span className="rounded-full border border-white/12 bg-white/24 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                {t("patient.care.more_cases", {
                                  count: (slot.caseOptions || []).length - 4,
                                })}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectSlot(slot)}
                        className="denty-action denty-action-primary w-full shrink-0 sm:w-auto"
                      >
                        {t("patient.care.choose")}
                      </button>
                    </div>
                  </div>
                ))}
              {availableSlots.filter((slot) => {
                const date = new Date(slot.startTime);
                const sameDay = date.toDateString() === selectedDay.toDateString();
                const purpose = (slot.purpose || "").toLowerCase();
                const matchesType =
                  !selectedType || purpose.includes(selectedType.toLowerCase());
                const matchesClinic =
                  selectedClinicId === "all" || slot.clinic?.id === selectedClinicId;
                const matchesCase =
                  selectedClinicCaseId === "all" ||
                  (slot.caseOptions || []).some(
                    (item: any) => item.id === selectedClinicCaseId,
                  );
                return sameDay && matchesType && matchesClinic && matchesCase;
              }).length === 0 ? (
                <div className="denty-dashboard-card-soft p-5 text-sm leading-7 text-[var(--muted-foreground)]">
                  {t("patient.care.no_slots_match")}
                </div>
              ) : null}
              {error ? <p className="text-sm text-[#b91c1c]">{error}</p> : null}
              {message ? <p className="text-sm text-[#047857]">{message}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
