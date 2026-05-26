"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
import { ProfilePopup } from "@/features/profiles/components/profile-popup";
import { getMyCases } from "../services/cases-api";
import type { CaseProgressStatus, DoctorMyCasesEntry, DoctorMyCasesResponse } from "../types";

type Props = {
  identifier: string;
};

function StatusPill({ status }: { status: CaseProgressStatus }) {
  const config = {
    COMPLETED: {
      label: "Done",
      className:
        "border-emerald-500/50 bg-emerald-500/85 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]",
    },
    ASSISTED: {
      label: "Assisted",
      className:
        "border-amber-500/50 bg-amber-500/85 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
    },
    OPEN: {
      label: "Open",
      className:
        "border-sky-500/50 bg-sky-500/85 text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function CaseCard({
  entry,
  onOpenPatient,
}: {
  entry: DoctorMyCasesEntry;
  onOpenPatient: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = entry.status === "COMPLETED";

  return (
    <div className="denty-dashboard-card relative overflow-hidden">
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-[3px] ${
          isDone ? "bg-emerald-400/70" : "bg-white/20"
        }`}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-start justify-between gap-3 p-4 pl-5 text-left transition hover:bg-white/5"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)] sm:text-base">
              {entry.case.title}
            </p>
            <StatusPill status={entry.status} />
            {entry.case.requiredCount > 1 ? (
              <span className="denty-pill">×{entry.case.requiredCount}</span>
            ) : null}
          </div>
          {entry.case.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
              {entry.case.description}
            </p>
          ) : null}
          {entry.completedAt ? (
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Completed {new Date(entry.completedAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        <span
          aria-hidden
          className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/15 bg-white/10 transition ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-white/10 p-4 pl-5">
          {entry.case.description ? (
            <div className="rounded-[16px] border border-white/10 bg-white/8 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Brief
              </p>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                {entry.case.description}
              </p>
            </div>
          ) : null}

          {entry.report ? (
            <div className="rounded-[16px] border border-emerald-300/25 bg-emerald-500/8 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Report · {entry.report.status}
                </p>
                <div className="flex gap-2">
                  {entry.report.mark != null ? (
                    <span className="denty-pill">Mark {entry.report.mark}</span>
                  ) : null}
                  {entry.report.rating != null ? (
                    <span className="denty-pill">{entry.report.rating}/5</span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {entry.report.title}
              </p>
              {entry.report.appointment?.patient ? (
                <button
                  type="button"
                  onClick={() =>
                    entry.report?.appointment?.patient?.id &&
                    onOpenPatient(entry.report.appointment.patient.id)
                  }
                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-teal-400/22"
                >
                  <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-300/30">
                    <svg width="9" height="9" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  {entry.report.appointment.patient.name}
                  {entry.report.appointment.patient.phone ? (
                    <span className="text-[10px] opacity-60">· {entry.report.appointment.patient.phone}</span>
                  ) : null}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-[16px] border border-dashed border-white/12 bg-white/5 px-3 py-2 text-xs text-[var(--muted-foreground)]">
              No report linked yet — this case is still {entry.status.toLowerCase()}.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DoctorCasesView({ identifier }: Props) {
  useTranslation();
  const [data, setData] = useState<DoctorMyCasesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseProgressStatus>("all");
  const [profileTargetId, setProfileTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyCases(identifier)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e?.message || "Failed to load cases.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const needle = searchTerm.trim().toLowerCase();
    return data.groups
      .map((group) => ({
        ...group,
        cases: group.cases.filter((c) => {
          if (statusFilter !== "all" && c.status !== statusFilter) return false;
          if (!needle) return true;
          return (
            c.case.title.toLowerCase().includes(needle) ||
            (c.case.description?.toLowerCase().includes(needle) ?? false) ||
            group.clinic.name.toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((group) => group.cases.length > 0);
  }, [data, searchTerm, statusFilter]);

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="denty-kicker">Semester cases</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            My cases
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Cases you need to complete this semester, grouped by clinic. Click any case to view the linked report and patient.
          </p>
        </div>
        {data ? (
          <div className="flex flex-wrap gap-2">
            <span className="denty-pill">{data.summary.total} total</span>
            <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
              {data.summary.completed} done
            </span>
            <span className="inline-flex items-center rounded-full border border-sky-500/50 bg-sky-500/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]">
              {data.summary.open} open
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cases by title, description, or clinic"
            className="denty-field w-full pl-10 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | CaseProgressStatus)}
          className="denty-field cursor-pointer text-sm sm:min-w-[180px]"
        >
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSISTED">Assisted</option>
          <option value="COMPLETED">Done</option>
        </select>
      </div>

      {loading && !data ? (
        <div className="mt-5 space-y-3">
          <div className="denty-skeleton denty-skeleton-card" />
          <div className="denty-skeleton denty-skeleton-card" />
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-[16px] border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {data && !loading ? (
        <div className="mt-5 max-h-[72vh] space-y-5 overflow-y-auto pr-1">
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <section key={group.clinic.id}>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-5 w-[3px] rounded-full bg-teal-300/70" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                    {group.clinic.name}
                  </p>
                  <span className="denty-pill">{group.cases.length}</span>
                  <span className="ml-auto h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
                </div>
                <div className="space-y-2">
                  {group.cases.map((entry) => (
                    <CaseCard
                      key={entry.progressId}
                      entry={entry}
                      onOpenPatient={(id) => setProfileTargetId(id)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              {data.summary.total === 0
                ? "No cases assigned yet. They'll appear here once a rotation plan is published for your group."
                : "No cases match the current filter."}
            </p>
          )}
        </div>
      ) : null}

      <ProfilePopup
        targetId={profileTargetId}
        viewerIdentifier={identifier}
        onClose={() => setProfileTargetId(null)}
      />
    </div>
  );
}
