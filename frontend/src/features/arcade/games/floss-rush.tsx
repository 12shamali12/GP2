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

function levelTuning(level: number) {
  const lv = Math.max(1, Math.min(10, level));
  return {
    // px / second
    baseSpeed: 280 + (lv - 1) * 32, // 280 → 568
    spawnIntervalMs: Math.max(380, 950 - (lv - 1) * 65), // 950 → 380
    sugarShare: 0.16 + (lv - 1) * 0.025, // 16% → 38%
    goldShare: Math.max(0.04, 0.12 - (lv - 1) * 0.008),
  };
}

type GameProps = {
  level: number;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  /** Top-bar portal target for the focus-mode HUD. */
  hudSlot?: HTMLElement | null;
};

export function FlossRushGame({
  level,
  onFinish,
  onCancel,
  hudSlot,
}: GameProps) {
  void onCancel; // Quit is owned by the parent's Exit button.
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

  const itemsRef = useRef<Item[]>([]);
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

    const tuning = levelTuning(level);

    const tick = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;
      // Speed ramps with time inside the round so long runs get harder.
      const elapsedSec = (now - startedAtRef.current) / 1000;
      const speed = tuning.baseSpeed + Math.min(220, elapsedSec * 8);

      // Spawn
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
      }

      // Advance items + collision
      let collided = false;
      const next: Item[] = [];
      for (const it of itemsRef.current) {
        const nx = it.x - speed * dt;
        if (nx < -40) continue;
        // Collision if same lane and the item's x crossed the player's x.
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
            // Gold tooth → biggest celebration; floss/water still substantial.
            const size: "xl" | "xxl" = it.kind === "gold" ? "xxl" : "xl";
            const color =
              it.kind === "gold"
                ? "rgba(252,211,77,0.98)"
                : "rgba(94,234,212,0.98)";
            popFloat(it.lane, PLAYER_X, `+${info.points}`, color, size);
          }
          continue;
        }
        next.push({ ...it, x: nx });
      }
      itemsRef.current = next;
      setItems(next);

      // Distance accrual (metres ≈ speed * dt / 12 just to keep number nice)
      distanceRef.current += (speed * dt) / 12;
      setDistance(distanceRef.current);

      if (collided) {
        setCrashed(true);
        finish();
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    lastFrameRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, level, popFloat, finish]);

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  const total = score + Math.floor(distance);

  const hud = (
    <>
      <HudChip label="Score" value={total.toLocaleString()} variant="score" />
      <HudChip
        label="Distance"
        value={`${Math.floor(distance)}m`}
        variant="combo"
      />
      <HudChip label="Level" value={level} variant="level" />
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

        {/* Items */}
        {items.map((it) => {
          const info = ITEM_INFO[it.kind];
          const top = (it.lane + 0.5) * (100 / LANES);
          return (
            <div
              key={it.id}
              aria-hidden
              className="absolute"
              style={{
                left: it.x - ITEM_RADIUS,
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
              className="rounded-[24px] border border-amber-200/40 bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(8,47,73,0.92))] px-7 py-5 text-center text-white shadow-[0_30px_80px_rgba(7,18,34,0.55)]"
              style={{
                animation:
                  "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-amber-200/85">
                {crashed ? "Crashed into sugar" : "Run complete"}
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
