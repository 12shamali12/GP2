"use client";

import Link from "next/link";
import { useMemo, useState, type RefObject } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
import { useCountUp } from "@/features/ui/hooks/use-count-up";
import { StreakSummaryWidget } from "@/features/smile-streak/components/streak-summary-widget";

/** Renders an integer stat that counts up from 0 on mount / value change. */
function StatCount({ value }: { value: number }) {
  const animated = useCountUp(value, 700);
  return <>{Math.round(animated)}</>;
}

type PatientCareDeskViewProps = {
  uniqueUpcoming: any[];
  availableSlots: any[];
  history: any[];
  unreadNotifications: number;
  selectedMonth: number | "all";
  selectedYear: number | "all";
  selectedDay: Date | null;
  filteredDays: Date[];
  caseOptions: Array<{ id: string; title: string; clinicName: string }>;
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
  onSelectedMonthChange: (value: number | "all") => void;
  onSelectedYearChange: (value: number | "all") => void;
  onSelectedDayChange: (value: Date) => void;
  onSelectedClinicCaseChange: (value: string) => void;
  onSelectSlot: (slot: any) => void;
  onSelectAppointment: (appointment: any) => void;
  onOpenStreak: () => void;
};

export function PatientCareDeskView({
  uniqueUpcoming,
  availableSlots,
  history,
  unreadNotifications,
  selectedMonth,
  selectedYear,
  selectedDay,
  filteredDays,
  caseOptions,
  selectedClinicCaseId,
  bookingForm,
  error,
  message,
  reservationRef,
  onReserveClick,
  onSelectedMonthChange,
  onSelectedYearChange,
  onSelectedDayChange,
  onSelectedClinicCaseChange,
  onSelectSlot,
  onSelectAppointment,
  onOpenStreak,
}: PatientCareDeskViewProps) {
  const t = useTranslation();
  const selectedCase =
    selectedClinicCaseId === "" || selectedClinicCaseId === "all"
      ? null
      : caseOptions.find((clinicCase) => clinicCase.id === selectedClinicCaseId) || null;

  // Group cases by clinic name so the picker reads as
  // "Endodontics > [case, case, …], Pediatrics > [case, case, …]".
  const groupedCases = useMemo(() => {
    const map = new Map<string, typeof caseOptions>();
    caseOptions.forEach((c) => {
      const key = c.clinicName || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries()).map(([clinicName, cases]) => ({
      clinicName,
      cases,
    }));
  }, [caseOptions]);

  const [openClinics, setOpenClinics] = useState<Record<string, boolean>>({});
  const isOpen = (name: string) => openClinics[name] ?? true;
  const toggleClinic = (name: string) =>
    setOpenClinics((prev) => ({ ...prev, [name]: !isOpen(name) }));
  const [caseSearch, setCaseSearch] = useState("");
  const filteredGroups = useMemo(() => {
    const needle = caseSearch.trim().toLowerCase();
    if (!needle) return groupedCases;
    return groupedCases
      .map((group) => ({
        ...group,
        cases: group.cases.filter(
          (c) =>
            c.title.toLowerCase().includes(needle) ||
            group.clinicName.toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.cases.length > 0);
  }, [groupedCases, caseSearch]);

  // Count slots that actually match the user's current filters so the
  // "Availability" stat tile reflects the real subset they're looking at,
  // not the raw `availableSlots.length` (which never moves).
  const matchingSlotsCount = useMemo(() => {
    return availableSlots.filter((slot) => {
      const date = new Date(slot.startTime);
      const monthOk =
        selectedMonth === "all" || date.getMonth() === selectedMonth;
      const yearOk =
        selectedYear === "all" || date.getFullYear() === selectedYear;
      const caseOk =
        selectedClinicCaseId === "" ||
        (slot.caseOptions || []).some(
          (item: { id: string }) => item.id === selectedClinicCaseId,
        );
      return monthOk && yearOk && caseOk;
    }).length;
  }, [availableSlots, selectedClinicCaseId, selectedMonth, selectedYear]);

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
          <div className="sm:col-span-2 xl:col-span-1">
            <StreakSummaryWidget onOpen={onOpenStreak} />
          </div>
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_upcoming")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              <StatCount value={uniqueUpcoming.length} />
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
              <StatCount value={matchingSlotsCount} />
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {selectedClinicCaseId
                ? `Slots offering ${selectedCase?.title ?? "the selected case"}.`
                : "Total open slots — pick a case to narrow it down."}
            </p>
          </div>
          <div className="denty-stat-card p-4">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("patient.care.stat_history")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              <StatCount value={history.length} />
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("patient.care.case")}
                <span className="ml-1 text-rose-500">*</span>
              </label>
              {selectedCase ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                  <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500/85 text-white">
                    <svg width="9" height="9" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {selectedCase.title}
                  <button
                    type="button"
                    onClick={() => onSelectedClinicCaseChange("")}
                    className="ml-1 cursor-pointer rounded-full p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label="Clear selected case"
                  >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M10 2v10M10 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Pick a case to see slots
                </span>
              )}
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/22 p-2">
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Search cases…"
                  className="denty-field w-full pl-9 text-sm"
                />
              </div>
              <div className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
                {filteredGroups.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-[var(--muted-foreground)]">
                    No cases available right now.
                  </p>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.clinicName}>
                      <button
                        type="button"
                        onClick={() => toggleClinic(group.clinicName)}
                        className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] transition hover:bg-white/10"
                      >
                        <span
                          aria-hidden
                          className={`inline-flex h-4 w-4 items-center justify-center text-[var(--muted-foreground)] transition ${
                            isOpen(group.clinicName) ? "rotate-90" : ""
                          }`}
                        >
                          <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="flex-1 truncate">{group.clinicName}</span>
                        <span className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                          {group.cases.length}
                        </span>
                      </button>
                      {isOpen(group.clinicName) ? (
                        <div className="ml-3 space-y-1 border-l border-white/10 pl-2">
                          {group.cases.map((option) => {
                            const active = option.id === selectedClinicCaseId;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => onSelectedClinicCaseChange(option.id)}
                                className={`flex w-full items-center justify-between rounded-[12px] px-3 py-1.5 text-sm transition ${
                                  active
                                    ? "bg-teal-500/20 text-[var(--foreground)]"
                                    : "text-[var(--foreground)] hover:bg-white/10"
                                }`}
                              >
                                <span className="truncate text-left">{option.title}</span>
                                {active ? (
                                  <span aria-hidden className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/85 text-white">
                                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                                      <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
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

            <div className="flex-1 rounded-[18px] border border-white/10 bg-white/22 px-3 py-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    selectedCase
                      ? "bg-teal-500/85 text-white"
                      : "border border-white/15 bg-white/10 text-[var(--muted-foreground)]"
                  }`}
                >
                  {selectedCase ? (
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V11M10 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("patient.care.case_focus")}
                </p>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-[var(--foreground)]" title={selectedCase?.title}>
                {selectedCase?.title || t("patient.care.all_available_cases")}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                {selectedCase?.clinicName ?? t("patient.care.clinic_focus_note")}
              </p>
            </div>
          </div>
        </div>

        {selectedCase ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.pick_day")}
            </p>
            <div className="denty-calendar-grid grid max-h-72 grid-cols-7 gap-2 overflow-y-auto rounded-[22px] border border-[rgba(148,163,184,0.14)] bg-[rgba(244,245,247,0.88)] p-3">
              {filteredDays.length === 0 ? (
                <p className="col-span-7 px-2 py-6 text-center text-sm text-[var(--muted-foreground)]">
                  No open days for this case yet. Try a different case or clinic.
                </p>
              ) : (
                filteredDays.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => onSelectedDayChange(date)}
                    className={`denty-calendar-cell rounded-lg border px-2 py-3 text-sm ${
                      selectedDay?.toDateString() === date.toDateString()
                        ? "denty-calendar-cell-active border-[rgba(11,123,138,0.18)] bg-[rgba(230,244,246,0.9)] text-[rgba(8,68,78,0.96)]"
                        : "border-[rgba(148,163,184,0.16)] bg-white text-[var(--foreground)] hover:border-[rgba(11,123,138,0.18)]"
                    }`}
                  >
                    <span className="block text-xs">
                      {date.toLocaleString(undefined, { month: "short" })}
                    </span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="denty-placeholder flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-white/14 p-8 text-center">
            <span
              aria-hidden
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-400/15 text-teal-200"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12.5l-3-1.6-3 1.6-3-1.6-3 1.6V7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path d="M9 10h6M9 13.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-base font-semibold text-[var(--foreground)]">
              Pick a case first
            </p>
            <p className="max-w-md text-sm text-[var(--muted-foreground)]">
              Choose the procedure you need from the list above. We&apos;ll then show
              you every doctor and slot that still has that case open.
            </p>
          </div>
        )}

        {selectedDay ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("patient.care.slots_for", {
                date: selectedDay.toDateString(),
                intent: selectedCase?.title || t("patient.care.any_visit_intent"),
              })}
            </p>
            <div className="space-y-2">
              {availableSlots
                .filter((slot) => {
                  const date = new Date(slot.startTime);
                  const sameDay = date.toDateString() === selectedDay.toDateString();
                  const matchesCase =
                    selectedClinicCaseId !== "" &&
                    (slot.caseOptions || []).some(
                      (item: any) => item.id === selectedClinicCaseId,
                    );
                  return sameDay && matchesCase;
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
                const matchesCase =
                  selectedClinicCaseId !== "" &&
                  (slot.caseOptions || []).some(
                    (item: any) => item.id === selectedClinicCaseId,
                  );
                return sameDay && matchesCase;
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
