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
import { ApiError } from "@/lib/api/http";
import { useToast } from "@/features/ui/components/toast-provider";

const panelInnerClass =
  "overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-6 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:p-7";

const CATEGORY_LABEL: Record<string, string> = {
  anatomy: "Anatomy",
  caries: "Caries",
  periodontics: "Periodontics",
  endodontics: "Endodontics",
  "oral-surgery": "Oral surgery",
};

/** Total seconds allowed per question. The backend enforces the cap too. */
const QUESTION_SECONDS = 30;

/** Recompute the countdown tick interval. */
const COUNTDOWN_MS = 250;

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
    }
  | { kind: "submitting"; today: GameTodayStatus }
  | {
      kind: "results";
      today: GameTodayStatus;
      result: QuizAttemptResult;
    };

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

function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

export function GameSurface() {
  const { pushToast } = useToast();

  const [phase, setPhase] = useState<QuizPhase>({ kind: "loading" });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState<number>(0);

  // Per-question countdown timer, kept in a ref so cleanup is trivial.
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Daily reset countdown timer.
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Daily-reset countdown (only meaningful when we have a `resetAt`)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Per-question timer
  // ---------------------------------------------------------------------------

  const clearQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  // Always clean up on unmount.
  useEffect(() => clearQuestionTimer, [clearQuestionTimer]);

  /**
   * Lock the current answer (or `-1` for "time expired") and advance to the
   * next question. When all 10 are recorded, transition into `submitting`
   * and post to the backend.
   */
  const lockAnswer = useCallback(
    (selectedIndex: number) => {
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
        };
      });
    },
    [],
  );

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
          // Time expired -> count as a wrong answer.
          // We schedule the lock via a microtask so we don't mutate inside
          // setState directly; lockAnswer reads the latest state.
          queueMicrotask(() => lockAnswer(-1));
          return { ...prev, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: left };
      });
    }, COUNTDOWN_MS);

    return clearQuestionTimer;
    // We re-arm whenever the active question changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase.kind,
    phase.kind === "playing" ? phase.currentIndex : -1,
    phase.kind === "playing" ? phase.questionStartedAt : 0,
    clearQuestionTimer,
    lockAnswer,
  ]);

  // ---------------------------------------------------------------------------
  // Submit attempt when transitioning into `submitting`
  // ---------------------------------------------------------------------------

  // Stash the answers for the in-flight submission across the state transition.
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
          // Already played somewhere else (different tab) — refresh.
          void loadToday();
          return;
        }

        // Soft fall-back: show the error state so the doctor isn't stuck.
        setPhase({ kind: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [phase, pushToast, refreshAttempts, loadToday]);

  // ---------------------------------------------------------------------------
  // Best-effort "leave page during quiz" guard
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase.kind !== "playing") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase.kind]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

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
        // Backend says we've already played — re-sync.
        void loadToday();
        return;
      }
      setPhase({ kind: "error", message });
    }
  }, [phase, pushToast, loadToday]);

  const submitSelection = useCallback(() => {
    if (phase.kind !== "playing" || phase.selectedIndex === null) return;
    lockAnswer(phase.selectedIndex);
  }, [phase, lockAnswer]);

  const backToToday = useCallback(() => {
    void loadToday();
  }, [loadToday]);

  // ---------------------------------------------------------------------------
  // Derived view-model
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">Daily knowledge quiz</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Toothy daily quiz
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              Ten timed questions, 30 seconds each. Server-scored. One run per
              day per doctor — keep the streak going.
            </p>
          </div>
          {streakValue > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(234,88,12,0.3)] bg-[rgba(254,215,170,0.4)] px-4 py-2 text-sm font-semibold text-[rgba(124,45,18,0.95)] shadow-[0_12px_28px_rgba(124,45,18,0.12)]">
              <span aria-hidden>🔥</span>
              <span>{streakValue}-day streak</span>
            </span>
          ) : null}
        </div>

        {phase.kind === "loading" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
            Loading today's quiz...
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
              {phase.message}
            </p>
            <button
              type="button"
              onClick={backToToday}
              className="inline-flex min-h-[2.75rem] cursor-pointer items-center justify-center rounded-[16px] border border-white/14 bg-white/30 px-5 py-2 text-sm font-semibold text-[rgba(10,22,40,0.78)] transition hover:bg-white/45"
            >
              Try again
            </button>
          </div>
        ) : null}

        {phase.kind === "already-played" ? (
          <div className="mt-6 space-y-5">
            {phase.today.todayScore ? (
              <div className="rounded-[24px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] px-5 py-5 shadow-[0_18px_42px_rgba(7,18,34,0.1)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.78)]">
                  Today's run
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  {phase.today.todayScore.score} / {phase.today.todayScore.total}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  Earned {phase.today.todayScore.pointsEarned.toFixed(1)}{" "}
                  leaderboard points · finished{" "}
                  {formatAttemptDate(phase.today.todayScore.completedAt)}.
                </p>
              </div>
            ) : (
              <div className="rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
                You've already played today.
              </div>
            )}

            <div className="rounded-[20px] border border-white/12 bg-white/24 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.58)]">
                Next quiz unlocks in
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[var(--foreground)]">
                {formatCountdown(resetIn)}
              </p>
            </div>
          </div>
        ) : null}

        {phase.kind === "lobby" ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-[24px] border border-white/12 bg-white/24 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.58)]">
                Today's challenge
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                10 questions · 30 seconds each
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Once you start, you can't pause. Wrong answer if the timer
                expires.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void startQuiz()}
                className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110"
              >
                Play today's quiz
              </button>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
                Server-scored | one attempt per day
              </span>
            </div>
          </div>
        ) : null}

        {phase.kind === "playing"
          ? (() => {
              const question = phase.questions[phase.currentIndex];
              if (!question) return null;
              const total = phase.questions.length;
              const completed = phase.answers.length;
              const progressPct = (completed / total) * 100;
              const seconds = Math.ceil(phase.secondsLeft);
              const inDanger = seconds <= 5;
              const timerPct = (phase.secondsLeft / QUESTION_SECONDS) * 100;

              return (
                <div className="mt-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                      Q {phase.currentIndex + 1} / {total}
                    </span>
                    <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.96)]">
                      {categoryLabel(question.category)}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.58)]">
                        Time left
                      </span>
                      <span
                        className={`font-mono text-2xl font-semibold ${
                          inDanger
                            ? "text-rose-600"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {seconds}s
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                          inDanger
                            ? "bg-rose-500"
                            : "bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))]"
                        }`}
                        style={{ width: `${timerPct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xl font-semibold leading-8 text-[var(--foreground)]">
                    {question.prompt}
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    {question.options.map((option, index) => {
                      const isSelected = phase.selectedIndex === index;
                      return (
                        <button
                          key={`${question.id}-${index}`}
                          type="button"
                          onClick={() =>
                            setPhase((prev) =>
                              prev.kind === "playing"
                                ? { ...prev, selectedIndex: index }
                                : prev,
                            )
                          }
                          className={`rounded-[20px] border px-4 py-3 text-left text-sm font-medium transition ${
                            isSelected
                              ? "border-[rgba(7,111,133,0.5)] bg-[linear-gradient(180deg,rgba(176,224,238,0.6),rgba(154,206,224,0.32))] text-[rgba(6,83,98,0.96)] shadow-[0_18px_42px_rgba(7,18,34,0.12)]"
                              : "border-white/12 bg-white/28 text-[rgba(10,22,40,0.82)] hover:bg-white/42"
                          }`}
                        >
                          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={submitSelection}
                      disabled={phase.selectedIndex === null}
                      className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phase.currentIndex + 1 === total
                        ? "Finish quiz"
                        : "Lock answer"}
                    </button>
                  </div>
                </div>
              );
            })()
          : null}

        {phase.kind === "submitting" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
            Submitting your attempt to the server...
          </div>
        ) : null}

        {phase.kind === "results" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] px-5 py-5 shadow-[0_18px_42px_rgba(7,18,34,0.1)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.78)]">
                Result
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                You scored {phase.result.score} / {phase.result.total}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                Earned {phase.result.pointsEarned.toFixed(1)} leaderboard
                points from this attempt.
              </p>
              <p className="mt-1 text-sm leading-7 text-[var(--muted-foreground)]">
                New streak: <span aria-hidden>🔥</span>{" "}
                {phase.result.streak}-day streak.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={backToToday}
                className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110"
              >
                Back to today
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="denty-kicker">Recent attempts</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              Your last quizzes
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              The server stores every attempt and uses them to compute your
              leaderboard standing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAttempts()}
            disabled={attemptsLoading}
            className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-[16px] border border-white/14 bg-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.7)] transition hover:bg-white/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {attemptsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {attemptsError ? (
          <p className="mt-4 rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
            {attemptsError}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          {attempts.length === 0 && !attemptsLoading ? (
            <p className="rounded-[20px] border border-dashed border-white/20 bg-white/14 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              No attempts yet. Play a round to populate your history.
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
                        +{attempt.pointsEarned.toFixed(1)} leaderboard points
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
