"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { SupervisorWorkspaceData } from "../../types";

type Props = {
  workspace: SupervisorWorkspaceData | null;
};

export function SupervisorWorkspaceHero({ workspace }: Props) {
  const t = useTranslation();
  return (
    <section className="frozen-stage relative overflow-hidden rounded-[38px] border border-white/10 px-4 py-5 text-white shadow-[0_34px_90px_rgba(4,11,26,0.3)] sm:px-6 md:py-6">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,34,0.86),rgba(11,24,42,0.58),rgba(15,50,78,0.34))]" />
      <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-4">
          <p className="denty-kicker !text-white/62">
            {t("supervision.sup.hero.eyebrow")}
          </p>
          <h2 className="max-w-3xl text-2xl font-semibold text-white sm:text-3xl">
            {t("supervision.sup.hero.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            {t("supervision.sup.hero.description")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">{t("supervision.sup.hero.clinic_duties")}</p><p className="mt-3 text-xl font-semibold text-white">{workspace?.clinicOverview.length || 0}</p></div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">{t("supervision.sup.hero.visible_groups")}</p><p className="mt-3 text-xl font-semibold text-white">{workspace?.stats.groups || 0}</p></div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">{t("supervision.sup.hero.pending_reports")}</p><p className="mt-3 text-xl font-semibold text-white">{workspace?.stats.pendingReports || 0}</p></div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">{t("supervision.sup.hero.active_freezes")}</p><p className="mt-3 text-xl font-semibold text-white">{workspace?.activeFreezes.length || 0}</p></div>
        </div>
      </div>
    </section>
  );
}
