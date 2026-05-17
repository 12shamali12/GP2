"use client";

import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { ModeratedJoinRequest } from "../hooks/use-admin-group-moderation-workspace";

type ModerationJoinRequestsViewProps = {
  sections: AlphabetSection<ModeratedJoinRequest>[];
  total: number;
  onDecide: (requestId: string, approve: boolean) => void;
};

export function ModerationJoinRequestsView({
  sections,
  total,
  onDecide,
}: ModerationJoinRequestsViewProps) {
  return (
    <div className="denty-panel-strong max-h-[48rem] overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Join requests
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Student requests waiting for admin approval.
          </p>
        </div>
        <span className="denty-pill">{total} pending</span>
      </div>

      <div className="mt-5 max-h-[38rem] overflow-y-auto pr-2">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.letter}>
                <p className="denty-kicker !tracking-[0.18em]">
                  {section.letter}
                </p>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  {section.items.map((request) => (
                    <div key={request.id} className="denty-dashboard-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-[var(--foreground)]">
                            {request.applicant.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            @{request.applicant.username}
                          </p>
                        </div>
                        <span className="denty-pill">{request.group.name}</span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                        {request.group.semesterLabel}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        {request.applicant.doctorIdNumber
                          ? `Student ID: ${request.applicant.doctorIdNumber}`
                          : request.applicant.email ||
                            request.applicant.phone ||
                            "No contact"}
                      </p>
                      {request.note ? (
                        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                          {request.note}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onDecide(request.id, true)}
                          className="rounded-full border border-emerald-600/32 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecide(request.id, false)}
                          className="rounded-full border border-rose-600/24 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Join queue</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No join requests match the current filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
