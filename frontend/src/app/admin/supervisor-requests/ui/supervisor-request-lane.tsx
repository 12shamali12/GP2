"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { SupervisorRequestItem } from "@/features/admin/types/admin";

type SupervisorRequestLaneProps = {
  error: string | null;
  loading: boolean;
  requestQuery: string;
  filteredCount: number;
  sections: AlphabetSection<SupervisorRequestItem>[];
  onRequestQueryChange: (value: string) => void;
  onDecide: (id: string, approve: boolean) => void;
};

export function SupervisorRequestLane({
  error,
  loading,
  requestQuery,
  filteredCount,
  sections,
  onRequestQueryChange,
  onDecide,
}: SupervisorRequestLaneProps) {
  const t = useTranslation();
  const requestCountLabel =
    filteredCount === 1
      ? t("admin.sup_req.requests_one")
      : t("admin.sup_req.requests_other");

  return (
    <div className="denty-panel-strong flex min-h-[45rem] max-h-[45rem] flex-col overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="denty-kicker">{t("admin.common.review_studio")}</p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {t("admin.sup_req.pending_title")}
          </h2>
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
          {loading ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.common.loading")}
            </p>
          ) : null}
        </div>
        <div className="rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
          {t("admin.common.open_count", { count: filteredCount })}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.2)] p-4 shadow-[0_14px_34px_rgba(7,18,34,0.06)] backdrop-blur-[18px]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <input
            type="text"
            value={requestQuery}
            onChange={(e) => onRequestQueryChange(e.target.value)}
            placeholder={t("admin.sup_req.search_placeholder")}
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
                    {t("admin.common.open_count", { count: section.items.length })}
                  </span>
                </div>
                <div className="denty-enter-stagger mt-3 space-y-3">
                  {section.items.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(229,237,243,0.18))] px-4 py-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px] sm:px-5"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.1fr)_auto] xl:items-start">
                        <div className="min-w-0">
                          <Link
                            href={`/profiles/${request.applicant.id}`}
                            className="break-words text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {request.applicant.name}
                          </Link>
                          <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                            @{request.applicant.username}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            {t("admin.common.submitted_on", {
                              date: new Date(
                                request.createdAt,
                              ).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }),
                            })}
                          </p>
                        </div>

                        <div className="min-w-0 space-y-2 text-sm text-[var(--muted-foreground)]">
                          <p className="break-words">
                            {t("admin.common.email_label", {
                              value: request.applicant.email || "-",
                            })}
                          </p>
                          <p className="break-words">
                            {t("admin.common.phone_label", {
                              value: request.applicant.phone || "-",
                            })}
                          </p>
                          <p className="break-words rounded-[18px] border border-white/10 bg-white/24 px-4 py-3 text-xs leading-6 text-[rgba(10,22,40,0.72)]">
                            {request.note || t("admin.common.no_review_note")}
                          </p>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 xl:min-w-[9rem]">
                          <button
                            onClick={() => onDecide(request.id, true)}
                            className="min-h-[2.5rem] cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            {t("admin.common.approve")}
                          </button>
                          <button
                            onClick={() => onDecide(request.id, false)}
                            className="min-h-[2.5rem] cursor-pointer rounded-full border border-rose-600/30 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            {t("admin.common.reject")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="denty-skeleton denty-skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">{t("admin.common.quiet_desk")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.sup_req.none_pending")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
