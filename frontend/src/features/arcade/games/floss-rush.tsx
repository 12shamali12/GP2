"use client";

/**
 * Floss Rush — three-lane endless runner.
 *
 * The toothbrush sprite is stuck on the left edge of the play area. Lanes
 * scroll right-to-left and items (collectibles + obstacles) spawn off-screen
 * and stream toward the player. The player swaps lanes with W/S, ArrowUp/
 * ArrowDown, or tap on the upper/lower half of the play area.
 *
 *   floss 🧵      → +15
 *   water 💧      → +10
 *   gold tooth 🦷 → +50 rare bonus
 *   sugar 🍬      → game over on contact
 *
 * Score = collected points + distance bonus (1 per metre). Speed scales with
 * the patient's streak level AND elapsed time so a long run gets brutal.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HudChip } from "@/features/arcade/components/hud-chip";
import { useTranslation } from "@/features/i18n/language-provider";

const LANES = 3;
const LANE_NAMES = ["upper", "middle", "lower"] as const;
const PLAYER_X = 80; // px from left edge
const ITEM_RADIUS = 28;

type ItemKind = "floss" | "water" | "gold" | "sugar";

type Item = {
  id: number;
  lane: number;
  x: number; // px from left edge of play area
  kind: ItemKind;
};

const ITEM_INFO: Record<
  ItemKind,
  { points: number; emoji: string; deadly: boolean }
> = {
  floss: { points: 15, emoji: "🧵", deadly: false },
  water: { points: 10, emoji: "💧", deadly: false },
  gold: { points: 50, emoji: "🦷", deadly: false },
  sugar: { points: 0, emoji: "🍬", deadly: true },
};

function levelTuning(level: number, elapsedSec = 0) {
  // Lv 11 = endless. Starts at Lv 2 (slow scroll, low sugar) and climbs
  // about one level every 15 seconds:
  //   0s  → Lv 2     (calm scroll, easy collectibles)
  //   30s → Lv 4
  //   60s → Lv 6
  //   90s → Lv 8
  //   120s → Lv 10   (Lv 10-equivalent intensity)
  //   180s → Lv 14   (beyond fixed-level peak)
  const endless = level >= 11;
  const baseLv = endless ? 2 : Math.max(1, Math.min(10, level));
  const escalation = endless ? Math.min(12, elapsedSec / 15) : 0;
  const lv = baseLv + escalation;
  // Eased: slower scroll, less sugar, more gold. One-shot game-over on
  // sugar is already punishing — keep the spawn density humane.
  return {
    // Slower base + tighter cap so endless stays controllable.
    baseSpeed: Math.min(680, 250 + (lv - 1) * 26),
    spawnIntervalMs: Math.max(320, 1000 - (lv - 1) * 60),
    // Sugar grows more gently — Lv 10 used to be 38%, now 26%.
    sugarShare: Math.min(0.4, 0.12 + (lv - 1) * 0.016),
    // A bit more gold so collecting feels rewarding.
    goldShare: Math.max(0.06, 0.14 - (lv - 1) * 0.007),
  };
}

type GameProps = {
  level: number;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  /** Top-bar portal target for the focus-mode HUD. */
  hudSlot?: HTMLElement | null;
  /**
   * Score that, if crossed mid-run, ends the round with a "level cleared"
   * celebration. Null when there's no extra unlock at stake (level 11 or
   * the player's already past this level's threshold).
   */
  winThreshold?: number | null;
};

export function FlossRushGame({
  level,
  onFinish,
  onCancel,
  hudSlot,
  winThreshold,
}: GameProps) {
  void onCancel; // Quit is owned by the parent's Exit button.
  const t = useTranslation();
  const playAreaRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(true);
  const [floats, setFloats] = useState<
    {
      id: number;
      lane: number;
      x: number;
      text: string;
      color: string;
      size: "lg" | "xl" | "xxl";
    }[]
  >([]);
  // Lane glow — when the player switches lanes, the destination lane briefly
  // pulses so the move is visually telegraphed.
  const [laneGlowId, setLaneGlowId] = useState(0);
  // Crash flash — pulses red when sugar is hit (sells the game-over moment).
  const [crashed, setCrashed] = useState(false);
  // Level-cleared flash — fires when total crosses the unlock threshold.
  // Mutually exclusive with `crashed` (the rAF loop returns after either).
  const [won, setWon] = useState(false);

  const itemsRef = useRef<Item[]>([]);
  // DOM refs per item — used to apply translateX every frame without going
  // through React state (which was the source of the laggy motion).
  const itemNodesRef = useRef(new Map<number, HTMLDivElement | null>());
  const laneRef = useRef(lane);
  const startedAtRef = useRef<number>(performance.now());
  const lastFrameRef = useRef<number>(performance.now());
  const lastSpawnRef = useRef<number>(performance.now());
  const idRef = useRef(0);
  const scoreRef = useRef(0);
  const distanceRef = useRef(0);
  const widthRef = useRef(640);
  const finishedRef = useRef(false);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    const total = scoreRef.current + Math.floor(distanceRef.current);
    const duration = performance.now() - startedAtRef.current;
    setTimeout(() => onFinish(total, Math.round(duration)), 80);
  }, [onFinish]);

  /* -------------------------------------------------------------------- */
  /* Resize                                                               */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    const update = () => {
      if (playAreaRef.current) {
        widthRef.current = playAreaRef.current.clientWidth;
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* -------------------------------------------------------------------- */
  /* Input                                                                */
  /* -------------------------------------------------------------------- */

  // Bump the lane glow each time the player changes lanes so the destination
  // briefly pulses with the brand teal.
  const bumpLaneGlow = useCallback(() => {
    setLaneGlowId((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        setLane((l) => {
          const next = Math.max(0, l - 1);
          if (next !== l) bumpLaneGlow();
          return next;
        });
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        setLane((l) => {
          const next = Math.min(LANES - 1, l + 1);
          if (next !== l) bumpLaneGlow();
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, bumpLaneGlow]);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!running) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      // Top third → upper, middle third → middle, bottom third → lower.
      const targetLane = relY < 0.33 ? 0 : relY < 0.67 ? 1 : 2;
      setLane((l) => {
        if (l !== targetLane) bumpLaneGlow();
        return targetLane;
      });
    },
    [running, bumpLaneGlow],
  );

  const popFloat = useCallback(
    (
      laneIdx: number,
      x: number,
      text: string,
      color: string,
      size: "lg" | "xl" | "xxl" = "xl",
    ) => {
      idRef.current += 1;
      const id = idRef.current;
      setFloats((prev) => [
        ...prev,
        { id, lane: laneIdx, x, text, color, size },
      ]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    [],
  );

  /* -------------------------------------------------------------------- */
  /* Main loop                                                            */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (!running) return;
    let raf = 0;

    const tick = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;
      // Speed ramps with time inside the round so long runs get harder. In
      // endless (Lv 11) the tuning itself also escalates with time.
      const elapsedSec = (now - startedAtRef.current) / 1000;
      const tuning = levelTuning(level, elapsedSec);
      // Softer time-boost so long runs ramp up gradually instead of
      // becoming impossible after 30 seconds.
      const speed = tuning.baseSpeed + Math.min(140, elapsedSec * 4);

      // Spawn — adds to membership, requires a setItems call.
      let membershipChanged = false;
      if (now - lastSpawnRef.current > tuning.spawnIntervalMs) {
        lastSpawnRef.current = now;
        const r = Math.random();
        let kind: ItemKind;
        if (r < tuning.sugarShare) kind = "sugar";
        else if (r < tuning.sugarShare + tuning.goldShare) kind = "gold";
        else kind = Math.random() < 0.55 ? "floss" : "water";
        idRef.current += 1;
        const newItem: Item = {
          id: idRef.current,
          lane: Math.floor(Math.random() * LANES),
          x: widthRef.current + 40,
          kind,
        };
        itemsRef.current = [...itemsRef.current, newItem];
        membershipChanged = true;
      }

      // Advance items + collision. Position updates happen in-place on
      // itemsRef + via direct DOM transform mutation — NO setItems per frame.
      let collided = false;
      const next: Item[] = [];
      for (const it of itemsRef.current) {
        const nx = it.x - speed * dt;
        if (nx < -40) {
          membershipChanged = true;
          continue;
        }
        if (
          it.lane === laneRef.current &&
          it.x > PLAYER_X &&
          nx <= PLAYER_X + ITEM_RADIUS
        ) {
          const info = ITEM_INFO[it.kind];
          if (info.deadly) {
            collided = true;
            popFloat(it.lane, PLAYER_X, "💥", "rgba(244,63,94,0.95)", "xxl");
          } else {
            scoreRef.current += info.points;
            setScore(scoreRef.current);
            const size: "xl" | "xxl" = it.kind === "gold" ? "xxl" : "xl";
            const color =
              it.kind === "gold"
                ? "rgba(252,211,77,0.98)"
                : "rgba(94,234,212,0.98)";
            popFloat(it.lane, PLAYER_X, `+${info.points}`, color, size);
          }
          membershipChanged = true;
          continue;
        }
        it.x = nx;
        next.push(it);
        // Direct DOM transform update — bypasses React state entirely so
        // motion stays at 60fps even with many items on screen.
        const node = itemNodesRef.current.get(it.id);
        if (node) {
          node.style.transform = `translate3d(${nx - ITEM_RADIUS}px, 0, 0)`;
        }
      }
      itemsRef.current = next;
      if (membershipChanged) setItems(next);

      // Distance accrual. Throttle to integer increments so React only
      // re-renders the HUD when the displayed number actually changes.
      distanceRef.current += (speed * dt) / 12;
      const floored = Math.floor(distanceRef.current);
      if (floored !== Math.floor(distance)) setDistance(distanceRef.current);

      if (collided) {
        setCrashed(true);
        finish();
        return;
      }

      // Threshold cutoff — once total clears the per-level unlock target,
      // end the run early so the player gets the "level cleared!" payoff
      // instead of being forced to keep going until they touch sugar.
      if (winThreshold != null) {
        const total = scoreRef.current + Math.floor(distanceRef.current);
        if (total >= winThreshold) {
          setWon(true);
          finish();
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    lastFrameRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, level, popFloat, finish, winThreshold]);

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  const total = score + Math.floor(distance);

  const hud = (
    <>
      <HudChip
        label={t("arcade.hud.score")}
        value={total.toLocaleString()}
        variant="score"
      />
      <HudChip
        label={t("arcade.hud.distance")}
        value={`${Math.floor(distance)}m`}
        variant="combo"
      />
      <HudChip label={t("arcade.hud.level")} value={level} variant="level" />
    </>
  );

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      <div
        ref={playAreaRef}
        onPointerDown={handlePointer}
        className="relative w-full select-none overflow-hidden rounded-[24px] border border-white/14 bg-[linear-gradient(180deg,rgba(8,47,73,0.92),rgba(15,118,110,0.85))] shadow-[0_28px_70px_rgba(7,18,34,0.32)]"
        style={{
          aspectRatio: "16 / 10",
          maxHeight: "100%",
          touchAction: "none",
        }}
      >
        {/* Lane dividers */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden
            className="absolute left-0 right-0 border-t border-dashed border-white/14"
            style={{ top: `${(i * 100) / LANES}%` }}
          />
        ))}

        {/* Active-lane glow — soft teal stripe behind the toothbrush. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0"
          style={{
            top: `${(lane * 100) / LANES}%`,
            height: `${100 / LANES}%`,
            background:
              "linear-gradient(90deg, rgba(94,234,212,0.32) 0%, rgba(94,234,212,0.08) 60%, transparent 100%)",
            transition: "top 120ms ease-out",
          }}
        />

        {/* Lane-switch flash — re-keyed so the animation fires each switch. */}
        <span
          key={`flash-${laneGlowId}`}
          aria-hidden
          className="pointer-events-none absolute left-0"
          style={{
            top: `${(lane * 100) / LANES}%`,
            height: `${100 / LANES}%`,
            width: "200px",
            background:
              "linear-gradient(90deg, rgba(94,234,212,0.85), transparent 100%)",
            animation:
              laneGlowId > 0
                ? "denty-blast-flash 450ms ease-out forwards"
                : undefined,
          }}
        />

        {/* Animated speedlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 6px, transparent 6px 36px)",
            animation: "denty-speedlines 0.4s linear infinite",
          }}
        />

        {/* Player */}
        <div
          aria-hidden
          className="absolute z-10"
          style={{
            left: PLAYER_X - 28,
            top: `calc(${(lane + 0.5) * (100 / LANES)}% - 30px)`,
            transition: "top 120ms ease-out",
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(186,230,253,0.7))] text-4xl shadow-[0_10px_24px_rgba(7,18,34,0.45)]"
            style={{
              boxShadow:
                "0 0 0 3px rgba(94,234,212,0.45), 0 10px 24px rgba(7,18,34,0.5), 0 0 28px rgba(94,234,212,0.55)",
            }}
          >
            🪥
          </div>
        </div>

        {/* Items — positioned at left:0 then translated via DOM ref per
            frame from the rAF loop, so scrolling stays at 60fps without
            forcing React to re-render every tick. */}
        {items.map((it) => {
          const info = ITEM_INFO[it.kind];
          const top = (it.lane + 0.5) * (100 / LANES);
          return (
            <div
              key={it.id}
              aria-hidden
              ref={(node) => {
                if (node) {
                  itemNodesRef.current.set(it.id, node);
                  // Apply the initial position synchronously so the item
                  // doesn't flash at left:0 before the next rAF tick.
                  node.style.transform = `translate3d(${it.x - ITEM_RADIUS}px, 0, 0)`;
                } else {
                  itemNodesRef.current.delete(it.id);
                }
              }}
              className="absolute will-change-transform"
              style={{
                left: 0,
                top: `calc(${top}% - ${ITEM_RADIUS}px)`,
              }}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-[0_6px_14px_rgba(7,18,34,0.4)] ${
                  info.deadly
                    ? "bg-[radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.95),rgba(190,18,60,0.7))] denty-blast-bomb"
                    : it.kind === "gold"
                      ? "bg-[radial-gradient(circle_at_30%_30%,rgba(252,211,77,0.95),rgba(234,179,8,0.7))]"
                      : "bg-[radial-gradient(circle_at_30%_30%,rgba(186,230,253,0.85),rgba(94,234,212,0.5))]"
                }`}
                style={
                  it.kind === "gold"
                    ? {
                        boxShadow:
                          "0 0 0 2px rgba(252,211,77,0.6), 0 0 24px rgba(252,211,77,0.55)",
                      }
                    : undefined
                }
              >
                {info.emoji}
              </div>
            </div>
          );
        })}

        {/* Floating score popups — bigger, arc-up animation, color-coded. */}
        {floats.map((f) => (
          <span
            key={f.id}
            aria-hidden
            className="pointer-events-none absolute z-20 font-extrabold tabular-nums drop-shadow-[0_4px_14px_rgba(7,18,34,0.55)]"
            style={{
              left: f.x + 30,
              top: `calc(${(f.lane + 0.5) * (100 / LANES)}% - 30px)`,
              color: f.color,
              fontSize:
                f.size === "xxl"
                  ? "clamp(1.75rem, 3.4vw, 2.75rem)"
                  : f.size === "xl"
                    ? "clamp(1.4rem, 2.6vw, 2.1rem)"
                    : "clamp(1.1rem, 1.9vw, 1.5rem)",
              textShadow:
                "0 0 14px currentColor, 0 2px 6px rgba(0,0,0,0.5)",
              WebkitTextStroke: "1px rgba(255,255,255,0.55)",
              animation:
                "denty-blast-pop 900ms cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
            }}
          >
            {f.text}
          </span>
        ))}

        {/* Crash flash overlay when sugar is hit. */}
        {crashed ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.7), rgba(244,63,94,0.55) 35%, transparent 75%)",
              animation: "denty-blast-flash 1000ms ease-out forwards",
            }}
          />
        ) : null}

        {!running ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(6,20,31,0.55)] backdrop-blur-[6px]">
            <div
              className={`rounded-[24px] border px-7 py-5 text-center text-white shadow-[0_30px_80px_rgba(7,18,34,0.55)] ${
                won
                  ? "border-emerald-200/60 bg-[linear-gradient(135deg,rgba(5,150,105,0.92),rgba(13,148,136,0.92))]"
                  : "border-amber-200/40 bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(8,47,73,0.92))]"
              }`}
              style={{
                animation:
                  "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.32em] ${
                  won ? "text-emerald-100/90" : "text-amber-200/85"
                }`}
              >
                {won
                  ? "Level cleared!"
                  : crashed
                    ? "Crashed into sugar"
                    : "Run complete"}
              </p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl">
                {total.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-white/80">
                {Math.floor(distance)} m · {score} pts collected
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="px-1 text-[11px] text-white/70">
        Swap lanes with arrow keys / WS, or tap upper/middle/lower areas.
        Collect 🧵 / 💧 / 🦷 for points. Hit 🍬 sugar and the run is over.
      </p>

      <style jsx>{`
        @keyframes denty-speedlines {
          to {
            transform: translateX(-36px);
          }
        }
      `}</style>
    </div>
  );
}
