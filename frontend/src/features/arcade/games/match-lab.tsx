"use client";

/**
 * Match Lab — dental-themed memory match.
 *
 * Cards flash face-up for a few seconds at the start of each board (preview),
 * then flip face-down. Tap two cards to compare. Matches stay open; wrong
 * pairs flip back. Three misses ends the run. Score is a mix of:
 *
 *   match bonus  +200 each
 *   speed bonus  up to +60 per match for fast clears
 *   clean bonus  +500 if the board finishes with no misses
 *   streak       consecutive-match multiplier on the match bonus
 *
 * Level scales: grid size (12→30 cards), preview window (4s→1.5s), and from
 * L8 a single mid-preview reshuffle to break naive memorization.
 *
 * Lv 11 = endless: boards keep coming until the player misses 3 times across
 * the whole run.
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

type CardKind = string;
type Card = {
  id: number;
  kind: CardKind;
  matched: boolean;
  /** Index in the current grid layout. Updated on the L8+ mid-preview shuffle. */
};

const MISS_LIMIT = 3;

/** Dental-themed emoji pool. Each round samples N from this list. Order
 *  matters loosely — earlier ones are simpler, later ones look more alike
 *  to make hard levels harder. */
const EMOJI_POOL: string[] = [
  "🦷",
  "🪥",
  "🧵",
  "💧",
  "✨",
  "❤️",
  "😁",
  "⭐",
  "🦴",
  "👄",
  "👅",
  "🍎",
  "🥕",
  "🥛",
  "🍭",
  "🍬",
  "🦠",
  "💊",
  "🌿",
  "🫧",
  "🔬",
  "🧪",
];

/** Per-level config. Endless (11) tracks L10. */
function levelConfig(level: number) {
  const clamped = Math.max(1, Math.min(11, level));
  const table = [
    /*  L1 */ { pairs: 6, previewMs: 4000, cols: 4, shuffle: false, bonus: false },
    /*  L2 */ { pairs: 6, previewMs: 3500, cols: 4, shuffle: false, bonus: false },
    /*  L3 */ { pairs: 8, previewMs: 3500, cols: 4, shuffle: false, bonus: false },
    /*  L4 */ { pairs: 8, previewMs: 3000, cols: 4, shuffle: false, bonus: false },
    /*  L5 */ { pairs: 10, previewMs: 3000, cols: 5, shuffle: false, bonus: false },
    /*  L6 */ { pairs: 10, previewMs: 2500, cols: 5, shuffle: false, bonus: false },
    /*  L7 */ { pairs: 12, previewMs: 2500, cols: 6, shuffle: false, bonus: false },
    /*  L8 */ { pairs: 12, previewMs: 2000, cols: 6, shuffle: true, bonus: false },
    /*  L9 */ { pairs: 14, previewMs: 2000, cols: 7, shuffle: true, bonus: true },
    /* L10 */ { pairs: 15, previewMs: 1500, cols: 6, shuffle: true, bonus: true },
    /* L11 */ { pairs: 15, previewMs: 1500, cols: 6, shuffle: true, bonus: true },
  ];
  return table[clamped - 1];
}

function buildBoard(pairs: number, seed: number): Card[] {
  const pool = EMOJI_POOL.slice(0, Math.max(pairs, 6));
  // Light pseudo-random based on seed so different boards don't all look identical.
  const shuffled = pool.slice().sort(() => Math.random() - 0.5).slice(0, pairs);
  const cards: Card[] = [];
  let id = seed * 1000;
  for (const emoji of shuffled) {
    cards.push({ id: id++, kind: emoji, matched: false });
    cards.push({ id: id++, kind: emoji, matched: false });
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

type Phase = "preview" | "play" | "between";

export function MatchLabGame({ level, onFinish, onCancel, hudSlot }: GameProps) {
  const t = useTranslation();
  const endless = level >= 11;
  const cfg = useMemo(() => levelConfig(level), [level]);

  const [board, setBoard] = useState<Card[]>(() => buildBoard(cfg.pairs, 1));
  const [phase, setPhase] = useState<Phase>("preview");
  const [previewLeft, setPreviewLeft] = useState(cfg.previewMs);
  const [boardIndex, setBoardIndex] = useState(1);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusKind, setBonusKind] = useState<string | null>(null);
  const [matchesThisBoard, setMatchesThisBoard] = useState(0);
  const [missesThisBoard, setMissesThisBoard] = useState(0);
  const [lastMatchAt, setLastMatchAt] = useState<number>(() => Date.now());
  const [over, setOver] = useState<null | "win" | "miss">(null);
  const [overReason, setOverReason] = useState<string>("");

  const startedRef = useRef<number>(Date.now());
  const previewIntervalRef = useRef<number | null>(null);
  const shuffledMidRef = useRef(false);

  const submit = useCallback(
    (final: number) => {
      const dur = Date.now() - startedRef.current;
      onFinish(final, dur);
    },
    [onFinish],
  );

  // Preview countdown
  useEffect(() => {
    if (phase !== "preview") return;
    const start = Date.now();
    const target = cfg.previewMs;
    setPreviewLeft(target);
    previewIntervalRef.current = window.setInterval(() => {
      const left = target - (Date.now() - start);
      setPreviewLeft(Math.max(0, left));
      if (left <= 0) {
        if (previewIntervalRef.current)
          window.clearInterval(previewIntervalRef.current);
        setPhase("play");
        setLastMatchAt(Date.now());
      }
      // L8+ mid-preview shuffle: at the halfway mark, reshuffle once.
      if (cfg.shuffle && !shuffledMidRef.current && left <= target / 2) {
        shuffledMidRef.current = true;
        setBoard((b) => {
          const copy = b.slice();
          for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return copy;
        });
      }
    }, 90);
    return () => {
      if (previewIntervalRef.current)
        window.clearInterval(previewIntervalRef.current);
    };
  }, [phase, cfg.previewMs, cfg.shuffle]);

  // Bonus pair (L9+): pick a kind, glow it, expires after 4s.
  useEffect(() => {
    if (!cfg.bonus || phase !== "play") return;
    if (bonusActive) return;
    const id = window.setTimeout(() => {
      const remaining = board.filter((c) => !c.matched);
      if (!remaining.length) return;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      setBonusKind(pick.kind);
      setBonusActive(true);
      window.setTimeout(() => {
        setBonusActive(false);
        setBonusKind(null);
      }, 4000);
    }, 2000 + Math.random() * 3000);
    return () => window.clearTimeout(id);
  }, [cfg.bonus, phase, bonusActive, board]);

  const startNextBoard = useCallback(() => {
    const next = boardIndex + 1;
    setBoardIndex(next);
    setBoard(buildBoard(cfg.pairs, next));
    setFlipped([]);
    setMatchesThisBoard(0);
    setMissesThisBoard(0);
    setBonusActive(false);
    setBonusKind(null);
    shuffledMidRef.current = false;
    setPhase("preview");
  }, [boardIndex, cfg.pairs]);

  // Handle card tap.
  const onCardTap = useCallback(
    (cardId: number) => {
      if (phase !== "play" || busy || over) return;
      const idx = board.findIndex((c) => c.id === cardId);
      if (idx < 0) return;
      if (board[idx].matched) return;
      if (flipped.includes(cardId)) return;
      const nextFlipped = [...flipped, cardId];
      setFlipped(nextFlipped);
      if (nextFlipped.length < 2) return;
      setBusy(true);
      const [aId, bId] = nextFlipped;
      const a = board.find((c) => c.id === aId)!;
      const b = board.find((c) => c.id === bId)!;
      if (a.kind === b.kind) {
        // Match
        const now = Date.now();
        const elapsed = now - lastMatchAt;
        const speedBonus = Math.max(0, Math.round(60 - elapsed / 80));
        const newStreak = streak + 1;
        const streakBonus = Math.min(100, newStreak * 12);
        const isBonusKind = bonusActive && bonusKind === a.kind;
        const baseMatch = 200;
        const total = (baseMatch + speedBonus + streakBonus) * (isBonusKind ? 2 : 1);
        setLastMatchAt(now);
        setStreak(newStreak);
        if (isBonusKind) {
          setBonusActive(false);
          setBonusKind(null);
        }
        window.setTimeout(() => {
          setBoard((bd) =>
            bd.map((c) =>
              c.id === aId || c.id === bId ? { ...c, matched: true } : c,
            ),
          );
          setFlipped([]);
          setBusy(false);
          setScore((s) => s + total);
          const matched = matchesThisBoard + 1;
          setMatchesThisBoard(matched);
          if (matched >= cfg.pairs) {
            // Board cleared.
            const clean = missesThisBoard === 0 ? 500 : 0;
            const total2 = clean;
            setScore((s) => s + total2);
            if (endless) {
              setPhase("between");
              window.setTimeout(() => startNextBoard(), 1200);
            } else {
              setOver("win");
              setOverReason(t("arcade.match.over_win"));
              window.setTimeout(() => submit(score + total + total2), 1600);
            }
          }
        }, 320);
      } else {
        // Miss
        const newMisses = misses + 1;
        const newBoardMisses = missesThisBoard + 1;
        setStreak(0);
        window.setTimeout(() => {
          setFlipped([]);
          setBusy(false);
          setMisses(newMisses);
          setMissesThisBoard(newBoardMisses);
          if (newMisses >= MISS_LIMIT) {
            setOver("miss");
            setOverReason(t("arcade.match.over_miss"));
            window.setTimeout(() => submit(score), 1600);
          }
        }, 700);
      }
    },
    [
      phase,
      busy,
      over,
      board,
      flipped,
      streak,
      bonusActive,
      bonusKind,
      lastMatchAt,
      misses,
      missesThisBoard,
      matchesThisBoard,
      cfg.pairs,
      endless,
      startNextBoard,
      score,
      submit,
      t,
    ],
  );

  // HUD chips (rendered into the focus-stage top bar slot via portal).
  const hud = (
    <div className="flex flex-wrap items-center gap-2">
      <HudChip label={t("arcade.hud.score")} value={score} variant="score" />
      <HudChip
        label={t("arcade.match.hud_matches")}
        value={`${matchesThisBoard}/${cfg.pairs}`}
        variant="combo"
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
      {endless ? (
        <HudChip
          label={t("arcade.match.hud_board")}
          value={boardIndex}
          variant="timer"
        />
      ) : null}
    </div>
  );

  const rows = Math.ceil(board.length / cfg.cols);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:p-6">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      {/* Preview countdown banner */}
      {phase === "preview" ? (
        <div
          className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full border border-white/25 bg-black/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/95 backdrop-blur"
          aria-live="polite"
        >
          {t("arcade.match.preview_in", {
            seconds: Math.ceil(previewLeft / 1000),
          })}
        </div>
      ) : null}

      {/* Between-board banner (endless only) */}
      {phase === "between" ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border-2 border-emerald-300/55 px-6 py-3 text-center text-white shadow-[0_18px_44px_rgba(16,185,129,0.45)]"
          style={{
            background:
              "linear-gradient(135deg,rgba(16,185,129,0.85),rgba(20,184,166,0.92))",
            animation: "denty-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/95">
            {t("arcade.match.between_eyebrow")}
          </p>
          <p className="mt-1 text-xl font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            {t("arcade.match.between_title")}
          </p>
        </div>
      ) : null}

      {/* Board */}
      <div
        className="grid w-full max-w-3xl gap-2.5 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {board.map((card) => {
          const isFlipped =
            phase === "preview" || card.matched || flipped.includes(card.id);
          const isWrong =
            flipped.length === 2 &&
            flipped.includes(card.id) &&
            !card.matched &&
            board.find((c) => c.id === flipped[0])!.kind !==
              board.find((c) => c.id === flipped[1])!.kind;
          const isBonus = bonusActive && bonusKind === card.kind && !card.matched;
          return (
            <button
              key={card.id}
              type="button"
              disabled={busy || over !== null || phase === "preview"}
              onClick={() => onCardTap(card.id)}
              aria-label={t("arcade.match.card_aria")}
              className="relative aspect-square select-none rounded-2xl border-2 outline-none transition-all duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-teal-300 disabled:hover:scale-100"
              style={{
                borderColor: card.matched
                  ? "rgba(94,234,212,0.95)"
                  : isFlipped
                    ? "rgba(148,163,184,0.6)"
                    : "rgba(167,139,250,0.55)",
                background: card.matched
                  ? "linear-gradient(135deg,rgba(20,184,166,0.75),rgba(16,185,129,0.85))"
                  : isFlipped
                    ? "linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))"
                    : "linear-gradient(135deg,rgba(67,56,202,0.92),rgba(124,58,237,0.92),rgba(190,24,93,0.86))",
                boxShadow: card.matched
                  ? "0 0 0 1px rgba(255,255,255,0.4) inset, 0 8px 24px rgba(16,185,129,0.5), 0 0 32px rgba(94,234,212,0.4)"
                  : isFlipped
                    ? "0 8px 22px rgba(2,6,18,0.32), 0 0 0 1px rgba(255,255,255,0.6) inset"
                    : "0 10px 28px rgba(67,56,202,0.42), 0 0 0 1px rgba(255,255,255,0.18) inset",
                transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
                transformStyle: "preserve-3d",
                animation: isWrong
                  ? "denty-shake 380ms cubic-bezier(0.36,0.07,0.19,0.97) both"
                  : card.matched
                    ? "denty-pop 340ms cubic-bezier(0.34, 1.56, 0.64, 1) both"
                    : undefined,
              }}
            >
              {/* Front face: emoji */}
              <span
                className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:text-4xl"
                style={{
                  opacity: isFlipped ? 1 : 0,
                  transition: "opacity 180ms",
                }}
              >
                {card.kind}
              </span>
              {/* Back face: stylised tooth + sparkle accent */}
              <span
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: isFlipped ? 0 : 1,
                  transition: "opacity 180ms",
                }}
                aria-hidden
              >
                <span
                  className="text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:text-3xl"
                  style={{
                    filter: "brightness(1.15)",
                  }}
                >
                  🦷
                </span>
                <span
                  className="pointer-events-none absolute inset-2 rounded-[10px] border border-white/20"
                  aria-hidden
                />
              </span>
              {/* Bonus glow */}
              {isBonus ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-0.5 rounded-[16px]"
                  style={{
                    boxShadow:
                      "0 0 0 2px rgba(250,204,21,0.95), 0 0 22px rgba(250,204,21,0.65)",
                    animation: "denty-flame-pulse 1100ms ease-in-out infinite",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Game-over banner */}
      {over ? (
        <div
          className="absolute inset-x-4 top-1/2 z-40 -translate-y-1/2 rounded-3xl border-2 px-6 py-5 text-center text-white shadow-[0_30px_70px_rgba(2,6,18,0.7)] backdrop-blur"
          style={{
            borderColor:
              over === "win"
                ? "rgba(94,234,212,0.65)"
                : "rgba(248,113,113,0.6)",
            background:
              over === "win"
                ? "linear-gradient(135deg,rgba(13,148,136,0.92),rgba(20,184,166,0.92))"
                : "linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92))",
            animation: "denty-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-[0.24em]"
            style={{
              color:
                over === "win"
                  ? "rgba(236,253,245,0.9)"
                  : "rgba(254,202,202,0.95)",
            }}
          >
            {over === "win"
              ? t("arcade.match.over_win_eyebrow")
              : t("arcade.match.over_miss_eyebrow")}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            {overReason}
          </p>
          <p className="mt-1 text-sm text-white/95">
            {t("arcade.match.over_score", { score })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
