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
import { useTranslation } from "@/features/i18n/language-provider";

const panelClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:p-6";

type ReportFilter = "pending" | "resolved" | "all";

export default function AdminUserReportsPage() {
  const t = useTranslation();
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
    messageTitle: t("admin.reports.toast_title"),
    errorTitle: t("admin.reports.toast_title"),
  });

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfileReports();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || t("admin.reports.failed_load"));
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
      setMessage(data?.message || t("admin.reports.decision_saved"));
      await loadReports();
    } catch (e: any) {
      setError(e?.message || t("admin.reports.failed_decision"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminShell
      title={t("admin.reports.title")}
      description={t("admin.reports.description")}
    >
      <div className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <div className={panelClass}>
          <p className="denty-kicker">{t("admin.reports.safety_desk")}</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {t("admin.reports.moderation_queue")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            {t("admin.reports.queue_intro")}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                {t("admin.reports.pending")}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                {t("admin.reports.reviewed")}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {items.filter((item) => item.status !== "PENDING").length}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                {t("admin.reports.total")}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {items.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="denty-field text-sm"
              placeholder={t("admin.reports.search_placeholder")}
            />
            <div className="flex flex-wrap gap-3">
              {[
                { key: "pending", label: t("admin.reports.filter_pending") },
                { key: "resolved", label: t("admin.reports.filter_resolved") },
                { key: "all", label: t("admin.reports.filter_all") },
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
              <p className="denty-kicker">{t("admin.reports.reported_users")}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {t("admin.reports.review_lane")}
              </h2>
            </div>
            <span className="denty-pill">
              {t("admin.reports.reports_count", { count: filteredItems.length })}
            </span>
          </div>

          <div className="mt-5 max-h-[56rem] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("admin.reports.loading")}
              </p>
            ) : null}

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] p-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/12 bg-white/28 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.62)]">
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.44)]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words text-xl font-semibold text-[var(--foreground)]">
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
                        {t("admin.reports.dismiss")}
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveReport(item.id, "ACTION_TAKEN")}
                        disabled={savingId === item.id}
                        className="inline-flex min-h-[2.7rem] items-center justify-center rounded-[16px] border border-rose-300/34 bg-[rgba(190,24,93,0.16)] px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-[rgba(190,24,93,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("admin.reports.take_action")}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      {t("admin.reports.reporter")}
                    </p>
                    <Link
                      href={`/profiles/${item.reporter.id}`}
                      className="mt-2 inline-block break-words font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {item.reporter.name}
                    </Link>
                    <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                      @{item.reporter.username} | {item.reporter.role}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      {t("admin.reports.reported_user")}
                    </p>
                    <Link
                      href={`/profiles/${item.reportedUser.id}`}
                      className="mt-2 inline-block break-words font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {item.reportedUser.name}
                    </Link>
                    <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                      @{item.reportedUser.username} | {item.reportedUser.role}
                    </p>
                  </div>
                </div>

                {item.note ? (
                  <div className="mt-4 rounded-[20px] border border-white/10 bg-white/24 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      {t("admin.reports.reporter_note")}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {item.note}
                    </p>
                  </div>
                ) : null}

                {item.resolutionNote ? (
                  <div className="mt-4 rounded-[20px] border border-emerald-300/24 bg-emerald-50/56 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                      {t("admin.reports.resolution_note")}
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
                  {t("admin.reports.empty")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
