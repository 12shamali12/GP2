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
import {
  DEFAULT_FILTERS,
  userMatches,
  type UserFilters,
  type UserRole,
} from "../lib/user-filters";

export type DeleteTarget = {
  id: string;
  name: string;
  role: string;
} | null;

export type GroupedUserRole = {
  role: UserRole;
  users: ManagedUser[];
  count: number;
  sections: ReturnType<typeof sectionByLetter<ManagedUser>>;
};

const ROLE_ORDER: UserRole[] = ["SUPERVISOR", "DOCTOR", "PATIENT"];

export function useAdminUsersWorkspace() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [expandedRoles, setExpandedRoles] = useState<UserRole[]>([]);
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

  /** Distinct semester labels present in the data — feeds the filter modal. */
  const semesterOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const user of visibleUsers) {
      if (user.semester?.label) labels.add(user.semester.label);
    }
    return Array.from(labels).sort();
  }, [visibleUsers]);

  /** Flat list of accounts matching the applied filters + search query. */
  const filteredUsers = useMemo(
    () => visibleUsers.filter((user) => userMatches(user, filters, query)),
    [visibleUsers, filters, query],
  );

  const groupedUsers = useMemo<GroupedUserRole[]>(() => {
    return ROLE_ORDER.filter((role) => filters.roles.includes(role)).map(
      (role) => {
        const roleUsers = filteredUsers.filter((user) => user.role === role);
        return {
          role,
          users: roleUsers,
          count: roleUsers.length,
          sections: sectionByLetter(roleUsers, (user) => user.name),
        };
      },
    );
  }, [filteredUsers, filters.roles]);

  const toggleRole = (role: UserRole) => {
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
    query,
    setQuery,
    filters,
    setFilters,
    semesterOptions,
    expandedRoles,
    groupedUsers,
    visibleUsers,
    filteredUsers,
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
