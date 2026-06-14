"use client";

/**
 * Admin leaderboard switcher.
 *
 * Wraps three boards behind one top-level tab control:
 *
 *   1. Academic    — the existing LeaderboardView showing student
 *                    semester progress + grades.
 *   2. Arcade      — per-game per-level rankings via ArcadeLeaderboardView.
 *   3. Smile Streak — patient streak rankings via StreakLeaderboardSection.
 *
 * The arcade + streak views are reused from the patient surface; both of
 * their underlying endpoints accept any authenticated user including
 * admin, so no backend changes are required.
 */

import { useState } from "react";
import { ArcadeLeaderboardView } from "@/features/arcade/components/arcade-leaderboard";
import { StreakLeaderboardSection } from "@/features/smile-streak/components/streak-leaderboard-section";
import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";
import { useTranslation } from "@/features/i18n/language-provider";

type Section = "academic" | "arcade" | "streak";

type AdminLeaderboardSwitcherProps = {
  /** Academic snapshot (semester progress, per-student grades). */
  snapshot: LeaderboardSnapshot | null;
  /** Whether the academic snapshot is still loading. */
  loading: boolean;
};

const TAB_THEME: Record<
  Section,
  { active: string; emoji: string; labelKey: string }
> = {
  academic: {
    active:
      "border-[rgba(7,111,133,0.45)] bg-gradient-to-r from-teal-600/95 to-sky-600/95 text-white shadow-[0_10px_24px_rgba(7,111,133,0.4)]",
    emoji: "🎓",
    labelKey: "admin.leaderboard.tab_academic",
  },
  arcade: {
    active:
      "border-[rgba(94,234,212,0.55)] bg-gradient-to-r from-teal-500/95 to-cyan-500/95 text-white shadow-[0_10px_24px_rgba(20,184,166,0.42)]",
    emoji: "🦷",
    labelKey: "admin.leaderboard.tab_arcade",
  },
  streak: {
    active:
      "border-[rgba(251,113,133,0.55)] bg-gradient-to-r from-rose-500/95 to-amber-500/95 text-white shadow-[0_10px_24px_rgba(244,114,182,0.42)]",
    emoji: "🔥",
    labelKey: "admin.leaderboard.tab_streak",
  },
};

const TAB_ORDER: Section[] = ["academic", "arcade", "streak"];

export function AdminLeaderboardSwitcher({
  snapshot,
  loading,
}: AdminLeaderboardSwitcherProps) {
  const t = useTranslation();
  const [section, setSection] = useState<Section>("academic");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("admin.leaderboard.section_aria")}
        className="inline-flex flex-wrap gap-2 rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.16)] p-2 shadow-[0_18px_44px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
      >
        {TAB_ORDER.map((id) => {
          const theme = TAB_THEME[id];
          const active = section === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(id)}
              className={`inline-flex min-h-[2.6rem] items-center gap-2 rounded-[16px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                active
                  ? theme.active
                  : "border-white/14 bg-white/40 text-[rgba(10,22,40,0.74)] hover:bg-white/55"
              }`}
            >
              <span aria-hidden>{theme.emoji}</span>
              {t(theme.labelKey)}
            </button>
          );
        })}
      </div>

      {section === "academic" ? (
        <LeaderboardView snapshot={snapshot} loading={loading} />
      ) : null}

      {section === "arcade" ? (
        <div className="denty-panel p-4 md:p-6">
          <ArcadeLeaderboardView />
        </div>
      ) : null}

      {section === "streak" ? (
        <div className="denty-panel p-4 md:p-6">
          <StreakLeaderboardSection />
        </div>
      ) : null}
    </div>
  );
}
