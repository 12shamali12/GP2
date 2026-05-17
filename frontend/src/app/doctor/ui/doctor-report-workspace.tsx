"use client";

import type { DoctorWorkspaceData } from "@/features/supervision/types";

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
  const existingReport = selectedReport?.report || null;
  const canSendReport = selectedReport?.status === "COMPLETED";
  const canRatePatient = selectedReport?.status === "COMPLETED";

  return (
    <div className="space-y-5">
      <div className="denty-dashboard-card overflow-hidden p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">Case reporting</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Clinical completion studio
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              Confirm the visit, leave patient notes, rate the patient, and submit one structured
              report for supervisor review without leaving the doctor suite.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="denty-pill">{bookedAppointments.length} active visits</span>
            <span className="denty-pill">{noShowCount} no-shows</span>
            <span className="denty-pill">{userName || "Doctor"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="denty-dashboard-card overflow-hidden p-5">
          <div className="space-y-3">
            {bookedAppointments.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No approved or completed appointments yet.</p>
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
                            : "No time"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="denty-pill">{appointment.status}</span>
                          {appointment.report?.status ? (
                            <span className="denty-pill">{appointment.report.status}</span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Patient: {appointment.patient?.name || appointment.patientName || "Unknown"}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Clinic: {appointment.clinicCase?.clinic?.name || appointment.slot?.clinic?.name || "Clinic"}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Case: {appointment.clinicCase?.title || appointment.slot?.purpose || "General"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {appointment.status === "APPROVED" ? (
                        <button
                          onClick={() => onNoShow(appointment.id)}
                          className="denty-action denty-action-danger"
                        >
                          Haven&apos;t shown
                        </button>
                      ) : null}
                      <button
                        onClick={() => onSelectReport(appointment)}
                        className="denty-action denty-action-primary"
                      >
                        Open case desk
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="denty-dashboard-card overflow-hidden p-5">
          {selectedReport ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="denty-kicker">Report form</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    Complete case report
                  </h3>
                </div>
                <button onClick={onCloseReportForm} className="denty-action denty-action-secondary">
                  Clear form
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/22 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Appointment snapshot
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">Patient:</span>{" "}
                      {selectedReport.patient?.name || selectedReport.patientName || "Unknown"}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">Clinic:</span>{" "}
                      {selectedReport.clinicCase?.clinic?.name ||
                        selectedReport.slot?.clinic?.name ||
                        "Clinic"}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-semibold">Case:</span>{" "}
                      {selectedReport.clinicCase?.title ||
                        selectedReport.slot?.purpose ||
                        "General"}
                    </p>
                  </div>
                </div>

                {existingReport ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/22 p-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                          Latest faculty review
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
                        "You can reopen this draft, update the fields below, and resubmit it."}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Patient
                  </p>
                  <input
                    value={selectedReport.patient?.name || selectedReport.patientName || ""}
                    onChange={(event) => onPatientNameChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Phone
                  </p>
                  <input
                    value={selectedReport.patient?.phone || selectedReport.patientPhone || ""}
                    onChange={(event) => onPatientPhoneChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Doctor
                  </p>
                  <input value={userName || ""} readOnly className="denty-field text-sm" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Supervisor
                  </p>
                  {doctorWorkspace?.reportSupervisors?.length ? (
                    <select
                      value={reportForm.supervisor}
                      onChange={(event) => onSupervisorChange(event.target.value)}
                      className="denty-field cursor-pointer text-sm"
                    >
                      <option value="">Choose supervisor</option>
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
                    Partner
                  </p>
                  <input
                    value={
                      selectedReport.partnerDoctor?.name ||
                      (doctorWorkspace?.partnerPair
                        ? doctorWorkspace.partnerPair.doctorOne.id ===
                          doctorWorkspace.doctor.id
                          ? doctorWorkspace.partnerPair.doctorTwo.name
                          : doctorWorkspace.partnerPair.doctorOne.name
                        : "No active partner")
                    }
                    readOnly
                    className="denty-field text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Report title
                  </p>
                  <input
                    value={reportForm.title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    className="denty-field text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Case summary
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
                    Chief complaint and history
                  </p>
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={reportFormData.chiefComplaint}
                      onChange={(event) =>
                        onReportFieldChange("chiefComplaint", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder="Chief complaint and history of chief complaint"
                    />
                    <textarea
                      value={reportFormData.medicalHistory}
                      onChange={(event) =>
                        onReportFieldChange("medicalHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder="Relevant medical history"
                    />
                    <textarea
                      value={reportFormData.dentalHistory}
                      onChange={(event) =>
                        onReportFieldChange("dentalHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder="Dental past history"
                    />
                    <textarea
                      value={reportFormData.socialHistory}
                      onChange={(event) =>
                        onReportFieldChange("socialHistory", event.target.value)
                      }
                      className="denty-field min-h-[90px] text-sm"
                      placeholder="Social and family history"
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Examination and imaging
                  </p>
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={reportFormData.extraOralFindings}
                      onChange={(event) =>
                        onReportFieldChange("extraOralFindings", event.target.value)
                      }
                      className="denty-field min-h-[80px] text-sm"
                      placeholder="Extra-oral findings"
                    />
                    <textarea
                      value={reportFormData.intraOralFindings}
                      onChange={(event) =>
                        onReportFieldChange("intraOralFindings", event.target.value)
                      }
                      className="denty-field min-h-[80px] text-sm"
                      placeholder="Intra-oral findings"
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
                      placeholder="Radiographic findings"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Diagnosis of main problems
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {reportFormData.diagnosisLines.map((line, index) => (
                    <input
                      key={index}
                      value={line}
                      onChange={(event) => onDiagnosisLineChange(index, event.target.value)}
                      className="denty-field text-sm"
                      placeholder={`Diagnosis ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Treatment plan
                </p>
                <div className="mt-3 grid gap-3">
                  {reportFormData.treatmentVisits.map((visit, index) => (
                    <div
                      key={visit.visitLabel}
                      className="grid gap-3 rounded-[20px] border border-white/10 bg-white/26 px-4 py-3 md:grid-cols-[0.22fr_0.28fr_1fr]"
                    >
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        {visit.visitLabel}
                      </div>
                      <input
                        value={visit.tooth}
                        onChange={(event) =>
                          onTreatmentVisitChange(index, "tooth", event.target.value)
                        }
                        className="denty-field text-sm"
                        placeholder="Tooth"
                      />
                      <input
                        value={visit.procedure}
                        onChange={(event) =>
                          onTreatmentVisitChange(index, "procedure", event.target.value)
                        }
                        className="denty-field text-sm"
                        placeholder="Procedure"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {doctorWorkspace?.clinicTasks?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Clinic tasks worked on today
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
                    Faculty notes for the patient
                  </p>
                  <textarea
                    value={completionNotes}
                    onChange={(event) => onCompletionNotesChange(event.target.value)}
                    className="denty-field mt-3 min-h-[120px] text-sm"
                    placeholder="Post-visit notes, instructions, and next steps"
                  />
                  <button
                    onClick={onCompleteAppointment}
                    className="denty-button-secondary mt-3 w-full px-4 py-3 text-sm font-semibold"
                  >
                    {selectedReport.status === "COMPLETED"
                      ? "Update completion notes"
                      : "Mark visit completed"}
                  </button>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Rate the patient
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[0.35fr_1fr]">
                    <select
                      value={patientFeedbackForm.stars}
                      onChange={(event) => onPatientRatingChange(event.target.value)}
                      className="denty-field cursor-pointer text-sm"
                    >
                      {STAR_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value.toFixed(1)} stars
                        </option>
                      ))}
                    </select>
                    <input
                      value={patientFeedbackForm.comment}
                      onChange={(event) => onPatientCommentChange(event.target.value)}
                      className="denty-field text-sm"
                      placeholder="Attendance, cooperation, or case notes"
                    />
                  </div>
                  {canRatePatient ? (
                    <button
                      onClick={onSubmitPatientFeedback}
                      className="denty-button-secondary mt-3 w-full px-4 py-3 text-sm font-semibold"
                    >
                      Save patient feedback
                    </button>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      Patient feedback opens after you mark the visit as completed.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/22 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Notes to faculty
                </p>
                <textarea
                  value={reportFormData.facultyNotes}
                  onChange={(event) => onReportFieldChange("facultyNotes", event.target.value)}
                  rows={4}
                  className="denty-field mt-3 text-sm"
                  placeholder="Optional notes for faculty review"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onSubmit}
                  disabled={!canSendReport}
                  className="denty-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Send report
                </button>
              </div>

              {reportMessage ? (
                <p className="text-sm text-[var(--muted-foreground)]">{reportMessage}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-[30rem] flex-col items-center justify-center text-center text-[var(--muted-foreground)]">
              <p className="text-xl font-semibold text-[var(--foreground)]">
                Select an appointment to report on
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7">
                Open any approved or completed appointment from the left lane to confirm the visit,
                capture patient notes, and submit the case to the supervisor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
