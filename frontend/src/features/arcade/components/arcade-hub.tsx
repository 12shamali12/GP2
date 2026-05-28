"use client";

/**
 * Patient arcade hub — landing page for the three competitive games.
 *
 * Shows a card per game with the patient's best score, current streak, and
 * the level the next attempt will be played at. Clicking a card swaps the
 * hub for the active game; when the game finishes the score gets POSTed to
 * /arcade/score and we show a celebration screen.
 *
 * Once-a-day enforcement is server-side; this surface just renders the lock
 * state so the patient can't accidentally start a game they've already
 * played today (the backend will 409 if they bypass us somehow).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getArcadeToday,
  submitArcadeScore,
  type ArcadeGameType,
  type ArcadeTodayEntry,
  type SubmitArcadeScoreResponse,
} from "@/features/arcade/services/arcade-api";
import { PlaqueBlasterGame } from "@/features/arcade/games/plaque-blaster";
import { ToothDefenderGame } from "@/features/arcade/games/tooth-defender";
import { FlossRushGame } from "@/features/arcade/games/floss-rush";
import { QuitConfirmModal } from "@/features/arcade/components/quit-confirm-modal";
import { ArcadeIntroCard } from "@/features/arcade/components/arcade-intro-card";

const GAME_META: Record<
  ArcadeGameType,
  {
    label: string;
    tagline: string;
    description: string;
    emoji: string;
    gradient: string;
    accent: string;
  }
> = {
  PLAQUE_BLASTER: {
    label: "Plaque Blaster",
    tagline: "30 seconds. Tap fast. Don't bite the sugar.",
    description:
      "A 5×3 grid of teeth. Plaque, gold cavities, brushes and sugar bombs spawn — tap to score, ignore the candy. Chain hits for combo multipliers.",
    emoji: "🦷",
    gradient:
      "linear-gradient(135deg,rgba(14,116,144,0.95),rgba(13,148,136,0.7))",
    accent: "rgba(94,234,212,0.95)",
  },
  TOOTH_DEFENDER: {
    label: "Tooth Defender 3D",
    tagline: "Three lives. Endless bacteria.",
    description:
      "A 3D scene. Click bacteria as they swarm your molar. Tougher waves at higher levels — first-shot kills score a bonus. Three lives, then it's over.",
    emoji: "🛡️",
    gradient:
      "linear-gradient(135deg,rgba(76,29,149,0.95),rgba(190,24,93,0.75))",
    accent: "rgba(244,114,182,0.95)",
  },
  FLOSS_RUSH: {
    label: "Floss Rush",
    tagline: "Three lanes. One mistake.",
    description:
      "A 3-lane runner. Switch lanes to collect floss, water, and golden teeth — touch a sugar candy and the run is over. Speed climbs with distance.",
    emoji: "💨",
    gradient:
      "linear-gradient(135deg,rgba(15,118,110,0.95),rgba(20,184,166,0.75))",
    accent: "rgba(186,230,253,0.95)",
  },
};

const GAME_ORDER: ArcadeGameType[] = [
  "PLAQUE_BLASTER",
  "TOOTH_DEFENDER",
  "FLOSS_RUSH",
];

type Mode =
  | { kind: "hub" }
  | { kind: "playing"; game: ArcadeGameType; level: number }
  | {
      kind: "result";
      game: ArcadeGameType;
      level: number;
      score: number;
      response: SubmitArcadeScoreResponse;
    };

type ArcadeHubProps = {
  /** Called when the user clicks "View leaderboards" from the hub. */
  onOpenLeaderboard?: () => void;
};

export function ArcadeHub({ onOpenLeaderboard }: ArcadeHubProps) {
  const [today, setToday] = useState<ArcadeTodayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "hub" });
  // Player-chosen level per game, defaults to the highest unlocked level so
  // the dropdown lands on the "best so far" by default.
  const [selectedLevels, setSelectedLevels] = useState<
    Partial<Record<ArcadeGameType, number>>
  >({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArcadeToday();
      setToday(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load games.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byType = useMemo(() => {
    const map = new Map<ArcadeGameType, ArcadeTodayEntry>();
    for (const e of today) map.set(e.gameType, e);
    return map;
  }, [today]);

  const startGame = useCallback(
    (gameType: ArcadeGameType) => {
      const entry = byType.get(gameType);
      if (!entry || !entry.canPlay) return;
      // Use the dropdown selection, clamped to what's unlocked. Defaults to
      // unlockedLevel when nothing's been picked yet.
      const chosen = Math.min(
        entry.unlockedLevel,
        Math.max(1, selectedLevels[gameType] ?? entry.unlockedLevel),
      );
      setMode({ kind: "playing", game: gameType, level: chosen });
    },
    [byType, selectedLevels],
  );

  const handleFinish = useCallback(
    async (gameType: ArcadeGameType, score: number, durationMs: number) => {
      try {
        // Re-read the current mode to grab the level we just played at —
        // setMode below replaces it with "result" before refresh().
        const playedLevel =
          mode.kind === "playing" ? mode.level : 1;
        const response = await submitArcadeScore({
          gameType,
          score,
          level: playedLevel,
          durationMs,
        });
        setMode({
          kind: "result",
          game: gameType,
          level: playedLevel,
          score,
          response,
        });
        void refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save your score.");
        setMode({ kind: "hub" });
      }
    },
    [mode, refresh],
  );

  const handleCancel = useCallback(() => {
    setMode({ kind: "hub" });
  }, []);

  /* -------------------------------------------------------------------- */
  /* Playing / result — both rendered inside the full-viewport portal so   */
  /* the game doesn't abruptly quit when the round ends. The stage decides */
  /* which surface (game vs. celebration) to render internally.            */
  /* -------------------------------------------------------------------- */

  if (mode.kind === "playing" || mode.kind === "result") {
    return (
      <>
        {/* Placeholder in the original surface — keeps the panel from
            collapsing while the immersive overlay is mounted. */}
        <div className="flex min-h-[40vh] items-center justify-center rounded-[24px] border border-white/14 bg-white/24 p-8 text-center text-sm text-[var(--muted-foreground)]">
          {mode.kind === "playing"
            ? "Game in progress — focus mode active."
            : "Round complete — review your score in focus mode."}
        </div>
        <ArcadeFullscreenStage
          game={mode.game}
          level={mode.level}
          result={mode.kind === "result" ? mode.response : null}
          finalScore={mode.kind === "result" ? mode.score : null}
          onFinish={(s, dur) => void handleFinish(mode.game, s, dur)}
          onCancel={handleCancel}
          onPlayAgain={() => {
            const entry = byType.get(mode.game);
            if (!entry) {
              handleCancel();
              return;
            }
            const chosen = Math.min(
              entry.unlockedLevel,
              Math.max(1, selectedLevels[mode.game] ?? entry.unlockedLevel),
            );
            setMode({ kind: "playing", game: mode.game, level: chosen });
          }}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      </>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Hub                                                                  */
  /* -------------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/* Hub header — arcade-flavored: dark themed bg, animated tooth mascot,
          three colored pill badges, gradient title. */}
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/14 p-5 text-white shadow-[0_28px_72px_rgba(7,18,34,0.32)] backdrop-blur-[24px] sm:p-7"
        style={{
          background:
            "radial-gradient(900px circle at 15% 0%, rgba(94,234,212,0.28), transparent 55%), radial-gradient(700px circle at 95% 100%, rgba(244,114,182,0.28), transparent 55%), linear-gradient(160deg, rgba(8,18,38,0.96) 0%, rgba(15,32,56,0.96) 50%, rgba(8,18,38,0.96) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-6 -right-6 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.35),transparent_70%)] blur-2xl"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(94,234,212,0.95),rgba(20,184,166,0.7))] text-3xl shadow-[0_14px_30px_rgba(2,6,18,0.5)] sm:h-16 sm:w-16 sm:text-4xl"
            style={{
              animation: "denty-pulse 2400ms ease-in-out infinite",
            }}
          >
            🦷
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">
              Toothie&apos;s Games
            </p>
            <h2 className="mt-1 bg-[linear-gradient(135deg,#bef264,#5eead4,#a5b4fc)] bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
              Three games. Eleven levels. One leaderboard each.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Play once per game per day. Score the per-level threshold to
              unlock the next difficulty. Reach <span className="font-bold text-amber-200">Lv 11 Endless</span> for an open run with no timer — survive as long as you can.
            </p>
          </div>
        </div>
        {/* Quick badges per game, color-coded to match the cards below. */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {GAME_ORDER.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90"
              style={{ background: GAME_META[g].gradient }}
            >
              <span aria-hidden>{GAME_META[g].emoji}</span>
              {GAME_META[g].label}
            </span>
          ))}
        </div>
        {error ? (
          <p className="relative mt-3 rounded-[16px] border border-rose-400/30 bg-rose-500/14 px-4 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GAME_ORDER.map((gameType) => {
          const meta = GAME_META[gameType];
          const entry = byType.get(gameType);
          const locked = entry ? !entry.canPlay : false;
          const unlocked = entry?.unlockedLevel ?? 1;
          const selected = Math.min(
            unlocked,
            Math.max(1, selectedLevels[gameType] ?? unlocked),
          );
          return (
            <div
              key={gameType}
              className="group relative overflow-hidden rounded-[24px] border border-white/14 text-white shadow-[0_24px_60px_rgba(7,18,34,0.28)] backdrop-blur-[18px]"
              style={{ background: meta.gradient }}
            >
              <div className="relative z-10 flex h-full flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl drop-shadow-[0_4px_10px_rgba(7,18,34,0.4)]" aria-hidden>
                    {meta.emoji}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{meta.label}</p>
                  <p className="mt-1 text-sm font-medium text-white/85">
                    {meta.tagline}
                  </p>
                </div>
                <p className="text-xs leading-6 text-white/75">
                  {meta.description}
                </p>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <StatChip
                    label={`Best at Lv ${selected}`}
                    value={(() => {
                      const v = entry?.bestScorePerLevel?.[selected - 1] ?? 0;
                      return v > 0 ? v.toLocaleString() : "—";
                    })()}
                  />
                  <StatChip
                    label="Unlocked"
                    value={`Lv ${unlocked}/11`}
                  />
                </div>

                {/* Level dropdown — Level 1 is always unlocked, levels above
                    unlockedLevel are 🔒 and unselectable. */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                    Difficulty
                  </span>
                  <select
                    value={selected}
                    onChange={(e) =>
                      setSelectedLevels((prev) => ({
                        ...prev,
                        [gameType]: Number(e.target.value),
                      }))
                    }
                    disabled={locked}
                    className="cursor-pointer rounded-[14px] border border-white/30 bg-[rgba(4,10,22,0.55)] px-3 py-2 text-sm font-bold text-white outline-none transition hover:bg-[rgba(4,10,22,0.7)] focus:border-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {Array.from({ length: 11 }).map((_, i) => {
                      const lv = i + 1;
                      const isLocked = lv > unlocked;
                      const threshold = entry?.thresholds[lv - 2];
                      const label =
                        lv === 11
                          ? isLocked
                            ? `🔒 Level 11 · Endless — need ${threshold?.toLocaleString() ?? "?"}`
                            : "♾️ Level 11 · Endless"
                          : isLocked
                            ? `🔒 Level ${lv} — need ${threshold?.toLocaleString() ?? "?"}`
                            : `Level ${lv}${lv === 1 ? " (start)" : ""}`;
                      return (
                        <option
                          key={lv}
                          value={lv}
                          disabled={isLocked}
                          style={{
                            background: "#0a1729",
                            color: isLocked ? "rgba(255,255,255,0.45)" : "#fff",
                          }}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {/* Best-of-all-time across every level. Compact secondary
                      stat — the prominent chip above already shows the
                      per-level best for whatever level is selected. */}
                  {entry ? (
                    <span className="text-[11px] text-white/80">
                      Best of all:{" "}
                      <span className="font-bold tabular-nums text-white">
                        {(entry.bestScore ?? 0).toLocaleString()}
                      </span>
                    </span>
                  ) : null}
                  {entry && entry.nextThreshold !== null ? (
                    (() => {
                      // Unlocks are sequential: the threshold must be earned
                      // playing AT the highest unlocked level.
                      const bestAtUnlocked =
                        entry.bestScorePerLevel?.[unlocked - 1] ?? 0;
                      const remaining = Math.max(
                        0,
                        entry.nextThreshold - bestAtUnlocked,
                      );
                      return (
                        <span className="text-[10px] text-white/65">
                          Score {remaining.toLocaleString()} more{" "}
                          <span className="font-semibold text-white/85">
                            at Lv {unlocked}
                          </span>{" "}
                          to unlock Lv {unlocked + 1}
                        </span>
                      );
                    })()
                  ) : entry && entry.nextThreshold === null ? (
                    <span className="text-[10px] font-semibold text-amber-200">
                      ⭐ All 10 levels unlocked
                    </span>
                  ) : null}
                </label>

                <button
                  type="button"
                  disabled={locked || loading}
                  onClick={() => startGame(gameType)}
                  className="denty-play-button inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-white/20 bg-white/95 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locked
                    ? "Locked till tomorrow"
                    : `Play Level ${selected}`}
                </button>
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full opacity-50 blur-3xl"
                style={{ background: meta.accent }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/30 bg-white/12 px-4 py-3 backdrop-blur-[10px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/20 bg-white/12 px-2 py-2 text-center backdrop-blur-[10px]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Immersive full-viewport stage                                              */
/* -------------------------------------------------------------------------- */

type ArcadeFullscreenStageProps = {
  game: ArcadeGameType;
  level: number;
  /** When non-null, the stage renders the celebration screen instead of the
   *  game (the run just ended). */
  result: SubmitArcadeScoreResponse | null;
  /** Final score for this round, used by the celebration. */
  finalScore: number | null;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  /** Called from the celebration's "Play again" button. */
  onPlayAgain: () => void;
  /** Optional — wired by the patient page to switch tabs. */
  onOpenLeaderboard?: () => void;
};

/**
 * Renders the active game in a full-viewport portal with a dark themed
 * backdrop, locking body scroll so the patient is in "game mode" and the
 * rest of the page chrome (rail, headers) fades behind.
 */
function ArcadeFullscreenStage({
  game,
  level,
  result,
  finalScore,
  onFinish,
  onCancel,
  onPlayAgain,
  onOpenLeaderboard,
}: ArcadeFullscreenStageProps) {
  const meta = GAME_META[game];
  const [mounted, setMounted] = useState(false);
  // Slot for the in-game HUD chips — games portal their chips here so the
  // header stays consistent across all three games.
  const [hudSlot, setHudSlot] = useState<HTMLDivElement | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const inResult = result !== null;
  // Intro card plays before the actual game mounts; once the player skips or
  // the 3-second countdown ends, we flip this and the game takes over.
  const [introDone, setIntroDone] = useState(false);
  // Reset the intro flag whenever the player re-enters with a new game/level
  // (e.g. clicking "Play again" from the celebration).
  useEffect(() => {
    if (!inResult) setIntroDone(false);
  }, [game, level, inResult]);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  const stage = (
    <div
      className="arcade-focus-stage fixed inset-0 z-[150] flex flex-col"
      style={{ backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}
    >
      {/* Themed backdrop — pulled from the game's palette so each game has
          its own atmosphere. Semi-transparent so the page chrome behind
          (rail, panels) shows through the heavy blur as a soft frosted layer. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(1100px circle at 25% 15%, ${meta.accent}33, transparent 60%), radial-gradient(900px circle at 85% 90%, ${meta.accent}26, transparent 55%), linear-gradient(160deg, rgba(5,11,24,0.92) 0%, rgba(10,23,41,0.92) 50%, rgba(5,11,24,0.92) 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* Top bar — title on the left, HUD chips stretching across the middle,
          Exit on the right. Chips render via portal from the active game.
          The HUD slot uses flex-1 so the chips spread to fill the header
          width instead of clustering in the center. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-[rgba(4,10,22,0.6)] px-3 py-2 backdrop-blur-[18px] sm:gap-4 sm:px-5 sm:py-3">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-xl shadow-[0_10px_24px_rgba(2,6,18,0.45)] sm:h-12 sm:w-12 sm:text-2xl"
            style={{ background: meta.gradient }}
            aria-hidden
          >
            {meta.emoji}
          </span>
          <div className="min-w-0 max-sm:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Focus mode
            </p>
            <p className="truncate text-base font-bold text-white">
              {meta.label}
            </p>
          </div>
        </div>

        {/* HUD slot — each game's <HudChip/> elements portal in here.
            flex-1 makes it claim all remaining width; justify-evenly fans
            the chips out across the entire header. */}
        <div
          ref={setHudSlot}
          className="flex flex-1 flex-wrap items-center justify-evenly gap-2 sm:gap-3"
        />

        <button
          type="button"
          onClick={() => (inResult ? onCancel() : setQuitOpen(true))}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-rose-300/30 bg-rose-500/14 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/25"
        >
          {inResult ? "Close" : "Exit"}
        </button>
      </div>

      {/* Stage — fills the viewport minus the top bar. overflow-hidden
          prevents scroll bars when the game's aspect-ratio container is
          height-limited; the games use width:100% + max-height:100% +
          aspect-ratio so they letterbox cleanly to either dimension. */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        <div className="arcade-focus-cursor flex h-full w-full max-w-[min(1700px,98vw)] items-center justify-center">
          {inResult && result ? (
            <ArcadeResultCelebration
              game={game}
              level={level}
              score={finalScore ?? result.score}
              result={result}
              onClose={onCancel}
              onPlayAgain={onPlayAgain}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          ) : !introDone ? (
            <ArcadeIntroCard
              game={game}
              level={level}
              gradient={meta.gradient}
              emoji={meta.emoji}
              label={meta.label}
              onStart={() => setIntroDone(true)}
            />
          ) : game === "PLAQUE_BLASTER" ? (
            <PlaqueBlasterGame
              level={level}
              onFinish={onFinish}
              onCancel={onCancel}
              hudSlot={hudSlot}
            />
          ) : game === "TOOTH_DEFENDER" ? (
            <ToothDefenderGame
              level={level}
              onFinish={onFinish}
              onCancel={onCancel}
              hudSlot={hudSlot}
            />
          ) : (
            <FlossRushGame
              level={level}
              onFinish={onFinish}
              onCancel={onCancel}
              hudSlot={hudSlot}
            />
          )}
        </div>
      </div>

      <QuitConfirmModal
        open={quitOpen}
        gameLabel={meta.label}
        onCancel={() => setQuitOpen(false)}
        onConfirm={() => {
          setQuitOpen(false);
          onCancel();
        }}
      />
    </div>
  );

  return createPortal(stage, document.body);
}

/* -------------------------------------------------------------------------- */
/* Celebration — rendered inside the focus-mode portal when a run ends.       */
/* -------------------------------------------------------------------------- */

type ArcadeResultCelebrationProps = {
  game: ArcadeGameType;
  level: number;
  score: number;
  result: SubmitArcadeScoreResponse;
  onClose: () => void;
  onPlayAgain: () => void;
  onOpenLeaderboard?: () => void;
};

function ArcadeResultCelebration({
  game,
  level,
  score,
  result,
  onClose,
  onPlayAgain,
  onOpenLeaderboard,
}: ArcadeResultCelebrationProps) {
  const meta = GAME_META[game];
  const headline = result.newLevelUnlocked
    ? `🎉 Level ${result.unlockedLevel} unlocked!`
    : result.isNewBest
      ? "New personal best!"
      : "Round complete";

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/14 p-7 text-white shadow-[0_30px_80px_rgba(2,6,18,0.55)] sm:p-10"
        style={{
          background: meta.gradient,
          animation: "denty-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
          {meta.label} · Level {result.playedAtLevel}
        </p>
        <p className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
          {headline}
        </p>
        <p className="mt-2 text-sm text-white/80">
          You played at Level {level}.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {/* Score card = the score the player just earned this round.
              result.score is the persisted max (could be a prior higher
              today-run in test mode), so we display the actual round score
              passed in from the game. */}
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Best" value={result.bestScore.toLocaleString()} />
          <Stat
            label="Unlocked"
            value={`Lv ${result.unlockedLevel}/11`}
          />
        </div>

        <p className="mt-5 max-w-2xl text-sm text-white/85">
          {result.newLevelUnlocked
            ? `Level ${result.unlockedLevel} is now playable from the dropdown. Tougher spawns, faster cadence, bigger rewards — go push your best.`
            : result.nextThreshold !== null
              ? `Score ${result.nextThreshold.toLocaleString()} or more at Level ${result.unlockedLevel} to unlock Level ${result.unlockedLevel + 1}.`
              : "Level 10 — you've maxed out the unlocks. Now chase the leaderboard."}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="denty-play-button inline-flex min-h-11 items-center justify-center rounded-[14px] bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-slate-900"
          >
            Play again
          </button>
          {onOpenLeaderboard ? (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-white/30 bg-white/14 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-[12px] transition hover:bg-white/24"
            >
              View leaderboard
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-white/22 bg-transparent px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Back to hub
          </button>
        </div>

        {/* Confetti burst when a new level unlocks — small CSS sparkles. */}
        {result.newLevelUnlocked ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
          >
            {Array.from({ length: 18 }).map((_, i) => {
              const angle = (i / 18) * Math.PI * 2;
              const radius = 220 + (i % 3) * 50;
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
                      width: 14,
                      height: 14,
                      borderRadius: 9999,
                      background:
                        i % 3 === 0
                          ? "rgba(252,211,77,0.95)"
                          : i % 3 === 1
                            ? "rgba(94,234,212,0.95)"
                            : "rgba(244,114,182,0.95)",
                      boxShadow: "0 0 22px currentColor",
                      animation:
                        "denty-spark-out 1400ms ease-out forwards",
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
