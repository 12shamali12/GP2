"use client";

import { useEffect, useMemo, useState } from "react";
import {
  advanceEligibleStudents,
  getSemesterProgression,
  getPlanningWorkspace,
  getUsers,
  postAdminJson,
  updateStudentSemester,
} from "@/features/admin/services/admin-api";
import { sortByLabel } from "@/features/admin/utils/collection";
import type {
  ManagedUser,
  SemesterProgressionPreview,
} from "@/features/admin/types/admin";
import type { PlanningWorkspaceData } from "@/features/supervision/types";

export type PlanningTab =
  | "resources"
  | "plans"
  | "assignments"
  | "supervisors";
export type PlanDraftMode = "create" | "edit";
export type DeleteDialogState =
  | {
      kind: "clinic" | "shift" | "plan" | "semester" | "clinicCase";
      id: string;
      label: string;
    }
  | null;
export type PlanDayDraft = {
  assignmentDate: string;
  clinicId: string;
  notes: string;
  isVacation: boolean;
  vacationReason: string;
};

export const VACATION_OPTION = "__VACATION__";

const formatDateOnly = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

const parseDateValue = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
      0,
      0,
      0
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (value: string) => {
  const date = parseDateValue(value);
  return date ? formatDateOnly(date) : "";
};

const formatDateLabel = (
  value: string,
  options?: Intl.DateTimeFormatOptions
) => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString(undefined, options) : value;
};

const buildWorkingDays = (startsOn: string) => {
  const start = parseDateValue(startsOn);
  if (!start) return [];
  const dates: string[] = [];
  for (let offset = 0; offset < 12; offset += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + offset);
    const day = next.getDay();
    if (day >= 0 && day <= 4) dates.push(formatDateOnly(next));
  }
  return dates;
};

export function useAdminPlanningWorkspace() {
  const [workspace, setWorkspace] = useState<PlanningWorkspaceData | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [semesterProgression, setSemesterProgression] =
    useState<SemesterProgressionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<PlanningTab>("plans");
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [showClinicCaseForm, setShowClinicCaseForm] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editingClinicCaseId, setEditingClinicCaseId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planDraftMode, setPlanDraftMode] = useState<PlanDraftMode>("edit");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: "", description: "" });
  const [shiftForm, setShiftForm] = useState({
    name: "",
    startsAt: "16:00",
    endsAt: "20:00",
    appointmentCapacity: "2",
  });
  const [semesterForm, setSemesterForm] = useState({
    label: "",
    sortOrder: "0",
    endsOn: "",
  });
  const [clinicCaseForm, setClinicCaseForm] = useState({
    semesterId: "",
    clinicId: "",
    title: "",
    description: "",
    requiredCount: "1",
  });
  const [planForm, setPlanForm] = useState({
    label: "",
    startsOn: "",
    shiftId: "",
  });
  const [planDays, setPlanDays] = useState<PlanDayDraft[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    planId: "",
    groupId: "",
    notes: "",
  });
  const [clinicSupervisorForm, setClinicSupervisorForm] = useState({
    clinicId: "",
    supervisorId: "",
    notes: "",
  });
  const [progressingSemesters, setProgressingSemesters] = useState(false);
  const [studentSemesterSubmittingId, setStudentSemesterSubmittingId] =
    useState<string | null>(null);

  const sortedClinics = useMemo(
    () => sortByLabel(workspace?.clinics ?? [], (clinic) => clinic.name),
    [workspace]
  );
  const sortedShifts = useMemo(
    () => sortByLabel(workspace?.shifts ?? [], (shift) => shift.name),
    [workspace]
  );
  const sortedSemesters = useMemo(
    () =>
      [...(workspace?.semesters ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }
        return left.label.localeCompare(right.label);
      }),
    [workspace]
  );
  const sortedPlans = useMemo(
    () => sortByLabel(workspace?.plans ?? [], (plan) => plan.label),
    [workspace]
  );
  const sortedGroups = useMemo(
    () =>
      sortByLabel(
        workspace?.groups ?? [],
        (group) => `${group.name} ${group.semesterLabel}`
      ),
    [workspace]
  );
  const sortedSupervisors = useMemo(
    () =>
      sortByLabel(
        users.filter(
          (user) =>
            user.role === "SUPERVISOR" && user.supervisorStatus === "APPROVED"
        ),
        (user) => user.name
      ),
    [users]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [planningData, usersData, progressionData] = await Promise.all([
        getPlanningWorkspace(),
        getUsers(),
        getSemesterProgression(),
      ]);
      setWorkspace(planningData);
      setUsers(usersData || []);
      setSemesterProgression(progressionData || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load planning workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedPlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === selectedPlanId) || null,
    [sortedPlans, selectedPlanId]
  );
  const selectedAssignmentPlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === assignmentForm.planId) || null,
    [sortedPlans, assignmentForm.planId]
  );
  const selectedClinicSupervisorTarget = useMemo(
    () =>
      sortedClinics.find(
        (clinic) => clinic.id === clinicSupervisorForm.clinicId
      ) || null,
    [clinicSupervisorForm.clinicId, sortedClinics]
  );

  useEffect(() => {
    if (planDraftMode !== "edit") return;
    if (!sortedPlans.length) {
      setSelectedPlanId("");
      return;
    }
    if (
      !selectedPlanId ||
      !sortedPlans.some((plan) => plan.id === selectedPlanId)
    ) {
      setSelectedPlanId(sortedPlans[0].id);
    }
  }, [sortedPlans, selectedPlanId, planDraftMode]);

  useEffect(() => {
    if (planDraftMode !== "edit" || !selectedPlan) return;
    setPlanForm({
      label: selectedPlan.label,
      startsOn: toDateInputValue(selectedPlan.startsOn),
      shiftId: selectedPlan.shift?.id || "",
    });
  }, [planDraftMode, selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) {
      setPlanDays([]);
      return;
    }
    const existing = new Map(
      selectedPlan.days.map((day) => [
        toDateInputValue(day.assignmentDate),
        {
          clinicId: day.clinic?.id || "",
          notes: day.notes || "",
          isVacation: Boolean(day.isVacation),
          vacationReason: day.vacationReason || "",
        },
      ])
    );
    setPlanDays(
      buildWorkingDays(toDateInputValue(selectedPlan.startsOn)).map((date) => ({
        assignmentDate: date,
        clinicId: existing.get(date)?.clinicId || "",
        notes: existing.get(date)?.notes || "",
        isVacation: existing.get(date)?.isVacation || false,
        vacationReason: existing.get(date)?.vacationReason || "",
      }))
    );
  }, [selectedPlan]);

  useEffect(() => {
    if (!sortedPlans.length) return;
    setAssignmentForm((prev) => ({
      ...prev,
      planId: prev.planId || sortedPlans[0].id,
    }));
  }, [sortedPlans]);

  useEffect(() => {
    if (!sortedGroups.length) return;
    setAssignmentForm((prev) => ({
      ...prev,
      groupId: prev.groupId || sortedGroups[0].id,
    }));
  }, [sortedGroups]);

  useEffect(() => {
    if (!sortedSupervisors.length) return;
    setClinicSupervisorForm((prev) => ({
      ...prev,
      supervisorId: prev.supervisorId || sortedSupervisors[0].id,
    }));
  }, [sortedSupervisors]);

  useEffect(() => {
    if (!sortedClinics.length) return;
    setClinicSupervisorForm((prev) => ({
      ...prev,
      clinicId: prev.clinicId || sortedClinics[0].id,
    }));
  }, [sortedClinics]);

  useEffect(() => {
    if (!sortedSemesters.length) return;
    setClinicCaseForm((prev) => ({
      ...prev,
      semesterId: prev.semesterId || sortedSemesters[0].id,
    }));
  }, [sortedSemesters]);

  useEffect(() => {
    if (!sortedClinics.length) return;
    setClinicCaseForm((prev) => ({
      ...prev,
      clinicId: prev.clinicId || sortedClinics[0].id,
    }));
  }, [sortedClinics]);

  const resetClinicForm = () => {
    setEditingClinicId(null);
    setClinicForm({ name: "", description: "" });
    setShowClinicForm(false);
  };

  const resetShiftForm = () => {
    setEditingShiftId(null);
    setShiftForm({
      name: "",
      startsAt: "16:00",
      endsAt: "20:00",
      appointmentCapacity: "2",
    });
    setShowShiftForm(false);
  };

  const resetSemesterForm = () => {
    setEditingSemesterId(null);
    setSemesterForm({ label: "", sortOrder: "0", endsOn: "" });
    setShowSemesterForm(false);
  };

  const resetClinicCaseForm = () => {
    setEditingClinicCaseId(null);
    setClinicCaseForm((prev) => ({
      semesterId: prev.semesterId || sortedSemesters[0]?.id || "",
      clinicId: prev.clinicId || sortedClinics[0]?.id || "",
      title: "",
      description: "",
      requiredCount: "1",
    }));
    setShowClinicCaseForm(false);
  };

  const startNewPlan = () => {
    setPlanDraftMode("create");
    setSelectedPlanId("");
    setPlanForm({ label: "", startsOn: "", shiftId: "" });
    setPlanDays([]);
  };

  const submit = async (
    url: string,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    setError(null);
    setMessage(null);
    try {
      const data = await postAdminJson<Record<string, any>>(url, body);
      setMessage(successMessage);
      await loadData();
      return data;
    } catch (e: any) {
      setError(e?.message || "Action failed.");
      return null;
    }
  };

  const postWithoutBody = async (url: string, successMessage: string) => {
    setError(null);
    setMessage(null);
    try {
      const data = await postAdminJson<Record<string, any>>(url);
      setMessage(successMessage);
      await loadData();
      return data;
    } catch (e: any) {
      setError(e?.message || "Action failed.");
      return null;
    }
  };

  const savePlanShell = async () => {
    if (!planForm.label.trim() || !planForm.startsOn || !planForm.shiftId) {
      setError("Plan name, Sunday start date, and fixed shift are required.");
      return;
    }
    const data = await submit(
      planDraftMode === "edit" && selectedPlan
        ? `/supervisor/plans/${selectedPlan.id}/update`
        : "/supervisor/plans",
      {
        label: planForm.label.trim(),
        startsOn: planForm.startsOn,
        shiftId: planForm.shiftId,
      },
      planDraftMode === "edit" ? "Plan shell updated." : "Plan shell created."
    );
    if (data?.plan?.id) {
      setSelectedPlanId(data.plan.id);
      setPlanDraftMode("edit");
    }
  };

  const savePlanDays = async () => {
    if (!selectedPlan) return;
    const data = await submit(
      `/supervisor/plans/${selectedPlan.id}/days`,
      {
        days: planDays.map((day) => ({
          assignmentDate: day.assignmentDate,
          clinicId: day.isVacation ? undefined : day.clinicId,
          isVacation: day.isVacation,
          vacationReason: day.isVacation ? day.vacationReason : undefined,
          notes: day.notes,
        })),
      },
      "Plan schedule saved."
    );
    if (data?.plan?.id) {
      setSelectedPlanId(data.plan.id);
      setPlanDraftMode("edit");
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setDeleteSubmitting(true);
    const url =
      deleteDialog.kind === "clinic"
        ? `/supervisor/clinics/${deleteDialog.id}/delete`
        : deleteDialog.kind === "shift"
          ? `/supervisor/shifts/${deleteDialog.id}/delete`
          : deleteDialog.kind === "semester"
            ? `/supervisor/semesters/${deleteDialog.id}/delete`
            : deleteDialog.kind === "clinicCase"
              ? `/supervisor/clinic-cases/${deleteDialog.id}/delete`
          : `/supervisor/plans/${deleteDialog.id}/delete`;
    const successMessage =
      deleteDialog.kind === "clinic"
        ? "Clinic deleted."
        : deleteDialog.kind === "shift"
          ? "Shift deleted."
          : deleteDialog.kind === "semester"
            ? "Semester deleted."
            : deleteDialog.kind === "clinicCase"
              ? "Clinic case deleted."
          : "Plan deleted.";
    const data = await postWithoutBody(url, successMessage);
    if (data) {
      if (deleteDialog.kind === "clinic" && editingClinicId === deleteDialog.id)
        resetClinicForm();
      if (deleteDialog.kind === "shift" && editingShiftId === deleteDialog.id)
        resetShiftForm();
      if (
        deleteDialog.kind === "semester" &&
        editingSemesterId === deleteDialog.id
      )
        resetSemesterForm();
      if (
        deleteDialog.kind === "clinicCase" &&
        editingClinicCaseId === deleteDialog.id
      )
        resetClinicCaseForm();
      if (deleteDialog.kind === "plan" && selectedPlanId === deleteDialog.id)
        startNewPlan();
      setDeleteDialog(null);
    }
    setDeleteSubmitting(false);
  };

  const advanceSemesterCohorts = async () => {
    setProgressingSemesters(true);
    try {
      const data = await advanceEligibleStudents();
      setMessage(data?.message || "Eligible students advanced.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to progress students.");
    } finally {
      setProgressingSemesters(false);
    }
  };

  const reassignStudentSemester = async (
    userId: string,
    semesterId?: string | null,
  ) => {
    setStudentSemesterSubmittingId(userId);
    try {
      const data = await updateStudentSemester(userId, semesterId);
      setMessage(data?.message || "Student semester updated.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to update student semester.");
    } finally {
      setStudentSemesterSubmittingId(null);
    }
  };

  return {
    workspace,
    users,
    semesterProgression,
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
  };
}
