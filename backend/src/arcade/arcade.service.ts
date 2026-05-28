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

/**
 * Score thresholds to unlock each level. Index 0 is the threshold for
 * unlocking Level 2 — and importantly the score must be earned WHILE PLAYING
 * Level 1, not just any best ever. So:
 *   - thresholds[0] = score required AT Level 1 to unlock Level 2
 *   - thresholds[1] = score required AT Level 2 to unlock Level 3
 *   - ...
 *   - thresholds[8] = score required AT Level 9 to unlock Level 10
 *
 * Unlocks are strictly sequential: you cannot skip levels by scoring high at
 * a lower level. You must climb one at a time.
 */
const LEVEL_THRESHOLDS: Record<ArcadeGameType, number[]> = {
  // Plaque Blaster — 30s round. Hard but reachable curve: low Lv 1 bar so
  // anyone gets through the first unlock, then steady steps that demand
  // genuine improvement to keep climbing. Index 9 is the Lv 11 unlock.
  PLAQUE_BLASTER: [200, 350, 500, 700, 900, 1150, 1400, 1700, 2000, 2400],
  // Tooth Defender — open-ended. Each tier asks for a longer kill chain
  // without breaching the tooth. Lowered another 10% (now ~28% off the
  // original curve) so the early levels click without too many runs.
  // Index 9 is the Lv 11 (endless) unlock.
  TOOTH_DEFENDER: [360, 720, 1200, 1800, 2500, 3450, 4550, 5750, 7200, 9000],
  // Floss Rush — score + distance, dies on first sugar. Slower ramp early,
  // steeper at the top. Index 9 is the Lv 11 (endless) unlock.
  FLOSS_RUSH: [200, 500, 900, 1400, 2000, 2700, 3500, 4500, 5800, 7200],
};

/**
 * Sticky sequential unlock. Two rules combine so unlocks never regress:
 *   1. STICKY FLOOR — once you've ever played Level N (any score), Level N
 *      stays unlocked forever. Stops a later threshold bump from kicking
 *      you back down.
 *   2. THRESHOLD EXTENSION — from the floor, scoring `thresholds[i]` at
 *      Level i+1 unlocks Level i+2 (sequential, no skipping).
 */
/** Total level count (1..11). Level 11 is the endless "open" mode. */
const MAX_LEVEL = 11;

function computeUnlockedLevel(
  gameType: ArcadeGameType,
  bestScorePerLevel: number[],
): number {
  const thresholds = LEVEL_THRESHOLDS[gameType];
  // Sticky floor: highest level the patient has ever played at (any score).
  // Any non-zero slot means they completed at least one round at that level.
  let unlocked = 1;
  for (let i = 0; i < MAX_LEVEL; i += 1) {
    if ((bestScorePerLevel[i] ?? 0) > 0) {
      unlocked = Math.max(unlocked, i + 1);
    }
  }
  // Sequential extension: starting from the floor, see how far the player
  // has climbed by hitting the per-level threshold.
  for (let i = unlocked - 1; i < thresholds.length; i += 1) {
    if ((bestScorePerLevel[i] ?? 0) >= thresholds[i]) {
      unlocked = i + 2;
    } else {
      break;
    }
  }
  return Math.min(MAX_LEVEL, unlocked);
}

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
      select: { gameType: true, score: true, dateKey: true, streakLevel: true },
    });

    return ALL_GAMES.map((gameType) => {
      const mine = attempts.filter((a) => a.gameType === gameType);
      const dateKeys = new Set(mine.map((a) => a.dateKey));
      const bestScore = mine.reduce(
        (acc, a) => (a.score > acc ? a.score : acc),
        0,
      );
      // Per-level best score, indexed 0..9 for levels 1..10. Lets the hub
      // card show "Best at Level N: 1,200" when the patient picks a level,
      // and drives the sequential unlock computation below.
      const bestScorePerLevel = Array<number>(MAX_LEVEL).fill(0);
      for (const a of mine) {
        const lv = Math.max(1, Math.min(MAX_LEVEL, a.streakLevel)) - 1;
        if (a.score > bestScorePerLevel[lv]) bestScorePerLevel[lv] = a.score;
      }
      const streak = computeStreak(dateKeys, todayKey);
      const playedToday = dateKeys.has(todayKey);
      const unlockedLevel = computeUnlockedLevel(gameType, bestScorePerLevel);
      // Next threshold = score needed AT the currently unlocked level to
      // unlock the level after it. (e.g. unlocked=3 → need thresholds[2]
      // at Level 3 to unlock Level 4.) Null if at Level 10.
      const nextThreshold =
        unlockedLevel >= MAX_LEVEL
          ? null
          : LEVEL_THRESHOLDS[gameType][unlockedLevel - 1];
      return {
        gameType,
        canPlay: gameTestMode() ? true : !playedToday,
        bestScore,
        bestScorePerLevel,
        streak,
        unlockedLevel,
        nextThreshold,
        thresholds: LEVEL_THRESHOLDS[gameType],
      };
    });
  }

  /**
   * Submit a new score. Enforces one attempt per Amman-day per game UNLESS
   * GAME_TEST_MODE=true, in which case the latest score wins (last-write).
   * The chosen level must be ≤ the patient's currently unlocked level.
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

    const past = await this.prisma.arcadeAttempt.findMany({
      where: { patientId: user.id, gameType: dto.gameType },
      select: { dateKey: true, score: true, streakLevel: true },
    });
    // Build the prior per-level best table so we can compute unlocks
    // sequentially (a 9999 at L1 still only unlocks L2).
    const prevBestPerLevel = Array<number>(MAX_LEVEL).fill(0);
    for (const a of past) {
      const lv = Math.max(1, Math.min(MAX_LEVEL, a.streakLevel)) - 1;
      if (a.score > prevBestPerLevel[lv]) prevBestPerLevel[lv] = a.score;
    }
    const prevBest = past.reduce(
      (acc, a) => (a.score > acc ? a.score : acc),
      0,
    );
    const unlockedBefore = computeUnlockedLevel(
      dto.gameType,
      prevBestPerLevel,
    );
    // Player picks their level from the unlocked range; we trust the DTO
    // but clamp defensively so a tampered client can't play Level 10 cold.
    const startedAtLevel = Math.min(
      unlockedBefore,
      Math.max(1, dto.level ?? unlockedBefore),
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
        streakLevel: startedAtLevel,
      },
    });

    // Re-compute the per-level table with this attempt folded in, then
    // derive the new unlocked level. Crucially, only the slot for
    // startedAtLevel gets updated — earning Level 10 at Level 3 doesn't
    // shortcut the climb.
    const newBestPerLevel = prevBestPerLevel.slice();
    const idx = startedAtLevel - 1;
    if (attempt.score > newBestPerLevel[idx]) newBestPerLevel[idx] = attempt.score;
    const newBest = Math.max(prevBest, attempt.score);
    const unlockedAfter = computeUnlockedLevel(
      dto.gameType,
      newBestPerLevel,
    );
    const newLevelUnlocked = unlockedAfter > unlockedBefore;

    return {
      attemptId: attempt.id,
      score: attempt.score,
      isNewBest: attempt.score >= newBest,
      bestScore: newBest,
      playedAtLevel: startedAtLevel,
      unlockedLevel: unlockedAfter,
      newLevelUnlocked,
      // If still climbing, surface the next threshold so the celebration
      // can read "1500 more at Level N to unlock Level N+1".
      nextThreshold:
        unlockedAfter >= MAX_LEVEL
          ? null
          : LEVEL_THRESHOLDS[dto.gameType][unlockedAfter - 1],
    };
  }

  /**
   * Per-game leaderboard ranked by best score per patient. When `level` is
   * provided, the leaderboard is filtered to attempts played at exactly that
   * level — "best Level 5 Plaque Blaster scores" etc. Patients with no
   * attempts (or no attempts at the requested level) are excluded so the
   * board reads as actual competitors instead of a list of zeros.
   */
  async getLeaderboard(gameType: ArcadeGameType, level?: number) {
    const now = new Date();
    const todayKey = ammanDateKey(now);
    const lvFilter =
      level !== undefined ? { streakLevel: level } : {};
    const includeEmpty = level === undefined;

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
          where: { gameType, ...lvFilter },
          select: { score: true, dateKey: true, completedAt: true, streakLevel: true },
        },
      },
    });

    const rows = patients
      .map((p) => {
        const attempts = p.arcadeAttempts;
        const bestScore = attempts.reduce(
          (acc, a) => (a.score > acc ? a.score : acc),
          0,
        );
        const dateKeys = new Set(attempts.map((a) => a.dateKey));
        const streak = computeStreak(dateKeys, todayKey);
        const lastPlayedAt = attempts.reduce<Date | null>(
          (acc, a) =>
            acc == null || a.completedAt > acc ? a.completedAt : acc,
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
      })
      // When filtering by level, hide patients who never played at that
      // level so the leaderboard reads as real competitors.
      .filter((r) => (includeEmpty ? true : r.attempts > 0));

    rows.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.attempts - a.attempts;
    });

    return {
      gameType,
      level: level ?? null,
      generatedAt: now.toISOString(),
      entries: rows.map((r, i) => ({ rank: i + 1, ...r })),
    };
  }
}
