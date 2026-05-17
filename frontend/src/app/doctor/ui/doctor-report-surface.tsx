"use client";

import type { Dispatch, SetStateAction } from "react";
import { DoctorReportWorkspace } from "@/app/doctor/ui/doctor-report-workspace";
import type { DoctorReportFormData } from "@/app/doctor/lib/report-form";
import type { DoctorWorkspaceData } from "@/features/supervision/types";

type ReportForm = {
  title: string;
  description: string;
  supervisor: string;
};

type PatientFeedbackForm = {
  stars: string;
  comment: string;
};

type DoctorReportSurfaceProps = {
  userName: string;
  noShowCount: number;
  bookedAppointments: any[];
  selectedReport: any | null;
  reportForm: ReportForm;
  reportFormData: DoctorReportFormData;
  completionNotes: string;
  patientFeedbackForm: PatientFeedbackForm;
  selectedReportTaskIds: string[];
  doctorWorkspace: DoctorWorkspaceData | null;
  reportMessage: string | null;
  setSelectedReport: Dispatch<SetStateAction<any | null>>;
  setReportForm: Dispatch<SetStateAction<ReportForm>>;
  setReportFormData: Dispatch<SetStateAction<DoctorReportFormData>>;
  setSelectedReportTaskIds: Dispatch<SetStateAction<string[]>>;
  setCompletionNotes: Dispatch<SetStateAction<string>>;
  setPatientFeedbackForm: Dispatch<SetStateAction<PatientFeedbackForm>>;
  onNoShow: (appointmentId: string) => void;
  onSelectReport: (appointment: any) => void;
  onCloseReportForm: () => void;
  onCompleteAppointment: () => void;
  onSubmitPatientFeedback: () => void;
  onSubmit: () => void;
};

export function DoctorReportSurface({
  userName,
  noShowCount,
  bookedAppointments,
  selectedReport,
  reportForm,
  reportFormData,
  completionNotes,
  patientFeedbackForm,
  selectedReportTaskIds,
  doctorWorkspace,
  reportMessage,
  setSelectedReport,
  setReportForm,
  setReportFormData,
  setSelectedReportTaskIds,
  setCompletionNotes,
  setPatientFeedbackForm,
  onNoShow,
  onSelectReport,
  onCloseReportForm,
  onCompleteAppointment,
  onSubmitPatientFeedback,
  onSubmit,
}: DoctorReportSurfaceProps) {
  return (
    <DoctorReportWorkspace
      userName={userName}
      noShowCount={noShowCount}
      bookedAppointments={bookedAppointments}
      selectedReport={selectedReport}
      reportForm={reportForm}
      reportFormData={reportFormData}
      completionNotes={completionNotes}
      patientFeedbackForm={patientFeedbackForm}
      selectedReportTaskIds={selectedReportTaskIds}
      doctorWorkspace={doctorWorkspace}
      reportMessage={reportMessage}
      onNoShow={onNoShow}
      onSelectReport={onSelectReport}
      onCloseReportForm={onCloseReportForm}
      onPatientNameChange={(value) =>
        setSelectedReport((prev: any) => ({ ...prev, patientName: value }))
      }
      onPatientPhoneChange={(value) =>
        setSelectedReport((prev: any) => ({ ...prev, patientPhone: value }))
      }
      onSupervisorChange={(value) =>
        setReportForm((prev) => ({ ...prev, supervisor: value }))
      }
      onTitleChange={(value) =>
        setReportForm((prev) => ({ ...prev, title: value }))
      }
      onDescriptionChange={(value) =>
        setReportForm((prev) => ({ ...prev, description: value }))
      }
      onToggleTask={(taskId, checked) =>
        setSelectedReportTaskIds((prev) =>
          checked ? [...prev, taskId] : prev.filter((id) => id !== taskId),
        )
      }
      onReportFieldChange={(field, value) =>
        setReportFormData((prev) => ({ ...prev, [field]: value }))
      }
      onToggleRadiographicView={(value, checked) =>
        setReportFormData((prev) => ({
          ...prev,
          radiographicViews: checked
            ? Array.from(new Set([...prev.radiographicViews, value]))
            : prev.radiographicViews.filter((item) => item !== value),
        }))
      }
      onDiagnosisLineChange={(index, value) =>
        setReportFormData((prev) => ({
          ...prev,
          diagnosisLines: prev.diagnosisLines.map((line, lineIndex) =>
            lineIndex === index ? value : line,
          ),
        }))
      }
      onTreatmentVisitChange={(index, field, value) =>
        setReportFormData((prev) => ({
          ...prev,
          treatmentVisits: prev.treatmentVisits.map((visit, visitIndex) =>
            visitIndex === index ? { ...visit, [field]: value } : visit,
          ),
        }))
      }
      onCompletionNotesChange={setCompletionNotes}
      onCompleteAppointment={onCompleteAppointment}
      onPatientRatingChange={(value) =>
        setPatientFeedbackForm((prev) => ({ ...prev, stars: value }))
      }
      onPatientCommentChange={(value) =>
        setPatientFeedbackForm((prev) => ({ ...prev, comment: value }))
      }
      onSubmitPatientFeedback={onSubmitPatientFeedback}
      onSubmit={onSubmit}
    />
  );
}
