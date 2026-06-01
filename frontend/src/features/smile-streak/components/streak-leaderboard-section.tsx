"use client";

/**
 * Smile-streak leaderboard section.
 *
 * Three metric tabs:
 *   - Current streak     — consecutive Amman-local days the patient
 *                          has logged a check-in right now.
 *   - Best streak ever   — longest streak the patient has ever held.
 *   - Total points       — cumulative score across all check-ins.
 *
 * The endpoint /smile-streak/leaderboard returns one row per patient with
 * all three metrics, so this surface just re-sorts client-side instead of
 * round-tripping per tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSmileLeaderboard,
  type SmileLeaderboardEntry,
} from "@/features/smile-streak/services/smile-streak-api";
import { useTranslation } from "@/features/i18n/language-provider";

type StreakLeaderboardSectionProps = {
  currentUserId?: string;
};

type Metric = "current" | "best" | "cumulative";

const METRIC_VALUE: Record<Metric, (e: SmileLeaderboardEntry) => number> = {
  current: (e) => e.streak,
  best: (e) => e.bestStreak,
  cumulative: (e) => e.cumulative,
};

const METRIC_TINT: Record<
  Metric,
  { active: string; accent: string }
> = {
  current: {
    active:
      "border-rose-300/45 bg-gradient-to-r from-rose-500/90 to-amber-500/90 text-white shadow-[0_10px_24px_rgba(244,114,182,0.35)]",
    accent: "rgba(251,191,36,0.95)",
  },
  best: {
    active:
      "border-amber-300/45 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-[0_10px_24px_rgba(245,158,11,0.35)]",
    accent: "rgba(245,158,11,0.95)",
  },
  cumulative: {
    active:
      "border-teal-300/45 bg-gradient-to-r from-teal-500/90 to-sky-500/90 text-white shadow-[0_10px_24px_rgba(20,184,166,0.35)]",
    accent: "rgba(94,234,212,0.95)",
  },
};

function timeAgo(iso: string | null, t: (k: string, v?: any) => string): string {
  if (!iso) return t("streak.lb.last_never");
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 1) return t("streak.lb.last_now");
  if (mins < 60) return t("streak.lb.last_minutes", { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("streak.lb.last_hours", { count: hours });
  const days = Math.round(hours / 24);
  return t("streak.lb.last_days", { count: days });
}

function rankSuffix(rank: number, t: (k: string, v?: any) => string): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function StreakLeaderboardSection({
  currentUserId,
}: StreakLeaderboardSectionProps) {
  const t = useTranslation();
  const [metric, setMetric] = useState<Metric>("current");
  const [entries, setEntries] = useState<SmileLeaderboardEntry[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getSmileLeaderboard();
      setEntries(snap.entries);
      setGeneratedAt(snap.generatedAt);
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || t("streak.lb.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sort by current metric (server already ranks by cumulative; we re-rank
  // client-side so all three tabs share one fetch).
  const ranked = useMemo(() => {
    const valueOf = METRIC_VALUE[metric];
    const copy = entries.slice();
    copy.sort((a, b) => valueOf(b) - valueOf(a) || a.patient.name.localeCompare(b.patient.name));
    return copy.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }, [entries, metric]);

  const myRow = currentUserId
    ? ranked.find((e) => e.patient.id === currentUserId)
    : undefined;

  const tint = METRIC_TINT[metric];

  return (
    <div className="space-y-4">
      {/* ── Hero summary card ─────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[22px] border border-white/14 p-5 text-white shadow-[0_20px_44px_rgba(7,18,34,0.28)] backdrop-blur-[18px] sm:p-6"
        style={{
          background:
            "linear-gradient(135deg,rgba(190,24,93,0.92),rgba(245,158,11,0.85))",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
              {t("streak.lb.eyebrow")}
            </p>
            <p className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
              {t("streak.lb.heading")}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              {t("streak.lb.subheading")}
            </p>
          </div>
          {myRow ? (
            <div className="rounded-[18px] border border-white/22 bg-white/15 px-4 py-3 text-right backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                {t("streak.lb.your_rank")}
              </p>
              <p className="mt-1 text-2xl font-extrabold leading-none">
                {rankSuffix(myRow.rank, t)}
              </p>
              <p className="mt-1 text-[11px] text-white/85">
                {t("streak.lb.your_metric_value", {
                  value: METRIC_VALUE[metric](myRow),
                })}
              </p>
            </div>
          ) : null}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-white/15 blur-3xl"
        />
      </div>

      {/* ── Metric switcher + refresh ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={t("streak.lb.metric_aria")}
          className="inline-flex flex-wrap gap-2 rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.18)] p-2 backdrop-blur-[16px]"
        >
          {(["current", "best", "cumulative"] as const).map((m) => {
            const active = m === metric;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(m)}
                className={`inline-flex min-h-[2.4rem] items-center gap-2 rounded-[14px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  active
                    ? METRIC_TINT[m].active
                    : "border-white/14 bg-white/40 text-[rgba(10,22,40,0.74)] hover:bg-white/55"
                }`}
              >
                {t(`streak.lb.metric_${m}`)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {t("streak.lb.last_updated", {
              when: generatedAt ? timeAgo(generatedAt, t) : t("streak.lb.last_never"),
            })}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-[2.4rem] items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-500/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800 transition hover:bg-teal-500/25 disabled:opacity-60"
          >
            {loading ? t("streak.lb.refreshing") : t("streak.lb.refresh")}
          </button>
        </div>
      </div>

      {/* ── Ranking list ──────────────────────────────── */}
      {error ? (
        <p className="rounded-[16px] border border-rose-300/40 bg-rose-500/15 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      {!loading && !error && ranked.length === 0 ? (
        <p className="rounded-[16px] border border-white/14 bg-white/40 p-4 text-sm text-[var(--muted-foreground)]">
          {t("streak.lb.empty")}
        </p>
      ) : null}

      <ol className="space-y-2">
        {ranked.map((entry) => {
          const isMe = currentUserId && entry.patient.id === currentUserId;
          const value = METRIC_VALUE[metric](entry);
          const initials = entry.patient.name
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?";
          return (
            <li
              key={entry.patient.id}
              className={`flex items-center gap-3 rounded-[18px] border p-3 sm:p-3.5 transition ${
                isMe
                  ? "border-teal-400/45 bg-gradient-to-r from-teal-500/14 to-sky-500/14 shadow-[0_10px_24px_rgba(20,184,166,0.18)]"
                  : "border-white/14 bg-white/40 hover:bg-white/55"
              }`}
            >
              {/* Rank pill */}
              <div
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] text-sm font-extrabold"
                style={{
                  background:
                    entry.rank <= 3
                      ? "linear-gradient(135deg,rgba(250,204,21,0.95),rgba(245,158,11,0.95))"
                      : "rgba(15,23,42,0.08)",
                  color: entry.rank <= 3 ? "#0f172a" : "rgba(10,22,40,0.7)",
                }}
              >
                {rankSuffix(entry.rank, t)}
              </div>

              {/* Avatar */}
              <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-slate-200 to-slate-400 text-sm font-bold text-slate-900">
                {entry.patient.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.patient.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {/* Name + secondary */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {entry.patient.name}
                  {isMe ? (
                    <span
                      className="ml-2 inline-flex rounded-full border border-teal-400/40 bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-800"
                      style={{ borderColor: tint.accent }}
                    >
                      {t("streak.lb.you")}
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {t("streak.lb.row_secondary", {
                    checkins: entry.checkinCount,
                    best: entry.bestStreak,
                  })}
                </p>
              </div>

              {/* Metric value */}
              <div className="flex flex-none flex-col items-end">
                <p className="text-xl font-extrabold leading-none text-[var(--foreground)] sm:text-2xl">
                  {value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t(`streak.lb.metric_unit_${metric}`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
