"use client";

import { DoctorDashboardSummary } from "@/app/doctor/ui/doctor-dashboard-summary";
import { DoctorLegacyOperations } from "@/app/doctor/ui/doctor-legacy-operations";
import { DoctorWorkspacePanel } from "@/features/supervision/components/doctor-workspace-panel";
import type { DoctorWorkspaceData } from "@/features/supervision/types";

type WeeklyPerformance = {
  done: number;
  rejected: number;
  cancelledByDoctor: number;
  cancelledByPatient: number;
  noShow: number;
};

type DoctorOverviewSurfaceProps = {
  apiUrl: string;
  identifier: string;
  userName: string;
  todayAppointments: any[];
  pendingAppointments: any[];
  appointments: any[];
  notifications: any[];
  unreadNotifications: number;
  groupedSlots: any;
  loadingAction: boolean;
  weeklyPerformance: WeeklyPerformance;
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  selectedPurposes: string[];
  casesOpen: boolean;
  daysInView: any;
  now: Date;
  slots: any[];
  selectedDay: Date | null;
  workingHours: number[];
  selectedHours: number[];
  slotsForSelectedDay: any[];
  showLegacyOps: boolean;
  onToggleLegacy: () => void;
  onWorkspaceChange: (workspace: DoctorWorkspaceData | null) => void;
  getWeekRange: () => { start: Date; end: Date };
  onApproveDecision: (appointmentId: string) => void;
  onRejectDecision: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteAllNotifications: () => void;
  onNotificationClick: (notification: any) => void;
  onDeleteNotification: (notificationId: string) => void;
  onDeleteDay: (...args: any[]) => void;
  onSelectBookedSlot: (...args: any[]) => void;
  onFillReportForSlot: (...args: any[]) => void;
  onMarkNoShowForSlot: (...args: any[]) => void;
  onDeleteSlot: (...args: any[]) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onCasesOpenToggle: () => void;
  onTogglePurpose: (purpose: string) => void;
  onSelectedDayChange: (day: Date | null) => void;
  onToggleHour: (hour: number) => void;
  onAddMultipleSlots: () => void;
};

export function DoctorOverviewSurface({
  apiUrl,
  identifier,
  userName,
  todayAppointments,
  pendingAppointments,
  appointments,
  notifications,
  unreadNotifications,
  groupedSlots,
  loadingAction,
  weeklyPerformance,
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
  showLegacyOps,
  onToggleLegacy,
  onWorkspaceChange,
  getWeekRange,
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
}: DoctorOverviewSurfaceProps) {
  return (
    <>
      {identifier ? (
        <DoctorWorkspacePanel
          apiUrl={apiUrl}
          identifier={identifier}
          onWorkspaceChange={onWorkspaceChange}
        />
      ) : null}

      <DoctorDashboardSummary
        userName={userName}
        todayAppointments={todayAppointments.length}
        pendingAppointments={pendingAppointments.length}
        unreadNotifications={unreadNotifications}
        showLegacyOps={showLegacyOps}
        onToggleLegacy={onToggleLegacy}
      />

      {showLegacyOps ? (
        <DoctorLegacyOperations
          todayAppointments={todayAppointments}
          appointments={appointments}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
          groupedSlots={groupedSlots}
          loadingAction={loadingAction}
          weeklyPerformance={weeklyPerformance}
          getWeekRange={getWeekRange}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          selectedPurposes={selectedPurposes}
          casesOpen={casesOpen}
          daysInView={daysInView}
          now={now}
          slots={slots}
          selectedDay={selectedDay}
          workingHours={workingHours}
          selectedHours={selectedHours}
          slotsForSelectedDay={slotsForSelectedDay}
          onApproveDecision={onApproveDecision}
          onRejectDecision={onRejectDecision}
          onCancelAppointment={onCancelAppointment}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onDeleteAllNotifications={onDeleteAllNotifications}
          onNotificationClick={onNotificationClick}
          onDeleteNotification={onDeleteNotification}
          onDeleteDay={onDeleteDay}
          onSelectBookedSlot={onSelectBookedSlot}
          onFillReportForSlot={onFillReportForSlot}
          onMarkNoShowForSlot={onMarkNoShowForSlot}
          onDeleteSlot={onDeleteSlot}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          onCasesOpenToggle={onCasesOpenToggle}
          onTogglePurpose={onTogglePurpose}
          onSelectedDayChange={onSelectedDayChange}
          onToggleHour={onToggleHour}
          onAddMultipleSlots={onAddMultipleSlots}
        />
      ) : null}
    </>
  );
}
