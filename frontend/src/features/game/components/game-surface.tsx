"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMyAttempts,
  getQuizQuestions,
  submitQuizAttempt,
  type QuizAttempt,
  type QuizQuestion,
} from "@/features/game/services/game-api";
import {
  LOCAL_QUIZ_QUESTIONS,
  QUIZ_LENGTH,
  type LocalQuizQuestion,
} from "@/features/game/lib/questions";
import { useToast } from "@/features/ui/components/toast-provider";

type Phase = "idle" | "playing" | "scoring" | "finished";

const panelInnerClass =
  "overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-6 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:p-7";

const CATEGORY_LABEL: Record<string, string> = {
  anatomy: "Anatomy",
  caries: "Caries",
  periodontics: "Periodontics",
  endodontics: "Endodontics",
  "oral-surgery": "Oral surgery",
};

/**
 * Returns up to `count` random items from `source` (Fisher-Yates partial shuffle).
 * Pure helper, kept module-local so it stays easy to unit-test later.
 */
function pickRandom<T>(source: readonly T[], count: number): T[] {
  const copy = source.slice();
  const take = Math.min(count, copy.length);
  for (let i = 0; i < take; i += 1) {
    const swap = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[swap]] = [copy[swap], copy[i]];
  }
  return copy.slice(0, take);
}

/**
 * Computes the leaderboard contribution for a given score/total using the
 * same formula the backend applies: `score/total * 3`, summed across all
 * attempts and capped at 30. Here we only report the per-attempt slice so
 * the doctor sees the immediate reward of finishing a quiz.
 */
function leaderboardPointsForAttempt(score: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((score / total) * 3).toFixed(2));
}

function formatAttemptDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function GameSurface() {
  const { pushToast } = useToast();

  // Server-fetched question metadata. Used only to confirm the backend is
  // reachable and to display the category mix. Scoring uses the local copy.
  const [serverQuestions, setServerQuestions] = useState<QuizQuestion[] | null>(
    null,
  );
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeQuestions, setActiveQuestions] = useState<LocalQuizQuestion[]>(
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -- Bootstrap -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    getQuizQuestions()
      .then((data) => {
        if (!cancelled) setServerQuestions(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Failed to reach the quiz service.";
        setQuestionsError(message);
      });
    return () => {
      cancelled = true;
    };
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
    void refreshAttempts();
  }, [refreshAttempts]);

  // -- Quiz flow -------------------------------------------------------------

  const startQuiz = useCallback(() => {
    const next = pickRandom(LOCAL_QUIZ_QUESTIONS, QUIZ_LENGTH);
    setActiveQuestions(next);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setSubmitError(null);
    setPhase("playing");
  }, []);

  const currentQuestion = activeQuestions[currentIndex] ?? null;

  const score = useMemo(() => {
    let total = 0;
    for (let i = 0; i < answers.length && i < activeQuestions.length; i += 1) {
      if (answers[i] === activeQuestions[i].correctIndex) total += 1;
    }
    return total;
  }, [answers, activeQuestions]);

  const handleAdvance = useCallback(() => {
    if (selectedOption === null || !currentQuestion) return;
    const nextAnswers = [...answers, selectedOption];
    setAnswers(nextAnswers);
    setSelectedOption(null);

    if (nextAnswers.length >= activeQuestions.length) {
      setPhase("scoring");
    } else {
      setCurrentIndex((index) => index + 1);
    }
  }, [activeQuestions.length, answers, currentQuestion, selectedOption]);

  // Submit once when we transition into scoring.
  useEffect(() => {
    if (phase !== "scoring") return;
    let cancelled = false;
    setSubmitError(null);
    submitQuizAttempt({ score, total: activeQuestions.length })
      .then((attempt) => {
        if (cancelled) return;
        setAttempts((prev) => [attempt, ...prev].slice(0, 20));
        setPhase("finished");
        pushToast({
          kind: "success",
          title: "Quiz submitted",
          description: `You scored ${score} / ${activeQuestions.length}.`,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Failed to submit the attempt.";
        setSubmitError(message);
        setPhase("finished");
        pushToast({
          kind: "error",
          title: "Quiz submission",
          description: message,
        });
      });
    return () => {
      cancelled = true;
    };
    // We intentionally only react to the phase transition; `score` and
    // `activeQuestions.length` are stable for the lifetime of the attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const playAgain = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  // -- Render ----------------------------------------------------------------

  return (
    <div className="space-y-5">
      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">Knowledge quiz</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Play the Toothy Quiz
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              Answer ten random dental questions across anatomy, caries,
              periodontics, endodontics, and oral surgery. Every attempt
              contributes to your leaderboard standing (capped at +30 across
              all attempts).
            </p>
          </div>
          {serverQuestions ? (
            <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
              {serverQuestions.length} questions live
            </span>
          ) : null}
        </div>

        {questionsError ? (
          <p className="mt-4 rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
            {questionsError}
          </p>
        ) : null}

        {phase === "idle" ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startQuiz}
              disabled={!serverQuestions && !questionsError}
              className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start quiz
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
              10 questions | client-scored for instant feedback
            </span>
          </div>
        ) : null}

        {phase === "playing" && currentQuestion ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                Question {currentIndex + 1} of {activeQuestions.length}
              </span>
              <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.96)]">
                {CATEGORY_LABEL[currentQuestion.category] ??
                  currentQuestion.category}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] transition-all duration-300"
                style={{
                  width: `${
                    ((currentIndex + (selectedOption === null ? 0 : 1)) /
                      activeQuestions.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <p className="text-xl font-semibold leading-8 text-[var(--foreground)]">
              {currentQuestion.prompt}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    onClick={() => setSelectedOption(index)}
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
                onClick={handleAdvance}
                disabled={selectedOption === null}
                className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentIndex + 1 === activeQuestions.length
                  ? "Finish quiz"
                  : "Next question"}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "scoring" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
            Submitting your attempt...
          </div>
        ) : null}

        {phase === "finished" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] px-5 py-5 shadow-[0_18px_42px_rgba(7,18,34,0.1)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.78)]">
                Result
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                You scored {score} / {activeQuestions.length}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                Earned {leaderboardPointsForAttempt(score, activeQuestions.length)} leaderboard
                points from this attempt.
              </p>
              {submitError ? (
                <p className="mt-3 rounded-[16px] border border-rose-400/30 bg-rose-100/40 px-3 py-2 text-xs font-semibold text-rose-900">
                  Could not save the attempt: {submitError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={playAgain}
                className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110"
              >
                Play again
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border border-white/14 bg-white/30 px-6 py-3 text-sm font-semibold text-[rgba(10,22,40,0.78)] transition hover:bg-white/45"
              >
                Back to lobby
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
              Your last 20 attempts as stored on the server. The leaderboard
              uses the sum of `score / total * 3` per attempt (capped at 30).
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
