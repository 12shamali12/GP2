"use client";

import type { Dispatch, SetStateAction } from "react";

type BookingForm = {
  slotId: string;
  clinicCaseId: string;
  clinicName: string;
  caseTitle: string;
  reason: string;
  doctor: string;
};

type UsePatientBookingActionsParams = {
  apiUrl: string;
  identifier: string;
  user: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    username?: string | null;
  };
  bookingForm: BookingForm;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setPendingSlotId: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  setUpcoming: Dispatch<SetStateAction<any[]>>;
  setHistory: Dispatch<SetStateAction<any[]>>;
  setSelectedAppointment: Dispatch<SetStateAction<any | null>>;
  setCancellingId: Dispatch<SetStateAction<string>>;
  loadData: () => Promise<void>;
  loadSlots: () => Promise<void>;
};

export function usePatientBookingActions({
  apiUrl,
  identifier,
  user,
  bookingForm,
  setLoading,
  setPendingSlotId,
  setError,
  setMessage,
  setUpcoming,
  setHistory,
  setSelectedAppointment,
  setCancellingId,
  loadData,
  loadSlots,
}: UsePatientBookingActionsParams) {
  const handleBook = async () => {
    setError(null);
    setMessage(null);
    setPendingSlotId("");

    if (!bookingForm.slotId) {
      setError("Please select an available slot.");
      return;
    }

    const activeIdentifier =
      user.id || user.email || user.phone || user.username || "";

    if (!activeIdentifier) {
      setError("Missing patient identifier.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientIdentifier: activeIdentifier,
          slotId: bookingForm.slotId,
          clinicCaseId: bookingForm.clinicCaseId || undefined,
          note: bookingForm.reason || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Booking failed.");
      } else {
        setMessage(
          data?.message ||
            "Your reservation was requested. You'll be notified when the doctor approves."
        );
        setPendingSlotId(bookingForm.slotId);
        await loadData();
      }
    } catch (error: any) {
      setError(error?.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setError(null);
    setMessage(null);

    if (!identifier) {
      setError("Missing patient identifier.");
      return;
    }

    const proceed =
      typeof window !== "undefined"
        ? window.confirm("Cancel this reservation?")
        : true;

    if (!proceed) return;

    setCancellingId(appointmentId);

    try {
      const response = await fetch(
        `${apiUrl}/appointments/${appointmentId}/cancel-patient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientIdentifier: identifier }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Unable to cancel the appointment.");
      } else {
        setMessage(data?.message || "Appointment cancelled.");
        setUpcoming((prev) => prev.filter((item) => item.id !== appointmentId));
        setHistory((prev) => prev.filter((item) => item.id !== appointmentId));
        setSelectedAppointment(null);
        await loadSlots();
      }
    } catch (error: any) {
      setError(error?.message || "Unable to cancel the appointment.");
    } finally {
      setCancellingId("");
    }
  };

  const handleRateDoctor = async (
    appointmentId: string,
    stars: number,
    comment?: string
  ) => {
    setError(null);
    setMessage(null);

    if (!identifier) {
      setError("Missing patient identifier.");
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/appointments/${appointmentId}/patient-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            stars,
            comment: comment || undefined,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Unable to save your rating.");
      } else {
        setMessage(data?.message || "Your feedback was saved.");
        await loadData();
      }
    } catch (error: any) {
      setError(error?.message || "Unable to save your rating.");
    }
  };

  return {
    handleBook,
    handleCancel,
    handleRateDoctor,
  };
}
