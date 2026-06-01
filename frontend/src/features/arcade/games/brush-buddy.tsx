"use client";

/**
 * Brush Buddy — Simon-style brushing pattern memorization.
 *
 * Each round, a sequence of mouth zones lights up in order. The player has
 * to tap the same zones in the same order. Get it right → next round adds
 * another step. Get a zone wrong → miss++ and the same pattern replays
 * once. Three misses ends the run.
 *
 * Zones scale with level:
 *   L1–4 — 4 quadrants  (UL, UR, LL, LR)
 *   L5–6 — 6 zones      (+ inner / outer surfaces)
 *   L7+  — 8 zones      (+ tongue, cheek — "full mouth coverage")
 *
 * Lv 11 = endless: no level cap on pattern length — chain bonus compounds.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HudChip } from "@/features/arcade/components/hud-chip";
import { useTranslation } from "@/features/i18n/language-provider";

type GameProps = {
  level: number;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  hudSlot?: HTMLElement | null;
};

const MISS_LIMIT = 3;

type ZoneKey =
  | "UL" // upper-left outer
  | "UR" // upper-right outer
  | "LL" // lower-left outer
  | "LR" // lower-right outer
  | "UI" // upper inner (lingual)
  | "LI" // lower inner (lingual)
  | "TG" // tongue
  | "CH"; // cheek

type Zone = {
  key: ZoneKey;
  labelKey: string;
  /** Grid position [col, row] on a 3x3 layout. Used for placement. */
  pos: [number, number];
  /** Emoji shown inside the zone. */
  icon: string;
  /** Visual highlight color when active. */
  glow: string;
};

const ALL_ZONES: Zone[] = [
  { key: "UL", labelKey: "arcade.brush.zone.ul", pos: [0, 0], icon: "🦷", glow: "rgba(94,234,212,0.95)" },
  { key: "UR", labelKey: "arcade.brush.zone.ur", pos: [2, 0], icon: "🦷", glow: "rgba(94,234,212,0.95)" },
  { key: "UI", labelKey: "arcade.brush.zone.ui", pos: [1, 0], icon: "🦷", glow: "rgba(56,189,248,0.95)" },
  { key: "LL", labelKey: "arcade.brush.zone.ll", pos: [0, 2], icon: "🦷", glow: "rgba(94,234,212,0.95)" },
  { key: "LR", labelKey: "arcade.brush.zone.lr", pos: [2, 2], icon: "🦷", glow: "rgba(94,234,212,0.95)" },
  { key: "LI", labelKey: "arcade.brush.zone.li", pos: [1, 2], icon: "🦷", glow: "rgba(56,189,248,0.95)" },
  { key: "TG", labelKey: "arcade.brush.zone.tongue", pos: [1, 1], icon: "👅", glow: "rgba(244,114,182,0.95)" },
  { key: "CH", labelKey: "arcade.brush.zone.cheek", pos: [2, 1], icon: "😊", glow: "rgba(250,204,21,0.95)" },
];

function zonesForLevel(level: number): Zone[] {
  if (level <= 4) {
    return ALL_ZONES.filter((z) => ["UL", "UR", "LL", "LR"].includes(z.key));
  }
  if (level <= 6) {
    return ALL_ZONES.filter((z) =>
      ["UL", "UR", "UI", "LL", "LR", "LI"].includes(z.key),
    );
  }
  return ALL_ZONES;
}

/**
 * Starting pattern length per level. Kept LOW at the bottom of the curve
 * so the early levels feel like a warm-up — a 2-step pattern at L1 reads
 * instantly, the player succeeds, and the round wraps up fast.
 */
function startingLength(level: number): number {
  if (level <= 1) return 2;
  if (level <= 2) return 2;
  if (level <= 4) return 3;
  if (level <= 6) return 4;
  if (level <= 8) return 5;
  return 6;
}

function stepGrowth(level: number): number {
  // L9+ grows by 2 steps per round, rest grow by 1.
  return level >= 9 ? 2 : 1;
}

/** Playback timing: glow on, then off, then small gap. Faster at higher
 *  levels; comfortably slow at L1 so it actually feels like a warm-up. */
function playbackTiming(level: number): { glowMs: number; gapMs: number } {
  const clamped = Math.max(1, Math.min(10, level));
  // L1: glow 820ms, gap 320ms — clearly readable.
  // L10: glow 320ms, gap 100ms — sharp + tight.
  const glow = Math.max(320, 880 - clamped * 60);
  const gap = Math.max(100, 340 - clamped * 26);
  return { glowMs: glow, gapMs: gap };
}

function randomZone(zones: Zone[]): ZoneKey {
  return zones[Math.floor(Math.random() * zones.length)].key;
}

type Phase = "watch" | "input" | "replay" | "between";

export function BrushBuddyGame({ level, onFinish, onCancel, hudSlot }: GameProps) {
  const t = useTranslation();
  const endless = level >= 11;
  const effectiveLevel = endless ? 10 : level;
  const zones = useMemo(() => zonesForLevel(effectiveLevel), [effectiveLevel]);
  const { glowMs, gapMs } = useMemo(
    () => playbackTiming(effectiveLevel),
    [effectiveLevel],
  );
  const growth = useMemo(() => stepGrowth(effectiveLevel), [effectiveLevel]);

  const [pattern, setPattern] = useState<ZoneKey[]>(() =>
    Array.from({ length: startingLength(effectiveLevel) }, () =>
      randomZone(zones),
    ),
  );
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("watch");
  const [active, setActive] = useState<ZoneKey | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [chain, setChain] = useState(0);
  const [over, setOver] = useState<null | "fail" | "win">(null);
  const [overReason, setOverReason] = useState("");
  const [misdirect, setMisdirect] = useState<ZoneKey | null>(null);
  /** Animated "MISS!" overlay — pops on a wrong tap, fades after ~900ms. */
  const [missFlash, setMissFlash] = useState<{ id: number; remaining: number } | null>(null);
  const missIdRef = useRef(0);

  const startedRef = useRef(Date.now());
  const phaseTokenRef = useRef(0);

  const submit = useCallback(
    (final: number) => onFinish(final, Date.now() - startedRef.current),
    [onFinish],
  );

  // Playback effect — replays whenever phase enters "watch" or "replay".
  useEffect(() => {
    if (phase !== "watch" && phase !== "replay") return;
    const token = ++phaseTokenRef.current;
    let i = 0;
    setActive(null);

    function step() {
      if (token !== phaseTokenRef.current) return;
      if (i >= pattern.length) {
        // Done playing — hand over to input.
        setActive(null);
        setStepIdx(0);
        setPhase("input");
        return;
      }
      const key = pattern[i];
      setActive(key);
      window.setTimeout(() => {
        if (token !== phaseTokenRef.current) return;
        setActive(null);
        // L8+ misdirection between steps.
        if (effectiveLevel >= 8 && Math.random() < 0.35) {
          const others = zones.filter((z) => z.key !== key);
          const flick = others[Math.floor(Math.random() * others.length)].key;
          setMisdirect(flick);
          window.setTimeout(() => setMisdirect(null), 90);
        }
        i += 1;
        window.setTimeout(step, gapMs);
      }, glowMs);
    }

    // Brief beat before playback begins.
    window.setTimeout(step, 500);

    return () => {
      // Invalidate this run.
      phaseTokenRef.current += 1;
    };
    // We deliberately depend on pattern object identity + phase changes.
  }, [phase, pattern, glowMs, gapMs, effectiveLevel, zones]);

  const onZoneTap = useCallback(
    (key: ZoneKey) => {
      if (phase !== "input" || over) return;
      const expected = pattern[stepIdx];
      if (key === expected) {
        // Correct step.
        setActive(key);
        window.setTimeout(() => setActive(null), 180);
        const nextChain = chain + 1;
        const chainBonus = Math.min(120, nextChain * 8);
        setScore((s) => s + 60 + chainBonus);
        setChain(nextChain);

        const nextStep = stepIdx + 1;
        if (nextStep >= pattern.length) {
          // Round cleared.
          const cleanBonus = 200 + Math.round(pattern.length * 30);
          setScore((s) => s + cleanBonus);
          setStepIdx(0);
          setPhase("between");
          // Endless: grow forever. Fixed levels: cap rounds at 5 — keeps
          // the run short and snappy and lets early levels feel like a
          // warm-up rather than a slog.
          const nextRound = round + 1;
          if (!endless && nextRound > 5) {
            setOver("win");
            setOverReason(t("arcade.brush.over_win"));
            window.setTimeout(
              () => submit(score + 60 + chainBonus + cleanBonus),
              1600,
            );
            return;
          }
          window.setTimeout(() => {
            // Build the new, longer pattern (keep existing + add `growth` new).
            setPattern((prev) => [
              ...prev,
              ...Array.from({ length: growth }, () => randomZone(zones)),
            ]);
            setRound(nextRound);
            setPhase("watch");
          }, 900);
        } else {
          setStepIdx(nextStep);
        }
      } else {
        // Wrong tap.
        setActive(key);
        window.setTimeout(() => setActive(null), 220);
        const newMisses = misses + 1;
        setMisses(newMisses);
        setChain(0);
        const flashId = ++missIdRef.current;
        setMissFlash({ id: flashId, remaining: MISS_LIMIT - newMisses });
        window.setTimeout(() => {
          // Only clear if this is still the latest flash — otherwise a newer
          // miss has already overwritten it and we don't want to wipe early.
          setMissFlash((current) =>
            current && current.id === flashId ? null : current,
          );
        }, 1000);
        if (newMisses >= MISS_LIMIT) {
          setOver("fail");
          setOverReason(t("arcade.brush.over_fail"));
          window.setTimeout(() => submit(score), 1600);
          return;
        }
        // Replay the same pattern from scratch.
        setStepIdx(0);
        setPhase("replay");
      }
    },
    [
      phase,
      over,
      pattern,
      stepIdx,
      chain,
      round,
      misses,
      endless,
      growth,
      zones,
      score,
      submit,
      t,
    ],
  );

  const hud = (
    <div className="flex flex-wrap items-center gap-2">
      <HudChip label={t("arcade.hud.score")} value={score} variant="score" />
      <HudChip
        label={t("arcade.brush.hud_round")}
        value={round}
        variant="combo"
      />
      <HudChip
        label={t("arcade.brush.hud_steps")}
        value={pattern.length}
        variant="timer"
      />
      <HudChip
        label={t("arcade.hud.misses")}
        value={`${misses}/${MISS_LIMIT}`}
        variant={misses >= 2 ? "danger" : "neutral"}
        urgent={misses >= 2}
      />
      <HudChip
        label={t("arcade.hud.level")}
        value={endless ? t("arcade.hud.endless") : level}
        variant="level"
      />
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:p-6">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      {/* Phase banner */}
      <div
        className="pointer-events-none rounded-full border border-white/20 bg-black/50 px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur"
        aria-live="polite"
      >
        {phase === "watch" || phase === "replay"
          ? t("arcade.brush.watch")
          : phase === "input"
            ? t("arcade.brush.your_turn", {
                done: stepIdx,
                total: pattern.length,
              })
            : t("arcade.brush.next_round")}
      </div>

      {/* Mouth grid */}
      <div
        className="grid w-full max-w-md gap-3 sm:gap-4"
        style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: "repeat(3, minmax(0, 1fr))",
          aspectRatio: "1 / 1",
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const zone = zones.find(
            (z) => z.pos[0] === col && z.pos[1] === row,
          );
          if (!zone) {
            // Empty cell — visual filler with subtle mouth gradient.
            return (
              <div
                key={`empty-${i}`}
                aria-hidden
                className="rounded-[18px] border border-white/8"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(190,24,93,0.15),rgba(127,29,29,0.1))",
                }}
              />
            );
          }
          const isActive = active === zone.key;
          const isMisdirect = misdirect === zone.key;
          return (
            <button
              key={zone.key}
              type="button"
              disabled={phase !== "input" || over !== null}
              onClick={() => onZoneTap(zone.key)}
              aria-label={t(zone.labelKey)}
              className="relative rounded-[18px] border-2 transition focus-visible:ring-2 focus-visible:ring-white"
              style={{
                borderColor: isActive
                  ? zone.glow
                  : "rgba(255,255,255,0.16)",
                background: isActive
                  ? `radial-gradient(circle at 50% 50%, ${zone.glow}, rgba(20,40,68,0.85))`
                  : "linear-gradient(135deg,rgba(248,250,252,0.95),rgba(226,232,240,0.9))",
                boxShadow: isActive
                  ? `0 0 28px ${zone.glow}, 0 0 0 4px rgba(255,255,255,0.18) inset`
                  : isMisdirect
                    ? `0 0 14px rgba(255,255,255,0.55)`
                    : "0 6px 14px rgba(2,6,18,0.25)",
                animation: isActive
                  ? "denty-pop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both"
                  : undefined,
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl">
                {zone.icon}
              </span>
              <span
                className="absolute bottom-1 left-1 right-1 truncate text-center text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{
                  color: isActive ? "#ffffff" : "rgba(15,23,42,0.6)",
                }}
              >
                {t(zone.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Big MISS! flash — overlays the whole play area for ~1s on a wrong tap. */}
      {missFlash && !over ? (
        <div
          key={missFlash.id}
          aria-live="assertive"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          style={{
            animation: "denty-miss-flash 1000ms ease-out both",
          }}
        >
          <div
            className="flex flex-col items-center gap-2 rounded-[28px] border border-rose-300/55 bg-gradient-to-br from-rose-500/85 to-rose-700/85 px-10 py-6 text-center text-white shadow-[0_30px_80px_rgba(190,18,60,0.65)] backdrop-blur"
            style={{
              animation:
                "denty-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both, denty-shake 380ms cubic-bezier(0.36,0.07,0.19,0.97) both",
            }}
          >
            <p className="text-5xl font-black uppercase tracking-[0.18em] drop-shadow-[0_6px_18px_rgba(2,6,18,0.55)] sm:text-6xl">
              {t("arcade.brush.miss_banner")}
            </p>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-rose-100/95">
              {missFlash.remaining > 0
                ? t("arcade.brush.miss_remaining", {
                    remaining: missFlash.remaining,
                  })
                : t("arcade.brush.miss_last")}
            </p>
          </div>
        </div>
      ) : null}

      {over ? (
        <div
          className="absolute inset-x-4 top-1/2 z-40 -translate-y-1/2 rounded-[22px] border border-white/22 bg-black/70 px-6 py-5 text-center text-white shadow-[0_30px_70px_rgba(2,6,18,0.6)] backdrop-blur"
          style={{
            animation: "denty-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/65">
            {over === "win"
              ? t("arcade.brush.over_win_eyebrow")
              : t("arcade.brush.over_fail_eyebrow")}
          </p>
          <p className="mt-2 text-2xl font-extrabold">{overReason}</p>
          <p className="mt-1 text-sm text-white/80">
            {t("arcade.brush.over_score", { score, length: pattern.length })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
