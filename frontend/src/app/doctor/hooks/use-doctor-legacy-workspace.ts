"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DoctorWorkspaceData } from "@/features/supervision/types";

type ReportForm = {
  title: string;
  description: string;
  supervisorIds: string[];
};

type UseDoctorLegacyWorkspaceParams = {
  apiUrl: string;
  identifier: string;
  appointments: any[];
  slots: any[];
  selectedMonth: number;
  selectedYear: number;
  selectedDay: Date | null;
  selectedHours: number[];
  selectedPurposes: string[];
  doctorWorkspace: DoctorWorkspaceData | null;
  loadData: () => Promise<void>;
  setLoadingAction: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSlotError: Dispatch<SetStateAction<string | null>>;
  setSlotMessage: Dispatch<SetStateAction<string | null>>;
  setSelectedHours: Dispatch<SetStateAction<number[]>>;
  setSelectedPurposes: Dispatch<SetStateAction<string[]>>;
  setSelectedReport: Dispatch<SetStateAction<any | null>>;
  setReportForm: Dispatch<SetStateAction<ReportForm>>;
  setSelectedReportTaskIds: Dispatch<SetStateAction<string[]>>;
  setReportMessage: Dispatch<SetStateAction<string | null>>;
  setReportOpen: Dispatch<SetStateAction<boolean>>;
  handleNoShow: (appointmentId: string) => void;
};

export function useDoctorLegacyWorkspace({
  apiUrl,
  identifier,
  appointments,
  slots,
  selectedMonth,
  selectedYear,
  selectedDay,
  selectedHours,
  selectedPurposes,
  doctorWorkspace,
  loadData,
  setLoadingAction,
  setError,
  setSlotError,
  setSlotMessage,
  setSelectedHours,
  setSelectedPurposes,
  setSelectedReport,
  setReportForm,
  setSelectedReportTaskIds,
  setReportMessage,
  setReportOpen,
  handleNoShow,
}: UseDoctorLegacyWorkspaceParams) {
  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toDateString();

    return appointments.filter(
      (appointment) =>
        appointment.slot?.startTime &&
        new Date(appointment.slot.startTime).toDateString() === todayStr
    );
  }, [appointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "PENDING"),
    [appointments]
  );

  const workingHours = useMemo(
    () => Array.from({ length: 9 }, (_, index) => 8 + index),
    []
  );

  const now = useMemo(() => new Date(), []);

  const yearOptions = useMemo(() => {
    const year = now.getFullYear();

    return [year, year + 1];
  }, [now]);

  const daysInView = useMemo(() => {
    const total = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    return Array.from({ length: total }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear]);

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];

    return slots
      .filter((slot) => {
        const date = new Date(slot.startTime);

        return date.toDateString() === selectedDay.toDateString();
      })
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() -
          new Date(right.startTime).getTime()
      );
  }, [selectedDay, slots]);

  const groupedSlots = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    slots
      .slice()
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() -
          new Date(right.startTime).getTime()
      )
      .forEach((slot) => {
        const date = new Date(slot.startTime);
        const key = date.toDateString();

        if (!grouped[key]) grouped[key] = [];

        grouped[key].push(slot);
      });

    return Object.entries(grouped).map(([key, list]) => ({
      key,
      date: new Date(list[0].startTime),
      list,
    }));
  }, [slots]);

  const toggleHour = (hour: number) => {
    setSelectedHours((prev) =>
      prev.includes(hour)
        ? prev.filter((item) => item !== hour)
        : [...prev, hour].sort((left, right) => left - right)
    );
  };

  const togglePurpose = (purpose: string) => {
    setSelectedPurposes((prev) =>
      prev.includes(purpose)
        ? prev.filter((item) => item !== purpose)
        : [...prev, purpose]
    );
  };

  const handleDeleteDay = async (dateKey: string, slotIds: string[]) => {
    if (
      !window.confirm(
        `Delete all slots for ${dateKey}? This will cancel any reservations.`
      )
    ) {
      return;
    }

    setLoadingAction(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/appointments/slots/batch-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorIdentifier: identifier,
          slotIds,
          dateLabel: dateKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data?.message || "Delete failed for day.");
      }

      await loadData();
    } catch (error: any) {
      setError(error?.message || "Delete failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddMultipleSlots = async () => {
    setSlotError(null);
    setSlotMessage(null);

    if (!selectedDay) {
      setSlotError("Pick a day to add availability.");
      return;
    }

    if (selectedHours.length === 0) {
      setSlotError("Select one or more 1-hour slots.");
      return;
    }

    if (!identifier) {
      setSlotError("Missing doctor identifier.");
      return;
    }

    const purposeText = selectedPurposes.length
      ? selectedPurposes.join(", ")
      : "General";

    setLoadingAction(true);

    let success = 0;

    try {
      for (const hour of selectedHours) {
        const start = new Date(selectedDay);

        start.setHours(hour, 0, 0, 0);

        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const response = await fetch(`${apiUrl}/appointments/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorIdentifier: identifier,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            purpose: purposeText,
          }),
        });

        if (response.ok) success += 1;
      }

      if (success > 0) {
        setSlotMessage(`Added ${success} slot${success > 1 ? "s" : ""}.`);
        await loadData();
        setSelectedHours([]);
      } else {
        setSlotError("Could not add slots. Try again.");
      }
    } catch (error: any) {
      setSlotError(error?.message || "Failed to add slots.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectBookedSlot = (slotId: string) => {
    const appointment = appointments.find((item) => item.slotId === slotId);

    if (!appointment) return;

    setSelectedReport(appointment);
    setReportForm({
      title: "",
      description: "",
      supervisorIds: [],
    });
    setReportMessage(null);
    setReportOpen(true);
  };

  const handleOpenReportForSlot = (slotId: string) => {
    const appointment = appointments.find((item) => item.slotId === slotId);

    if (!appointment) return;

    const defaultSupervisorId =
      doctorWorkspace?.reportSupervisors?.[0]?.id || "";

    setSelectedReport(appointment);
    setReportForm({
      title: "",
      description: "",
      supervisorIds: defaultSupervisorId ? [defaultSupervisorId] : [],
    });
    setSelectedReportTaskIds([]);
    setReportMessage(null);
    setReportOpen(true);
  };

  const handleNoShowForSlot = (slotId: string) => {
    const appointment = appointments.find((item) => item.slotId === slotId);

    if (appointment) {
      handleNoShow(appointment.id);
    }
  };

  return {
    todayAppointments,
    pendingAppointments,
    workingHours,
    now,
    yearOptions,
    daysInView,
    slotsForSelectedDay,
    groupedSlots,
    toggleHour,
    togglePurpose,
    handleDeleteDay,
    handleAddMultipleSlots,
    handleSelectBookedSlot,
    handleOpenReportForSlot,
    handleNoShowForSlot,
  };
}
