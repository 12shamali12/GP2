"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useAdminSupervisorRequestsWorkspace } from "./hooks/use-admin-supervisor-requests-workspace";
import { SupervisorAccountsLane } from "./ui/supervisor-accounts-lane";
import { SupervisorRequestLane } from "./ui/supervisor-request-lane";

export default function AdminSupervisorRequestsPage() {
  const {
    error,
    loading,
    requestQuery,
    setRequestQuery,
    supervisorQuery,
    setSupervisorQuery,
    filteredRequests,
    filteredSupervisors,
    requestSections,
    supervisorSections,
    decide,
    toggleBlock,
    reapproveSupervisor,
  } = useAdminSupervisorRequestsWorkspace();

  return (
    <AdminShell
      title="Supervisor Requests"
      description="Review pending supervisor applications and manage existing supervisor accounts from one review lane."
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SupervisorRequestLane
          error={error}
          loading={loading}
          requestQuery={requestQuery}
          filteredCount={filteredRequests.length}
          sections={requestSections}
          onRequestQueryChange={setRequestQuery}
          onDecide={decide}
        />

        <SupervisorAccountsLane
          supervisorQuery={supervisorQuery}
          filteredCount={filteredSupervisors.length}
          sections={supervisorSections}
          onSupervisorQueryChange={setSupervisorQuery}
          onReapproveSupervisor={reapproveSupervisor}
          onToggleBlock={toggleBlock}
        />
      </div>
    </AdminShell>
  );
}
