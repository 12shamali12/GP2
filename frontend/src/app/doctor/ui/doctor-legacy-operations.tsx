"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type DoctorLegacyOperationsProps = {
  todayAppointments: any[];
  appointments: any[];
  notifications: any[];
  unreadNotifications: number;
  groupedSlots: Array<{ key: string; date: Date; list: any[] }>;
  loadingAction: boolean;
  weeklyPerformance: {
    done: number;
    rejected: number;
    cancelledByDoctor: number;
    cancelledByPatient: number;
    noShow: number;
  };
  getWeekRange: () => { start: Date; end: Date };
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  selectedPurposes: string[];
  casesOpen: boolean;
  daysInView: number[];
  now: Date;
  slots: any[];
  selectedDay: Date | null;
  workingHours: number[];
  selectedHours: number[];
  slotsForSelectedDay: any[];
  onApproveDecision: (appointmentId: string) => void;
  onRejectDecision: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteAllNotifications: () => void;
  onNotificationClick: (notification: any) => void;
  onDeleteNotification: (notificationId: string) => void;
  onDeleteDay: (dateKey: string, slotIds: string[]) => void;
  onSelectBookedSlot: (slotId: string) => void;
  onFillReportForSlot: (slotId: string) => void;
  onMarkNoShowForSlot: (slotId: string) => void;
  onDeleteSlot: (slot: any) => void;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onCasesOpenToggle: () => void;
  onTogglePurpose: (purpose: string) => void;
  onSelectedDayChange: (date: Date) => void;
  onToggleHour: (hour: number) => void;
  onAddMultipleSlots: () => void;
};

export function DoctorLegacyOperations({
  todayAppointments,
  appointments,
  notifications,
  unreadNotifications,
  groupedSlots,
  loadingAction,
  weeklyPerformance,
  getWeekRange,
  selectedMonth,
  selectedYear,
  yearOptions,
  selectedPurposes,
  casesOpen,
  daysInView,
  now,
  slots,
  selectedDay,
  workingHours,
  selectedHours,
  slotsForSelectedDay,
  onApproveDecision,
  onRejectDecision,
  onCancelAppointment,
  onMarkAllNotificationsRead,
  onDeleteAllNotifications,
  onNotificationClick,
  onDeleteNotification,
  onDeleteDay,
  onSelectBookedSlot,
  onFillReportForSlot,
  onMarkNoShowForSlot,
  onDeleteSlot,
  onMonthChange,
  onYearChange,
  onCasesOpenToggle,
  onTogglePurpose,
  onSelectedDayChange,
  onToggleHour,
  onAddMultipleSlots,
}: DoctorLegacyOperationsProps) {
  const t = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="denty-dashboard-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="denty-kicker">{t("doctor.legacy.today_schedule")}</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t("doctor.legacy.appointments")}
              </h3>
            </div>

            <span className="denty-pill">
              {t("doctor.legacy.planned_count", {
                count: todayAppointments.length,
              })}
            </span>
          </div>

          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="denty-list-row flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--foreground)]">
                    {t("doctor.legacy.patient_label", {
                      value:
                        appointment.patient?.name ||
                        appointment.patientId?.slice(0, 6) ||
                        t("patient.common.unknown"),
                    })}
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {appointment.slot?.startTime
                      ? new Date(appointment.slot.startTime).toLocaleString()
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span
                    className={`denty-status-chip ${
                      appointment.status === "APPROVED"
                        ? "border-[rgba(16,185,129,0.18)] bg-[rgba(236,253,245,0.96)] text-[#047857]"
                        : appointment.status === "REJECTED"
                          ? "border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.96)] text-[#b91c1c]"
                          : "denty-status-chip-strong"
                    }`}
                  >
                    {appointment.status}
                  </span>

                  {appointment.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() => onApproveDecision(appointment.id)}
                        className="denty-action denty-action-success disabled:opacity-60"
                        disabled={loadingAction}
                      >
                        {t("doctor.common.approve")}
                      </button>

                      <button
                        onClick={() => onRejectDecision(appointment.id)}
                        className="denty-action denty-action-danger disabled:opacity-60"
                        disabled={loadingAction}
                      >
                        {t("doctor.common.reject")}
                      </button>
                    </>
                  ) : null}

                  {appointment.status === "APPROVED" ? (
                    <button
                      onClick={() => onCancelAppointment(appointment.id)}
                      className="denty-action denty-action-danger disabled:opacity-60"
                      disabled={loadingAction}
                    >
                      {t("doctor.common.cancel")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="denty-dashboard-card-soft p-5">
          <p className="denty-kicker">{t("doctor.legacy.notifications")}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("doctor.notif.unread_count", { count: unreadNotifications })}
            </p>

            {notifications.length > 0 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="denty-link-button"
                >
                  {t("doctor.common.mark_all_read")}
                </button>

                <button
                  type="button"
                  onClick={onDeleteAllNotifications}
                  className="text-[11px] font-semibold text-[#b91c1c] underline underline-offset-[0.22rem]"
                >
                  {t("doctor.common.remove_all")}
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-h-56 min-h-[128px] space-y-2 overflow-y-auto pr-1">
            {notifications.map((notification) => {
              const body = notification.body || notification.text;
              const created =
                notification.createdAt || notification.time
                  ? new Date(notification.createdAt || Date.now()).toLocaleString()
                  : "";
              const read = notification.read ?? false;

              return (
                <div key={notification.id} className="denty-list-row w-full p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => onNotificationClick(notification)} className="flex-1 text-left">
                      <p
                        className={`overflow-hidden text-ellipsis text-sm text-[var(--foreground)] ${
                          read ? "" : "font-semibold"
                        }`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {body}
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {created || notification.time}
                      </p>
                    </button>

                    {!read && notifications.length ? (
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-info)]"></span>
                    ) : null}

                    {notifications.length ? (
                      <button
                        onClick={() => notification.id && onDeleteNotification(notification.id)}
                        className="denty-action denty-action-danger px-3 py-1.5 text-[11px]"
                        aria-label={t("doctor.common.delete")}
                      >
                        {t("doctor.common.delete")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("doctor.common.no_notifications")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="denty-dashboard-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="denty-kicker">{t("doctor.legacy.slot_planner")}</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t("doctor.legacy.my_slots")}
              </h3>
            </div>
            <span className="denty-pill">
              {t("doctor.legacy.days_count", { count: groupedSlots.length })}
            </span>
          </div>

          <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
            {groupedSlots.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("doctor.legacy.no_slots")}
              </p>
            ) : null}

            {groupedSlots.map((group) => (
              <div key={group.key} className="denty-dashboard-card-soft space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[var(--foreground)]">
                    {group.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>

                  <button
                    onClick={() => onDeleteDay(group.key, group.list.map((slot) => slot.id))}
                    className="denty-action denty-action-danger disabled:opacity-60"
                    disabled={loadingAction}
                  >
                    {t("doctor.legacy.delete_day")}
                  </button>
                </div>

                <div className="space-y-1">
                  {group.list.map((slot) => {
                    const appointment = appointments.find((item) => item.slotId === slot.id);

                    return (
                      <div
                        key={slot.id}
                        className="denty-list-row flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div
                          onClick={() => {
                            if (appointment) {
                              onSelectBookedSlot(slot.id);
                            }
                          }}
                          className="min-w-0 cursor-pointer"
                        >
                          <p className="text-sm font-semibold text-[var(--foreground)]">
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

                          <p className="text-xs text-[var(--muted-foreground)]">
                            {t("doctor.legacy.status_label", {
                              value: slot.status,
                            })}{" "}
                            <span className="text-base align-middle">{slot.status === "BOOKED" ? "?" : "?"}</span>
                          </p>

                          {slot.purpose ? (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {t("doctor.legacy.cases_label", {
                                value: slot.purpose,
                              })}
                            </p>
                          ) : null}

                          {slot.status === "BOOKED" ? (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {t("doctor.legacy.with_label", {
                                name:
                                  appointment?.patient?.name ||
                                  t("doctor.common.patient"),
                                phone: appointment?.patient?.phone || "N/A",
                              })}
                            </p>
                          ) : null}
                        </div>

                        {new Date(slot.startTime) < new Date() && slot.status === "BOOKED" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onFillReportForSlot(slot.id)}
                              className="denty-action denty-action-primary disabled:opacity-60"
                              disabled={loadingAction}
                            >
                              {t("doctor.legacy.fill_report")}
                            </button>

                            <button
                              onClick={() => onMarkNoShowForSlot(slot.id)}
                              className="denty-action denty-action-danger disabled:opacity-60"
                              disabled={loadingAction}
                            >
                              {t("doctor.legacy.no_show")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onDeleteSlot(slot)}
                            className="denty-action denty-action-danger disabled:opacity-60"
                            disabled={loadingAction}
                          >
                            {t("doctor.common.remove")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="denty-dashboard-card-soft p-5">
          <p className="denty-kicker">
            {t("doctor.legacy.performance", {
              start: getWeekRange().start.toLocaleDateString(),
              end: getWeekRange().end.toLocaleDateString(),
            })}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[var(--foreground)]">
            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.done_week")}
              </p>
              <p className="mt-2 text-2xl font-semibold">{weeklyPerformance.done}</p>
            </div>

            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.rejected_reservations")}
              </p>
              <p className="mt-2 text-2xl font-semibold">{weeklyPerformance.rejected}</p>
            </div>

            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.cancelled_by_you")}
              </p>
              <p className="mt-2 text-2xl font-semibold">{weeklyPerformance.cancelledByDoctor}</p>
            </div>

            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.cancelled_by_patients")}
              </p>
              <p className="mt-2 text-2xl font-semibold">{weeklyPerformance.cancelledByPatient}</p>
            </div>

            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.no_shows")}
              </p>
              <p className="mt-2 text-2xl font-semibold">{weeklyPerformance.noShow}</p>
            </div>

            <div className="denty-stat-card p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("doctor.legacy.rating")}
              </p>
              <p className="mt-2 text-2xl font-semibold">-</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="denty-dashboard-card space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="denty-kicker">{t("doctor.legacy.planning_surface")}</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t("doctor.legacy.availability_planner")}
              </h3>
            </div>
            <span className="denty-pill">
              {t("doctor.legacy.live_scheduling")}
            </span>
          </div>

          <div className="grid items-start gap-2 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("doctor.legacy.month")}
              </label>

              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="denty-field text-sm"
              >
                {[...Array(12).keys()].map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month, 1).toLocaleString(undefined, {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("doctor.legacy.year")}
              </label>

              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="denty-field text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("doctor.legacy.select_cases")}
              </p>

              <div className="relative">
                <button
                  type="button"
                  onClick={onCasesOpenToggle}
                  className="denty-field flex items-center justify-between text-left text-sm"
                >
                  <span>
                    {selectedPurposes.length
                      ? selectedPurposes.join(", ")
                      : t("doctor.legacy.select_cases")}
                  </span>

                  <span className="text-xs text-[var(--muted-foreground)]">
                    {casesOpen ? "" : ""}
                  </span>
                </button>

                {casesOpen ? (
                  <div className="denty-dashboard-card absolute z-20 mt-2 max-h-48 w-full overflow-auto p-2 shadow-lg">
                    {(
                      [
                        ["General", "doctor.legacy.case.general"],
                        ["Check-up", "doctor.legacy.case.checkup"],
                        ["Cleaning", "doctor.legacy.case.cleaning"],
                        ["Pain/Urgent", "doctor.legacy.case.pain"],
                        ["Whitening", "doctor.legacy.case.whitening"],
                      ] as const
                    ).map(([purpose, labelKey]) => {
                      const active = selectedPurposes.includes(purpose);

                      return (
                        <button
                          key={purpose}
                          type="button"
                          onClick={() => onTogglePurpose(purpose)}
                          className="flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[rgba(230,244,246,0.78)]"
                        >
                          <span>{t(labelKey)}</span>
                          <span className="ml-3 text-base">{active ? "" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {t("doctor.legacy.pick_day")}
            </p>

            <div className="grid grid-cols-7 gap-2 rounded-[22px] border border-[rgba(148,163,184,0.14)] bg-[rgba(244,245,247,0.88)] p-3">
              {daysInView.map((day) => {
                const dateObj = new Date(selectedYear, selectedMonth, day);
                const isPast =
                  dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const hasSlots = slots.some((slot) => {
                  const slotDate = new Date(slot.startTime);
                  return (
                    slotDate.getFullYear() === selectedYear &&
                    slotDate.getMonth() === selectedMonth &&
                    slotDate.getDate() === day
                  );
                });
                const isSelected =
                  selectedDay?.toDateString() === dateObj.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (!isPast) onSelectedDayChange(dateObj);
                    }}
                    disabled={isPast}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      isSelected
                        ? "border-[rgba(11,123,138,0.18)] bg-[rgba(230,244,246,0.9)] text-[rgba(8,68,78,0.96)]"
                        : "border-[rgba(148,163,184,0.16)] bg-white text-[var(--foreground)] hover:border-[rgba(11,123,138,0.18)]"
                    } ${
                      isPast
                        ? "cursor-not-allowed opacity-40 hover:border-[rgba(148,163,184,0.16)]"
                        : ""
                    }`}
                  >
                    {day}
                    {hasSlots ? <span className="ml-1 text-[10px]"></span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("doctor.legacy.slots_for", {
                    date: selectedDay.toDateString(),
                  })}
                </p>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {workingHours.map((hour) => {
                    const label = new Date(0, 0, 0, hour).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const selected = selectedHours.includes(hour);

                    return (
                      <button
                        key={hour}
                        onClick={() => onToggleHour(hour)}
                        className={`rounded-lg border px-2 py-2 text-sm ${
                          selected
                            ? "border-[rgba(11,123,138,0.18)] bg-[rgba(230,244,246,0.9)] text-[rgba(8,68,78,0.96)]"
                            : "border-[rgba(148,163,184,0.16)] bg-white text-[var(--foreground)] hover:border-[rgba(11,123,138,0.18)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={onAddMultipleSlots}
                disabled={loadingAction}
                className="denty-button-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {loadingAction
                  ? t("doctor.legacy.adding")
                  : t("doctor.legacy.add_slots")}
              </button>

              {slotsForSelectedDay.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.legacy.existing_slots")}
                  </p>

                  {slotsForSelectedDay.map((slot) => (
                    <div
                      key={slot.id}
                      className="denty-list-row flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="text-xs text-[var(--muted-foreground)]">
                          {t("doctor.legacy.status_label", {
                            value: slot.status,
                          })}{" "}
                          <span className="text-base align-middle">{slot.status === "BOOKED" ? "?" : "?"}</span>
                        </p>

                        {slot.purpose ? (
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {t("doctor.legacy.cases_label", {
                              value: slot.purpose,
                            })}
                          </p>
                        ) : null}
                      </div>

                      <span className="denty-status-chip">
                        {t("doctor.legacy.one_hour")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
