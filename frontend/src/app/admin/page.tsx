"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { DashboardAnalytics } from "@/features/admin/components/analytics/dashboard-analytics";
import { useTranslation } from "@/features/i18n/language-provider";
import { useCountUp } from "@/features/ui/hooks/use-count-up";
import {
  getDoctorRequests,
  getSupervisorRequests,
  getUsers,
} from "@/features/admin/services/admin-api";
import type {
  DoctorRequestItem,
  ManagedUser,
  SupervisorRequestItem,
} from "@/features/admin/types/admin";

const panelClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.76),rgba(225,234,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.14)] backdrop-blur-[24px] sm:p-6";

const softCardClass =
  "rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(232,240,246,0.22))] p-4 shadow-[0_20px_50px_rgba(7,18,34,0.1)] backdrop-blur-[22px] sm:p-5";

type AdminLaneCard = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  metric: string;
};

/** Renders an integer stat that counts up from 0 on mount / value change. */
function StatCount({ value }: { value: number }) {
  const animated = useCountUp(value, 700);
  return <>{Math.round(animated)}</>;
}

export default function AdminPage() {
  const t = useTranslation();
  const [supervisorRequests, setSupervisorRequests] = useState<SupervisorRequestItem[]>([]);
  const [doctorRequests, setDoctorRequests] = useState<DoctorRequestItem[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSupervisorRequests, nextDoctorRequests, nextUsers] = await Promise.all([
        getSupervisorRequests(),
        getDoctorRequests(),
        getUsers(),
      ]);

      setSupervisorRequests(nextSupervisorRequests || []);
      setDoctorRequests(nextDoctorRequests || []);
      setUsers(nextUsers || []);
    } catch (e: any) {
      setError(e?.message || t("admin.queue.failed_load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const visibleUsers = users.filter((user) => user.role !== "ADMIN");
  const pendingSupervisor = supervisorRequests.length;
  const pendingDoctor = doctorRequests.length;
  const pendingTotal = pendingSupervisor + pendingDoctor;
  const blockedUsers = visibleUsers.filter((user) => user.blocked).length;
  const doctorCount = visibleUsers.filter((user) => user.role === "DOCTOR").length;
  const supervisorCount = visibleUsers.filter((user) => user.role === "SUPERVISOR").length;
  const patientCount = visibleUsers.filter((user) => user.role === "PATIENT").length;

  const cards: AdminLaneCard[] = [
    {
      href: "/admin/supervisor-requests",
      eyebrow: t("admin.common.review"),
      title: t("admin.queue.card_supervisor_title"),
      description: t("admin.queue.card_supervisor_desc"),
      metric: t("admin.queue.metric_pending", { count: pendingSupervisor }),
    },
    {
      href: "/admin/doctor-requests",
      eyebrow: t("admin.common.review"),
      title: t("admin.queue.card_doctor_title"),
      description: t("admin.queue.card_doctor_desc"),
      metric: t("admin.queue.metric_pending", { count: pendingDoctor }),
    },
    {
      href: "/admin/groups",
      eyebrow: t("admin.common.studio"),
      title: t("admin.queue.card_groups_title"),
      description: t("admin.queue.card_groups_desc"),
      metric: t("admin.queue.metric_manage_groups"),
    },
    {
      href: "/admin/planning",
      eyebrow: t("admin.common.studio"),
      title: t("admin.queue.card_planning_title"),
      description: t("admin.queue.card_planning_desc"),
      metric: t("admin.queue.metric_plan_rotations"),
    },
    {
      href: "/admin/users",
      eyebrow: t("admin.common.control"),
      title: t("admin.queue.card_users_title"),
      description: t("admin.queue.card_users_desc"),
      metric: t("admin.queue.metric_accounts", { count: visibleUsers.length }),
    },
  ];

  return (
    <AdminShell
      title={t("admin.queue.title")}
      description={t("admin.queue.description")}
    >
      {error ? (
        <div className={`${panelClass} border-rose-200/60 bg-[linear-gradient(180deg,rgba(255,244,246,0.86),rgba(255,234,238,0.48))]`}>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className={panelClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">{t("admin.queue.eyebrow")}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] md:text-xl">
                {t("admin.queue.all_pending")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                {t("admin.queue.intro")}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/12 bg-[rgba(9,20,38,0.68)] px-5 py-4 text-white shadow-[0_20px_46px_rgba(4,11,26,0.24)] backdrop-blur-[18px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/62">
                {t("admin.queue.total_pending")}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                <StatCount value={pendingTotal} />
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--muted-foreground)]">{t("admin.queue.loading_queue")}</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.supervisor_queue")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {pendingSupervisor}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {t("admin.queue.supervisor_queue_note")}
                </p>
              </div>

              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.doctor_queue")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {pendingDoctor}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {t("admin.queue.doctor_queue_note")}
                </p>
              </div>

              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.blocked_users")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {blockedUsers}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {t("admin.queue.blocked_users_note")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={panelClass}>
          <p className="denty-kicker">{t("admin.queue.accounts_eyebrow")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {t("admin.queue.platform_users")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            {t("admin.queue.platform_users_note")}
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--muted-foreground)]">{t("admin.queue.loading_users")}</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.doctors")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  <StatCount value={doctorCount} />
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.supervisors")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  <StatCount value={supervisorCount} />
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.patients")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  <StatCount value={patientCount} />
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">{t("admin.queue.all_accounts")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  <StatCount value={visibleUsers.length} />
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <DashboardAnalytics
        users={users}
        supervisorRequests={supervisorRequests}
        doctorRequests={doctorRequests}
        loading={loading}
      />

      <div className="denty-enter-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${panelClass} block transition hover:-translate-y-1 hover:border-white/18`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="denty-kicker">{card.eyebrow}</p>
                <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {card.title}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-white/14 bg-[rgba(9,20,38,0.12)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] backdrop-blur-[12px]">
                {card.metric}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              {card.description}
            </p>

            <p className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-ice)]" />
              {t("admin.queue.open_review_lane")}
            </p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
