"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getDailyQuestions,
  getMyAttempts,
  getToday,
  submitQuizAttempt,
  type GameTodayStatus,
  type QuizAttempt,
  type QuizAttemptAnswer,
  type QuizAttemptResult,
  type QuizQuestion,
} from "@/features/game/services/game-api";
import { FlameStreak } from "@/features/game/components/flame-streak";
import { useTranslation } from "@/features/i18n/language-provider";
import { ApiError } from "@/lib/api/http";
import { useToast } from "@/features/ui/components/toast-provider";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const panelInnerClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:p-6 md:p-5";

/** Total seconds allowed per question. The backend enforces the cap too. */
const QUESTION_SECONDS = 30;

/** Recompute the countdown tick interval. */
const COUNTDOWN_MS = 100;

/**
 * Each known quiz category gets a colour accent. The chip colour lights up
 * the lobby preview AND the question card's left border during play, so the
 * doctor builds an intuitive sense of "this is an anatomy question" before
 * even reading it.
 */
const CATEGORY_STYLE: Record<
  string,
  { chip: string; border: string; key: string }
> = {
  anatomy: {
    chip: "bg-[rgba(59,130,246,0.18)] text-[rgba(30,64,175,0.95)] border-[rgba(59,130,246,0.32)]",
    border: "border-l-[rgba(59,130,246,0.85)]",
    key: "game.cat.anatomy",
  },
  caries: {
    chip: "bg-[rgba(239,68,68,0.16)] text-[rgba(153,27,27,0.95)] border-[rgba(239,68,68,0.3)]",
    border: "border-l-[rgba(239,68,68,0.85)]",
    key: "game.cat.caries",
  },
  periodontics: {
    chip: "bg-[rgba(34,197,94,0.18)] text-[rgba(22,101,52,0.95)] border-[rgba(34,197,94,0.32)]",
    border: "border-l-[rgba(34,197,94,0.85)]",
    key: "game.cat.periodontics",
  },
  endodontics: {
    chip: "bg-[rgba(168,85,247,0.18)] text-[rgba(107,33,168,0.95)] border-[rgba(168,85,247,0.32)]",
    border: "border-l-[rgba(168,85,247,0.85)]",
    key: "game.cat.endodontics",
  },
  "oral-surgery": {
    chip: "bg-[rgba(249,115,22,0.18)] text-[rgba(154,52,18,0.95)] border-[rgba(249,115,22,0.32)]",
    border: "border-l-[rgba(249,115,22,0.85)]",
    key: "game.cat.oral-surgery",
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_STYLE);

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type QuizPhase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "already-played"; today: GameTodayStatus }
  | { kind: "lobby"; today: GameTodayStatus }
  | {
      kind: "playing";
      today: GameTodayStatus;
      questions: QuizQuestion[];
      answers: QuizAttemptAnswer[];
      currentIndex: number;
      selectedIndex: number | null;
      questionStartedAt: number;
      secondsLeft: number;
      /**
       * Tracks the "selected pulse" UI feedback — true for ~300ms after a
       * click, so the option button can show a brief animation before we
       * advance to the next question.
       */
      lockedAt: number | null;
    }
  | { kind: "submitting"; today: GameTodayStatus }
  | {
      kind: "results";
      today: GameTodayStatus;
      result: QuizAttemptResult;
    };

export type GameSurfaceProps = {
  /**
   * Optional callback — when supplied, the results screen renders a primary
   * "View leaderboard" CTA that calls this. The doctor shell wires this to
   * `setActiveSurface("leaderboard")`.
   */
  onViewLeaderboard?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatAttemptDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Tiny counter hook: animates from 0 to `target` over `duration` ms. */
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic for a satisfying decel
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

/** Circular SVG countdown ring drawn around the question number. */
function CountdownRing({
  secondsLeft,
  totalSeconds,
  questionNumber,
}: {
  secondsLeft: number;
  totalSeconds: number;
  questionNumber: number;
}) {
  const pct = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  // Colour shift: green > 20s, yellow 10-20s, red <10s
  let stroke = "url(#ring-green)";
  if (secondsLeft <= 10) stroke = "url(#ring-red)";
  else if (secondsLeft <= 20) stroke = "url(#ring-yellow)";

  const danger = secondsLeft <= 3;

  return (
    <div
      className={`relative inline-flex h-20 w-20 items-center justify-center ${
        danger ? "denty-shake" : ""
      }`}
    >
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <defs>
          <linearGradient id="ring-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="ring-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="ring-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(10,22,40,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 100ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[var(--foreground)] tabular-nums">
          {questionNumber}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.5)]">
          {Math.ceil(secondsLeft)}s
        </span>
      </div>
    </div>
  );
}

/** Six stars radiating from the score on the results screen. */
function StarBurst() {
  // Six stars at 60deg increments. CSS keyframes do the radiating motion.
  return (
    <div className="pointer-events-none absolute inset-0">
      {[0, 60, 120, 180, 240, 300].map((rot, i) => (
        <span
          key={rot}
          className="denty-burst-star"
          style={
            {
              ["--burst-rot" as string]: `${rot}deg`,
              animationDelay: `${i * 60}ms`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12 2l2.6 6.5 7 .6-5.3 4.6 1.7 6.8L12 16.9 5.9 20.5l1.7-6.8L2.4 9.1l7-.6L12 2Z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main surface                                                               */
/* -------------------------------------------------------------------------- */

export function GameSurface({ onViewLeaderboard }: GameSurfaceProps = {}) {
  const { pushToast } = useToast();
  const t = useTranslation();

  const [phase, setPhase] = useState<QuizPhase>({ kind: "loading" });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState<number>(0);

  // Per-question countdown timer, kept in a ref so cleanup is trivial.
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Daily reset countdown timer.
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ------------------------------------------------------------------ */
  /* Bootstrap                                                          */
  /* ------------------------------------------------------------------ */

  const loadToday = useCallback(async () => {
    try {
      const today = await getToday();
      setPhase(
        today.canPlay
          ? { kind: "lobby", today }
          : { kind: "already-played", today },
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load today's quiz status.";
      setPhase({ kind: "error", message });
    }
  }, []);

  const refreshAttempts = useCallback(async () => {
    setAttemptsLoading(true);
    setAttemptsError(null);
    try {
      const list = await getMyAttempts();
      setAttempts(list);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load recent attempts.";
      setAttemptsError(message);
    } finally {
      setAttemptsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadToday();
    void refreshAttempts();
  }, [loadToday, refreshAttempts]);

  /* ------------------------------------------------------------------ */
  /* Daily-reset countdown                                              */
  /* ------------------------------------------------------------------ */

  const resetAtIso = useMemo<string | null>(() => {
    if (phase.kind === "already-played" || phase.kind === "lobby") {
      return phase.today.resetAt;
    }
    if (phase.kind === "results") {
      return phase.today.resetAt;
    }
    return null;
  }, [phase]);

  useEffect(() => {
    if (!resetAtIso) {
      setResetIn(0);
      if (resetTimerRef.current) {
        clearInterval(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      return;
    }

    const tick = () => {
      const ms = new Date(resetAtIso).getTime() - Date.now();
      setResetIn(Math.max(0, ms));
    };
    tick();
    resetTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (resetTimerRef.current) {
        clearInterval(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [resetAtIso]);

  /* ------------------------------------------------------------------ */
  /* Per-question timer                                                 */
  /* ------------------------------------------------------------------ */

  const clearQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearQuestionTimer, [clearQuestionTimer]);

  /**
   * Lock the current answer (or `-1` for "time expired") and advance to the
   * next question. When all 10 are recorded, transition into `submitting`
   * and post to the backend.
   */
  const lockAnswer = useCallback((selectedIndex: number) => {
    setPhase((prev) => {
      if (prev.kind !== "playing") return prev;
      const current = prev.questions[prev.currentIndex];
      if (!current) return prev;

      const elapsed = Date.now() - prev.questionStartedAt;
      const clampedMs = Math.min(
        QUESTION_SECONDS * 1000,
        Math.max(0, elapsed),
      );

      const newAnswer: QuizAttemptAnswer = {
        questionId: current.id,
        selectedIndex,
        timeMs: clampedMs,
      };
      const nextAnswers = [...prev.answers, newAnswer];

      if (nextAnswers.length >= prev.questions.length) {
        return { kind: "submitting", today: prev.today };
      }

      return {
        ...prev,
        answers: nextAnswers,
        currentIndex: prev.currentIndex + 1,
        selectedIndex: null,
        questionStartedAt: Date.now(),
        secondsLeft: QUESTION_SECONDS,
        lockedAt: null,
      };
    });
  }, []);

  // Run the countdown whenever we're playing.
  useEffect(() => {
    if (phase.kind !== "playing") {
      clearQuestionTimer();
      return;
    }

    clearQuestionTimer();
    questionTimerRef.current = setInterval(() => {
      setPhase((prev) => {
        if (prev.kind !== "playing") return prev;
        const elapsedMs = Date.now() - prev.questionStartedAt;
        const left = Math.max(0, QUESTION_SECONDS - elapsedMs / 1000);
        if (left <= 0) {
          queueMicrotask(() => lockAnswer(-1));
          return { ...prev, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: left };
      });
    }, COUNTDOWN_MS);

    return clearQuestionTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase.kind,
    phase.kind === "playing" ? phase.currentIndex : -1,
    phase.kind === "playing" ? phase.questionStartedAt : 0,
    clearQuestionTimer,
    lockAnswer,
  ]);

  /* ------------------------------------------------------------------ */
  /* Submit attempt when transitioning into `submitting`                */
  /* ------------------------------------------------------------------ */

  const pendingAnswersRef = useRef<QuizAttemptAnswer[] | null>(null);

  useEffect(() => {
    if (phase.kind !== "playing") return;
    pendingAnswersRef.current = phase.answers;
  }, [phase]);

  useEffect(() => {
    if (phase.kind !== "submitting") return;
    const answers = pendingAnswersRef.current;
    if (!answers || answers.length === 0) return;

    let cancelled = false;
    submitQuizAttempt({ answers })
      .then((result) => {
        if (cancelled) return;
        pendingAnswersRef.current = null;
        setPhase((prev) =>
          prev.kind === "submitting"
            ? { kind: "results", today: prev.today, result }
            : prev,
        );
        pushToast({
          kind: "success",
          title: "Quiz submitted",
          description: `You scored ${result.score} / ${result.total}.`,
        });
        void refreshAttempts();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        pendingAnswersRef.current = null;
        const message =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Failed to submit the attempt.";

        pushToast({
          kind: "error",
          title: "Quiz submission",
          description: message,
        });

        if (e instanceof ApiError && e.status === 409) {
          void loadToday();
          return;
        }

        setPhase({ kind: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [phase, pushToast, refreshAttempts, loadToday]);

  /* ------------------------------------------------------------------ */
  /* Best-effort "leave page during quiz" guard                         */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (phase.kind !== "playing") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase.kind]);

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */

  const startQuiz = useCallback(async () => {
    if (phase.kind !== "lobby") return;
    const today = phase.today;
    setPhase({ kind: "loading" });
    try {
      const questions = await getDailyQuestions();
      if (!questions.length) {
        setPhase({
          kind: "error",
          message: "Today's quiz has no questions yet.",
        });
        return;
      }
      setPhase({
        kind: "playing",
        today,
        questions,
        answers: [],
        currentIndex: 0,
        selectedIndex: null,
        questionStartedAt: Date.now(),
        secondsLeft: QUESTION_SECONDS,
        lockedAt: null,
      });
    } catch (e: unknown) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load today's questions.";

      pushToast({
        kind: "error",
        title: "Today's quiz",
        description: message,
      });

      if (e instanceof ApiError && e.status === 409) {
        void loadToday();
        return;
      }
      setPhase({ kind: "error", message });
    }
  }, [phase, pushToast, loadToday]);

  /**
   * Click on an option: stash selection and trigger the 300ms "selected
   * pulse" before locking in the answer. If the option matches what's
   * already selected (and we're not mid-pulse) we treat the second click
   * as confirm-and-advance.
   */
  const pickOption = useCallback(
    (index: number) => {
      setPhase((prev) => {
        if (prev.kind !== "playing") return prev;
        if (prev.lockedAt !== null) return prev;
        return { ...prev, selectedIndex: index, lockedAt: Date.now() };
      });
      // Advance after the pulse settles.
      window.setTimeout(() => lockAnswer(index), 320);
    },
    [lockAnswer],
  );

  const backToToday = useCallback(() => {
    void loadToday();
  }, [loadToday]);

  /* ------------------------------------------------------------------ */
  /* Derived view-model                                                 */
  /* ------------------------------------------------------------------ */

  const streakValue: number = useMemo(() => {
    if (phase.kind === "lobby" || phase.kind === "already-played") {
      return phase.today.streak;
    }
    if (phase.kind === "results") {
      return phase.result.streak;
    }
    if (phase.kind === "playing" || phase.kind === "submitting") {
      return phase.today.streak;
    }
    return 0;
  }, [phase]);

  /** Best score so far (across the doctor's attempt history). */
  const bestAttempt = useMemo<QuizAttempt | null>(() => {
    if (attempts.length === 0) return null;
    let best = attempts[0];
    for (const attempt of attempts) {
      const a = attempt.total > 0 ? attempt.score / attempt.total : 0;
      const b = best.total > 0 ? best.score / best.total : 0;
      if (a > b) best = attempt;
    }
    return best;
  }, [attempts]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-5">
      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">{t("game.eyebrow")}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {t("game.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("game.description")}
            </p>
          </div>
          {streakValue > 0 ? <FlameStreak count={streakValue} size="md" /> : null}
        </div>

        {phase.kind === "loading" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
            {t("game.loading")}
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <div className="mt-6 space-y-3 denty-card-in">
            <p className="rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
              {phase.message}
            </p>
            <button
              type="button"
              onClick={backToToday}
              className="inline-flex min-h-[2.75rem] cursor-pointer items-center justify-center rounded-[16px] border border-white/14 bg-white/30 px-5 py-2 text-sm font-semibold text-[rgba(10,22,40,0.78)] transition hover:bg-white/45"
            >
              {t("common.try_again")}
            </button>
          </div>
        ) : null}

        {phase.kind === "already-played" ? (
          <AlreadyPlayedView
            today={phase.today}
            resetIn={resetIn}
            attempts={attempts}
            streakValue={streakValue}
          />
        ) : null}

        {phase.kind === "lobby" ? (
          <LobbyView
            today={phase.today}
            streakValue={streakValue}
            bestAttempt={bestAttempt}
            onStart={() => void startQuiz()}
          />
        ) : null}

        {phase.kind === "playing" ? (
          <PlayingView
            phase={phase}
            onPick={pickOption}
          />
        ) : null}

        {phase.kind === "submitting" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)] denty-card-in">
            {t("game.submitting")}
          </div>
        ) : null}

        {phase.kind === "results" ? (
          <ResultsView
            result={phase.result}
            onBack={backToToday}
            onViewLeaderboard={onViewLeaderboard}
          />
        ) : null}
      </section>

      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="denty-kicker">{t("game.recent_attempts")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              {t("game.recent_attempts.title")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              {t("game.recent_attempts.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAttempts()}
            disabled={attemptsLoading}
            className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-[16px] border border-white/14 bg-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.7)] transition hover:bg-white/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {attemptsLoading ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>

        {attemptsError ? (
          <p className="mt-4 rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
            {attemptsError}
          </p>
        ) : null}

        {/* Sparkline-style score timeline */}
        {attempts.length > 0 ? (
          <div className="mt-4 rounded-[20px] border border-white/12 bg-white/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.58)]">
              {t("game.history_visual")}
            </p>
            <div className="mt-3 flex h-24 items-end justify-start gap-1.5">
              {[...attempts].reverse().slice(-14).map((attempt, idx) => {
                const ratio =
                  attempt.total > 0 ? attempt.score / attempt.total : 0;
                const heightPx = Math.max(6, Math.round(ratio * 88));
                return (
                  <div
                    key={attempt.id ?? idx}
                    className="group relative flex h-full w-7 items-end"
                    title={`${attempt.score}/${attempt.total}`}
                  >
                    <div
                      className="w-full rounded-t-md bg-[linear-gradient(180deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] transition-all"
                      style={{ height: `${heightPx}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {attempts.length === 0 && !attemptsLoading ? (
            <p className="rounded-[20px] border border-dashed border-white/20 bg-white/14 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              {t("game.no_attempts")}
            </p>
          ) : null}

          {attempts.map((attempt) => {
            const pct =
              attempt.total > 0
                ? Math.round((attempt.score / attempt.total) * 100)
                : 0;
            return (
              <div
                key={attempt.id}
                className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] p-4 shadow-[0_18px_42px_rgba(7,18,34,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.5)]">
                      {formatAttemptDate(attempt.completedAt || attempt.createdAt)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                      {attempt.score} / {attempt.total}
                    </p>
                    {typeof attempt.pointsEarned === "number" ? (
                      <p className="mt-1 text-xs font-medium text-[var(--muted-foreground)]">
                        +{attempt.pointsEarned.toFixed(1)} {t("game.points_suffix")}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-4 py-2 text-sm font-semibold text-[rgba(6,83,98,0.96)]">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lobby view                                                                 */
/* -------------------------------------------------------------------------- */

function LobbyView({
  today,
  streakValue,
  bestAttempt,
  onStart,
}: {
  today: GameTodayStatus;
  streakValue: number;
  bestAttempt: QuizAttempt | null;
  onStart: () => void;
}) {
  const t = useTranslation();

  return (
    <div className="mt-6 space-y-6 denty-card-in">
      {/* Centerpiece: streak + best score */}
      <div className="rounded-[26px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(222,233,241,0.25))] p-4 text-center shadow-[0_24px_56px_rgba(7,18,34,0.1)] sm:p-6">
        <p className="denty-kicker">{t("game.todays_challenge")}</p>
        <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
          {t("game.challenge_summary")}
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t("game.challenge_hint")}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {streakValue > 0 ? (
            <FlameStreak count={streakValue} size="lg" />
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-white/40 px-5 py-3 text-sm font-semibold text-[rgba(10,22,40,0.78)]">
            <span aria-hidden>⭐</span>
            <span>
              {bestAttempt
                ? t("game.your_best", {
                    score: bestAttempt.score,
                    total: bestAttempt.total,
                  })
                : t("game.no_best_yet")}
            </span>
          </span>
        </div>
      </div>

      {/* Category preview chips */}
      <div className="rounded-[22px] border border-white/12 bg-white/22 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.6)]">
          {t("game.category_preview")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((key) => {
            const style = CATEGORY_STYLE[key];
            return (
              <span
                key={key}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm transition hover:-translate-y-[1px] hover:shadow-md ${style.chip}`}
              >
                {t(style.key)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Big start button */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={!today.canPlay}
          className="group inline-flex h-16 w-full max-w-md cursor-pointer items-center justify-center gap-3 rounded-[20px] border border-[rgba(137,219,255,0.32)] bg-[linear-gradient(135deg,rgba(12,32,54,0.96),rgba(9,68,94,0.92))] px-6 text-base font-bold uppercase tracking-[0.16em] text-white shadow-[0_24px_52px_rgba(6,17,34,0.32)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_28px_64px_rgba(6,17,34,0.42),0_0_24px_rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <span>{t("game.start_button")}</span>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 transition-transform group-hover:translate-x-1"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.55)]">
          {t("game.server_scored")}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Playing view                                                               */
/* -------------------------------------------------------------------------- */

function PlayingView({
  phase,
  onPick,
}: {
  phase: Extract<QuizPhase, { kind: "playing" }>;
  onPick: (index: number) => void;
}) {
  const t = useTranslation();
  const question = phase.questions[phase.currentIndex];
  if (!question) return null;

  const total = phase.questions.length;
  const completed = phase.answers.length;
  const progressPct = ((completed + (phase.lockedAt !== null ? 1 : 0)) / total) * 100;
  const style = CATEGORY_STYLE[question.category] ?? {
    chip: "bg-white/30 text-[rgba(10,22,40,0.7)] border-white/20",
    border: "border-l-[rgba(10,22,40,0.4)]",
    key: question.category,
  };

  return (
    // Keyed on `currentIndex` so React fully remounts the card → CSS keyframe
    // re-runs and we get a clean fade-in between questions.
    <div
      key={phase.currentIndex}
      className="mt-6 space-y-5 denty-card-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CountdownRing
            secondsLeft={phase.secondsLeft}
            totalSeconds={QUESTION_SECONDS}
            questionNumber={phase.currentIndex + 1}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.5)]">
              {t("game.question_of", {
                n: phase.currentIndex + 1,
                total,
              })}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
              {t("game.time_left")}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${style.chip}`}
        >
          {t(style.key)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card with category-coloured left border */}
      <div
        className={`rounded-[20px] border border-white/14 ${style.border} border-l-[6px] bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(222,233,241,0.22))] p-4 shadow-[0_18px_42px_rgba(7,18,34,0.1)] sm:p-5`}
      >
        <p className="text-base font-semibold leading-7 text-[var(--foreground)] sm:text-xl sm:leading-8">
          {question.prompt}
        </p>
      </div>

      {/* Option grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {question.options.map((option, index) => {
          const isSelected = phase.selectedIndex === index;
          const isPulsing = isSelected && phase.lockedAt !== null;
          const locked = phase.lockedAt !== null;
          return (
            <button
              key={`${question.id}-${index}`}
              type="button"
              disabled={locked}
              onClick={() => onPick(index)}
              className={`group flex min-h-14 w-full items-center gap-3 rounded-[18px] border px-3 py-2 text-left text-sm font-medium transition-all duration-200 sm:px-4 ${
                isSelected
                  ? "border-[rgba(7,111,133,0.6)] bg-[linear-gradient(180deg,rgba(176,224,238,0.7),rgba(154,206,224,0.4))] text-[rgba(6,83,98,0.96)] shadow-[0_18px_42px_rgba(7,18,34,0.18)]"
                  : "border-white/14 bg-white/30 text-[rgba(10,22,40,0.84)] hover:-translate-y-[2px] hover:bg-white/48 hover:shadow-[0_16px_36px_rgba(7,18,34,0.14)]"
              } ${isPulsing ? "denty-option-pulse" : ""} ${
                locked && !isSelected ? "opacity-50" : ""
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wide ${
                  isSelected
                    ? "bg-[rgba(6,83,98,0.95)] text-white"
                    : "bg-white/40 text-[rgba(10,22,40,0.7)] group-hover:bg-white/60"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="min-w-0 flex-1 wrap-break-word">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Results view                                                               */
/* -------------------------------------------------------------------------- */

function ResultsView({
  result,
  onBack,
  onViewLeaderboard,
}: {
  result: QuizAttemptResult;
  onBack: () => void;
  onViewLeaderboard?: () => void;
}) {
  const t = useTranslation();
  const points = useCountUp(result.pointsEarned, 800);

  return (
    <div className="mt-6 space-y-5 denty-card-in">
      <div className="relative overflow-hidden rounded-[28px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] p-5 text-center shadow-[0_24px_56px_rgba(7,18,34,0.12)] sm:p-8">
        <StarBurst />
        <p className="denty-kicker relative">{t("game.result")}</p>
        <p className="relative mt-4 font-bold leading-none text-[var(--foreground)]">
          <span className="text-5xl tabular-nums sm:text-7xl">{result.score}</span>
          <span className="mx-1 text-2xl text-[rgba(10,22,40,0.4)] sm:text-3xl">/</span>
          <span className="text-3xl tabular-nums text-[rgba(10,22,40,0.65)] sm:text-4xl">
            {result.total}
          </span>
        </p>
        <p className="relative mt-4 text-sm font-semibold text-[rgba(6,83,98,0.95)] sm:text-base">
          {t("game.points_earned_animated")}{" "}
          <span className="text-lg text-[var(--foreground)] tabular-nums sm:text-xl">
            +{points.toFixed(1)}
          </span>{" "}
          {t("game.points_unit")}
        </p>
        <div className="relative mt-5 flex justify-center">
          <FlameStreak count={result.streak} size="md" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-[18px] border border-white/16 bg-white/35 px-6 py-3 text-sm font-semibold text-[rgba(10,22,40,0.8)] transition hover:bg-white/55 sm:w-auto"
        >
          {t("game.back_to_lobby")}
        </button>
        {onViewLeaderboard ? (
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="inline-flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110 sm:w-auto"
          >
            {t("game.view_leaderboard")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Already-played view                                                        */
/* -------------------------------------------------------------------------- */

function AlreadyPlayedView({
  today,
  resetIn,
  attempts,
  streakValue,
}: {
  today: GameTodayStatus;
  resetIn: number;
  attempts: QuizAttempt[];
  streakValue: number;
}) {
  const t = useTranslation();

  return (
    <div className="mt-6 space-y-5 denty-card-in">
      {/* Calm "come back tomorrow" centerpiece */}
      <div className="rounded-[26px] border border-white/16 bg-[linear-gradient(180deg,rgba(248,250,252,0.66),rgba(226,232,240,0.32))] p-5 text-center shadow-[0_20px_48px_rgba(7,18,34,0.08)] sm:p-7">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/55 text-[rgba(10,22,40,0.7)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">
          {t("game.come_back_tomorrow")}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.55)]">
          {t("game.next_quiz_in")}
        </p>
        <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-[var(--foreground)]">
          {formatCountdown(resetIn)}
        </p>
        {streakValue > 0 ? (
          <div className="mt-5 flex justify-center">
            <FlameStreak count={streakValue} size="md" />
          </div>
        ) : null}
      </div>

      {today.todayScore ? (
        <div className="rounded-[22px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.42),rgba(154,206,224,0.25))] p-5 shadow-[0_14px_32px_rgba(7,18,34,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.78)]">
            {t("game.todays_recap")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {today.todayScore.score} / {today.todayScore.total}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
            {t("game.points_earned_today", {
              points: today.todayScore.pointsEarned.toFixed(1),
              when: formatAttemptDate(today.todayScore.completedAt),
            })}
          </p>
        </div>
      ) : null}

      {/* Mini sparkline of last attempts even on already-played day */}
      {attempts.length > 0 ? (
        <div className="rounded-[20px] border border-white/12 bg-white/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.58)]">
            {t("game.history_visual")}
          </p>
          <div className="mt-3 flex h-16 items-end justify-start gap-1.5">
            {[...attempts].reverse().slice(-14).map((attempt, idx) => {
              const ratio =
                attempt.total > 0 ? attempt.score / attempt.total : 0;
              const heightPx = Math.max(6, Math.round(ratio * 56));
              return (
                <div
                  key={attempt.id ?? idx}
                  className="flex h-full w-7 items-end"
                  title={`${attempt.score}/${attempt.total}`}
                >
                  <div
                    className="w-full rounded-t-md bg-[linear-gradient(180deg,rgba(12,32,54,0.92),rgba(9,68,94,0.88))]"
                    style={{ height: `${heightPx}px` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
