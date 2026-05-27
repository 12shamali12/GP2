import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";

/**
 * Arcade API client — patient competitive games.
 *
 * Three games share this client; the backend disambiguates with `gameType`.
 * Daily lock is enforced server-side; the client just renders state.
 */

export type ArcadeGameType =
  | "PLAQUE_BLASTER"
  | "TOOTH_DEFENDER"
  | "FLOSS_RUSH";

export type ArcadeTodayEntry = {
  gameType: ArcadeGameType;
  canPlay: boolean;
  bestScore: number;
  streak: number;
  nextLevel: number;
};

export type SubmitArcadeScorePayload = {
  gameType: ArcadeGameType;
  score: number;
  durationMs?: number;
};

export type SubmitArcadeScoreResponse = {
  attemptId: string;
  score: number;
  isNewBest: boolean;
  bestScore: number;
  streak: number;
  streakLevel: number;
};

export type ArcadeLeaderboardEntry = {
  rank: number;
  patient: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  bestScore: number;
  attempts: number;
  streak: number;
  lastPlayedAt: string | null;
};

export type ArcadeLeaderboardSnapshot = {
  gameType: ArcadeGameType;
  generatedAt: string;
  entries: ArcadeLeaderboardEntry[];
};

export const getArcadeToday = (): Promise<ArcadeTodayEntry[]> =>
  httpJson<ArcadeTodayEntry[]>("/arcade/today", { headers: authHeaders() });

export const submitArcadeScore = (
  payload: SubmitArcadeScorePayload,
): Promise<SubmitArcadeScoreResponse> =>
  httpJson<SubmitArcadeScoreResponse>("/arcade/score", {
    method: "POST",
    headers: authHeaders(),
    body: payload,
  });

export const getArcadeLeaderboard = (
  gameType: ArcadeGameType,
): Promise<ArcadeLeaderboardSnapshot> =>
  httpJson<ArcadeLeaderboardSnapshot>("/arcade/leaderboard", {
    headers: authHeaders(),
    query: { game: gameType },
  });
