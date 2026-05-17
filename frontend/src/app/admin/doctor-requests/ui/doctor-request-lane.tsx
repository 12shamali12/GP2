"use client";

import Link from "next/link";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { DoctorRequestItem } from "@/features/admin/types/admin";

type DoctorRequestLaneProps = {
  error: string | null;
  loading: boolean;
  requestQuery: string;
  filteredCount: number;
  sections: AlphabetSection<DoctorRequestItem>[];
  onRequestQueryChange: (value: string) => void;
  onDecide: (id: string, approve: boolean) => void;
};

export function DoctorRequestLane({
  error,
  loading,
  requestQuery,
  filteredCount,
  sections,
  onRequestQueryChange,
  onDecide,
}: DoctorRequestLaneProps) {
  const requestCountLabel = filteredCount === 1 ? "request" : "requests";

  return (
    <div className="denty-panel-strong flex min-h-[45rem] max-h-[45rem] flex-col overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="denty-kicker">Review studio</p>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Pending doctor requests
          </h2>
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
          {loading ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Loading...
            </p>
          ) : null}
        </div>
        <div className="rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
          {filteredCount} open
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.2)] p-4 shadow-[0_14px_34px_rgba(7,18,34,0.06)] backdrop-blur-[18px]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <input
            type="text"
            value={requestQuery}
            onChange={(e) => onRequestQueryChange(e.target.value)}
            placeholder="Search pending requests"
            className="denty-field text-sm"
          />
          <div className="rounded-full border border-white/14 bg-[rgba(9,20,38,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.6)]">
            {filteredCount} {requestCountLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.letter}>
                <div className="flex items-center justify-between gap-3">
                  <p className="denty-kicker !tracking-[0.18em]">
                    {section.letter}
                  </p>
                  <span className="rounded-full border border-white/12 bg-white/24 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.56)]">
                    {section.items.length} open
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {section.items.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(229,237,243,0.18))] px-5 py-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.1fr)_auto] xl:items-start">
                        <div>
                          <Link
                            href={`/profiles/${request.applicant.id}`}
                            className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {request.applicant.name}
                          </Link>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            @{request.applicant.username}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            Submitted{" "}
                            {new Date(request.createdAt).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                          <p>Email: {request.applicant.email || "-"}</p>
                          <p>Phone: {request.applicant.phone || "-"}</p>
                          <p className="rounded-[18px] border border-white/10 bg-white/24 px-4 py-3 text-xs leading-6 text-[rgba(10,22,40,0.72)]">
                            {request.note || "No review note was attached to this request."}
                          </p>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 xl:min-w-[9rem]">
                          <button
                            onClick={() => onDecide(request.id, true)}
                            className="cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDecide(request.id, false)}
                            className="cursor-pointer rounded-full border border-rose-600/30 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : !loading ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Quiet desk</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No pending doctor requests.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
