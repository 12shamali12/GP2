import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";

export type QuizCategory =
  | "anatomy"
  | "caries"
  | "periodontics"
  | "endodontics"
  | "oral-surgery";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  category: string;
};

export type QuizAttempt = {
  id: string;
  score: number;
  total: number;
  completedAt: string;
  createdAt: string;
};

/**
 * Fetches the 15 quiz questions exposed by the backend.
 * Note: the backend deliberately strips `correctIndex` from the payload.
 * For the demo, scoring is done client-side using the questions in
 * `@/features/game/lib/questions`. Production would score on the backend.
 */
export const getQuizQuestions = (): Promise<QuizQuestion[]> =>
  httpJson<QuizQuestion[]>("/game/questions", { headers: authHeaders() });

/**
 * Returns the authenticated doctor's last 20 quiz attempts.
 */
export const getMyAttempts = (): Promise<QuizAttempt[]> =>
  httpJson<QuizAttempt[]>("/game/my-attempts", { headers: authHeaders() });

/**
 * Persists a completed quiz attempt. The backend uses the (score, total)
 * to bump the doctor's `quizPoints` contribution to the leaderboard.
 */
export const submitQuizAttempt = (body: {
  score: number;
  total: number;
}): Promise<QuizAttempt> =>
  httpJson<QuizAttempt>("/game/quiz-attempt", {
    method: "POST",
    headers: authHeaders(),
    body,
  });
