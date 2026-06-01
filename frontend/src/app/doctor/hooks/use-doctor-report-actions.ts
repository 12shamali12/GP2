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
  /**
   * The list of supervisor IDs the doctor has chosen to send this report to.
   * First entry becomes the primary `reviewerSupervisorId` on the backend;
   * the rest are stored as additional reviewers in formData. At least one
   * entry is required by submit-time validation.
   */
  supervisorIds: string[];
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
      // Seed the multi-select with whoever is already attached to the report.
      // Primary reviewer comes first; any additional reviewers stored in
      // formData.additionalSupervisorIds (or as a flat array) follow.
      const additional: string[] = Array.isArray(
        existingReport?.formData?.additionalSupervisorIds,
      )
        ? (existingReport.formData.additionalSupervisorIds as unknown[]).filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          )
        : [];
      const seedIds: string[] = [];
      if (existingReport?.reviewer?.id) seedIds.push(existingReport.reviewer.id);
      additional.forEach((id) => {
        if (!seedIds.includes(id)) seedIds.push(id);
      });
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
        supervisorIds: seedIds,
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
    setReportForm({ title: "", description: "", supervisorIds: [] });
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

    if (reportForm.supervisorIds.length === 0) {
      setReportMessage(
        "Pick at least one supervisor to send this report to.",
      );
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
    // First selected supervisor is the primary reviewer; the rest are
    // additional reviewers stored in formData.additionalSupervisorIds.
    const [primaryId, ...additionalIds] = reportForm.supervisorIds;
    const primarySupervisor = doctorWorkspace?.reportSupervisors?.find(
      (s) => s.id === primaryId,
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
        supervisorName: primarySupervisor?.name || primaryId,
        supervisorIdentifier: primarySupervisor?.id || primaryId,
        partnerDoctorId: doctorWorkspace?.partnerPair
          ? doctorWorkspace.partnerPair.doctorOne.id ===
            doctorWorkspace.doctor.id
            ? doctorWorkspace.partnerPair.doctorTwo.id
            : doctorWorkspace.partnerPair.doctorOne.id
          : undefined,
        taskIds:
          selectedReportTaskIds.length > 0 ? selectedReportTaskIds : undefined,
        // Persist the full multi-select set so:
        //   - The first ID drives the primary reviewer on the schema row.
        //   - The rest live in formData and the backend can re-load them
        //     when the doctor re-opens the form, and the supervisor list
        //     can route a notification to every chosen reviewer.
        formData: {
          ...reportFormData,
          additionalSupervisorIds: additionalIds,
        },
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
    reportForm.supervisorIds,
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
