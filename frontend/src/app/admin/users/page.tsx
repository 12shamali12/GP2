"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminUsersWorkspace } from "./hooks/use-admin-users-workspace";
import { UserDeleteDialog } from "./ui/user-delete-dialog";
import { UsersFilterPanel } from "./ui/users-filter-panel";
import { UsersRoleSections } from "./ui/users-role-sections";

export default function AdminUsersPage() {
  const {
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
    blockUser,
    deleteUser,
    reapproveSupervisor,
    reapproveDoctor,
    hasActiveTimedFreeze,
    toggleRole,
    openDeleteModal,
    closeDeleteModal,
    adminUsername,
  } = useAdminUsersWorkspace();

  useFeedbackToast({
    error,
    clearError: () => setError(null),
    errorTitle: "User management",
  });

  return (
    <AdminShell
      title="User Management"
      description="Account controls now sit in a calmer management studio so they no longer stay buried inside mixed supervisor and admin screens."
    >
      <UsersFilterPanel
        query={query}
        roleFilter={roleFilter}
        loading={loading}
        onQueryChange={setQuery}
        onRoleFilterChange={setRoleFilter}
      />

      <UsersRoleSections
        groupedUsers={groupedUsers}
        expandedRoles={expandedRoles}
        onToggleRole={toggleRole}
        onBlockUser={blockUser}
        onOpenDeleteModal={openDeleteModal}
        onReapproveSupervisor={reapproveSupervisor}
        onReapproveDoctor={reapproveDoctor}
        hasActiveTimedFreeze={hasActiveTimedFreeze}
      />

      <UserDeleteDialog
        deleteTarget={deleteTarget}
        deletePassword={deletePassword}
        deleteSubmitting={deleteSubmitting}
        adminUsername={adminUsername}
        onPasswordChange={setDeletePassword}
        onClose={closeDeleteModal}
        onConfirm={deleteUser}
      />
    </AdminShell>
  );
}
