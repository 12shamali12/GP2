import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { ArcadeGameType, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthUser } from "../auth/jwt-payload";
import { SubmitArcadeScoreDto } from "./dto";

// ---------------------------------------------------------------------------
// Arcade module — patient-only competitive games, one attempt per game per
// Amman day. Each game type has its own leaderboard ranked by best score.
// Difficulty (streakLevel) is derived from consecutive day-plays of the same
// game; the client reads this from /arcade/today to scale spawns/speed.
// ---------------------------------------------------------------------------

const AMMAN_OFFSET_MS = 3 * 60 * 60 * 1000;

function ammanDateKey(d: Date = new Date()): string {
  return new Date(d.getTime() + AMMAN_OFFSET_MS).toISOString().slice(0, 10);
}

function previousDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function gameTestMode(): boolean {
  return process.env.GAME_TEST_MODE === "true";
}

const ALL_GAMES: ArcadeGameType[] = [
  ArcadeGameType.PLAQUE_BLASTER,
  ArcadeGameType.TOOTH_DEFENDER,
  ArcadeGameType.FLOSS_RUSH,
];

// Count consecutive Amman days, ending at today/yesterday, with attempts for
// this game type. Same shape as the quiz streak — keeps UX consistent.
function computeStreak(dateKeys: Set<string>, todayKey: string): number {
  if (dateKeys.size === 0) return 0;
  const yesterday = previousDay(todayKey);
  let anchor: string;
  if (dateKeys.has(todayKey)) anchor = todayKey;
  else if (dateKeys.has(yesterday)) anchor = yesterday;
  else return 0;
  let count = 0;
  let cursor = anchor;
  while (dateKeys.has(cursor)) {
    count += 1;
    cursor = previousDay(cursor);
  }
  return count;
}

@Injectable()
export class ArcadeService {
  constructor(private readonly prisma: PrismaService) {}

  private requirePatient(user: AuthUser) {
    if (user.role !== Role.PATIENT) {
      throw new ForbiddenException(
        "Arcade games are patient-only.",
      );
    }
  }

  /**
   * Snapshot per game: canPlay (false if today already played), best score,
   * current streak, and the streakLevel the next attempt would be at.
   */
  async getTodayStatus(user: AuthUser) {
    this.requirePatient(user);
    const todayKey = ammanDateKey();

    const attempts = await this.prisma.arcadeAttempt.findMany({
      where: { patientId: user.id },
      select: { gameType: true, score: true, dateKey: true },
    });

    return ALL_GAMES.map((gameType) => {
      const mine = attempts.filter((a) => a.gameType === gameType);
      const dateKeys = new Set(mine.map((a) => a.dateKey));
      const bestScore = mine.reduce(
        (acc, a) => (a.score > acc ? a.score : acc),
        0,
      );
      const streak = computeStreak(dateKeys, todayKey);
      const playedToday = dateKeys.has(todayKey);
      // Next attempt's difficulty: if you've played today, the level you
      // already locked in stays; otherwise it's streak + 1 (a new day extends
      // the streak by one) capped at 10 so the curve stays playable.
      const nextLevel = Math.min(10, Math.max(1, playedToday ? streak : streak + 1));
      return {
        gameType,
        canPlay: gameTestMode() ? true : !playedToday,
        bestScore,
        streak,
        nextLevel,
      };
    });
  }

  /**
   * Submit a new score. Enforces one attempt per Amman-day per game UNLESS
   * GAME_TEST_MODE=true, in which case the latest score wins (last-write).
   */
  async submitScore(user: AuthUser, dto: SubmitArcadeScoreDto) {
    this.requirePatient(user);
    const todayKey = ammanDateKey();

    if (!gameTestMode()) {
      const existing = await this.prisma.arcadeAttempt.findUnique({
        where: {
          patientId_gameType_dateKey: {
            patientId: user.id,
            gameType: dto.gameType,
            dateKey: todayKey,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          "You've already played this game today. Come back tomorrow!",
        );
      }
    }

    // Derive the streak this attempt was started at: the user's current
    // streak BEFORE today's play.
    const past = await this.prisma.arcadeAttempt.findMany({
      where: { patientId: user.id, gameType: dto.gameType },
      select: { dateKey: true, score: true },
    });
    const dateKeys = new Set(past.map((a) => a.dateKey));
    const currentStreak = computeStreak(dateKeys, todayKey);
    const startedAtLevel = Math.min(
      10,
      Math.max(1, dateKeys.has(todayKey) ? currentStreak : currentStreak + 1),
    );

    const attempt = await this.prisma.arcadeAttempt.upsert({
      where: {
        patientId_gameType_dateKey: {
          patientId: user.id,
          gameType: dto.gameType,
          dateKey: todayKey,
        },
      },
      create: {
        patientId: user.id,
        gameType: dto.gameType,
        dateKey: todayKey,
        score: dto.score,
        streakLevel: startedAtLevel,
        durationMs: dto.durationMs ?? 0,
      },
      // Test mode replays: keep the highest score for the day so the
      // leaderboard reflects best, not most recent.
      update: {
        score: Math.max(
          dto.score,
          past.find((a) => a.dateKey === todayKey)?.score ?? 0,
        ),
        durationMs: dto.durationMs ?? 0,
      },
    });

    // Recompute streak with today included.
    dateKeys.add(todayKey);
    const newStreak = computeStreak(dateKeys, todayKey);
    const bestScore = Math.max(
      attempt.score,
      ...past.filter((a) => a.dateKey !== todayKey).map((a) => a.score),
      0,
    );

    return {
      attemptId: attempt.id,
      score: attempt.score,
      isNewBest: attempt.score >= bestScore,
      bestScore,
      streak: newStreak,
      streakLevel: startedAtLevel,
    };
  }

  /**
   * Per-game leaderboard ranked by best score per patient. Patients with no
   * attempts are still included (score=0) so a brand-new player sees their
   * rank immediately.
   */
  async getLeaderboard(gameType: ArcadeGameType) {
    const now = new Date();
    const todayKey = ammanDateKey(now);

    const patients = await this.prisma.user.findMany({
      where: {
        role: Role.PATIENT,
        blocked: false,
        OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        arcadeAttempts: {
          where: { gameType },
          select: { score: true, dateKey: true, completedAt: true },
        },
      },
    });

    const rows = patients.map((p) => {
      const attempts = p.arcadeAttempts;
      const bestScore = attempts.reduce(
        (acc, a) => (a.score > acc ? a.score : acc),
        0,
      );
      const dateKeys = new Set(attempts.map((a) => a.dateKey));
      const streak = computeStreak(dateKeys, todayKey);
      const lastPlayedAt = attempts.reduce<Date | null>(
        (acc, a) => (acc == null || a.completedAt > acc ? a.completedAt : acc),
        null,
      );
      return {
        patient: {
          id: p.id,
          name: p.name,
          username: p.username,
          avatar: p.avatar,
        },
        bestScore,
        attempts: attempts.length,
        streak,
        lastPlayedAt: lastPlayedAt ? lastPlayedAt.toISOString() : null,
      };
    });

    rows.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.attempts - a.attempts;
    });

    return {
      gameType,
      generatedAt: now.toISOString(),
      entries: rows.map((r, i) => ({ rank: i + 1, ...r })),
    };
  }
}
