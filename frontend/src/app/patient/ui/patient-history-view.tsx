"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";

type PatientHistoryViewProps = {
  history: any[];
  onSelectAppointment: (appointment: any) => void;
  onOpenProfile?: (doctorId: string) => void;
};

function StatusPill({ status }: { status: string }) {
  const key = (status || "").toUpperCase();
  const config: Record<string, string> = {
    COMPLETED:
      "border-emerald-500/50 bg-emerald-500/85 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]",
    REVIEWED:
      "border-emerald-500/50 bg-emerald-500/85 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]",
    SUBMITTED:
      "border-sky-500/50 bg-sky-500/85 text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]",
    CANCELLED:
      "border-rose-500/50 bg-rose-500/85 text-white shadow-[0_2px_8px_rgba(244,63,94,0.35)]",
    REJECTED:
      "border-rose-500/50 bg-rose-500/85 text-white shadow-[0_2px_8px_rgba(244,63,94,0.35)]",
    NO_SHOW:
      "border-amber-500/50 bg-amber-500/85 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
  };
  const cls = config[key] || "border-white/15 bg-white/10 text-[var(--foreground)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${cls}`}
    >
      {status || "—"}
    </span>
  );
}

export function PatientHistoryView({
  history,
  onSelectAppointment,
  onOpenProfile,
}: PatientHistoryViewProps) {
  const t = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [yearFilter, setYearFilter] = useState<"all" | number>("all");

  // Unique years pulled from the history entries — drives the year dropdown.
  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    history.forEach((appt) => {
      const date = appt.slot?.startTime
        ? new Date(appt.slot.startTime)
        : appt.createdAt
          ? new Date(appt.createdAt)
          : null;
      if (date && !Number.isNaN(date.getTime())) set.add(date.getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [history]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    history.forEach((appt) => {
      if (appt.status) set.add(appt.status);
    });
    return Array.from(set).sort();
  }, [history]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return history
      .filter((appt) => {
        const status = appt.status || "";
        if (statusFilter !== "all" && status !== statusFilter) return false;
        const date = appt.slot?.startTime
          ? new Date(appt.slot.startTime)
          : appt.createdAt
            ? new Date(appt.createdAt)
            : null;
        if (yearFilter !== "all") {
          if (!date || date.getFullYear() !== yearFilter) return false;
        }
        if (!needle) return true;
        const doctorName =
          appt.slot?.doctor?.name ||
          appt.doctor?.name ||
          appt.doctor?.username ||
          "";
        const clinicName =
          appt.slot?.clinic?.name || appt.clinicCase?.clinic?.name || "";
        const caseTitle = appt.clinicCase?.title || "";
        const haystack =
          `${doctorName} ${clinicName} ${caseTitle} ${status}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const at = a.slot?.startTime
          ? new Date(a.slot.startTime).getTime()
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const bt = b.slot?.startTime
          ? new Date(b.slot.startTime).getTime()
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
        return bt - at; // newest first
      });
  }, [history, search, statusFilter, yearFilter]);

  const summary = useMemo(() => {
    return history.reduce(
      (acc, appt) => {
        acc.total++;
        const status = (appt.status || "").toUpperCase();
        if (status === "COMPLETED" || status === "REVIEWED") acc.completed++;
        else if (status === "CANCELLED" || status === "REJECTED") acc.cancelled++;
        else if (status === "NO_SHOW") acc.noShow++;
        return acc;
      },
      { total: 0, completed: 0, cancelled: 0, noShow: 0 },
    );
  }, [history]);

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="denty-kicker">Past appointments</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            Your appointment history
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Every appointment you&apos;ve had — completed, cancelled, rejected, or marked no-show — with the doctor, clinic and case at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="denty-pill">{summary.total} total</span>
          <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
            {summary.completed} done
          </span>
          {summary.cancelled > 0 ? (
            <span className="inline-flex items-center rounded-full border border-rose-500/50 bg-rose-500/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
              {summary.cancelled} cancelled
            </span>
          ) : null}
          {summary.noShow > 0 ? (
            <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
              {summary.noShow} no-show
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor, clinic, case, or status"
            className="denty-field w-full pl-10 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="denty-field cursor-pointer text-sm sm:min-w-[160px]"
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={yearFilter === "all" ? "all" : String(yearFilter)}
          onChange={(e) =>
            setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="denty-field cursor-pointer text-sm sm:min-w-[120px]"
        >
          <option value="all">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 max-h-[72vh] space-y-3 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="denty-placeholder rounded-[22px] border border-dashed border-white/14 p-6 text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">
              {history.length === 0
                ? "No past appointments yet"
                : "No appointments match your filter"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {history.length === 0
                ? "Once you complete a visit it will show up here, with the doctor, clinic, and case info."
                : "Try clearing the search or picking a different year/status."}
            </p>
          </div>
        ) : (
          filtered.map((appt) => {
            const startTime = appt.slot?.startTime;
            const doctorId = appt.slot?.doctor?.id || appt.doctor?.id;
            const doctorName =
              appt.slot?.doctor?.name ||
              appt.doctor?.name ||
              appt.doctor?.username ||
              t("patient.common.unknown");
            const clinicName =
              appt.slot?.clinic?.name ||
              appt.clinicCase?.clinic?.name ||
              t("patient.common.clinic");
            const caseTitle = appt.clinicCase?.title || "—";
            return (
              <div
                key={appt.id}
                className="denty-dashboard-card relative overflow-hidden p-4 sm:p-5"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[3px] bg-teal-300/70"
                />
                <div className="flex flex-wrap items-start justify-between gap-3 pl-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={appt.status} />
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        {startTime
                          ? new Date(startTime).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                      {startTime ? (
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {new Date(startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {doctorId && onOpenProfile ? (
                        <button
                          type="button"
                          onClick={() => onOpenProfile(doctorId)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-teal-300/60 hover:bg-teal-400/22"
                          title="View doctor profile"
                        >
                          <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-300/30 text-teal-50">
                            <svg width="9" height="9" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          {doctorName}
                        </button>
                      ) : (
                        <span className="font-semibold text-[var(--foreground)]">
                          {doctorName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <span className="opacity-70">clinic ·</span>
                        <span className="font-semibold text-[var(--foreground)]">
                          {clinicName}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <span className="opacity-70">case ·</span>
                        <span className="font-semibold text-[var(--foreground)]">
                          {caseTitle}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectAppointment(appt)}
                    className="denty-button-secondary px-3 py-2 text-xs font-semibold"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
