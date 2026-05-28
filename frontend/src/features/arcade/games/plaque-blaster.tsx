"use client";

/**
 * Plaque Blaster — 30-second tap-to-clean arcade game.
 *
 * A 5×3 grid of teeth. Targets spawn on random cells; the player taps to
 * destroy them. Hit/miss timing, decoys, and spawn rate all escalate with
 * the patient's streak level (1 = chill, 10 = sweaty).
 *
 *   plaque       (+10, 1.4s) — main fodder, default spawn
 *   gold cavity  (+50, 0.8s) — rare bonus that disappears fast
 *   brush        (+20, 1.2s) — clean tap, also rare
 *   sugar bomb   (−50, 1.2s) — penalty on tap, looks like a target
 *   miss penalty (−5)        — tapping an empty cell costs a tick of score
 *
 * Score is the running total at t=0. Submission is the caller's job — this
 * component only invokes `onFinish(score)` when the timer hits 0.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HudChip } from "@/features/arcade/components/hud-chip";

type GameProps = {
  /** 1..11 — controls spawn cadence, target lifetime, decoy ratio. Lv 11
   *  is endless mode (no fixed timer; ends only on bomb tap). */
  level: number;
  /** Called with the final score at t=0. Caller submits to the backend. */
  onFinish: (score: number, durationMs: number) => void;
  /** Called when the player explicitly bails out. */
  onCancel: () => void;
  /**
   * DOM element provided by the arcade focus-mode top bar — when set, the
   * game's HUD chips render via React portal into this slot instead of
   * inside the play area.
   */
  hudSlot?: HTMLElement | null;
};

type TargetKind = "plaque" | "cavity" | "brush" | "sugar" | "bomb";

type SpawnedTarget = {
  id: number;
  cell: number;
  kind: TargetKind;
  bornAt: number;
  /** ms — pulled from KIND_INFO[kind].lifeMs and scaled for level. */
  lifeMs: number;
};

const GRID_COLS = 5;
const GRID_ROWS = 3;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;
const ROUND_DURATION_MS = 30_000;
/** Cumulative misses (empty taps + expired good targets) that end the run. */
const MISS_LIMIT = 10;

/* -------------------------------------------------------------------------- */
/* Endless-mode stages                                                        */
/* -------------------------------------------------------------------------- */

/** How long the player actually plays before the next stage banner triggers. */
const STAGE_PLAY_MS = 12_500;
/** Length of the "Stage N" countdown break between stages. */
const STAGE_BREAK_MS = 3_000;

/**
 * Each stage maps to a fixed-mode "effective level" the tuning uses while
 * that stage is active. Stage 1 plays like Lv 2 (warmup, no sugar). Stage 9
 * plays like Lv 10 (max fixed). Beyond stage 9 we keep pushing past Lv 10
 * for true endless chaos.
 */
function stageEffectiveLevel(stage: number): number {
  if (stage <= 0) return 2;
  return Math.min(13, 1 + stage);
}

type StageBrief = { title: string; blurb: string };

/** Headline + one-liner shown on the stage-break banner. */
function stageBrief(stage: number): StageBrief {
  const briefs: StageBrief[] = [
    { title: "Warm up", blurb: "Tap plaque and cavities — get a feel for the grid." },
    { title: "Sugar drop", blurb: "Lollipops invade. Don't tap them!" },
    { title: "Faster fingers", blurb: "Spawn rate climbs. Targets fade quicker." },
    { title: "Boom incoming", blurb: "Bombs appear — one tap ends the run." },
    { title: "Tighten up", blurb: "Lifetimes shorten. React or miss." },
    { title: "Double trouble", blurb: "Two targets can land at once now." },
    { title: "Pressure cooker", blurb: "More sugar, more bombs. Stay focused." },
    { title: "Triple threat", blurb: "Three-target spawns possible." },
    { title: "Final chaos", blurb: "Max cadence, max decoys. Survive." },
  ];
  if (stage >= 1 && stage <= briefs.length) {
    return briefs[stage - 1];
  }
  return {
    title: "Beyond the wall",
    blurb: "You've passed every fixed level. Score as long as you can.",
  };
}

const KIND_INFO: Record<
  TargetKind,
  {
    points: number;
    lifeMs: number;
    emoji: string;
    ringColor: string;
    /** Cell tint applied while this target is alive — keeps the grid lively. */
    cellGradient: string;
    cellBorder: string;
    cellGlow: string;
  }
> = {
  plaque: {
    points: 10,
    lifeMs: 1400,
    emoji: "🦠",
    ringColor: "rgba(34,197,94,0.7)",
    cellGradient:
      "linear-gradient(180deg,rgba(187,247,208,0.95),rgba(134,239,172,0.55))",
    cellBorder: "rgba(34,197,94,0.45)",
    cellGlow: "rgba(34,197,94,0.35)",
  },
  cavity: {
    points: 50,
    lifeMs: 800,
    emoji: "✨",
    ringColor: "rgba(234,179,8,0.85)",
    cellGradient:
      "linear-gradient(180deg,rgba(254,243,199,0.97),rgba(252,211,77,0.7))",
    cellBorder: "rgba(234,179,8,0.55)",
    cellGlow: "rgba(234,179,8,0.45)",
  },
  brush: {
    points: 20,
    lifeMs: 1200,
    emoji: "🪥",
    ringColor: "rgba(56,189,248,0.75)",
    cellGradient:
      "linear-gradient(180deg,rgba(186,230,253,0.95),rgba(125,211,252,0.6))",
    cellBorder: "rgba(56,189,248,0.5)",
    cellGlow: "rgba(56,189,248,0.4)",
  },
  sugar: {
    points: -50,
    lifeMs: 1200,
    emoji: "🍭",
    ringColor: "rgba(244,63,94,0.85)",
    cellGradient:
      "linear-gradient(180deg,rgba(254,205,211,0.95),rgba(251,113,133,0.65))",
    cellBorder: "rgba(244,63,94,0.5)",
    cellGlow: "rgba(244,63,94,0.45)",
  },
  // 💣 Bomb — game-ender. Lifetime is intentionally generous so the player
  // has time to see it and AVOID tapping. Visually distinct (deep crimson
  // gradient + wobble animation) so it can't be confused with a regular
  // target.
  bomb: {
    points: 0,
    lifeMs: 1800,
    emoji: "💣",
    ringColor: "rgba(244,63,94,0.95)",
    cellGradient:
      "radial-gradient(circle at 30% 30%, rgba(244,63,94,0.7) 0%, rgba(127,29,29,0.95) 70%)",
    cellBorder: "rgba(252,165,165,0.85)",
    cellGlow: "rgba(244,63,94,0.7)",
  },
};

/**
 * Resting tints used for empty cells — three pastel teals/mints rotated by
 * (row + col) so the grid reads as patterned rather than uniformly white.
 */
const REST_PALETTE: ReadonlyArray<{ bg: string; border: string }> = [
  {
    bg: "linear-gradient(180deg,rgba(207,250,254,0.92),rgba(165,243,252,0.55))",
    border: "rgba(165,243,252,0.55)",
  },
  {
    bg: "linear-gradient(180deg,rgba(220,252,231,0.92),rgba(187,247,208,0.55))",
    border: "rgba(187,247,208,0.55)",
  },
  {
    bg: "linear-gradient(180deg,rgba(224,242,254,0.92),rgba(186,230,253,0.55))",
    border: "rgba(186,230,253,0.55)",
  },
];

function restingTint(cell: number) {
  const row = Math.floor(cell / GRID_COLS);
  const col = cell % GRID_COLS;
  return REST_PALETTE[(row + col) % REST_PALETTE.length];
}

/**
 * Per-level tuning. Level 1 is a chill tutorial-feeling run (no penalties,
 * generous lifetimes, slow spawns). Difficulty climbs in dramatic steps as
 * new mechanics unlock per level:
 *
 *   L1  : plaque + cavity only, slow spawns, long lifetimes      — chill
 *   L2  : + brush spawns                                          — variety
 *   L3  : + sugar bombs (-50 on tap)                              — punish miss-taps
 *   L4  : faster spawns, shorter lifetimes                        — reflexes
 *   L5  : + bombs (game-over on tap)                              — read targets
 *   L6  : smaller lifetime window, more sugar                     — pressure
 *   L7  : rapid spawns                                            — sweaty
 *   L8  : tighter lifetimes, sugar share spikes                   — chaos
 *   L9  : everything faster, more bombs                           — hardcore
 *   L10 : maxed out — minimal lifetime, max decoy share           — expert
 */
function levelTuning(level: number, elapsedSec = 0) {
  // Lv 11 = endless. Starts at Lv 2 (very forgiving — no sugar, no bombs)
  // and climbs roughly one level every 15 seconds. After ~2 minutes you're
  // past the Lv 10 wall and the run becomes a survival exercise.
  // 0s   → Lv 2     (just plaque + cavity + brush)
  // 15s  → Lv 3     (sugar unlocks)
  // 45s  → Lv 5     (bombs unlock — first real danger)
  // 90s  → Lv 8     (double spawn + faster cadence)
  // 150s → Lv 12+   (beyond fixed-level peak)
  const endless = level >= 11;
  const baseLv = endless ? 2 : Math.max(1, Math.min(10, level));
  const escalation = endless ? Math.min(13, elapsedSec / 15) : 0;
  const lv = baseLv + escalation;

  // Per-level fine-tune nudge. Some levels feel a bit too punishing on the
  // linear curve — nudge them softer (>1 multiplier on cadence/lifetime,
  // <1 on decoy shares). Keep this list tight so the overall ramp stays
  // intuitive.
  const ease = !endless && level === 6 ? 1.05 : 1.0;

  // Spawn cadence — Level 1 is generous (900ms), tightens to ~230ms at L10.
  // Floor at 180ms so endless can't push past human reaction time.
  const spawnIntervalMs = Math.max(
    180,
    Math.round((900 - (lv - 1) * 75) * ease),
  );

  // Mechanic gates — features unlock at specific levels.
  const brushUnlocked = lv >= 2;
  const sugarUnlocked = lv >= 3;
  const bombUnlocked = lv >= 5;

  // Cavity shares stay generous (the bonus everyone loves).
  const cavityShare = 0.22 + (lv - 1) * 0.012;
  // Brush share grows slowly after it unlocks.
  const brushShare = brushUnlocked
    ? Math.max(0.06, 0.16 - (lv - 2) * 0.008)
    : 0;
  // Sugar share starts modest at L3 (~12%) and climbs sharply through L10.
  // Capped at 55% so endless mode doesn't drown the grid in lollipops.
  const sugarShare = sugarUnlocked
    ? Math.min(0.55, (0.12 + (lv - 3) * 0.05) / ease)
    : 0;
  // Bomb share — tiny at first, grows with level. Caps so the run stays fair.
  const bombShare = bombUnlocked
    ? Math.min(0.12, (0.03 + (lv - 5) * 0.018) / ease)
    : 0;

  // Lifetime scale — much more generous than before so the player can
  // actually react at higher levels. Even at Lv 10 targets stick around
  // longer than their base lifetime; the challenge comes from cadence +
  // decoys, not impossible reaction windows.
  // Lv 1: 1.7×  Lv 5: 1.38×  Lv 8: 1.16×  Lv 10: 1.02×
  const lifeScale = Math.max(0.95, (1.7 - (lv - 1) * 0.075) * ease);

  // Multi-spawn — pushed later in the curve so it doesn't pile on at Lv 7
  // when the player is still adjusting. Double spawn now starts at L8,
  // triple only at L10. Caps lowered so it never feels overwhelming.
  const doubleSpawnChance = lv >= 8 ? Math.min(0.35, (lv - 7) * 0.15) : 0;
  const tripleSpawnChance = lv >= 10 ? 0.2 : 0;
  // Visual jitter — only at the final fixed level so it stays a "you've
  // earned this challenge" thing, not a wall at L8.
  const jitter = lv >= 10;

  return {
    spawnIntervalMs,
    sugarShare,
    cavityShare,
    brushShare,
    bombShare,
    lifeScale,
    brushUnlocked,
    sugarUnlocked,
    bombUnlocked,
    doubleSpawnChance,
    tripleSpawnChance,
    jitter,
  };
}

function pickKind(tuning: ReturnType<typeof levelTuning>): TargetKind {
  const r = Math.random();
  let acc = tuning.bombShare;
  if (r < acc) return "bomb";
  acc += tuning.sugarShare;
  if (r < acc) return "sugar";
  acc += tuning.cavityShare;
  if (r < acc) return "cavity";
  acc += tuning.brushShare;
  if (r < acc) return "brush";
  return "plaque";
}

export function PlaqueBlasterGame({
  level,
  onFinish,
  onCancel,
  hudSlot,
}: GameProps) {
  void onCancel; // Quit is owned by the parent's Exit button now.
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_MS);
  const [running, setRunning] = useState(true);
  const [targets, setTargets] = useState<SpawnedTarget[]>([]);
  const [floats, setFloats] = useState<
    {
      id: number;
      cell: number;
      text: string;
      color: string;
      size: "lg" | "xl" | "xxl";
    }[]
  >([]);
  // Per-cell animation flags — drive the CSS-keyframe one-shots.
  const [hitCell, setHitCell] = useState<number | null>(null);
  const [shakeCell, setShakeCell] = useState<number | null>(null);
  const [rippleCell, setRippleCell] = useState<{ cell: number; color: string; id: number } | null>(null);
  // When a combo of 3+ gets broken, the previous count is shown briefly so
  // the player feels the loss instead of the HUD silently dropping to 0.
  const [comboLossId, setComboLossId] = useState(0);
  const [comboLossValue, setComboLossValue] = useState(0);
  const [sparkBursts, setSparkBursts] = useState<
    { id: number; cell: number; color: string }[]
  >([]);
  // Bomb explosion overlay (cell + flash) — drives the dramatic game-over.
  const [bombBlast, setBombBlast] = useState<{ cell: number } | null>(null);
  // Total misses this round — counts empty-cell taps AND expired good
  // targets. Hitting MISS_LIMIT ends the run regardless of level.
  const [misses, setMisses] = useState(0);
  const missesRef = useRef(0);

  const startedAtRef = useRef<number>(performance.now());
  const idRef = useRef<number>(0);
  const finishedRef = useRef(false);
  const endless = level >= 11;
  // Active elapsed = total elapsed minus time spent on stage-break overlays.
  // This is what drives both the displayed timer AND the stage / level
  // escalation so 3-second breaks don't count toward the curve.
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  // Stage state — only used in endless mode. activeStage is the current
  // stage number (1, 2, 3, …). showStageBanner gates the 3-second overlay
  // before the new stage's gameplay begins. We mirror showStageBanner into
  // a ref so the rAF loop closure can read the latest value without
  // re-running the effect on every banner toggle.
  const [activeStage, setActiveStage] = useState(1);
  const [showStageBanner, setShowStageBanner] = useState(false);
  const showStageBannerRef = useRef(false);
  useEffect(() => {
    showStageBannerRef.current = showStageBanner;
  }, [showStageBanner]);
  const lastStageRef = useRef(1);
  // We re-tune every couple seconds in endless mode so spawn cadence and
  // lifetime keep tightening as the run goes on. tuningTick increments via
  // an interval and forces the memo to recompute.
  const [tuningTick, setTuningTick] = useState(0);
  useEffect(() => {
    if (!endless) return;
    const id = setInterval(() => setTuningTick((n) => n + 1), 1500);
    return () => clearInterval(id);
  }, [endless]);
  const tuning = useMemo(() => {
    const totalMs = performance.now() - startedAtRef.current;
    const activeMs = totalMs - pausedMsRef.current;
    // Endless mode steps per stage instead of climbing smoothly. The
    // stage's effective level is fed into levelTuning via a synthetic
    // elapsedSec — escalation = (lv - 2) * 15.
    if (endless) {
      const stage = Math.max(1, activeStage);
      const stageLv = stageEffectiveLevel(stage);
      return levelTuning(11, (stageLv - 2) * 15);
    }
    return levelTuning(level, activeMs / 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, tuningTick, endless, activeStage]);

  // popFloat is used by both the rAF loop (for expired-target "missed!"
  // markers) and handleTap (for hit/miss popups), so it has to be declared
  // before the rAF useEffect that references it.
  const popFloat = useCallback(
    (cell: number, text: string, color: string, size: "lg" | "xl" | "xxl" = "lg") => {
      idRef.current += 1;
      const id = idRef.current;
      setFloats((prev) => [...prev, { id, cell, text, color, size }]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    [],
  );

  // addMisses likewise has to be hoisted above the rAF effect that calls
  // it on every expired good target. Bumps the cumulative miss counter
  // and ends the round when it crosses MISS_LIMIT.
  const addMisses = useCallback(
    (count: number) => {
      if (finishedRef.current || count <= 0) return;
      missesRef.current = Math.min(MISS_LIMIT, missesRef.current + count);
      setMisses(missesRef.current);
      if (missesRef.current >= MISS_LIMIT) {
        finishedRef.current = true;
        setRunning(false);
        setTimeout(() => {
          const elapsed = performance.now() - startedAtRef.current;
          onFinish(scoreRef.current, Math.round(elapsed));
        }, 1100);
      }
    },
    [onFinish],
  );

  /* -------------------------------------------------------------------- */
  /* Main RAF loop — timer + lifetime decay                               */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const totalElapsed = performance.now() - startedAtRef.current;
      // Active elapsed excludes time spent on stage-break banners so the
      // game timer doesn't tick during the 3-second pause.
      const activeElapsed = totalElapsed - pausedMsRef.current;
      // In endless we display the playing time (monotonic — always changing
      // so React keeps re-rendering the decay rings). In fixed mode we show
      // the countdown remaining.
      const displayed = endless
        ? activeElapsed
        : Math.max(0, ROUND_DURATION_MS - activeElapsed);
      setTimeLeft(displayed);

      // While the stage-break banner is showing, freeze game logic — no
      // expiration checks, no stage advancement. pauseStartRef + bornAt
      // shifting happens at transition time so we don't need to touch them
      // here.
      if (showStageBannerRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Endless-mode stage transitions: every STAGE_PLAY_MS of active play
      // we bump the stage, freeze the game, and show a 3s banner.
      if (endless) {
        const currentStage =
          Math.floor(activeElapsed / STAGE_PLAY_MS) + 1;
        if (currentStage > lastStageRef.current) {
          lastStageRef.current = currentStage;
          setActiveStage(currentStage);
          // Set the ref synchronously so the spawner setInterval + handleTap
          // see the pause on their very next tick (state update is async).
          showStageBannerRef.current = true;
          pauseStartRef.current = performance.now();
          setShowStageBanner(true);
          setTimeout(() => {
            // Shift target bornAt forward by the pause duration so their
            // decay rings resume from where they were instead of expiring
            // all at once. Also bump pausedMsRef so the game timer didn't
            // count the break.
            if (pauseStartRef.current != null) {
              const pauseDur = performance.now() - pauseStartRef.current;
              pausedMsRef.current += pauseDur;
              for (const t of targetsRef.current) {
                t.bornAt += pauseDur;
              }
              pauseStartRef.current = null;
            }
            showStageBannerRef.current = false;
            setShowStageBanner(false);
          }, STAGE_BREAK_MS);
        }
      }

      // Detect targets that expired this frame. "Good" expirations (plaque,
      // cavity, brush) mean the player failed to tap in time — that breaks
      // the combo and pops a "missed!" indicator on the cell. Sugar/bomb
      // expiring is fine (you successfully avoided it), so we silently drop
      // those.
      const now = performance.now();
      const prev = targetsRef.current;
      const surviving: SpawnedTarget[] = [];
      const missed: SpawnedTarget[] = [];
      for (const t of prev) {
        if (now - t.bornAt < t.lifeMs) {
          surviving.push(t);
        } else if (
          t.kind === "plaque" ||
          t.kind === "cavity" ||
          t.kind === "brush"
        ) {
          missed.push(t);
        }
        // sugar / bomb that expired = silently dropped
      }

      if (surviving.length !== prev.length) {
        setTargets(surviving);
      }

      if (missed.length > 0) {
        // Side-effect after the state update is queued: visual feedback +
        // combo break. comboRef gives us the latest combo without nested
        // setState.
        const currentCombo = comboRef.current;
        if (currentCombo >= 3) {
          setComboLossValue(currentCombo);
          setComboLossId((n) => n + 1);
        }
        setCombo(0);
        for (const t of missed) {
          popFloat(t.cell, "missed!", "rgba(244,63,94,0.85)", "lg");
        }
        // Each expired good target costs a miss toward the 10-miss limit.
        addMisses(missed.length);
      }

      // Endless skips the timer end — the round only finishes on bomb tap
      // (handled in triggerBomb). Use activeElapsed so the round doesn't
      // end prematurely because of paused stage-break time.
      if (!endless && activeElapsed >= ROUND_DURATION_MS) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          setRunning(false);
          // Defer the finish callback to the next tick so React can flush
          // the final score render before the parent unmounts us.
          setTimeout(() => onFinish(scoreRef.current, ROUND_DURATION_MS), 50);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFinish, popFloat, endless, addMisses]);

  // Mirror score into a ref so the raf-loop closure can read the latest.
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  // Same trick for combo + targets — the rAF loop reads them to detect
  // expired targets and break the combo without nested setState calls.
  const comboRef = useRef(combo);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  const targetsRef = useRef<SpawnedTarget[]>([]);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Auto-clear the combo-loss indicator ~900ms after each break so the HUD
  // returns to the live ×0 state. Re-keyed on comboLossId so consecutive
  // breaks each cancel the prior timer and start a fresh 900ms window.
  useEffect(() => {
    if (comboLossId === 0) return;
    const id = setTimeout(() => setComboLossValue(0), 900);
    return () => clearTimeout(id);
  }, [comboLossId]);

  /* -------------------------------------------------------------------- */
  /* Spawner                                                              */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      // Freeze new spawns during the stage-break banner so the player
      // isn't penalized by targets expiring behind the overlay.
      if (showStageBannerRef.current) return;
      setTargets((prev) => {
        // Don't crowd the grid — keep at most 6 live targets so the game
        // stays readable even at high level.
        if (prev.length >= 6) return prev;
        const occupied = new Set(prev.map((t) => t.cell));
        const free: number[] = [];
        for (let i = 0; i < TOTAL_CELLS; i += 1) {
          if (!occupied.has(i)) free.push(i);
        }
        if (free.length === 0) return prev;

        // How many targets to drop on this tick — L7+ rolls for a double
        // spawn, L9+ rolls for triple. Capped by free-cell count.
        let spawnCount = 1;
        if (Math.random() < tuning.tripleSpawnChance) spawnCount = 3;
        else if (Math.random() < tuning.doubleSpawnChance) spawnCount = 2;
        spawnCount = Math.min(spawnCount, free.length, 6 - prev.length);

        // Fisher–Yates pick `spawnCount` distinct cells from free.
        for (let i = free.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [free[i], free[j]] = [free[j], free[i]];
        }
        const cells = free.slice(0, spawnCount);
        const additions: SpawnedTarget[] = cells.map((cell) => {
          idRef.current += 1;
          const kind = pickKind(tuning);
          return {
            id: idRef.current,
            cell,
            kind,
            bornAt: performance.now(),
            lifeMs: Math.round(KIND_INFO[kind].lifeMs * tuning.lifeScale),
          };
        });
        return [...prev, ...additions];
      });
    }, tuning.spawnIntervalMs);
    return () => clearInterval(interval);
  }, [running, tuning]);

  /* -------------------------------------------------------------------- */
  /* Tap handler                                                          */
  /* -------------------------------------------------------------------- */

  const popRipple = useCallback((cell: number, color: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setRippleCell({ cell, color, id });
    setTimeout(() => {
      setRippleCell((prev) => (prev?.id === id ? null : prev));
    }, 600);
  }, []);

  const popSparkBurst = useCallback((cell: number, color: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setSparkBursts((prev) => [...prev, { id, cell, color }]);
    setTimeout(() => {
      setSparkBursts((prev) => prev.filter((s) => s.id !== id));
    }, 700);
  }, []);

  const flashHit = useCallback((cell: number) => {
    setHitCell(cell);
    setTimeout(() => setHitCell((c) => (c === cell ? null : c)), 320);
  }, []);

  const flashShake = useCallback((cell: number) => {
    setShakeCell(cell);
    setTimeout(() => setShakeCell((c) => (c === cell ? null : c)), 320);
  }, []);

  /** Bomb tap — dramatic end. Shows explosion, flashes screen, then ends. */
  const triggerBomb = useCallback(
    (cell: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setBombBlast({ cell });
      setRunning(false);
      // Brief delay so the explosion + flash play before the parent unmounts.
      setTimeout(() => {
        const elapsed = performance.now() - startedAtRef.current;
        onFinish(scoreRef.current, Math.round(elapsed));
      }, 1100);
    },
    [onFinish],
  );

  const handleTap = useCallback(
    (cell: number) => {
      if (!running) return;
      // Ignore taps while the stage-break banner is up so the player can't
      // accidentally miss-tap their combo away behind the overlay.
      if (showStageBannerRef.current) return;
      const hit = targets.find((t) => t.cell === cell);

      if (!hit) {
        // Empty-cell miss — small score penalty, shake the cell, ripple in rose.
        setScore((s) => Math.max(0, s - 5));
        // Broadcast the combo we just lost (when it was >= 3) so the HUD can
        // flash a "Combo broken" indicator for 700ms before the chip drops.
        if (combo >= 3) {
          setComboLossValue(combo);
          setComboLossId((n) => n + 1);
        }
        setCombo(0);
        popFloat(cell, "−5", "rgba(244,63,94,0.95)", "lg");
        if (combo >= 3) {
          popFloat(
            cell,
            `Combo broken (×${combo})`,
            "rgba(244,63,94,0.95)",
            "xl",
          );
        }
        popRipple(cell, "rgba(244,63,94,0.7)");
        flashShake(cell);
        // Empty taps cost score + combo but do NOT count toward the
        // 10-miss limit — only expired good targets do.
        return;
      }

      const info = KIND_INFO[hit.kind];
      setTargets((prev) => prev.filter((t) => t.id !== hit.id));

      if (hit.kind === "bomb") {
        // GAME OVER — visual fireworks + finish.
        popRipple(cell, "rgba(244,63,94,0.95)");
        triggerBomb(cell);
        return;
      }

      if (hit.kind === "sugar") {
        setScore((s) => Math.max(0, s + info.points));
        if (combo >= 3) {
          setComboLossValue(combo);
          setComboLossId((n) => n + 1);
        }
        setCombo(0);
        popFloat(cell, `${info.points}`, "rgba(244,63,94,0.95)", "xl");
        popRipple(cell, "rgba(244,63,94,0.85)");
        flashShake(cell);
        return;
      }

      // Good hit — combo bumps; every 5 in a row multiplies by 1.5×.
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
      const multiplier = nextCombo >= 5 ? 1.5 : 1;
      const earned = Math.round(info.points * multiplier);
      setScore((s) => s + earned);
      // Cavity hits and combo-multipliers get the biggest popup.
      const size: "lg" | "xl" | "xxl" =
        multiplier > 1 || hit.kind === "cavity" ? "xxl" : "xl";
      popFloat(
        cell,
        multiplier > 1 ? `+${earned} ×${nextCombo}` : `+${earned}`,
        info.ringColor,
        size,
      );
      popRipple(cell, info.ringColor);
      popSparkBurst(cell, info.ringColor);
      flashHit(cell);
    },
    [combo, flashHit, flashShake, popFloat, popRipple, popSparkBurst, running, targets, triggerBomb],
  );

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  const seconds = Math.ceil(timeLeft / 1000);
  const urgent = seconds <= 10;
  // While a combo-loss is fresh (comboLossValue > 0), show the broken combo
  // in red instead of the current ×0 — sells the punishment without
  // changing the underlying state.
  const comboLossActive = comboLossValue > 0;
  // Re-key the chip so the pulse animation re-fires every time a combo breaks.
  const comboKey = comboLossActive ? `loss-${comboLossId}` : `live-${combo}`;
  const comboValue = comboLossActive
    ? `×${comboLossValue} broken`
    : `×${combo}`;
  const comboVariant = comboLossActive ? "danger" : "combo";

  const missesLeft = MISS_LIMIT - misses;
  const hud = (
    <>
      <HudChip label="Score" value={score} variant="score" />
      <HudChip
        key={comboKey}
        label={comboLossActive ? "Lost" : "Combo"}
        value={comboValue}
        variant={comboVariant}
        urgent={comboLossActive || combo >= 5}
      />
      <HudChip
        label="Misses"
        value={`${misses}/${MISS_LIMIT}`}
        variant={
          missesLeft <= 2 ? "danger" : missesLeft <= 4 ? "lives" : "neutral"
        }
        urgent={missesLeft <= 2}
      />
      <HudChip
        label="Level"
        value={endless ? "∞" : level}
        variant="level"
      />
      <HudChip
        label={endless ? "Endless" : "Time"}
        value={endless ? `${Math.floor((performance.now() - startedAtRef.current) / 1000)}s` : `${seconds}s`}
        variant="timer"
        urgent={!endless && urgent}
      />
    </>
  );

  return (
    <div className="flex h-full w-full flex-col gap-3">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      <div className="relative flex w-full flex-1 items-center justify-center rounded-[24px] border border-white/14 bg-[linear-gradient(180deg,rgba(14,116,144,0.32),rgba(13,148,136,0.18))] p-3 shadow-[0_28px_70px_rgba(7,18,34,0.28)] sm:p-4">
        <div
          className="grid select-none gap-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
            aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
            // Fit-to-container without scrolling: drive sizing from height
            // (auto width via aspect-ratio) and clamp with max-width 100%.
            // This way the grid never exceeds the parent's height — the
            // bottom row stays inside the viewport even on tall screens.
            height: "100%",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          {Array.from({ length: TOTAL_CELLS }).map((_, cell) => {
            const target = targets.find((t) => t.cell === cell);
            const float = floats.find((f) => f.cell === cell);
            // During a stage break, freeze the "current time" to when the
            // pause started so decay rings don't keep draining behind the
            // overlay. On resume, bornAt is shifted forward by pauseDur
            // (see the stage-transition setTimeout) so the rings continue
            // smoothly from where they left off.
            const nowForAge =
              pauseStartRef.current ?? performance.now();
            const age = target
              ? (nowForAge - target.bornAt) / target.lifeMs
              : 0;
            const ringPercent = Math.max(0, Math.min(100, (1 - age) * 100));
            const rest = restingTint(cell);
            const kindInfo = target ? KIND_INFO[target.kind] : null;
            const isHit = hitCell === cell;
            const isShaking = shakeCell === cell;
            const showRipple = rippleCell?.cell === cell;
            const sparkBurst = sparkBursts.find((s) => s.cell === cell);
            const isBombHere = bombBlast?.cell === cell;
            return (
              <button
                key={cell}
                type="button"
                onClick={() => handleTap(cell)}
                className={`group relative flex items-center justify-center overflow-hidden rounded-[22px] border transition-all duration-200 ease-out hover:scale-[1.03] active:scale-95 ${
                  isHit ? "denty-blast-hit" : ""
                } ${isShaking ? "denty-blast-shake" : ""}`}
                style={{
                  background: kindInfo ? kindInfo.cellGradient : rest.bg,
                  borderColor: kindInfo ? kindInfo.cellBorder : rest.border,
                  boxShadow: kindInfo
                    ? `0 14px 32px ${kindInfo.cellGlow}, inset 0 0 0 1px rgba(255,255,255,0.45)`
                    : "0 12px 30px rgba(7,18,34,0.18), inset 0 0 0 1px rgba(255,255,255,0.35)",
                }}
                aria-label={target ? `Tap ${target.kind}` : "Empty tooth"}
              >
                {/* Tooth silhouette — pearl highlight on top of the cell tint */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-3 rounded-[18px] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.85),rgba(255,255,255,0.0)_70%)]"
                />
                {target ? (
                  <>
                    {/* Decay ring */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-2 rounded-full"
                      style={{
                        background: `conic-gradient(${KIND_INFO[target.kind].ringColor} ${ringPercent}%, rgba(255,255,255,0) ${ringPercent}%)`,
                        mask: "radial-gradient(circle, transparent 58%, black 60%)",
                        WebkitMask:
                          "radial-gradient(circle, transparent 58%, black 60%)",
                      }}
                    />
                    {/* Bomb gets a wobble animation; other kinds use the standard pop.
                        At Level 8+ the jitter class adds a constant wiggle so
                        the eye can't lock to one position. */}
                    <span
                      key={target.id}
                      className={`relative z-10 text-4xl drop-shadow-[0_4px_8px_rgba(7,18,34,0.3)] sm:text-5xl md:text-6xl ${
                        target.kind === "bomb"
                          ? "denty-blast-bomb"
                          : "denty-blast-spawn"
                      } ${tuning.jitter ? "denty-blast-jitter" : ""}`}
                    >
                      {KIND_INFO[target.kind].emoji}
                    </span>
                  </>
                ) : null}

                {/* Tap ripple — expanding ring from the cell center. */}
                {showRipple ? (
                  <span
                    aria-hidden
                    key={rippleCell.id}
                    className="denty-blast-ripple"
                    style={{ color: rippleCell.color }}
                  />
                ) : null}

                {/* Spark burst — 6 mini sparks fly outward from cell center. */}
                {sparkBurst ? (
                  <span
                    key={sparkBurst.id}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10"
                  >
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i / 8) * Math.PI * 2;
                      const radius = 38;
                      const sx = Math.cos(angle) * radius;
                      const sy = Math.sin(angle) * radius;
                      return (
                        <span
                          key={i}
                          aria-hidden
                          className="absolute left-1/2 top-1/2"
                          style={
                            {
                              "--sx": `${sx}px`,
                              "--sy": `${sy}px`,
                              width: 10,
                              height: 10,
                              borderRadius: 9999,
                              background: sparkBurst.color,
                              boxShadow: `0 0 14px ${sparkBurst.color}`,
                              animation:
                                "denty-spark-out 650ms ease-out forwards",
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </span>
                ) : null}

                {/* Bomb explosion overlay — only on the bomb's cell. */}
                {isBombHere ? (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-24 w-24 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(252,211,77,0.95) 30%, rgba(244,63,94,0.85) 60%, rgba(127,29,29,0) 100%)",
                        animation: "denty-blast-boom 900ms ease-out forwards",
                      }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute z-30 text-6xl"
                      style={{ animation: "denty-blast-boom 900ms ease-out forwards" }}
                    >
                      💥
                    </span>
                  </>
                ) : null}

                {/* Floating score popup — bigger, arcs up, fades out. */}
                {float ? (
                  <span
                    key={float.id}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-30 font-extrabold tabular-nums drop-shadow-[0_4px_14px_rgba(7,18,34,0.55)]"
                    style={{
                      color: float.color,
                      fontSize:
                        float.size === "xxl"
                          ? "clamp(1.75rem, 3.4vw, 2.75rem)"
                          : float.size === "xl"
                            ? "clamp(1.4rem, 2.6vw, 2.1rem)"
                            : "clamp(1.1rem, 1.9vw, 1.5rem)",
                      textShadow:
                        "0 0 14px currentColor, 0 2px 6px rgba(0,0,0,0.45)",
                      WebkitTextStroke: "1px rgba(255,255,255,0.6)",
                      animation:
                        "denty-blast-pop 900ms cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
                    }}
                  >
                    {float.text}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Full-card flash overlay when the bomb detonates. */}
        {bombBlast ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.85), rgba(244,63,94,0.45) 40%, transparent 75%)",
              animation: "denty-blast-flash 1000ms ease-out forwards",
            }}
          />
        ) : null}

        {/* GAME OVER banner on bomb. */}
        {bombBlast ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-[24px] border border-rose-200/60 bg-[linear-gradient(135deg,rgba(244,63,94,0.92),rgba(127,29,29,0.92))] px-6 py-4 text-center text-white shadow-[0_28px_60px_rgba(127,29,29,0.55)] sm:px-10 sm:py-6"
              style={{
                animation:
                  "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-rose-100/85">
                Bomb!
              </p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Game Over
              </p>
              <p className="mt-1 text-sm text-rose-50/90">
                Final score{" "}
                <span className="font-bold tabular-nums">{score}</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* GAME OVER banner when the miss limit is hit (10 missed clicks /
            expirations). Distinct from the bomb banner — no fireball, more
            of a "too sloppy" feel. */}
        {misses >= MISS_LIMIT && !bombBlast ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-[24px] border border-amber-200/60 bg-[linear-gradient(135deg,rgba(217,119,6,0.92),rgba(120,53,15,0.92))] px-6 py-4 text-center text-white shadow-[0_28px_60px_rgba(120,53,15,0.55)] sm:px-10 sm:py-6"
              style={{
                animation:
                  "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-amber-100/85">
                Too many misses
              </p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Game Over
              </p>
              <p className="mt-1 text-sm text-amber-50/90">
                Final score{" "}
                <span className="font-bold tabular-nums">{score}</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* Endless-mode stage-break banner — pauses gameplay for 3 seconds
            and announces the next stage with a short description. */}
        {showStageBanner && endless ? (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[rgba(4,10,22,0.55)] backdrop-blur-[8px]">
            <div
              key={activeStage}
              className="w-full max-w-xl overflow-hidden rounded-[26px] border border-cyan-200/30 bg-[linear-gradient(135deg,rgba(15,32,56,0.96),rgba(8,18,38,0.96))] px-6 py-6 text-center text-white shadow-[0_30px_80px_rgba(2,6,18,0.55)] sm:px-10 sm:py-8"
              style={{
                animation:
                  "denty-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">
                ♾️ Endless · Stage {activeStage}
              </p>
              <p
                className="mt-2 bg-[linear-gradient(135deg,#bef264,#5eead4,#a5b4fc)] bg-clip-text text-5xl font-extrabold leading-none text-transparent sm:text-6xl"
                style={{
                  animation:
                    "denty-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
                }}
              >
                {stageBrief(activeStage).title}
              </p>
              <p className="mt-3 text-sm text-white/85">
                {stageBrief(activeStage).blurb}
              </p>
              {/* Countdown bar — animates from full to empty over 3s so the
                  player feels the break ticking down. */}
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/12">
                <span
                  aria-hidden
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#bef264,#5eead4)]"
                  style={{
                    animation: "denty-stage-bar 3000ms linear forwards",
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-[11px] text-white/70">
        <span>
          <span aria-hidden>🦠</span> +10 &nbsp; <span aria-hidden>✨</span> +50 &nbsp;{" "}
          <span aria-hidden>🪥</span> +20 &nbsp; <span aria-hidden>🍭</span> −50 &nbsp;{" "}
          <span aria-hidden className="text-rose-200">💣</span>{" "}
          <span className="text-rose-200/90">game over</span> &nbsp;·&nbsp;{" "}
          <span className="text-amber-100/90">
            {MISS_LIMIT} expired targets = game over
          </span>
        </span>
        <span>Best combo: ×{bestCombo}</span>
      </div>
    </div>
  );
}
