"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import {
  deleteUser as deleteUserApi,
  getUsers,
  reapproveDoctor as reapproveDoctorAccount,
  reapproveSupervisor as reapproveSupervisorAccount,
  setUserBlocked,
} from "@/features/admin/services/admin-api";
import type { ManagedUser } from "@/features/admin/types/admin";
import { sectionByLetter } from "@/features/admin/utils/collection";

export type RoleFilter = "ALL" | "SUPERVISOR" | "DOCTOR" | "PATIENT";

export type DeleteTarget = {
  id: string;
  name: string;
  role: string;
} | null;

export type GroupedUserRole = {
  role: Exclude<RoleFilter, "ALL">;
  label: string;
  users: ManagedUser[];
  count: number;
  sections: ReturnType<typeof sectionByLetter<ManagedUser>>;
};

export function useAdminUsersWorkspace() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [query, setQuery] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<RoleFilter[]>(["DOCTOR"]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const blockUser = async (id: string, blocked: boolean) => {
    try {
      await setUserBlocked(id, blocked);
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, blocked } : user)),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update user.");
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteSubmitting(true);
      await deleteUserApi(deleteTarget.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeletePassword("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete user.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const reapproveSupervisor = async (id: string) => {
    try {
      await reapproveSupervisorAccount(id);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, supervisorStatus: "APPROVED" } : user,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to re-approve supervisor.");
    }
  };

  const reapproveDoctor = async (id: string) => {
    try {
      await reapproveDoctorAccount(id);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, doctorStatus: "APPROVED" } : user,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to re-approve doctor.");
    }
  };

  const hasActiveTimedFreeze = (user: ManagedUser) =>
    !!user.blockedUntil && new Date(user.blockedUntil).getTime() > Date.now();

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role !== "ADMIN"),
    [users],
  );

  const groupedUsers = useMemo<GroupedUserRole[]>(() => {
    const lowerQuery = query.toLowerCase();
    const visibleRoles: Exclude<RoleFilter, "ALL">[] =
      roleFilter === "ALL"
        ? ["SUPERVISOR", "DOCTOR", "PATIENT"]
        : [roleFilter];

    return visibleRoles.map((role) => {
      const roleUsers = visibleUsers.filter((user) => {
        const textMatch =
          !lowerQuery ||
          user.name.toLowerCase().includes(lowerQuery) ||
          user.username.toLowerCase().includes(lowerQuery) ||
          (user.email || "").toLowerCase().includes(lowerQuery) ||
          (user.phone || "").toLowerCase().includes(lowerQuery) ||
          (user.doctorIdNumber || "").toLowerCase().includes(lowerQuery);
        return user.role === role && textMatch;
      });

      return {
        role,
        label:
          role === "SUPERVISOR"
            ? "Supervisors"
            : role === "DOCTOR"
              ? "Doctors"
              : "Patients",
        users: roleUsers,
        count: roleUsers.length,
        sections: sectionByLetter(roleUsers, (user) => user.name),
      };
    });
  }, [query, roleFilter, visibleUsers]);

  const toggleRole = (role: RoleFilter) => {
    setExpandedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((entry) => entry !== role)
        : [...prev, role],
    );
  };

  const openDeleteModal = (user: ManagedUser) => {
    setDeleteTarget({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
    setDeletePassword("");
  };

  return {
    error,
    setError,
    loading,
    roleFilter,
    setRoleFilter,
    query,
    setQuery,
    expandedRoles,
    groupedUsers,
    deleteTarget,
    deletePassword,
    setDeletePassword,
    deleteSubmitting,
    fetchUsers,
    blockUser,
    deleteUser,
    reapproveSupervisor,
    reapproveDoctor,
    hasActiveTimedFreeze,
    toggleRole,
    openDeleteModal,
    closeDeleteModal,
    adminUsername: ADMIN_USERNAME,
  };
}
