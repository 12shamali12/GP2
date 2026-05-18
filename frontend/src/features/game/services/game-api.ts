import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";

/**
 * Game API client.
 *
 * The backend is authoritative for both questions and scoring: the daily
 * questions payload deliberately omits `correctIndex`, and the score is
 * computed server-side when the attempt is submitted. The doctor may play
 * exactly once per UTC-rolling day; further calls return `409 Conflict`.
 */

export type QuizCategory = string;

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  category: QuizCategory;
};

export type QuizAttemptAnswer = {
  questionId: string;
  /** Index of the chosen option (0..3). Use `-1` for "no answer / timer expired". */
  selectedIndex: number;
  /** Milliseconds spent on this question, clamped to the 30s window by the backend. */
  timeMs: number;
};

export type TodayScore = {
  score: number;
  total: number;
  pointsEarned: number;
  completedAt: string;
};

export type GameTodayStatus = {
  canPlay: boolean;
  todayScore?: TodayScore;
  /** Current consecutive-day play streak. 0 if the doctor has never played. */
  streak: number;
  /** ISO timestamp when the daily quiz window resets. */
  resetAt: string;
};

export type QuizAttempt = {
  id: string;
  score: number;
  total: number;
  pointsEarned?: number;
  completedAt: string;
  /** Some legacy callers used `createdAt`; we keep it optional for safety. */
  createdAt?: string;
};

export type QuizAttemptResult = {
  score: number;
  total: number;
  pointsEarned: number;
  streak: number;
  attemptId: string;
  completedAt: string;
};

export type GameLeaderboardDoctor = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  doctorIdNumber?: string | null;
  semester?: {
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  } | null;
};

export type GameLeaderboardEntry = {
  rank: number;
  doctor: GameLeaderboardDoctor;
  totalQuizPoints: number;
  attempts: number;
  bestScore: number;
  averageScore: number;
  streak: number;
  lastPlayedAt: string | null;
};

export type GameLeaderboardSnapshot = {
  generatedAt: string;
  entries: GameLeaderboardEntry[];
};

/**
 * Returns whether the doctor can play right now plus today's score (if any),
 * current streak, and the timestamp when the daily window resets.
 */
export const getToday = (): Promise<GameTodayStatus> =>
  httpJson<GameTodayStatus>("/game/today", { headers: authHeaders() });

/**
 * Pulls the 10 questions for today's quiz. The backend omits `correctIndex`
 * — scoring happens server-side once `submitQuizAttempt` is called.
 *
 * Throws `ApiError` with status `409` if the doctor has already played today.
 */
export const getDailyQuestions = (): Promise<QuizQuestion[]> =>
  httpJson<QuizQuestion[]>("/game/daily-questions", { headers: authHeaders() });

/**
 * Submits a completed quiz attempt and returns the server-computed result.
 *
 * Throws `ApiError` with status `409` if the doctor has already played today.
 */
export const submitQuizAttempt = (body: {
  answers: QuizAttemptAnswer[];
}): Promise<QuizAttemptResult> =>
  httpJson<QuizAttemptResult>("/game/quiz-attempt", {
    method: "POST",
    headers: authHeaders(),
    body,
  });

/**
 * Returns the authenticated doctor's recent quiz attempts (newest first).
 */
export const getMyAttempts = (): Promise<QuizAttempt[]> =>
  httpJson<QuizAttempt[]>("/game/my-attempts", { headers: authHeaders() });

/**
 * Returns the game-specific leaderboard, ranked by `totalQuizPoints`.
 */
export const getGameLeaderboard = (): Promise<GameLeaderboardSnapshot> =>
  httpJson<GameLeaderboardSnapshot>("/game/leaderboard", {
    headers: authHeaders(),
  });
