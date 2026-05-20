"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useTranslation } from "@/features/i18n/language-provider";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminUsersWorkspace } from "./hooks/use-admin-users-workspace";
import { UserDeleteDialog } from "./ui/user-delete-dialog";
import { UsersFilterPanel } from "./ui/users-filter-panel";
import { UsersRoleSections } from "./ui/users-role-sections";

export default function AdminUsersPage() {
  const t = useTranslation();
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
    errorTitle: t("admin.users.toast_title"),
  });

  return (
    <AdminShell
      title={t("admin.users.title")}
      description={t("admin.users.description")}
    >
      <UsersFilterPanel
        query={query}
        roleFilter={roleFilter}
        loading={loading}
        onQueryChange={setQuery}
        onRoleFilterChange={setRoleFilter}
      />

      {loading && groupedUsers.length === 0 ? (
        <div className="mt-6 grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="denty-skeleton denty-skeleton-card" />
          ))}
        </div>
      ) : (
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
      )}

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
