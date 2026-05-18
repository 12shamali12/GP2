import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";

/**
 * Fetches the academic leaderboard snapshot from `/profiles/leaderboard`.
 *
 * Shared between the admin leaderboard page and the doctor/supervisor
 * shells so every role consumes the exact same payload shape.
 */
export const getLeaderboardSnapshot = (): Promise<LeaderboardSnapshot> =>
  httpJson<LeaderboardSnapshot>("/profiles/leaderboard", {
    headers: { ...authHeaders() },
  });
