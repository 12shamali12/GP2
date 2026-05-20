"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { ManagedUser } from "@/features/admin/types/admin";

type SupervisorAccountsLaneProps = {
  supervisorQuery: string;
  filteredCount: number;
  sections: AlphabetSection<ManagedUser>[];
  onSupervisorQueryChange: (value: string) => void;
  onReapproveSupervisor: (id: string) => void;
  onToggleBlock: (id: string, blocked: boolean) => void;
};

export function SupervisorAccountsLane({
  supervisorQuery,
  filteredCount,
  sections,
  onSupervisorQueryChange,
  onReapproveSupervisor,
  onToggleBlock,
}: SupervisorAccountsLaneProps) {
  const t = useTranslation();
  const accountCountLabel =
    filteredCount === 1
      ? t("admin.sup_req.accounts_one")
      : t("admin.sup_req.accounts_other");

  return (
    <div className="denty-panel-strong flex min-h-[45rem] max-h-[45rem] flex-col overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="denty-kicker">{t("admin.common.review_studio")}</p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {t("admin.sup_req.accounts_title")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t("admin.sup_req.accounts_subtitle")}
          </p>
        </div>
        <div className="rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
          {t("admin.common.accounts_count", { count: filteredCount })}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.2)] p-4 shadow-[0_14px_34px_rgba(7,18,34,0.06)] backdrop-blur-[18px]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <input
            type="text"
            value={supervisorQuery}
            onChange={(e) => onSupervisorQueryChange(e.target.value)}
            placeholder={t("admin.sup_req.accounts_search")}
            className="denty-field text-sm"
          />
          <div className="rounded-full border border-white/14 bg-[rgba(9,20,38,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.6)]">
            {filteredCount} {accountCountLabel}
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
                    {t("admin.common.listed_count", {
                      count: section.items.length,
                    })}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {section.items.map((supervisor) => (
                    <div
                      key={supervisor.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] px-4 py-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px] sm:px-5"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.08fr)_auto] xl:items-start">
                        <div className="min-w-0">
                          <Link
                            href={`/profiles/${supervisor.id}`}
                            className="break-words text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {supervisor.name}
                          </Link>
                          <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                            @{supervisor.username}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            {t("admin.sup_req.account_tag")}
                          </p>
                        </div>

                        <div className="grid min-w-0 gap-2 text-sm text-[var(--muted-foreground)] md:grid-cols-2">
                          <p className="break-words">
                            {t("admin.common.email_label", {
                              value: supervisor.email || "-",
                            })}
                          </p>
                          <p className="break-words">
                            {t("admin.common.phone_label", {
                              value: supervisor.phone || "-",
                            })}
                          </p>
                          <p className="break-words">
                            {t("admin.common.status_label", {
                              value:
                                supervisor.supervisorStatus ||
                                t("admin.common.unknown"),
                            })}
                          </p>
                          <p>
                            {t("admin.common.blocked_label", {
                              value: supervisor.blocked
                                ? t("admin.common.yes")
                                : t("admin.common.no"),
                            })}
                          </p>
                          {supervisor.blockedUntil ? (
                            <p className="md:col-span-2">
                              {t("admin.common.frozen_until", {
                                value: new Date(
                                  supervisor.blockedUntil,
                                ).toLocaleString(),
                              })}
                            </p>
                          ) : null}
                          {supervisor.blockReason ? (
                            <p className="md:col-span-2">
                              {t("admin.common.freeze_note", {
                                value: supervisor.blockReason,
                              })}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 xl:min-w-[9rem]">
                          <Link
                            href={`/profiles/${supervisor.id}`}
                            className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/34 px-4 py-2.5 text-center text-xs font-semibold text-[var(--foreground)] hover:bg-white/46"
                          >
                            {t("admin.common.view_profile")}
                          </Link>
                          {supervisor.supervisorStatus === "REJECTED" ? (
                            <button
                              onClick={() => onReapproveSupervisor(supervisor.id)}
                              className="min-h-[2.5rem] cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              {t("admin.common.re_approve")}
                            </button>
                          ) : null}
                          <button
                            onClick={() =>
                              onToggleBlock(supervisor.id, !supervisor.blocked)
                            }
                            className="min-h-[2.5rem] cursor-pointer rounded-full border border-[rgba(183,136,66,0.34)] bg-[rgba(183,136,66,0.14)] px-4 py-2.5 text-xs font-semibold text-[#855f1d] hover:bg-[rgba(183,136,66,0.22)]"
                          >
                            {supervisor.blocked
                              ? t("admin.common.unblock")
                              : t("admin.common.block")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : !filteredCount ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">{t("admin.common.directory")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.sup_req.none_found")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
