"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import {
  decideUserProfileReport,
  getUserProfileReports,
} from "@/features/admin/services/admin-api";
import type { UserProfileReportItem } from "@/features/admin/types/admin";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";

const panelClass =
  "overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-6 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:p-7";

type ReportFilter = "pending" | "resolved" | "all";

export default function AdminUserReportsPage() {
  const [items, setItems] = useState<UserProfileReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReportFilter>("pending");

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "User reports",
    errorTitle: "User reports",
  });

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfileReports();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load user reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return items.filter((item) => {
      const filterOk =
        filter === "all"
          ? true
          : filter === "pending"
            ? item.status === "PENDING"
            : item.status !== "PENDING";
      if (!filterOk) return false;
      if (!trimmed) return true;
      return [
        item.reason,
        item.note,
        item.reporter.name,
        item.reporter.username,
        item.reportedUser.name,
        item.reportedUser.username,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(trimmed));
    });
  }, [filter, items, query]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );

  const resolveReport = async (
    reportId: string,
    status: UserProfileReportItem["status"],
  ) => {
    setSavingId(reportId);
    setError(null);
    try {
      const data = await decideUserProfileReport(reportId, status);
      setMessage(data?.message || "Report decision saved.");
      await loadReports();
    } catch (e: any) {
      setError(e?.message || "Failed to save report decision.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminShell
      title="User Reports"
      description="Moderate profile abuse reports from doctors, supervisors, and patients without losing the context of who reported whom and why."
    >
      <div className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <div className={panelClass}>
          <p className="denty-kicker">Safety desk</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Moderation queue
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Reports are created from public profiles. Pending items should be
            dismissed when harmless, or marked as action taken once staff responds.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                Pending
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                Reviewed
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {items.filter((item) => item.status !== "PENDING").length}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {items.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="denty-field text-sm"
              placeholder="Search reports by reporter, user, or reason"
            />
            <div className="flex flex-wrap gap-3">
              {[
                { key: "pending", label: "Pending" },
                { key: "resolved", label: "Resolved" },
                { key: "all", label: "All" },
              ].map((option) => {
                const active = filter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key as ReportFilter)}
                    className={`inline-flex min-h-[2.8rem] items-center justify-center rounded-[18px] border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white"
                        : "border-white/12 bg-white/28 text-[rgba(10,22,40,0.78)] hover:bg-white/42"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="denty-kicker">Reported users</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                Review lane
              </h2>
            </div>
            <span className="denty-pill">{filteredItems.length} reports</span>
          </div>

          <div className="mt-5 max-h-[56rem] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Loading reports...
              </p>
            ) : null}

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] p-5 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/12 bg-white/28 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.62)]">
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.44)]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                      {item.reason}
                    </h3>
                  </div>
                  {item.status === "PENDING" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => resolveReport(item.id, "DISMISSED")}
                        disabled={savingId === item.id}
                        className="inline-flex min-h-[2.7rem] items-center justify-center rounded-[16px] border border-white/12 bg-white/42 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/56 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveReport(item.id, "ACTION_TAKEN")}
                        disabled={savingId === item.id}
                        className="inline-flex min-h-[2.7rem] items-center justify-center rounded-[16px] border border-rose-300/34 bg-[rgba(190,24,93,0.16)] px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-[rgba(190,24,93,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Take action
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Reporter
                    </p>
                    <Link
                      href={`/profiles/${item.reporter.id}`}
                      className="mt-2 inline-block font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {item.reporter.name}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      @{item.reporter.username} | {item.reporter.role}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Reported user
                    </p>
                    <Link
                      href={`/profiles/${item.reportedUser.id}`}
                      className="mt-2 inline-block font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {item.reportedUser.name}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      @{item.reportedUser.username} | {item.reportedUser.role}
                    </p>
                  </div>
                </div>

                {item.note ? (
                  <div className="mt-4 rounded-[20px] border border-white/10 bg-white/24 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Reporter note
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {item.note}
                    </p>
                  </div>
                ) : null}

                {item.resolutionNote ? (
                  <div className="mt-4 rounded-[20px] border border-emerald-300/24 bg-emerald-50/56 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                      Resolution note
                    </p>
                    <p className="mt-3 text-sm leading-7 text-emerald-900/90">
                      {item.resolutionNote}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}

            {!loading && filteredItems.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/16 bg-white/18 p-5">
                <p className="text-sm text-[var(--muted-foreground)]">
                  No reports match the current filter.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
