"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoctorToGroup as addDoctorToGroupAction,
  createGroup as createGroupAction,
  deleteGroup as deleteGroupAction,
  getGroups,
  getUsers,
  updateGroup as updateGroupAction,
} from "@/features/admin/services/admin-api";
import { sortByLabel } from "@/features/admin/utils/collection";
import type { ManagedUser } from "@/features/admin/types/admin";
import type { AdminGroupItem } from "@/features/supervision/types";

export type GroupDeleteDialogState = { id: string; label: string } | null;

const DEFAULT_GROUP_FORM = {
  name: "",
  description: "",
  semesterLabel: "Batch 2022",
};

const DEFAULT_GROUP_EDITOR = {
  name: "",
  description: "",
  semesterLabel: "",
  active: true,
};

export function useAdminGroupsWorkspace() {
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState(DEFAULT_GROUP_FORM);
  const [groupEditor, setGroupEditor] = useState(DEFAULT_GROUP_EDITOR);
  const [doctorSelections, setDoctorSelections] = useState<
    Record<string, string>
  >({});
  const [deleteDialog, setDeleteDialog] =
    useState<GroupDeleteDialogState>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsData, usersData] = await Promise.all([getGroups(), getUsers()]);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const doctors = useMemo(
    () =>
      sortByLabel(
        users.filter(
          (user) => user.role === "DOCTOR" && user.doctorStatus === "APPROVED"
        ),
        (user) => user.name
      ),
    [users]
  );

  const filteredGroups = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return sortByLabel(groups, (group) => `${group.name} ${group.semesterLabel}`)
      .filter((group) => {
        if (!lowerQuery) return true;
        const text = [
          group.name,
          group.semesterLabel,
          group.description || "",
          group.currentPlan?.plan.label || "",
          ...(group.nextPlans || []).map((entry) => entry.plan.label),
          ...group.members.map((member) => member.doctor.name),
          ...group.members.map((member) => member.doctor.username),
          ...group.members.map((member) => member.doctor.doctorIdNumber || ""),
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(lowerQuery);
      });
  }, [groups, query]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (!selectedGroup) return;
    setGroupEditor({
      name: selectedGroup.name,
      description: selectedGroup.description || "",
      semesterLabel: selectedGroup.semesterLabel,
      active: selectedGroup.active,
    });
  }, [selectedGroup]);

  const createGroup = async () => {
    try {
      await createGroupAction(groupForm);
      setGroupForm((prev) => ({
        ...DEFAULT_GROUP_FORM,
        semesterLabel: prev.semesterLabel,
      }));
      setMessage("Group created.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to create group.");
    }
  };

  const saveGroupChanges = async () => {
    if (!selectedGroup) return;
    try {
      await updateGroupAction(selectedGroup.id, groupEditor);
      setMessage("Group updated.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to update group.");
    }
  };

  const addDoctorToGroup = async (groupId: string) => {
    const doctorId = doctorSelections[groupId];
    if (!doctorId) return;
    try {
      await addDoctorToGroupAction(groupId, doctorId);
      setDoctorSelections((prev) => ({ ...prev, [groupId]: "" }));
      setMessage("Doctor assigned to group.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to assign doctor.");
    }
  };

  const confirmDeleteGroup = async () => {
    if (!deleteDialog) return;
    setDeleteSubmitting(true);
    try {
      await deleteGroupAction(deleteDialog.id);
      setMessage("Group deleted.");
      setDeleteDialog(null);
      setSelectedGroupId((current) =>
        current === deleteDialog.id ? null : current
      );
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to delete group.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return {
    loading,
    error,
    setError,
    message,
    setMessage,
    query,
    setQuery,
    selectedGroupId,
    setSelectedGroupId,
    groupForm,
    setGroupForm,
    groupEditor,
    setGroupEditor,
    doctors,
    filteredGroups,
    selectedGroup,
    doctorSelections,
    setDoctorSelections,
    deleteDialog,
    setDeleteDialog,
    deleteSubmitting,
    createGroup,
    saveGroupChanges,
    addDoctorToGroup,
    confirmDeleteGroup,
  };
}
