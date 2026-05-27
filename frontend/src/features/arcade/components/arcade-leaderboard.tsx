"use client";

/**
 * Per-game arcade leaderboard with three tabs (one per game type).
 * Ranks patients by best score for the selected game. Lazy-loads each tab
 * the first time it's activated.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getArcadeLeaderboard,
  type ArcadeGameType,
  type ArcadeLeaderboardSnapshot,
} from "@/features/arcade/services/arcade-api";

const TAB_META: Record<
  ArcadeGameType,
  { label: string; emoji: string; gradient: string }
> = {
  PLAQUE_BLASTER: {
    label: "Plaque Blaster",
    emoji: "🦷",
    gradient: "linear-gradient(135deg,rgba(14,116,144,0.95),rgba(13,148,136,0.7))",
  },
  TOOTH_DEFENDER: {
    label: "Tooth Defender",
    emoji: "🛡️",
    gradient: "linear-gradient(135deg,rgba(76,29,149,0.95),rgba(190,24,93,0.75))",
  },
  FLOSS_RUSH: {
    label: "Floss Rush",
    emoji: "💨",
    gradient: "linear-gradient(135deg,rgba(15,118,110,0.95),rgba(20,184,166,0.75))",
  },
};

const TAB_ORDER: ArcadeGameType[] = [
  "PLAQUE_BLASTER",
  "TOOTH_DEFENDER",
  "FLOSS_RUSH",
];

type ArcadeLeaderboardViewProps = {
  currentUserId?: string;
};

export function ArcadeLeaderboardView({
  currentUserId,
}: ArcadeLeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<ArcadeGameType>("PLAQUE_BLASTER");
  const [snapshots, setSnapshots] = useState<
    Partial<Record<ArcadeGameType, ArcadeLeaderboardSnapshot>>
  >({});
  const [loadingTab, setLoadingTab] = useState<ArcadeGameType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTab = useCallback(async (game: ArcadeGameType) => {
    setLoadingTab(game);
    setError(null);
    try {
      const data = await getArcadeLeaderboard(game);
      setSnapshots((prev) => ({ ...prev, [game]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard.");
    } finally {
      setLoadingTab(null);
    }
  }, []);

  useEffect(() => {
    if (!snapshots[activeTab]) {
      void loadTab(activeTab);
    }
  }, [activeTab, snapshots, loadTab]);

  const snapshot = snapshots[activeTab];
  const meta = TAB_META[activeTab];
  const entries = snapshot?.entries ?? [];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Arcade leaderboards"
        className="flex flex-wrap gap-3"
      >
        {TAB_ORDER.map((game) => {
          const active = activeTab === game;
          return (
            <button
              key={game}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(game)}
              className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-[16px] border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[rgba(137,219,255,0.32)] text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)]"
                  : "border-white/12 bg-white/28 text-[rgba(10,22,40,0.78)] hover:bg-white/42"
              }`}
              style={active ? { background: TAB_META[game].gradient } : {}}
            >
              <span aria-hidden>{TAB_META[game].emoji}</span>
              {TAB_META[game].label}
            </button>
          );
        })}
      </div>

      <div
        className="overflow-hidden rounded-[24px] border border-white/12 p-4 shadow-[0_28px_72px_rgba(7,18,34,0.16)] sm:p-6"
        style={{ background: meta.gradient }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Best-score ranking
            </p>
            <h2 className="mt-2 text-2xl font-bold">{meta.label}</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Top patients by personal best. Each round is one shot per day —
              keep your streak alive to play harder levels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadTab(activeTab)}
            disabled={loadingTab === activeTab}
            className="rounded-[14px] border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-[12px] transition hover:bg-white/30 disabled:opacity-60"
          >
            {loadingTab === activeTab ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <div className="denty-enter-stagger space-y-3">
        {loadingTab === activeTab && !snapshot
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="denty-skeleton denty-skeleton-card" />
            ))
          : null}

        {!loadingTab && snapshot && entries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/16 bg-white/14 p-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              Nobody has played this game yet — be the first to claim Rank #1.
            </p>
          </div>
        ) : null}

        {entries.map((entry) => {
          const isMe = currentUserId && entry.patient.id === currentUserId;
          return (
            <div
              key={entry.patient.id}
              className={`grid items-center gap-4 rounded-[24px] border p-4 backdrop-blur-[18px] sm:grid-cols-[auto_minmax(0,1fr)_auto] ${
                isMe
                  ? "border-[rgba(7,111,133,0.45)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] ring-2 ring-[rgba(7,111,133,0.4)]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_8px_20px_rgba(7,18,34,0.3)] ${
                    entry.rank === 1
                      ? "bg-[linear-gradient(135deg,#fde047,#f59e0b)]"
                      : entry.rank === 2
                        ? "bg-[linear-gradient(135deg,#cbd5e1,#64748b)]"
                        : entry.rank === 3
                          ? "bg-[linear-gradient(135deg,#fdba74,#c2410c)]"
                          : "bg-[rgba(9,20,38,0.7)]"
                  }`}
                >
                  {entry.rank}
                </span>
                {entry.patient.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.patient.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full border border-white/20 object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {entry.patient.name}
                  </p>
                  {isMe ? (
                    <span className="rounded-full border border-[rgba(7,111,133,0.36)] bg-[rgba(7,111,133,0.18)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.96)]">
                      You
                    </span>
                  ) : null}
                  {entry.streak > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(234,88,12,0.3)] bg-[rgba(254,215,170,0.4)] px-3 py-1 text-[11px] font-semibold text-[rgba(124,45,18,0.95)]">
                      <span aria-hidden>🔥</span>
                      {entry.streak} day{entry.streak === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  @{entry.patient.username} · {entry.attempts} attempt
                  {entry.attempts === 1 ? "" : "s"}
                  {entry.lastPlayedAt
                    ? ` · last play ${new Date(entry.lastPlayedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.55)]">
                  Best score
                </p>
                <p className="text-2xl font-extrabold tabular-nums text-[var(--foreground)]">
                  {entry.bestScore.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
