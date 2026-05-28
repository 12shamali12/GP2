"use client";

/**
 * Cinematic intro card that plays before a round starts.
 *
 * Level 1 acts as a "how to play" tutorial; subsequent levels list only the
 * mechanics that NEWLY unlock at this level so the player knows what to
 * expect. A 3-2-1 countdown ticks in the middle; a "Skip" button starts the
 * round immediately. When the countdown hits 0 the card auto-dismisses and
 * onStart() fires.
 */

import { useEffect, useState } from "react";
import { getLevelBrief } from "@/features/arcade/lib/level-features";
import type { ArcadeGameType } from "@/features/arcade/services/arcade-api";

type ArcadeIntroCardProps = {
  game: ArcadeGameType;
  level: number;
  /** Gradient + emoji from GAME_META so the card matches the focus stage. */
  gradient: string;
  emoji: string;
  label: string;
  onStart: () => void;
};

const COUNTDOWN_SECONDS = 3;

export function ArcadeIntroCard({
  game,
  level,
  gradient,
  emoji,
  label,
  onStart,
}: ArcadeIntroCardProps) {
  const brief = getLevelBrief(game, level);
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (remaining <= 0) {
      onStart();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onStart]);

  // Re-key the countdown digit so each tick replays the pop animation.
  const digitKey = `count-${remaining}`;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/16 p-7 text-white shadow-[0_30px_80px_rgba(2,6,18,0.55)] sm:p-10"
        style={{
          background: gradient,
          animation: "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {/* Header — game icon, level pill, title */}
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="inline-flex h-16 w-16 items-center justify-center rounded-[18px] bg-white/16 text-4xl shadow-[0_14px_30px_rgba(2,6,18,0.5)]"
          >
            {emoji}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
              {label}
            </p>
            <p className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Level {level}
            </p>
          </div>
          <div className="ml-auto flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">
              Starts in
            </p>
            <span
              key={digitKey}
              aria-live="polite"
              className="text-5xl font-extrabold tabular-nums leading-none text-white drop-shadow-[0_8px_18px_rgba(2,6,18,0.55)] sm:text-6xl"
              style={{
                animation:
                  "denty-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              {remaining}
            </span>
          </div>
        </div>

        {/* Headline + optional blurb */}
        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
            {brief.headline}
          </p>
          {brief.blurb ? (
            <p className="mt-1 text-sm text-white/80">{brief.blurb}</p>
          ) : null}
        </div>

        {/* Feature list */}
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {brief.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-[16px] border border-white/16 bg-white/10 px-3 py-2 backdrop-blur-[10px]"
              style={{
                animation: `denty-pop ${320 + i * 60}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
              }}
            >
              <span aria-hidden className="text-xl">
                {f.icon}
              </span>
              <span className="text-sm font-medium text-white/95">{f.text}</span>
            </li>
          ))}
        </ul>

        {/* Skip button */}
        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-white px-6 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-slate-900 shadow-[0_12px_28px_rgba(2,6,18,0.45)] transition hover:bg-white/90 active:scale-95"
          >
            Skip → Start
          </button>
        </div>

        {/* Decorative orbs */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-white/15 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-3xl"
        />
      </div>
    </div>
  );
}
