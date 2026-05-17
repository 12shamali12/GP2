"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { DoctorWorkspaceData } from "@/features/supervision/types";
import {
  createEmptyReportFormData,
  hydrateReportFormData,
  type DoctorReportFormData,
} from "@/app/doctor/lib/report-form";

type ReportForm = {
  title: string;
  description: string;
  supervisor: string;
};

type PatientFeedbackForm = {
  stars: string;
  comment: string;
};

type ReportUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
};

type UseDoctorReportActionsParams = {
  apiUrl: string;
  user: ReportUser;
  selectedReport: any | null;
  reportForm: ReportForm;
  reportFormData: DoctorReportFormData;
  completionNotes: string;
  patientFeedbackForm: PatientFeedbackForm;
  selectedReportTaskIds: string[];
  doctorWorkspace: DoctorWorkspaceData | null;
  setSelectedReport: Dispatch<SetStateAction<any | null>>;
  setReportForm: Dispatch<SetStateAction<ReportForm>>;
  setReportFormData: Dispatch<SetStateAction<DoctorReportFormData>>;
  setCompletionNotes: Dispatch<SetStateAction<string>>;
  setPatientFeedbackForm: Dispatch<SetStateAction<PatientFeedbackForm>>;
  setSelectedReportTaskIds: Dispatch<SetStateAction<string[]>>;
  setReportMessage: Dispatch<SetStateAction<string | null>>;
  setActiveSurfaceToReport: Dispatch<SetStateAction<boolean>>;
  loadData: () => Promise<void>;
  fetchPerformance: () => Promise<void> | void;
};

type UseDoctorReportActionsResult = {
  setReportSurfaceOpen: Dispatch<SetStateAction<boolean>>;
  handleSelectReportAppointment: (appointment: any) => void;
  clearReportSelection: () => void;
  handleSubmitReport: () => void;
  handleCompleteAppointment: () => Promise<void>;
  handleRatePatient: () => Promise<void>;
};

export function useDoctorReportActions({
  apiUrl,
  user,
  selectedReport,
  reportForm,
  reportFormData,
  completionNotes,
  patientFeedbackForm,
  selectedReportTaskIds,
  doctorWorkspace,
  setSelectedReport,
  setReportForm,
  setReportFormData,
  setCompletionNotes,
  setPatientFeedbackForm,
  setSelectedReportTaskIds,
  setReportMessage,
  setActiveSurfaceToReport,
  loadData,
  fetchPerformance,
}: UseDoctorReportActionsParams): UseDoctorReportActionsResult {
  const setReportSurfaceOpen = setActiveSurfaceToReport;

  const handleSelectReportAppointment = useCallback(
    (appointment: any) => {
      const existingReport = appointment.report || null;
      const defaultSupervisor =
        existingReport?.reviewer?.id ||
        doctorWorkspace?.reportSupervisors?.[0]?.id ||
        "";
      const doctorToPatientRating =
        appointment.ratings?.find(
          (rating: any) =>
            rating.kind === "DOCTOR_TO_PATIENT" && rating.active !== false,
        ) || null;
      setSelectedReport({
        ...appointment,
        patientName:
          existingReport?.patientName ||
          appointment.patientName ||
          appointment.patient?.name ||
          "",
        patientPhone:
          existingReport?.patientPhone ||
          appointment.patientPhone ||
          appointment.patient?.phone ||
          "",
      });
      setReportForm({
        title:
          existingReport?.title ||
          appointment.clinicCase?.title ||
          appointment.slot?.purpose ||
          "Clinical case report",
        description: existingReport?.description || "",
        supervisor: defaultSupervisor,
      });
      setReportFormData(hydrateReportFormData(existingReport?.formData));
      setCompletionNotes(appointment.doctorCompletionNotes || "");
      setPatientFeedbackForm({
        stars: String(doctorToPatientRating?.stars ?? "5"),
        comment: doctorToPatientRating?.comment || "",
      });
      setSelectedReportTaskIds(
        Array.isArray(existingReport?.taskLinks)
          ? existingReport.taskLinks.map((link: any) => link.clinicTaskId)
          : [],
      );
      setReportMessage(null);
    },
    [
      doctorWorkspace?.reportSupervisors,
      setCompletionNotes,
      setPatientFeedbackForm,
      setReportForm,
      setReportFormData,
      setReportMessage,
      setSelectedReport,
      setSelectedReportTaskIds,
    ],
  );

  const clearReportSelection = useCallback(() => {
    setSelectedReport(null);
    setReportForm({ title: "", description: "", supervisor: "" });
    setReportFormData(createEmptyReportFormData());
    setCompletionNotes("");
    setPatientFeedbackForm({ stars: "5", comment: "" });
    setSelectedReportTaskIds([]);
    setReportMessage(null);
  }, [
    setCompletionNotes,
    setPatientFeedbackForm,
    setReportForm,
    setReportFormData,
    setReportMessage,
    setSelectedReport,
    setSelectedReportTaskIds,
  ]);

  const handleSubmitReport = useCallback(() => {
    if (!selectedReport) return;

    if (!reportForm.title || !reportForm.description) {
      setReportMessage("Title and description are required.");
      return;
    }

    if (selectedReport.status !== "COMPLETED") {
      setReportMessage(
        "Mark the visit as completed before sending the report.",
      );
      return;
    }

    setReportMessage("Submitting report...");

    const activeIdentifier =
      user.email || user.phone || user.username || user.name || "";
    const chosenSupervisor = doctorWorkspace?.reportSupervisors?.find(
      (supervisor) => supervisor.id === reportForm.supervisor,
    );

    fetch(`${apiUrl}/appointments/${selectedReport.id}/report-submitted`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorIdentifier: activeIdentifier,
        patientName:
          selectedReport.patientName || selectedReport.patient?.name || undefined,
        patientPhone:
          selectedReport.patientPhone ||
          selectedReport.patient?.phone ||
          undefined,
        title: reportForm.title,
        description: reportForm.description,
        supervisorName:
          chosenSupervisor?.name ||
          (doctorWorkspace?.reportSupervisors?.length
            ? undefined
            : reportForm.supervisor || undefined),
        supervisorIdentifier:
          chosenSupervisor?.id ||
          (!doctorWorkspace?.reportSupervisors?.length
            ? reportForm.supervisor || undefined
            : undefined),
        partnerDoctorId: doctorWorkspace?.partnerPair
          ? doctorWorkspace.partnerPair.doctorOne.id ===
            doctorWorkspace.doctor.id
            ? doctorWorkspace.partnerPair.doctorTwo.id
            : doctorWorkspace.partnerPair.doctorOne.id
          : undefined,
        taskIds:
          selectedReportTaskIds.length > 0 ? selectedReportTaskIds : undefined,
        formData: reportFormData,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setReportMessage("Report submitted.");
        fetchPerformance();
      })
      .catch(() => setReportMessage("Failed to submit report."));

    clearReportSelection();
  }, [
    apiUrl,
    clearReportSelection,
    doctorWorkspace,
    fetchPerformance,
    reportFormData,
    reportForm.description,
    reportForm.supervisor,
    reportForm.title,
    selectedReport,
    selectedReportTaskIds,
    setReportMessage,
    user.email,
    user.name,
    user.phone,
    user.username,
  ]);

  const handleCompleteAppointment = useCallback(async () => {
    if (!selectedReport) return;

    const activeIdentifier =
      user.id || user.email || user.phone || user.username || user.name || "";
    if (!activeIdentifier) {
      setReportMessage("Missing doctor identifier.");
      return;
    }

    try {
      setReportMessage("Saving completion...");
      const response = await fetch(
        `${apiUrl}/appointments/${selectedReport.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorIdentifier: activeIdentifier,
            completionNotes: completionNotes || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to complete the appointment.");
      }
      setReportMessage("Appointment completed.");
      await loadData();
      setSelectedReport((prev: any) =>
        prev
          ? {
              ...prev,
              status: "COMPLETED",
              doctorCompletionNotes: completionNotes,
            }
          : prev,
      );
    } catch (err: any) {
      setReportMessage(err?.message || "Failed to complete the appointment.");
    }
  }, [
    apiUrl,
    completionNotes,
    loadData,
    selectedReport,
    setReportMessage,
    setSelectedReport,
    user.email,
    user.id,
    user.name,
    user.phone,
    user.username,
  ]);

  const handleRatePatient = useCallback(async () => {
    if (!selectedReport) return;
    const activeIdentifier =
      user.id || user.email || user.phone || user.username || user.name || "";
    if (!activeIdentifier) {
      setReportMessage("Missing doctor identifier.");
      return;
    }

    try {
      setReportMessage("Saving patient feedback...");
      const response = await fetch(
        `${apiUrl}/appointments/${selectedReport.id}/doctor-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: activeIdentifier,
            stars: Number(patientFeedbackForm.stars),
            comment: patientFeedbackForm.comment || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save patient feedback.");
      }
      setReportMessage("Patient feedback saved.");
      await loadData();
    } catch (err: any) {
      setReportMessage(err?.message || "Failed to save patient feedback.");
    }
  }, [
    apiUrl,
    loadData,
    patientFeedbackForm.comment,
    patientFeedbackForm.stars,
    selectedReport,
    setReportMessage,
    user.email,
    user.id,
    user.name,
    user.phone,
    user.username,
  ]);

  return {
    setReportSurfaceOpen,
    handleSelectReportAppointment,
    clearReportSelection,
    handleSubmitReport,
    handleCompleteAppointment,
    handleRatePatient,
  };
}
