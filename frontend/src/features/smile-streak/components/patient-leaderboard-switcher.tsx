"use client";

/**
 * Patient leaderboard switcher.
 *
 * Wraps the existing arcade leaderboard and the new smile-streak leaderboard
 * behind a two-tab top-level switcher. The arcade leaderboard owns its own
 * per-game / per-level tabs and filters — this surface only chooses which
 * of the two boards is showing.
 *
 * Mounted from the patient page when activeSurface === "leaderboard".
 */

import { useState } from "react";
import { ArcadeLeaderboardView } from "@/features/arcade/components/arcade-leaderboard";
import { StreakLeaderboardSection } from "@/features/smile-streak/components/streak-leaderboard-section";
import { useTranslation } from "@/features/i18n/language-provider";

type PatientLeaderboardSwitcherProps = {
  currentUserId?: string;
};

type Section = "arcade" | "streak";

export function PatientLeaderboardSwitcher({
  currentUserId,
}: PatientLeaderboardSwitcherProps) {
  const t = useTranslation();
  const [section, setSection] = useState<Section>("arcade");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("patient.leaderboard.section_aria")}
        className="inline-flex flex-wrap gap-2 rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.14)] p-2 shadow-[0_18px_44px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
      >
        <button
          role="tab"
          aria-selected={section === "arcade"}
          type="button"
          onClick={() => setSection("arcade")}
          className={`inline-flex min-h-[2.6rem] items-center gap-2 rounded-[16px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            section === "arcade"
              ? "border-[rgba(94,234,212,0.45)] bg-gradient-to-r from-teal-500/90 to-sky-500/90 text-white shadow-[0_10px_24px_rgba(20,184,166,0.35)]"
              : "border-white/14 bg-white/40 text-[rgba(10,22,40,0.74)] hover:bg-white/55"
          }`}
        >
          <span aria-hidden>🦷</span>
          {t("patient.leaderboard.tab_arcade")}
        </button>
        <button
          role="tab"
          aria-selected={section === "streak"}
          type="button"
          onClick={() => setSection("streak")}
          className={`inline-flex min-h-[2.6rem] items-center gap-2 rounded-[16px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            section === "streak"
              ? "border-[rgba(244,114,182,0.45)] bg-gradient-to-r from-rose-500/90 to-amber-500/90 text-white shadow-[0_10px_24px_rgba(244,114,182,0.35)]"
              : "border-white/14 bg-white/40 text-[rgba(10,22,40,0.74)] hover:bg-white/55"
          }`}
        >
          <span aria-hidden>🔥</span>
          {t("patient.leaderboard.tab_streak")}
        </button>
      </div>

      {section === "arcade" ? (
        <ArcadeLeaderboardView currentUserId={currentUserId} />
      ) : (
        <StreakLeaderboardSection currentUserId={currentUserId} />
      )}
    </div>
  );
}
