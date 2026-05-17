"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
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
  "overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.76),rgba(225,234,241,0.34))] p-6 shadow-[0_28px_72px_rgba(7,18,34,0.14)] backdrop-blur-[24px] md:p-7";

const softCardClass =
  "rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(232,240,246,0.22))] p-5 shadow-[0_20px_50px_rgba(7,18,34,0.1)] backdrop-blur-[22px]";

type AdminLaneCard = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  metric: string;
};

export default function AdminPage() {
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
      setError(e?.message || "Failed to load admin data.");
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
      eyebrow: "Review",
      title: "Supervisor requests",
      description: "Approve or reject pending supervisor accounts in a dedicated review lane.",
      metric: `${pendingSupervisor} pending`,
    },
    {
      href: "/admin/doctor-requests",
      eyebrow: "Review",
      title: "Doctor requests",
      description: "Handle doctor applications and keep status decisions in one clearer queue.",
      metric: `${pendingDoctor} pending`,
    },
    {
      href: "/admin/groups",
      eyebrow: "Studio",
      title: "Semester groups",
      description: "Create groups, manage student membership, and approve pairing requests from one focused studio.",
      metric: "Manage groups",
    },
    {
      href: "/admin/planning",
      eyebrow: "Studio",
      title: "Clinics and shifts",
      description: "Build named two-week plans with one fixed shift, a clinic per working day, and separate group assignment lanes.",
      metric: "Plan rotations",
    },
    {
      href: "/admin/users",
      eyebrow: "Control",
      title: "User management",
      description: "Block, unblock, delete, and re-approve platform accounts from one control desk.",
      metric: `${visibleUsers.length} accounts`,
    },
  ];

  return (
    <AdminShell
      title="Admin Request Desk"
      description="Handle pending approvals and account controls from one wider review workspace."
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
              <p className="denty-kicker">Queue</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
                All pending requests
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                This queue combines pending supervisor and doctor approvals so the admin can see the whole review load at once.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/12 bg-[rgba(9,20,38,0.68)] px-5 py-4 text-white shadow-[0_20px_46px_rgba(4,11,26,0.24)] backdrop-blur-[18px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/62">
                Total pending
              </p>
              <p className="mt-3 text-4xl font-semibold">{pendingTotal}</p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--muted-foreground)]">Loading queue...</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Supervisor queue</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {pendingSupervisor}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Pending supervisor requests waiting for review.
                </p>
              </div>

              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Doctor queue</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {pendingDoctor}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Pending doctor requests waiting for approval or rejection.
                </p>
              </div>

              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Blocked users</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {blockedUsers}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Accounts currently blocked from using the platform.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={panelClass}>
          <p className="denty-kicker">Accounts</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Platform users
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            A quick scan of live account volume before you enter the detailed user control page.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--muted-foreground)]">Loading users...</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Doctors</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {doctorCount}
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Supervisors</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {supervisorCount}
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">Patients</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {patientCount}
                </p>
              </div>
              <div className={softCardClass}>
                <p className="denty-kicker !tracking-[0.18em]">All accounts</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {visibleUsers.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${panelClass} block transition hover:-translate-y-1 hover:border-white/18`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="denty-kicker">{card.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {card.title}
                </h2>
              </div>
              <span className="rounded-full border border-white/14 bg-[rgba(9,20,38,0.12)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] backdrop-blur-[12px]">
                {card.metric}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              {card.description}
            </p>

            <p className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-ice)]" />
              Open review lane
            </p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
