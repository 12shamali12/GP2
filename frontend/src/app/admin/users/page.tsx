"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { useTranslation } from "@/features/i18n/language-provider";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { downloadCsv } from "@/lib/csv";
import { useAdminUsersWorkspace } from "./hooks/use-admin-users-workspace";
import { countActiveFilters, USER_CSV_COLUMNS } from "./lib/user-filters";
import { UserDeleteDialog } from "./ui/user-delete-dialog";
import { UsersFilterModal } from "./ui/users-filter-modal";
import { UsersFilterPanel } from "./ui/users-filter-panel";
import { UsersRoleSections } from "./ui/users-role-sections";

export default function AdminUsersPage() {
  const t = useTranslation();
  const {
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

  const [filterOpen, setFilterOpen] = useState(false);

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
        loading={loading}
        matchCount={filteredUsers.length}
        totalCount={visibleUsers.length}
        activeFilterCount={countActiveFilters(filters)}
        onQueryChange={setQuery}
        onOpenFilter={() => setFilterOpen(true)}
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
          query={query}
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

      <UsersFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        query={query}
        users={visibleUsers}
        semesterOptions={semesterOptions}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
        onExport={(users) => {
          downloadCsv("dentyhub-users", users, USER_CSV_COLUMNS);
        }}
      />
    </AdminShell>
  );
}
