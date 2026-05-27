import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";

/**
 * Smile-streak API client. Mirrors the frontend storage types but the server
 * is authoritative — score is recomputed from the booleans server-side so a
 * tampered client can't inflate its leaderboard standing.
 */

export type SmileHabits = {
  flossed: boolean;
  mouthwash: boolean;
  water: boolean;
};

export type SmileEntry = {
  date: string;
  score: number;
  habits: SmileHabits;
  brushingPatternDone: boolean;
};

export type SmileBadgeId =
  | "first-checkin"
  | "streak-3"
  | "streak-7"
  | "streak-30";

export type SmileStreakSnapshot = {
  entries: SmileEntry[];
  streak: number;
  bestStreak: number;
  badgesEarned: SmileBadgeId[];
  cumulative: number;
  hasCheckedInToday: boolean;
};

export type SmileLeaderboardEntry = {
  rank: number;
  patient: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  cumulative: number;
  checkinCount: number;
  streak: number;
  bestStreak: number;
  lastCheckinAt: string | null;
};

export type SmileLeaderboardSnapshot = {
  generatedAt: string;
  entries: SmileLeaderboardEntry[];
};

export type SmileCheckinPayload = {
  dateKey: string;
  brushingPatternDone: boolean;
  flossed: boolean;
  mouthwash: boolean;
  water: boolean;
};

export const getSmileStreak = (): Promise<SmileStreakSnapshot> =>
  httpJson<SmileStreakSnapshot>("/smile-streak/me", {
    headers: authHeaders(),
  });

export const submitSmileCheckin = (
  payload: SmileCheckinPayload,
): Promise<SmileStreakSnapshot> =>
  httpJson<SmileStreakSnapshot>("/smile-streak/checkin", {
    method: "POST",
    headers: authHeaders(),
    body: payload,
  });

export const importSmileCheckins = (
  entries: SmileCheckinPayload[],
): Promise<SmileStreakSnapshot> =>
  httpJson<SmileStreakSnapshot>("/smile-streak/import", {
    method: "POST",
    headers: authHeaders(),
    body: { entries },
  });

export const getSmileLeaderboard = (): Promise<SmileLeaderboardSnapshot> =>
  httpJson<SmileLeaderboardSnapshot>("/smile-streak/leaderboard", {
    headers: authHeaders(),
  });
