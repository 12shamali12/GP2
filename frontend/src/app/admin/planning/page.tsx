"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { PlanningAssignmentsView } from "./ui/planning-assignments-view";
import { PlanningDeleteDialog } from "./ui/planning-delete-dialog";
import { PlanningPlanSidebar } from "./ui/planning-plan-sidebar";
import { PlanningResourcesView } from "./ui/planning-resources-view";
import { PlanningSupervisorsView } from "./ui/planning-supervisors-view";
import { PlanningTabNav } from "./ui/planning-tab-nav";
import {
  useAdminPlanningWorkspace,
  VACATION_OPTION,
} from "./hooks/use-admin-planning-workspace";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useTranslation } from "@/features/i18n/language-provider";
const panelClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.76),rgba(225,234,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.14)] backdrop-blur-[24px] sm:p-6";
const planningTabBaseClass =
  "inline-flex min-h-[3.2rem] items-center justify-center rounded-[20px] border px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] shadow-[0_18px_38px_rgba(7,18,34,0.1)] backdrop-blur-[18px] transition";
const planningTabActiveClass =
  "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)]";
const planningTabInactiveClass =
  "border-white/12 bg-[rgba(255,255,255,0.28)] text-[rgba(10,22,40,0.76)] hover:border-[rgba(137,219,255,0.2)] hover:bg-[rgba(255,255,255,0.42)]";
const actionBase =
  "inline-flex items-center justify-center rounded-[18px] border px-5 py-3 text-sm font-semibold shadow-[0_18px_36px_rgba(7,18,34,0.1)] backdrop-blur-[16px] transition";
const primaryAction =
  `${actionBase} border-[rgba(7,111,133,0.2)] bg-[linear-gradient(135deg,rgba(7,111,133,0.96),rgba(11,130,148,0.9))] text-white hover:-translate-y-[1px] hover:shadow-[0_22px_42px_rgba(7,111,133,0.2)]`;
const secondaryAction =
  `${actionBase} border-white/14 bg-[rgba(255,255,255,0.48)] text-[var(--foreground)] hover:-translate-y-[1px] hover:border-white/18 hover:bg-[rgba(255,255,255,0.62)]`;
const dangerAction =
  "inline-flex items-center justify-center rounded-[18px] border border-rose-300/40 bg-rose-50/85 px-5 py-3 text-sm font-semibold text-rose-700 shadow-[0_18px_36px_rgba(120,30,48,0.08)] transition hover:-translate-y-[1px]";
const smallSecondary = `${secondaryAction} min-h-[2.5rem] px-4 py-2 text-xs`;
const smallDanger =
  "inline-flex min-h-[2.5rem] items-center justify-center rounded-[16px] border border-rose-300/40 bg-rose-50/85 px-4 py-2 text-xs font-semibold text-rose-700 shadow-[0_18px_32px_rgba(120,30,48,0.08)] transition hover:-translate-y-[1px]";
const accentAction =
  "inline-flex min-h-[3rem] items-center justify-center rounded-[20px] border border-[rgba(137,219,255,0.24)] bg-[linear-gradient(135deg,rgba(10,22,40,0.94),rgba(7,111,133,0.9))] px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_48px_rgba(6,17,34,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_28px_56px_rgba(6,17,34,0.3)]";

export default function AdminPlanningPage() {
  // Suspense wrapper required by Next.js when a child reads useSearchParams,
  // otherwise the production build fails to prerender this route.
  return (
    <Suspense fallback={null}>
      <AdminPlanningPageInner />
    </Suspense>
  );
}

function AdminPlanningPageInner() {
  const t = useTranslation();
  const {
    loading,
    error,
    setError,
    message,
    setMessage,
    tab,
    setTab,
    showClinicForm,
    setShowClinicForm,
    showShiftForm,
    setShowShiftForm,
    showSemesterForm,
    setShowSemesterForm,
    showClinicCaseForm,
    setShowClinicCaseForm,
    editingClinicId,
    setEditingClinicId,
    editingShiftId,
    setEditingShiftId,
    editingSemesterId,
    setEditingSemesterId,
    editingClinicCaseId,
    setEditingClinicCaseId,
    selectedPlanId,
    setSelectedPlanId,
    planDraftMode,
    setPlanDraftMode,
    deleteDialog,
    setDeleteDialog,
    deleteSubmitting,
    clinicForm,
    setClinicForm,
    shiftForm,
    setShiftForm,
    semesterForm,
    setSemesterForm,
    clinicCaseForm,
    setClinicCaseForm,
    semesterProgression,
    planForm,
    setPlanForm,
    planDays,
    setPlanDays,
    assignmentForm,
    setAssignmentForm,
    clinicSupervisorForm,
    setClinicSupervisorForm,
    progressingSemesters,
    studentSemesterSubmittingId,
    sortedClinics,
    sortedShifts,
    sortedSemesters,
    sortedPlans,
    sortedGroups,
    sortedSupervisors,
    selectedPlan,
    selectedAssignmentPlan,
    selectedClinicSupervisorTarget,
    resetClinicForm,
    resetShiftForm,
    resetSemesterForm,
    resetClinicCaseForm,
    startNewPlan,
    submit,
    postWithoutBody,
    savePlanShell,
    savePlanDays,
    confirmDelete,
    advanceSemesterCohorts,
    reassignStudentSemester,
    formatDateLabel,
  } = useAdminPlanningWorkspace();

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("admin.plan.toast_saved"),
    errorTitle: t("admin.plan.toast_issue"),
  });

  // ?focus=new-case  →  jump to Resources tab, scroll to + open the clinic case form.
  // Used by the "Add case" shortcut on /admin/cases.
  const searchParams = useSearchParams();
  const focus = searchParams?.get("focus");
  const handledFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    if (focus !== "new-case") return;
    if (handledFocusRef.current === focus) return;
    handledFocusRef.current = focus;
    setTab("resources");
    if (!showClinicCaseForm) {
      resetClinicCaseForm();
      setShowClinicCaseForm(true);
    }
    requestAnimationFrame(() => {
      const el = document.getElementById("planning-clinic-case-form");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focus, loading, showClinicCaseForm, setTab, setShowClinicCaseForm, resetClinicCaseForm]);

  return (
    <AdminShell
      title={t("admin.plan.title")}
      description={t("admin.plan.description")}
    >
      <PlanningTabNav
        tab={tab}
        onChange={setTab}
        baseClass={planningTabBaseClass}
        activeClass={planningTabActiveClass}
        inactiveClass={planningTabInactiveClass}
      />

      {loading ? (
        <div className={panelClass}>
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {t("admin.plan.loading")}
          </p>
        </div>
      ) : null}

      {tab === "resources" ? (
        <PlanningResourcesView
          panelClass={panelClass}
          secondaryAction={secondaryAction}
          primaryAction={primaryAction}
          smallSecondary={smallSecondary}
          smallDanger={smallDanger}
          showClinicForm={showClinicForm}
          showShiftForm={showShiftForm}
          showSemesterForm={showSemesterForm}
          showClinicCaseForm={showClinicCaseForm}
          editingClinicId={editingClinicId}
          editingShiftId={editingShiftId}
          editingSemesterId={editingSemesterId}
          editingClinicCaseId={editingClinicCaseId}
          clinicForm={clinicForm}
          shiftForm={shiftForm}
          semesterForm={semesterForm}
          clinicCaseForm={clinicCaseForm}
          sortedClinics={sortedClinics}
          sortedShifts={sortedShifts}
          sortedSemesters={sortedSemesters}
          semesterProgression={semesterProgression}
          progressingSemesters={progressingSemesters}
          studentSemesterSubmittingId={studentSemesterSubmittingId}
          onToggleClinicForm={() => {
            if (!showClinicForm || editingClinicId) resetClinicForm();
            setShowClinicForm((value) => !value);
          }}
          onToggleShiftForm={() => {
            if (!showShiftForm || editingShiftId) resetShiftForm();
            setShowShiftForm((value) => !value);
          }}
          onToggleSemesterForm={() => {
            if (!showSemesterForm || editingSemesterId) resetSemesterForm();
            setShowSemesterForm((value) => !value);
          }}
          onToggleClinicCaseForm={() => {
            if (!showClinicCaseForm || editingClinicCaseId)
              resetClinicCaseForm();
            setShowClinicCaseForm((value) => !value);
          }}
          onResetClinicForm={resetClinicForm}
          onResetShiftForm={resetShiftForm}
          onResetSemesterForm={resetSemesterForm}
          onResetClinicCaseForm={resetClinicCaseForm}
          onClinicFieldChange={(field, value) =>
            setClinicForm((prev) => ({ ...prev, [field]: value }))
          }
          onShiftFieldChange={(field, value) =>
            setShiftForm((prev) => ({ ...prev, [field]: value }))
          }
          onSemesterFieldChange={(field, value) =>
            setSemesterForm((prev) => ({ ...prev, [field]: value }))
          }
          onClinicCaseFieldChange={(field, value) =>
            setClinicCaseForm((prev) => ({ ...prev, [field]: value }))
          }
          onSaveClinic={async () => {
            const data = await submit(
              editingClinicId
                ? `/supervisor/clinics/${editingClinicId}/update`
                : "/supervisor/clinics",
              clinicForm,
              editingClinicId
                ? t("admin.plan.msg_clinic_updated")
                : t("admin.plan.msg_clinic_created")
            );
            if (data) resetClinicForm();
          }}
          onSaveShift={async () => {
            const data = await submit(
              editingShiftId
                ? `/supervisor/shifts/${editingShiftId}/update`
                : "/supervisor/shifts",
              {
                ...shiftForm,
                appointmentCapacity: Number(
                  shiftForm.appointmentCapacity || 2
                ),
              },
              editingShiftId
                ? t("admin.plan.msg_shift_updated")
                : t("admin.plan.msg_shift_created")
            );
            if (data) resetShiftForm();
          }}
          onSaveSemester={async () => {
            const data = await submit(
              editingSemesterId
                ? `/supervisor/semesters/${editingSemesterId}/update`
                : "/supervisor/semesters",
              {
                label: semesterForm.label,
                sortOrder: Number(semesterForm.sortOrder || 0),
                endsOn: semesterForm.endsOn || undefined,
              },
              editingSemesterId
                ? t("admin.plan.msg_semester_updated")
                : t("admin.plan.msg_semester_created")
            );
            if (data) resetSemesterForm();
          }}
          onSaveClinicCase={async () => {
            const data = await submit(
              editingClinicCaseId
                ? `/supervisor/clinic-cases/${editingClinicCaseId}/update`
                : "/supervisor/clinic-cases",
              {
                semesterId: clinicCaseForm.semesterId,
                clinicId: clinicCaseForm.clinicId,
                title: clinicCaseForm.title,
                description: clinicCaseForm.description || undefined,
                requiredCount: Number(clinicCaseForm.requiredCount || 1),
              },
              editingClinicCaseId
                ? t("admin.plan.msg_case_updated")
                : t("admin.plan.msg_case_created")
            );
            if (data) resetClinicCaseForm();
          }}
          onAdvanceSemesterCohorts={advanceSemesterCohorts}
          onReassignStudentSemester={reassignStudentSemester}
          onEditClinic={(clinic) => {
            setEditingClinicId(clinic.id);
            setClinicForm({
              name: clinic.name,
              description: clinic.description || "",
            });
            setShowClinicForm(true);
          }}
          onEditShift={(shift) => {
            setEditingShiftId(shift.id);
            setShiftForm({
              name: shift.name,
              startsAt: shift.startsAt,
              endsAt: shift.endsAt,
              appointmentCapacity: String(shift.appointmentCapacity),
            });
            setShowShiftForm(true);
          }}
          onEditSemester={(semester) => {
            setEditingSemesterId(semester.id);
            setSemesterForm({
              label: semester.label,
              sortOrder: String(semester.sortOrder),
              endsOn: semester.endsOn
                ? new Date(semester.endsOn).toISOString().slice(0, 10)
                : "",
            });
            setShowSemesterForm(true);
          }}
          onEditClinicCase={(clinicCase, semester) => {
            setEditingClinicCaseId(clinicCase.id);
            setClinicCaseForm({
              semesterId: semester.id,
              clinicId: clinicCase.clinic.id,
              title: clinicCase.title,
              description: clinicCase.description || "",
              requiredCount: String(clinicCase.requiredCount),
            });
            setShowClinicCaseForm(true);
          }}
          onDeleteClinic={(clinic) =>
            setDeleteDialog({
              kind: "clinic",
              id: clinic.id,
              label: clinic.name,
            })
          }
          onDeleteShift={(shift) =>
            setDeleteDialog({
              kind: "shift",
              id: shift.id,
              label: shift.name,
            })
          }
          onDeleteSemester={(semester) =>
            setDeleteDialog({
              kind: "semester",
              id: semester.id,
              label: semester.label,
            })
          }
          onDeleteClinicCase={(clinicCase) =>
            setDeleteDialog({
              kind: "clinicCase",
              id: clinicCase.id,
              label: clinicCase.title,
            })
          }
        />
      ) : null}

      {tab === "plans" ? (
        <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
          <PlanningPlanSidebar
            panelClass={panelClass}
            primaryAction={primaryAction}
            dangerAction={dangerAction}
            accentAction={accentAction}
            smallDanger={smallDanger}
            planDraftMode={planDraftMode}
            selectedPlan={selectedPlan}
            sortedPlans={sortedPlans}
            sortedShifts={sortedShifts}
            selectedPlanId={selectedPlanId}
            planForm={planForm}
            onStartNewPlan={startNewPlan}
            onSavePlanShell={savePlanShell}
            onDeletePlan={({ id, label }) =>
              setDeleteDialog({
                kind: "plan",
                id,
                label,
              })
            }
            onSelectPlan={(planId) => {
              setPlanDraftMode("edit");
              setSelectedPlanId(planId);
            }}
            onPlanFieldChange={(field, value) =>
              setPlanForm((prev) => ({ ...prev, [field]: value }))
            }
            formatDateLabel={formatDateLabel}
          />

          <div className={panelClass}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="denty-kicker">{t("admin.plan.planning_wall")}</p>
                <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {t("admin.plan.ten_day_board")}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  {t("admin.plan.board_intro")}
                </p>
              </div>
              <select
                value={selectedPlanId}
                onChange={(e) => {
                  setPlanDraftMode("edit");
                  setSelectedPlanId(e.target.value);
                }}
                className="denty-field w-full cursor-pointer text-sm sm:w-auto sm:min-w-[18rem]"
              >
                {sortedPlans.length === 0 ? (
                  <option value="">{t("admin.plan.no_plans_yet")}</option>
                ) : null}
                {sortedPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlan ? (
              <>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_54px_rgba(6,17,34,0.24)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-white">
                          {selectedPlan.label}
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          {formatDateLabel(selectedPlan.startsOn)} - {formatDateLabel(selectedPlan.endsOn)}
                        </p>
                      </div>
                      {selectedPlan.shift ? (
                        <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.16em] text-white/82">
                          {selectedPlan.shift.name} | {selectedPlan.shift.startsAt} - {selectedPlan.shift.endsAt}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/24 px-4 py-4">
                      <p className="denty-kicker !tracking-[0.16em]">{t("admin.plan.clinic_days")}</p>
                      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                        {planDays.filter((day) => !day.isVacation).length}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/24 px-4 py-4">
                      <p className="denty-kicker !tracking-[0.16em]">{t("admin.plan.free_days")}</p>
                      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                        {planDays.filter((day) => day.isVacation).length}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/24 px-4 py-4">
                      <p className="denty-kicker !tracking-[0.16em]">{t("admin.plan.wall_rows")}</p>
                      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                        {planDays.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {planDays.map((day, index) => (
                    <div
                      key={day.assignmentDate}
                      className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
                    >
                      <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[auto_minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-center">
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] text-base font-semibold text-[var(--foreground)]">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="break-words text-xl font-semibold text-[var(--foreground)]">
                            {formatDateLabel(day.assignmentDate, {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          <p className="mt-1 text-sm font-medium uppercase tracking-[0.14em] text-[rgba(10,22,40,0.48)]">
                            {t("admin.plan.day_number", { n: index + 1 })}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <select
                            value={day.isVacation ? VACATION_OPTION : day.clinicId}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPlanDays((prev) =>
                                prev.map((entry) =>
                                  entry.assignmentDate === day.assignmentDate
                                    ? {
                                        ...entry,
                                        clinicId:
                                          value === VACATION_OPTION || value === ""
                                            ? ""
                                            : value,
                                        isVacation: value === VACATION_OPTION,
                                        vacationReason:
                                          value === VACATION_OPTION
                                            ? entry.vacationReason
                                            : "",
                                      }
                                    : entry,
                                ),
                              );
                            }}
                            className="denty-field cursor-pointer text-sm"
                          >
                            <option value="">{t("admin.plan.choose_clinic")}</option>
                            {sortedClinics.map((clinic) => (
                              <option key={clinic.id} value={clinic.id}>
                                {clinic.name}
                              </option>
                            ))}
                            <option value={VACATION_OPTION}>
                              {t("admin.plan.vacation_option")}
                            </option>
                          </select>

                          <input
                            value={day.isVacation ? day.vacationReason : day.notes}
                            onChange={(e) =>
                              setPlanDays((prev) =>
                                prev.map((entry) =>
                                  entry.assignmentDate === day.assignmentDate
                                    ? day.isVacation
                                      ? { ...entry, vacationReason: e.target.value }
                                      : { ...entry, notes: e.target.value }
                                    : entry,
                                ),
                              )
                            }
                            className="denty-field text-sm md:min-w-[16rem]"
                            placeholder={
                              day.isVacation
                                ? t("admin.plan.vacation_reason_placeholder")
                                : t("admin.plan.note_placeholder")
                            }
                          />

                          {day.isVacation ? (
                            <div className="md:col-span-2">
                              <p className="rounded-[20px] border border-amber-200/40 bg-amber-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                                {t("admin.plan.vacation_day_note")}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {t("admin.plan.ten_rows_hint")}
                  </p>
                  <button type="button" onClick={savePlanDays} className={primaryAction}>
                    {t("admin.plan.save_schedule")}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[20px] border border-dashed border-white/18 bg-white/18 p-5">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("admin.plan.choose_plan_hint")}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "assignments" ? (
        <PlanningAssignmentsView
          panelClass={panelClass}
          primaryAction={primaryAction}
          assignmentForm={assignmentForm}
          sortedPlans={sortedPlans}
          sortedGroups={sortedGroups}
          selectedAssignmentPlan={selectedAssignmentPlan}
          formatDateLabel={formatDateLabel}
          onAssignmentFieldChange={(field, value) =>
            setAssignmentForm((prev) => ({ ...prev, [field]: value }))
          }
          onSubmitAssignment={async () => {
            const data = await submit(
              "/supervisor/plans/assign-group",
              assignmentForm,
              t("admin.plan.msg_plan_queued")
            );
            if (data) {
              setAssignmentForm((prev) => ({ ...prev, notes: "" }));
            }
          }}
        />
      ) : null}

      {tab === "supervisors" ? (
        <PlanningSupervisorsView
          panelClass={panelClass}
          primaryAction={primaryAction}
          smallDanger={smallDanger}
          clinicSupervisorForm={clinicSupervisorForm}
          sortedClinics={sortedClinics}
          sortedSupervisors={sortedSupervisors}
          selectedClinicSupervisorTarget={selectedClinicSupervisorTarget}
          onClinicSupervisorFieldChange={(field, value) =>
            setClinicSupervisorForm((prev) => ({ ...prev, [field]: value }))
          }
          onSaveClinicSupervisor={async () => {
            if (
              !clinicSupervisorForm.clinicId ||
              !clinicSupervisorForm.supervisorId
            ) {
              setError(t("admin.plan.choose_clinic_supervisor"));
              return;
            }
            const data = await submit(
              "/supervisor/clinics/supervisors",
              {
                clinicId: clinicSupervisorForm.clinicId,
                supervisorId: clinicSupervisorForm.supervisorId,
                notes: clinicSupervisorForm.notes,
              },
              t("admin.plan.msg_supervisor_linked")
            );
            if (data) {
              setClinicSupervisorForm((prev) => ({ ...prev, notes: "" }));
            }
          }}
          onRemoveClinicSupervisor={async (clinicId, supervisorId) => {
            await postWithoutBody(
              `/supervisor/clinics/${clinicId}/supervisors/${supervisorId}/remove`,
              t("admin.plan.msg_supervisor_removed")
            );
          }}
        />
      ) : null}

      <PlanningDeleteDialog
        deleteDialog={deleteDialog}
        deleteSubmitting={deleteSubmitting}
        secondaryAction={secondaryAction}
        dangerAction={dangerAction}
        onClose={() => !deleteSubmitting && setDeleteDialog(null)}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
