"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { DoctorWorkspaceData } from "../../types";
import { type DoctorWorkspaceViewKey } from "./doctor-workspace-types";

type Props = {
  view: DoctorWorkspaceViewKey;
  workspace: DoctorWorkspaceData | null;
  currentPartner:
    | {
        name: string;
        username: string;
      }
    | null
    | undefined;
};

export function DoctorWorkspaceHero({ view, workspace, currentPartner }: Props) {
  const t = useTranslation();
  return (
    <section className="frozen-stage relative overflow-hidden rounded-[38px] border border-white/10 px-4 py-5 text-white shadow-[0_34px_90px_rgba(4,11,26,0.3)] sm:px-6 md:py-6">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,34,0.86),rgba(11,24,42,0.58),rgba(15,50,78,0.34))]" />
      <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-4">
          <p className="denty-kicker !text-white/62">
            {t("supervision.doctor.hero.eyebrow")}
          </p>
          <h2 className="max-w-3xl text-2xl font-semibold text-white sm:text-3xl">
            {t("supervision.doctor.hero.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            {t("supervision.doctor.hero.description")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
              {t("supervision.doctor.hero.active_view", {
                view: t(`supervision.doctor.view.${view}`),
              })}
            </span>
            {workspace?.groupMembership?.group ? (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                {workspace.groupMembership.group.name}
              </span>
            ) : null}
            {currentPartner ? (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                {t("supervision.doctor.hero.partner_label", {
                  name: currentPartner.name,
                })}
              </span>
            ) : (
              <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
                {t("supervision.doctor.hero.partner_pending")}
              </span>
            )}
            <span className="denty-pill !border-white/12 !bg-white/10 !text-white/84">
              {t("supervision.doctor.hero.scheduled_duties", {
                count: workspace?.schedule.length || 0,
              })}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
              {t("supervision.doctor.hero.group")}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">
              {workspace?.groupMembership?.group.name ||
                t("supervision.doctor.hero.group_waiting")}
            </p>
            <p className="mt-2 text-sm text-white/66">
              {workspace?.groupMembership?.group.semesterLabel ||
                t("supervision.doctor.hero.group_waiting_hint")}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
              {t("supervision.doctor.hero.partner")}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">
              {currentPartner?.name ||
                t("supervision.doctor.hero.partner_pending_short")}
            </p>
            <p className="mt-2 text-sm text-white/66">
              {currentPartner
                ? `@${currentPartner.username}`
                : t("supervision.doctor.hero.partner_pending_hint")}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
              {t("supervision.doctor.hero.upcoming_shifts")}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">{workspace?.schedule.length || 0}</p>
            <p className="mt-2 text-sm text-white/66">
              {t("supervision.doctor.hero.upcoming_shifts_hint")}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 backdrop-blur-[16px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
              {t("supervision.doctor.hero.clinic_tasks")}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">{workspace?.clinicTasks.length || 0}</p>
            <p className="mt-2 text-sm text-white/66">
              {t("supervision.doctor.hero.clinic_tasks_hint")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
