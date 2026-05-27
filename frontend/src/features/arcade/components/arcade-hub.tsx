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
    tagline: "60 seconds. Tap fast. Don't bite the sugar.",
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
      setMode({ kind: "playing", game: gameType, level: entry.nextLevel });
    },
    [byType],
  );

  const handleFinish = useCallback(
    async (gameType: ArcadeGameType, score: number, durationMs: number) => {
      try {
        const response = await submitArcadeScore({
          gameType,
          score,
          durationMs,
        });
        setMode({ kind: "result", game: gameType, score, response });
        void refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save your score.");
        setMode({ kind: "hub" });
      }
    },
    [refresh],
  );

  const handleCancel = useCallback(() => {
    setMode({ kind: "hub" });
  }, []);

  /* -------------------------------------------------------------------- */
  /* Playing — immersive full-viewport mode                               */
  /* -------------------------------------------------------------------- */

  if (mode.kind === "playing") {
    // Render through a portal to document.body so the rail and patient page
    // chrome stay behind the overlay; lock body scroll for "game mode" feel.
    return (
      <>
        {/* Placeholder in the original surface — keeps the panel from
            collapsing while the immersive overlay is mounted. */}
        <div className="flex min-h-[40vh] items-center justify-center rounded-[24px] border border-white/14 bg-white/24 p-8 text-center text-sm text-[var(--muted-foreground)]">
          Game in progress — focus mode active.
        </div>
        <ArcadeFullscreenStage
          game={mode.game}
          level={mode.level}
          onFinish={(s, dur) => void handleFinish(mode.game, s, dur)}
          onCancel={handleCancel}
        />
      </>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Result screen                                                        */
  /* -------------------------------------------------------------------- */

  if (mode.kind === "result") {
    const meta = GAME_META[mode.game];
    const r = mode.response;
    return (
      <div
        className="overflow-hidden rounded-[28px] border border-white/12 p-6 text-white shadow-[0_30px_80px_rgba(7,18,34,0.32)] sm:p-10"
        style={{ background: meta.gradient }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
          {meta.label}
        </p>
        <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {r.isNewBest ? "New personal best!" : "Round complete"}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Score" value={r.score.toLocaleString()} />
          <Stat label="Best" value={r.bestScore.toLocaleString()} />
          <Stat
            label="Streak"
            value={`${r.streak} day${r.streak === 1 ? "" : "s"}`}
          />
        </div>

        <p className="mt-6 max-w-2xl text-sm text-white/80">
          {r.isNewBest
            ? "You climbed your own leaderboard. Tomorrow's run starts one level harder — keep the streak alive."
            : "Come back tomorrow to play at level " +
              (r.streakLevel + 1) +
              " and chase your best of " +
              r.bestScore.toLocaleString() +
              "."}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode({ kind: "hub" })}
            className="rounded-[14px] border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-[12px] transition hover:bg-white/30"
          >
            Back to games
          </button>
          {onOpenLeaderboard ? (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="rounded-[14px] bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
            >
              View leaderboard
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Hub                                                                  */
  /* -------------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-5 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:p-6">
        <p className="denty-kicker">Daily Arcade</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
          One run per game, per day
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Three competitive mini-games. Each game has its own leaderboard,
          ranked by your best score. Keep your streak alive — every consecutive
          day raises the difficulty by one level (up to Level 10).
        </p>
        {error ? (
          <p className="mt-3 rounded-[16px] border border-rose-400/30 bg-rose-100/40 px-4 py-2 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GAME_ORDER.map((gameType) => {
          const meta = GAME_META[gameType];
          const entry = byType.get(gameType);
          const locked = entry ? !entry.canPlay : false;
          return (
            <div
              key={gameType}
              className="group relative overflow-hidden rounded-[24px] border border-white/14 text-white shadow-[0_24px_60px_rgba(7,18,34,0.28)] backdrop-blur-[18px]"
              style={{ background: meta.gradient }}
            >
              <div className="relative z-10 flex h-full flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-4xl drop-shadow-[0_4px_10px_rgba(7,18,34,0.4)]" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="rounded-full border border-white/30 bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                    {locked ? "Played today" : "Ready"}
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

                <div className="mt-auto grid grid-cols-3 gap-2">
                  <StatChip
                    label="Best"
                    value={entry?.bestScore.toLocaleString() ?? "—"}
                  />
                  <StatChip
                    label="Streak"
                    value={
                      entry?.streak ? `${entry.streak}d` : "—"
                    }
                  />
                  <StatChip
                    label={locked ? "Tomorrow" : "Next"}
                    value={`Lv ${entry?.nextLevel ?? 1}`}
                  />
                </div>

                <button
                  type="button"
                  disabled={locked || loading}
                  onClick={() => startGame(gameType)}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-white/20 bg-white/95 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locked ? "Locked till tomorrow" : "Play now"}
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
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
};

/**
 * Renders the active game in a full-viewport portal with a dark themed
 * backdrop, locking body scroll so the patient is in "game mode" and the
 * rest of the page chrome (rail, headers) fades behind.
 */
function ArcadeFullscreenStage({
  game,
  level,
  onFinish,
  onCancel,
}: ArcadeFullscreenStageProps) {
  const meta = GAME_META[game];
  const [mounted, setMounted] = useState(false);
  // Slot for the in-game HUD chips — games portal their chips here so the
  // header stays consistent across all three games.
  const [hudSlot, setHudSlot] = useState<HTMLDivElement | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);

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
          onClick={() => setQuitOpen(true)}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-rose-300/30 bg-rose-500/14 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/25"
        >
          Exit
        </button>
      </div>

      {/* Stage — fills the viewport minus the top bar. overflow-hidden
          prevents scroll bars when the game's aspect-ratio container is
          height-limited; the games use width:100% + max-height:100% +
          aspect-ratio so they letterbox cleanly to either dimension. */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        <div className="arcade-focus-cursor flex h-full w-full max-w-[min(1700px,98vw)] items-center justify-center">
          {game === "PLAQUE_BLASTER" ? (
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
