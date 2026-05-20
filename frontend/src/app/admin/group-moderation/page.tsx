"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useTranslation } from "@/features/i18n/language-provider";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminGroupModerationWorkspace } from "./hooks/use-admin-group-moderation-workspace";
import { ModerationJoinRequestsView } from "./ui/moderation-join-requests-view";
import { ModerationPairsView } from "./ui/moderation-pairs-view";
import { ModerationPartnerRequestsView } from "./ui/moderation-partner-requests-view";
import { ModerationStudentsView } from "./ui/moderation-students-view";
import { ModerationTabNav } from "./ui/moderation-tab-nav";

export default function AdminGroupModerationPage() {
  const t = useTranslation();
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
    messageTitle: t("admin.mod.toast_updated"),
    errorTitle: t("admin.mod.toast_issue"),
  });

  return (
    <AdminShell
      title={t("admin.mod.title")}
      description={t("admin.mod.description")}
    >
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="denty-kicker">{t("admin.mod.tabs_eyebrow")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              {t("admin.mod.tabs_heading")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("admin.mod.tabs_intro")}
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.mod.search_placeholder")}
            className="denty-field text-sm xl:max-w-[360px]"
          />
        </div>

        <ModerationTabNav tab={tab} counts={counts} onTabChange={setTab} />
      </div>

      {loading ? (
        <div className="denty-panel-strong p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("admin.mod.loading")}
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
