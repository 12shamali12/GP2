"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { ModeratedPartnerRequest } from "../hooks/use-admin-group-moderation-workspace";

type ModerationPartnerRequestsViewProps = {
  sections: AlphabetSection<ModeratedPartnerRequest>[];
  total: number;
  onDecide: (requestId: string, approve: boolean) => void;
};

export function ModerationPartnerRequestsView({
  sections,
  total,
  onDecide,
}: ModerationPartnerRequestsViewProps) {
  const t = useTranslation();
  return (
    <div className="denty-panel-strong max-h-[48rem] overflow-hidden p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {t("admin.mod.partner_title")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t("admin.mod.partner_subtitle")}
          </p>
        </div>
        <span className="denty-pill">
          {t("admin.mod.pending_count", { count: total })}
        </span>
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
                        <div className="min-w-0">
                          <p className="break-words text-lg font-semibold text-[var(--foreground)]">
                            {t("admin.mod.partner_to", {
                              sender: request.sender.name,
                              receiver: request.receiver.name,
                            })}
                          </p>
                          <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                            {request.group.name} - {request.group.semesterLabel}
                          </p>
                        </div>
                        <span className="denty-pill shrink-0">{t("admin.mod.pairing")}</span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-white/10 bg-white/24 p-3">
                          <p className="denty-kicker">{t("admin.mod.sender")}</p>
                          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                            {request.sender.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {request.sender.doctorIdNumber ||
                              request.sender.username}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-white/24 p-3">
                          <p className="denty-kicker">{t("admin.mod.receiver")}</p>
                          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                            {request.receiver.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {request.receiver.doctorIdNumber ||
                              request.receiver.username}
                          </p>
                        </div>
                      </div>
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
                          {t("admin.mod.confirm_pair")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecide(request.id, false)}
                          className="rounded-full border border-rose-600/24 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                        >
                          {t("admin.common.reject")}
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
            <p className="denty-kicker">{t("admin.mod.partner_queue")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.mod.partner_empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
