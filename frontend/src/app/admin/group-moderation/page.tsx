"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminGroupModerationWorkspace } from "./hooks/use-admin-group-moderation-workspace";
import { ModerationJoinRequestsView } from "./ui/moderation-join-requests-view";
import { ModerationPairsView } from "./ui/moderation-pairs-view";
import { ModerationPartnerRequestsView } from "./ui/moderation-partner-requests-view";
import { ModerationStudentsView } from "./ui/moderation-students-view";
import { ModerationTabNav } from "./ui/moderation-tab-nav";

export default function AdminGroupModerationPage() {
  const {
    loading,
    error,
    setError,
    message,
    setMessage,
    tab,
    setTab,
    query,
    setQuery,
    counts,
    joinSections,
    partnerSections,
    membershipSections,
    pairSections,
    filteredJoinRequests,
    filteredPartnerRequests,
    decideJoinRequest,
    decidePartnerRequest,
    removeDoctorFromGroup,
    removePair,
  } = useAdminGroupModerationWorkspace();

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Moderation updated",
    errorTitle: "Moderation issue",
  });

  return (
    <AdminShell
      title="Group Moderation Desk"
      description="Review join requests, approve partner requests, remove students from groups, and dissolve pairs from one dedicated moderation workspace."
    >
      <div className="denty-panel-strong p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="denty-kicker">Moderation tabs</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Group requests and membership controls
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              The groups page now stays focused on group setup and planning.
              This page carries the real review queue.
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student, ID, or group"
            className="denty-field max-w-[360px] text-sm"
          />
        </div>

        <ModerationTabNav tab={tab} counts={counts} onTabChange={setTab} />
      </div>

      {loading ? (
        <div className="denty-panel-strong p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading moderation desk...
          </p>
        </div>
      ) : null}

      {tab === "join" ? (
        <ModerationJoinRequestsView
          sections={joinSections}
          total={filteredJoinRequests.length}
          onDecide={decideJoinRequest}
        />
      ) : null}

      {tab === "partner" ? (
        <ModerationPartnerRequestsView
          sections={partnerSections}
          total={filteredPartnerRequests.length}
          onDecide={decidePartnerRequest}
        />
      ) : null}

      {tab === "students" ? (
        <ModerationStudentsView
          sections={membershipSections}
          total={counts.students}
          onRemove={removeDoctorFromGroup}
        />
      ) : null}

      {tab === "pairs" ? (
        <ModerationPairsView
          sections={pairSections}
          total={counts.pairs}
          onRemovePair={removePair}
        />
      ) : null}
    </AdminShell>
  );
}
