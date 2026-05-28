"use client";

import type { DoctorWorkspaceData } from "@/features/supervision/types";
import { useTranslation } from "@/features/i18n/language-provider";

const VIEW_OPTIONS = [
  "Bitewings",
  "PA",
  "PA with angle",
  "Occlusal",
  "OPG",
  "Lat Ceph",
  "Other",
];

const STAR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

type DoctorReportWorkspaceProps = {
  userName: string;
  noShowCount: number;
  bookedAppointments: any[];
  selectedReport: any | null;
  reportForm: {
    title: string;
    description: string;
    supervisor: string;
  };
  reportFormData: {
    chiefComplaint: string;
    medicalHistory: string;
    dentalHistory: string;
    socialHistory: string;
    extraOralFindings: string;
    intraOralFindings: string;
    radiographicViews: string[];
    radiographicFindings: string;
    diagnosisLines: string[];
    treatmentVisits: Array<{
      visitLabel: string;
      tooth: string;
      procedure: string;
    }>;
    facultyNotes: string;
  };
  completionNotes: string;
  patientFeedbackForm: {
    stars: string;
    comment: string;
  };
  selectedReportTaskIds: string[];
  doctorWorkspace: DoctorWorkspaceData | null;
  reportMessage: string | null;
  onNoShow: (appointmentId: string) => void;
  onSelectReport: (appointment: any) => void;
  onCloseReportForm: () => void;
  onPatientNameChange: (value: string) => void;
  onPatientPhoneChange: (value: string) => void;
  onSupervisorChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onToggleTask: (taskId: string, checked: boolean) => void;
  onReportFieldChange: (
    field:
      | "chiefComplaint"
      | "medicalHistory"
      | "dentalHistory"
      | "socialHistory"
      | "extraOralFindings"
      | "intraOralFindings"
      | "radiographicFindings"
      | "facultyNotes",
    value: string,
  ) => void;
  onToggleRadiographicView: (value: string, checked: boolean) => void;
  onDiagnosisLineChange: (index: number, value: string) => void;
  onTreatmentVisitChange: (
    index: number,
    field: "tooth" | "procedure",
    value: string,
  ) => void;
  onCompletionNotesChange: (value: string) => void;
  onCompleteAppointment: () => void;
  onPatientRatingChange: (value: string) => void;
  onPatientCommentChange: (value: string) => void;
  onSubmitPatientFeedback: () => void;
  onSubmit: () => void;
};

export function DoctorReportWorkspace({
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
  onNoShow,
  onSelectReport,
  onCloseReportForm,
  onPatientNameChange,
  onPatientPhoneChange,
  onSupervisorChange,
  onTitleChange,
  onDescriptionChange,
  onToggleTask,
  onReportFieldChange,
  onToggleRadiographicView,
  onDiagnosisLineChange,
  onTreatmentVisitChange,
  onCompletionNotesChange,
  onCompleteAppointment,
  onPatientRatingChange,
  onPatientCommentChange,
  onSubmitPatientFeedback,
  onSubmit,
}: DoctorReportWorkspaceProps) {
  const t = useTranslation();
  const existingReport = selectedReport?.report || null;
  const canSendReport = selectedReport?.status === "COMPLETED";
  const canRatePatient = selectedReport?.status === "COMPLETED";

  return (
    <div className="space-y-5">
      <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="denty-kicker">{t("doctor.report.eyebrow")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("doctor.report.title")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("doctor.report.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="denty-pill">
              {t("doctor.report.active_visits", {
                count: bookedAppointments.length,
              })}
            </span>
            <span className="denty-pill">
              {t("doctor.report.no_shows", { count: noShowCount })}
            </span>
            <span className="denty-pill">
              {userName || t("doctor.common.doctor")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5">
          <div className="space-y-3">
            {bookedAppointments.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("doctor.report.no_appointments")}
              </p>
            ) : null}
            {bookedAppointments
              .slice()
              .sort(
                (left, right) =>
                  new Date(left.slot?.startTime || 0).getTime() -
                  new Date(right.slot?.startTime || 0).getTime(),
              )
              .map((appointment) => {
                const start = appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime)
                  : null;
                const active = selectedReport?.id === appointment.id;

                return (
                  <div
                    key={appointment.id}
                    className={`denty-dashboard-card-soft space-y-4 p-4 ${
                      active ? "ring-2 ring-[rgba(11,123,138,0.18)]" : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          {start
                            ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}${
                                appointment.slot?.endTime
                                  ? ` - ${new Date(appointment.slot.endTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : ""
                              }`
                            : t("doctor.report.no_time")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="denty-pill">{appointment.status}</span>
                          {appointment.report?.status ? (
                            (() => {
                              const s = appointment.report.status;
                              // Color-code so the doctor immediately sees a
                              // rejection or edit-request without having to
                              // open the appointment.
                              const cls =
                                s === "NEEDS_EDIT"
                                  ? "border-amber-500/60 bg-amber-500/85 text-white"
                                  : s === "CASE_REJECTED"
                                    ? "border-rose-500/60 bg-rose-500/85 text-white"
                                    : s === "REVIEWED"
                                      ? "border-emerald-500/60 bg-emerald-500/85 text-white"
                                      : "border-sky-500/60 bg-sky-500/85 text-white";
                              const label =
                                s === "NEEDS_EDIT"
                                  ? "Needs edit"
                                  : s === "CASE_REJECTED"
                                    ? "Case rejected — redo"
                                    : s === "REVIEWED"
                                      ? "Reviewed"
                                      : s === "SUBMITTED"
                                        ? "Submitted"
                                        : s;
                              return (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${cls}`}
                                >
                                  {label}
                                </span>
                              );
                            })()
                          ) : null}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {t("doctor.report.patient", {
                          value:
                            appointment.patient?.name ||
                            appointment.patientName ||
                            t("patient.common.unknown"),
                        })}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {t("doctor.report.clinic", {
                          value:
                            appointment.clinicCase?.clinic?.name ||
                            appointment.slot?.clinic?.name ||
                            t("doctor.profile.clinic"),
                        })}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {t("doctor.report.case", {
                          value:
                            appointment.clinicCase?.title ||
                            appointment.slot?.purpose ||
                            t("doctor.legacy.case.general"),
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {appointment.status === "APPROVED" ? (
                        <button
                          onClick={() => onNoShow(appointment.id)}
                          className="denty-action denty-action-danger"
                        >
                          {t("doctor.report.havent_shown")}
                        </button>
                      ) : null}
                      <button
                        onClick={() => onSelectReport(appointment)}
                        className="denty-action denty-action-primary"
                      >
                        {t("doctor.report.open_case_desk")}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="denty-dashboard-card overflow-hidden p-4 sm:p-5">
          {selectedReport ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="denty-kicker">{t("doctor.report.form_eyebrow")}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {t("doctor.report.form_title")}
                  </h3>
                </div>
                <button onClick={onCloseReportForm} className="denty-action denty-action-secondary shrink-0">
                  {t("doctor.report.clear_form")}
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/22 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.snapshot")}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">
                        {t("doctor.report.field_patient")}
                      </span>{" "}
                      {selectedReport.patient?.name ||
                        selectedReport.patientName ||
                        t("patient.common.unknown")}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">
                        {t("doctor.report.field_clinic")}
                      </span>{" "}
                      {selectedReport.clinicCase?.clinic?.name ||
                        selectedReport.slot?.clinic?.name ||
                        t("doctor.profile.clinic")}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">
                        {t("doctor.report.field_case")}
                      </span>{" "}
                      {selectedReport.clinicCase?.title ||
                        selectedReport.slot?.purpose ||
                        t("doctor.legacy.case.general")}
                    </p>
                  </div>
                </div>

                {existingReport ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                          {t("doctor.report.latest_review")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                          {existingReport.status}
                        </p>
                      </div>
                      {existingReport.reviewedAt ? (
                        <span className="denty-pill">
                          {new Date(existingReport.reviewedAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {existingReport.feedback ||
                        t("doctor.report.review_hint")}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.label_patient")}
                  </p>
                  <input
                    value={selectedReport.patient?.name || selectedReport.patientName || ""}
                    onChange={(event) => onPatientNameChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.label_phone")}
                  </p>
                  <input
                    value={selectedReport.patient?.phone || selectedReport.patientPhone || ""}
                    onChange={(event) => onPatientPhoneChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.label_doctor")}
                  </p>
                  <input value={userName || ""} readOnly className="denty-field text-sm" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.label_supervisor")}
                  </p>
                  {doctorWorkspace?.reportSupervisors?.length ? (
                    <select
                      value={reportForm.supervisor}
                      onChange={(event) => onSupervisorChange(event.target.value)}
                      className="denty-field cursor-pointer text-sm"
                    >
                      <option value="">
                        {t("doctor.report.choose_supervisor")}
                      </option>
                      {doctorWorkspace.reportSupervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={reportForm.supervisor}
                      onChange={(event) => onSupervisorChange(event.target.value)}
                      className="denty-field text-sm"
                    />
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.label_partner")}
                  </p>
                  <input
                    value={
                      selectedReport.partnerDoctor?.name ||
                      (doctorWorkspace?.partnerPair
                        ? doctorWorkspace.partnerPair.doctorOne.id ===
                          doctorWorkspace.doctor.id
                          ? doctorWorkspace.partnerPair.doctorTwo.name
                          : doctorWorkspace.partnerPair.doctorOne.name
                        : t("doctor.report.no_partner"))
                    }
                    readOnly
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.report_title")}
                  </p>
                  <input
                    value={reportForm.title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.case_summary")}
                  </p>
                  <textarea
                    value={reportForm.description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    rows={4}
                    className="denty-field text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.complaint_history")}
                  </p>
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={reportFormData.chiefComplaint}
                      onChange={(event) =>
                        onReportFieldChange("chiefComplaint", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder={t("doctor.report.ph_chief_complaint")}
                    />
                    <textarea
                      value={reportFormData.medicalHistory}
                      onChange={(event) =>
                        onReportFieldChange("medicalHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder={t("doctor.report.ph_medical_history")}
                    />
                    <textarea
                      value={reportFormData.dentalHistory}
                      onChange={(event) =>
                        onReportFieldChange("dentalHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder={t("doctor.report.ph_dental_history")}
                    />
                    <textarea
                      value={reportFormData.socialHistory}
                      onChange={(event) =>
                        onReportFieldChange("socialHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder={t("doctor.report.ph_social_history")}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.examination_imaging")}
                  </p>
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={reportFormData.extraOralFindings}
                      onChange={(event) =>
                        onReportFieldChange("extraOralFindings", event.target.value)
                      }
                      className="denty-field min-h-[80px] text-sm"
                      placeholder={t("doctor.report.ph_extra_oral")}
                    />
                    <textarea
                      value={reportFormData.intraOralFindings}
                      onChange={(event) =>
                        onReportFieldChange("intraOralFindings", event.target.value)
                      }
                      className="denty-field min-h-[80px] text-sm"
                      placeholder={t("doctor.report.ph_intra_oral")}
                    />
                    <div className="flex flex-wrap gap-2">
                      {VIEW_OPTIONS.map((value) => (
                        <label
                          key={value}
                          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/22 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]"
                        >
                          <input
                            type="checkbox"
                            checked={reportFormData.radiographicViews.includes(value)}
                            onChange={(event) =>
                              onToggleRadiographicView(value, event.target.checked)
                            }
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={reportFormData.radiographicFindings}
                      onChange={(event) =>
                        onReportFieldChange("radiographicFindings", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder={t("doctor.report.ph_radiographic")}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("doctor.report.diagnosis")}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {reportFormData.diagnosisLines.map((line, index) => (
                    <input
                      key={index}
                      value={line}
                      onChange={(event) => onDiagnosisLineChange(index, event.target.value)}
                      className="denty-field text-sm"
                      placeholder={t("doctor.report.ph_diagnosis", {
                        n: index + 1,
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("doctor.report.treatment_plan")}
                </p>
                <div className="mt-3 grid gap-3">
                  {reportFormData.treatmentVisits.map((visit, index) => (
                    <div
                      key={visit.visitLabel}
                      className="grid gap-3 rounded-[20px] border border-white/10 bg-white/26 px-4 py-3 sm:grid-cols-2 lg:grid-cols-[0.22fr_0.28fr_1fr]"
                    >
                      <div className="text-sm font-semibold text-[var(--foreground)] sm:col-span-2 lg:col-span-1">
                        {visit.visitLabel}
                      </div>
                      <input
                        value={visit.tooth}
                        onChange={(event) =>
                          onTreatmentVisitChange(index, "tooth", event.target.value)
                        }
                        className="denty-field text-sm"
                        placeholder={t("doctor.report.ph_tooth")}
                      />
                      <input
                        value={visit.procedure}
                        onChange={(event) =>
                          onTreatmentVisitChange(index, "procedure", event.target.value)
                        }
                        className="denty-field text-sm"
                        placeholder={t("doctor.report.ph_procedure")}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {doctorWorkspace?.clinicTasks?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.clinic_tasks")}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {doctorWorkspace.clinicTasks.map((task) => (
                      <label
                        key={task.id}
                        className="denty-list-row flex items-start gap-3 px-4 py-4"
                      >
                        <input
                          type="checkbox"
                          checked={selectedReportTaskIds.includes(task.id)}
                          onChange={(event) => onToggleTask(task.id, event.target.checked)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-semibold text-[var(--foreground)]">
                            {task.title}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                            {task.clinic.name}
                            {task.progress?.status ? ` - ${task.progress.status}` : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.faculty_notes_patient")}
                  </p>
                  <textarea
                    value={completionNotes}
                    onChange={(event) => onCompletionNotesChange(event.target.value)}
                    className="denty-field mt-3 min-h-[120px] text-sm"
                    placeholder={t("doctor.report.ph_completion_notes")}
                  />
                  <button
                    onClick={onCompleteAppointment}
                    className="denty-button-secondary mt-3 w-full px-4 py-3 text-sm font-semibold"
                  >
                    {selectedReport.status === "COMPLETED"
                      ? t("doctor.report.update_completion")
                      : t("doctor.report.mark_completed")}
                  </button>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {t("doctor.report.rate_patient")}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[0.4fr_1fr]">
                    <select
                      value={patientFeedbackForm.stars}
                      onChange={(event) => onPatientRatingChange(event.target.value)}
                      className="denty-field cursor-pointer text-sm"
                    >
                      {STAR_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {t("doctor.profile.stars", {
                            value: value.toFixed(1),
                          })}
                        </option>
                      ))}
                    </select>
                    <input
                      value={patientFeedbackForm.comment}
                      onChange={(event) => onPatientCommentChange(event.target.value)}
                      className="denty-field text-sm"
                      placeholder={t("doctor.report.ph_patient_comment")}
                    />
                  </div>
                  {canRatePatient ? (
                    <button
                      onClick={onSubmitPatientFeedback}
                      className="denty-button-secondary mt-3 w-full px-4 py-3 text-sm font-semibold"
                    >
                      {t("doctor.report.save_patient_feedback")}
                    </button>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      {t("doctor.report.feedback_locked")}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {t("doctor.report.notes_faculty")}
                </p>
                <textarea
                  value={reportFormData.facultyNotes}
                  onChange={(event) => onReportFieldChange("facultyNotes", event.target.value)}
                  rows={4}
                  className="denty-field mt-3 text-sm"
                  placeholder={t("doctor.report.ph_faculty_notes")}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onSubmit}
                  disabled={!canSendReport}
                  className="denty-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {t("doctor.report.send_report")}
                </button>
              </div>

              {reportMessage ? (
                <p className="text-sm text-[var(--muted-foreground)]">{reportMessage}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-[30rem] flex-col items-center justify-center text-center text-[var(--muted-foreground)]">
              <p className="text-xl font-semibold text-[var(--foreground)]">
                {t("doctor.report.empty_title")}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7">
                {t("doctor.report.empty_body")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
