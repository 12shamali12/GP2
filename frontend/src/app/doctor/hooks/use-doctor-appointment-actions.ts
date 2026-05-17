"use client";

import type { Dispatch, SetStateAction } from "react";

type SlotForm = {
  date: string;
  time: string;
  purpose: string;
};

type UseDoctorAppointmentActionsParams = {
  apiUrl: string;
  identifier: string;
  slotForm: SlotForm;
  setSlotForm: Dispatch<SetStateAction<SlotForm>>;
  setLoadingAction: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSlotError: Dispatch<SetStateAction<string | null>>;
  setSlotMessage: Dispatch<SetStateAction<string | null>>;
  setNoShowCount: Dispatch<SetStateAction<number>>;
  setAppointments: Dispatch<SetStateAction<any[]>>;
  loadData: () => Promise<void>;
  fetchPerformance: () => Promise<void> | void;
};

export function useDoctorAppointmentActions({
  apiUrl,
  identifier,
  slotForm,
  setSlotForm,
  setLoadingAction,
  setError,
  setSlotError,
  setSlotMessage,
  setNoShowCount,
  setAppointments,
  loadData,
  fetchPerformance,
}: UseDoctorAppointmentActionsParams) {
  const handleAddSlot = async () => {
    setSlotError(null);
    setSlotMessage(null);

    if (!slotForm.date || !slotForm.time) {
      setSlotError("Pick a date and time for the slot.");
      return;
    }

    if (!identifier) {
      setSlotError("Missing doctor identifier.");
      return;
    }

    const start = new Date(`${slotForm.date}T${slotForm.time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setLoadingAction(true);

    try {
      const response = await fetch(`${apiUrl}/appointments/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorIdentifier: identifier,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          purpose: slotForm.purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSlotError(data?.message || "Failed to add slot.");
      } else {
        setSlotMessage("Slot added.");
        setSlotForm({ date: "", time: "", purpose: "General" });
        await loadData();
      }
    } catch (error: any) {
      setSlotError(error?.message || "Failed to add slot.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDecision = async (
    appointmentId: string,
    approve: boolean,
    note?: string
  ) => {
    setLoadingAction(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/appointments/${appointmentId}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorIdentifier: identifier,
            approve,
            note: note || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Action failed.");
      }

      await loadData();
    } catch (error: any) {
      setError(error?.message || "Action failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setLoadingAction(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorIdentifier: identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Cancel failed.");
      }

      await loadData();
    } catch (error: any) {
      setError(error?.message || "Cancel failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    setLoadingAction(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorIdentifier: identifier,
          reason: "No-show",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No-show failed.");
      } else {
        setNoShowCount((count) => count + 1);
        fetchPerformance();
        setAppointments((prev) =>
          prev.filter((appointment) => appointment.id !== appointmentId)
        );
      }
    } catch (error: any) {
      setError(error?.message || "No-show failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteSlot = async (slot: any) => {
    const isBooked = slot.status && slot.status !== "OPEN";
    const confirmText = isBooked
      ? "Careful: this slot has a reservation. Remove it?"
      : "Remove this available slot?";

    if (!window.confirm(confirmText)) return;

    setLoadingAction(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/appointments/slots/${slot.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorIdentifier: identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Delete failed.");
      } else {
        await loadData();
      }
    } catch (error: any) {
      setError(error?.message || "Delete failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    handleAddSlot,
    handleDecision,
    handleCancel,
    handleNoShow,
    handleDeleteSlot,
  };
}
