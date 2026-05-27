import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { DoctorStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthUser } from "../auth/jwt-payload";
import { SubmitQuizAttemptDto } from "./dto";

// ---------------------------------------------------------------------------
// Game module — DB-backed quiz with daily limit, server-side scoring, streaks
// ---------------------------------------------------------------------------
//
// Time-of-day handling: Asia/Amman is UTC+3 with no DST since 2022, so we
// can convert without depending on Intl/tz-aware libraries. A "day" for the
// game ends at midnight Asia/Amman; the next reset is the next midnight.
//
// Daily questions are deterministic per (doctorId, dateKey) so repeated calls
// within the same Amman-day return the SAME 10 questions in the SAME order.
// We seed a mulberry32 PRNG from a 32-bit hash of `${doctorId}|${dateKey}`
// and use it to shuffle the active question bank before slicing 10.
//
// Scoring rules:
//   - score = number of answers whose selectedIndex matches the stored
//     correctIndex of that question (server-side; client cannot cheat).
//   - pointsEarned per attempt = (score / total) * 3, but capped so that the
//     doctor's cumulative pointsEarned across all attempts never exceeds 30.
//   - One attempt allowed per Amman-day (enforced by checking for an attempt
//     whose completedAt >= today's Amman midnight).
//
// Streak: convert each attempt's completedAt to its Amman date-key and count
// consecutive days going backward from today (Amman). If today is missing but
// yesterday is present, anchor on yesterday. If yesterday is also missing the
// streak is 0.

const QUIZ_POINTS_CAP = 30;
const POINTS_PER_ATTEMPT_MAX = 3;
const DAILY_QUESTION_COUNT = 10;

/**
 * Test-mode escape hatch: when `GAME_TEST_MODE=true` (set in backend/.env),
 * the one-attempt-per-day guard is disabled so the demo flow can be exercised
 * back-to-back without waiting for Amman midnight. MUST be flipped off (or
 * unset) before any production / defense demo so streak integrity holds.
 */
function gameTestMode(): boolean {
  return process.env.GAME_TEST_MODE === "true";
}

// --- timezone helpers (Asia/Amman, UTC+3) ---------------------------------
function ammanDateKey(d: Date): string {
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return t.toISOString().slice(0, 10); // YYYY-MM-DD
}

function ammanMidnightUtc(d: Date): Date {
  // Returns the UTC instant corresponding to the most recent Amman midnight
  // at or before `d`.
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  t.setUTCHours(0, 0, 0, 0);
  return new Date(t.getTime() - 3 * 60 * 60 * 1000);
}

function ammanNextMidnight(d: Date): Date {
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  t.setUTCHours(24, 0, 0, 0);
  return new Date(t.getTime() - 3 * 60 * 60 * 1000);
}

function dateKeyToTimestamp(key: string): number {
  // YYYY-MM-DD -> ms at UTC midnight (used only for arithmetic between keys).
  return Date.parse(`${key}T00:00:00Z`);
}

// --- seeded shuffle (mulberry32) ------------------------------------------
function hash32(str: string): number {
  // FNV-1a-ish 32-bit hash; good enough for shuffle seeding (not crypto).
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: ReadonlyArray<T>, seed: number): T[] {
  const out = [...arr];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- streak ---------------------------------------------------------------
function computeStreak(dateKeys: Set<string>, todayKey: string): number {
  if (dateKeys.size === 0) return 0;

  // Anchor on today if present, else yesterday, else 0.
  const todayTs = dateKeyToTimestamp(todayKey);
  const yesterdayKey = ammanDateKey(
    new Date(todayTs - 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
  );

  let anchorKey: string;
  if (dateKeys.has(todayKey)) {
    anchorKey = todayKey;
  } else if (dateKeys.has(yesterdayKey)) {
    anchorKey = yesterdayKey;
  } else {
    return 0;
  }

  let count = 0;
  let cursorTs = dateKeyToTimestamp(anchorKey);
  while (true) {
    const key = new Date(cursorTs).toISOString().slice(0, 10);
    if (!dateKeys.has(key)) break;
    count += 1;
    cursorTs -= 24 * 60 * 60 * 1000;
  }
  return count;
}

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // GET /game/today
  // -------------------------------------------------------------------------
  async getTodayState(user: AuthUser) {
    this.requireDoctor(user);
    const now = new Date();
    const todayMidnight = ammanMidnightUtc(now);
    const todayKey = ammanDateKey(now);
    const resetAt = ammanNextMidnight(now);

    const [todayAttempt, allAttempts] = await Promise.all([
      this.prisma.quizAttempt.findFirst({
        where: {
          doctorId: user.id,
          completedAt: { gte: todayMidnight },
        },
        orderBy: { completedAt: "desc" },
      }),
      this.prisma.quizAttempt.findMany({
        where: { doctorId: user.id },
        select: { completedAt: true, score: true, total: true },
        orderBy: { completedAt: "desc" },
      }),
    ]);

    const dateKeys = new Set<string>(
      allAttempts.map((a) => ammanDateKey(a.completedAt)),
    );
    const streak = computeStreak(dateKeys, todayKey);

    const totalPointsSoFar = allAttempts.reduce((acc, a) => {
      if (!a.total || a.total <= 0) return acc;
      return acc + Math.max(0, a.score / a.total) * POINTS_PER_ATTEMPT_MAX;
    }, 0);

    let todayPointsEarned = 0;
    if (todayAttempt && todayAttempt.total > 0) {
      const raw =
        Math.max(0, todayAttempt.score / todayAttempt.total) *
        POINTS_PER_ATTEMPT_MAX;
      // Recompute as the capped contribution of *this* attempt: total at the
      // time the attempt was made, capped at the global ceiling.
      const beforeThisAttempt = totalPointsSoFar - raw;
      todayPointsEarned = Math.max(
        0,
        Math.min(QUIZ_POINTS_CAP - Math.max(0, beforeThisAttempt), raw),
      );
    }

    return {
      canPlay: gameTestMode() ? true : !todayAttempt,
      todayScore: todayAttempt
        ? {
            score: todayAttempt.score,
            total: todayAttempt.total,
            pointsEarned: Number(todayPointsEarned.toFixed(2)),
            completedAt: todayAttempt.completedAt.toISOString(),
          }
        : undefined,
      streak,
      resetAt: resetAt.toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // GET /game/daily-questions
  // -------------------------------------------------------------------------
  async getDailyQuestions(user: AuthUser) {
    this.requireDoctor(user);
    const now = new Date();
    const todayMidnight = ammanMidnightUtc(now);
    const todayKey = ammanDateKey(now);
    const resetAt = ammanNextMidnight(now);

    if (!gameTestMode()) {
      const existing = await this.prisma.quizAttempt.findFirst({
        where: { doctorId: user.id, completedAt: { gte: todayMidnight } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Already played today. Try again after ${resetAt.toISOString()}.`,
        );
      }
    }

    const bank = await this.prisma.quizQuestion.findMany({
      where: { active: true },
      orderBy: { id: "asc" }, // stable base order before seeded shuffle
    });
    if (bank.length === 0) {
      throw new BadRequestException(
        "Quiz question bank is empty. Run the seed script.",
      );
    }

    // In test mode reshuffle on every fetch so the tester sees fresh
    // questions back-to-back; in normal mode the daily seed keeps the set
    // deterministic so a refresh doesn't change the prompts mid-quiz.
    const seedKey = gameTestMode()
      ? `${user.id}|${todayKey}|${Date.now()}`
      : `${user.id}|${todayKey}`;
    const seed = hash32(seedKey);
    const shuffled = seededShuffle(bank, seed);
    const picked = shuffled.slice(0, Math.min(DAILY_QUESTION_COUNT, bank.length));

    return picked.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      category: q.category,
    }));
  }

  // -------------------------------------------------------------------------
  // POST /game/quiz-attempt
  // -------------------------------------------------------------------------
  async submitAttempt(user: AuthUser, dto: SubmitQuizAttemptDto) {
    this.requireDoctor(user);
    const now = new Date();
    const todayMidnight = ammanMidnightUtc(now);
    const todayKey = ammanDateKey(now);
    const resetAt = ammanNextMidnight(now);

    // Guard: one attempt per Amman-day (bypassed when GAME_TEST_MODE=true).
    if (!gameTestMode()) {
      const existing = await this.prisma.quizAttempt.findFirst({
        where: { doctorId: user.id, completedAt: { gte: todayMidnight } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Already played today. Try again after ${resetAt.toISOString()}.`,
        );
      }
    }

    const ids = Array.from(new Set(dto.answers.map((a) => a.questionId)));
    if (ids.length !== dto.answers.length) {
      throw new BadRequestException("Duplicate questionId in answers.");
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { id: { in: ids } },
      select: { id: true, correctIndex: true },
    });
    if (questions.length !== ids.length) {
      throw new BadRequestException(
        "One or more questionId values are invalid.",
      );
    }

    const correctById = new Map(questions.map((q) => [q.id, q.correctIndex]));
    let score = 0;
    for (const a of dto.answers) {
      if (correctById.get(a.questionId) === a.selectedIndex) score += 1;
    }
    const total = dto.answers.length;

    // Cap pointsEarned so cumulative <= 30.
    const priorAttempts = await this.prisma.quizAttempt.findMany({
      where: { doctorId: user.id },
      select: { score: true, total: true },
    });
    const prevPoints = priorAttempts.reduce((acc, a) => {
      if (!a.total || a.total <= 0) return acc;
      return acc + Math.max(0, a.score / a.total) * POINTS_PER_ATTEMPT_MAX;
    }, 0);
    const rawPoints = (score / total) * POINTS_PER_ATTEMPT_MAX;
    const pointsEarned = Math.max(
      0,
      Math.min(rawPoints, QUIZ_POINTS_CAP - Math.max(0, prevPoints)),
    );

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        doctorId: user.id,
        score,
        total,
      },
    });

    // Recompute streak (this attempt is now included).
    const allAfter = await this.prisma.quizAttempt.findMany({
      where: { doctorId: user.id },
      select: { completedAt: true },
    });
    const dateKeys = new Set<string>(
      allAfter.map((a) => ammanDateKey(a.completedAt)),
    );
    const streak = computeStreak(dateKeys, todayKey);

    return {
      attemptId: attempt.id,
      score,
      total,
      pointsEarned: Number(pointsEarned.toFixed(2)),
      streak,
      completedAt: attempt.completedAt.toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // GET /game/my-attempts
  // -------------------------------------------------------------------------
  async listMyAttempts(user: AuthUser) {
    this.requireDoctor(user);
    return this.prisma.quizAttempt.findMany({
      where: { doctorId: user.id },
      orderBy: { completedAt: "desc" },
      take: 20,
    });
  }

  // -------------------------------------------------------------------------
  // GET /game/leaderboard  — game-specific board (separate from /profiles)
  // -------------------------------------------------------------------------
  async getLeaderboard(roleFilter?: Role) {
    const now = new Date();
    const todayKey = ammanDateKey(now);
    const effectiveRole = roleFilter ?? Role.DOCTOR;

    const [doctors, attempts] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: effectiveRole,
          // Only doctors are gated by the APPROVED status; patients have no
          // such gate. Use the spread so the where clause stays clean.
          ...(effectiveRole === Role.DOCTOR
            ? { doctorStatus: DoctorStatus.APPROVED }
            : {}),
          blocked: false,
          OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          doctorIdNumber: true,
          semester: { select: { id: true, label: true } },
        },
      }),
      this.prisma.quizAttempt.findMany({
        select: {
          doctorId: true,
          score: true,
          total: true,
          completedAt: true,
        },
        orderBy: { completedAt: "asc" },
      }),
    ]);

    type Agg = {
      attempts: number;
      bestScore: number;
      totalRatio: number;
      totalRawPoints: number;
      lastPlayedAt: Date | null;
      dateKeys: Set<string>;
    };

    const aggByDoctor = new Map<string, Agg>();
    for (const a of attempts) {
      let agg = aggByDoctor.get(a.doctorId);
      if (!agg) {
        agg = {
          attempts: 0,
          bestScore: 0,
          totalRatio: 0,
          totalRawPoints: 0,
          lastPlayedAt: null,
          dateKeys: new Set<string>(),
        };
        aggByDoctor.set(a.doctorId, agg);
      }
      agg.attempts += 1;
      if (a.score > agg.bestScore) agg.bestScore = a.score;
      if (a.total > 0) {
        const ratio = a.score / a.total;
        agg.totalRatio += ratio;
        agg.totalRawPoints += Math.max(0, ratio) * POINTS_PER_ATTEMPT_MAX;
      }
      if (!agg.lastPlayedAt || a.completedAt > agg.lastPlayedAt) {
        agg.lastPlayedAt = a.completedAt;
      }
      agg.dateKeys.add(ammanDateKey(a.completedAt));
    }

    const rows = doctors.map((doctor) => {
      const agg = aggByDoctor.get(doctor.id);
      const attemptsCount = agg?.attempts ?? 0;
      const totalQuizPoints = agg
        ? Math.min(QUIZ_POINTS_CAP, agg.totalRawPoints)
        : 0;
      const averageScore = agg && agg.attempts > 0 ? agg.totalRatio / agg.attempts : null;
      const streak = agg ? computeStreak(agg.dateKeys, todayKey) : 0;
      return {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          username: doctor.username,
          avatar: doctor.avatar,
          doctorIdNumber: doctor.doctorIdNumber,
          semester: doctor.semester
            ? { id: doctor.semester.id, label: doctor.semester.label }
            : null,
        },
        totalQuizPoints: Number(totalQuizPoints.toFixed(2)),
        attempts: attemptsCount,
        bestScore: agg?.bestScore ?? 0,
        averageScore: averageScore === null ? null : Number(averageScore.toFixed(3)),
        streak,
        lastPlayedAt: agg?.lastPlayedAt ? agg.lastPlayedAt.toISOString() : null,
      };
    });

    rows.sort((a, b) => {
      if (b.totalQuizPoints !== a.totalQuizPoints) {
        return b.totalQuizPoints - a.totalQuizPoints;
      }
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.attempts - a.attempts;
    });

    return {
      generatedAt: now.toISOString(),
      entries: rows.map((r, i) => ({ rank: i + 1, ...r })),
    };
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------
  private requireDoctor(user: AuthUser) {
    // The game is open to doctors and patients. Only block roles that
    // shouldn't accrue quiz state (admin / supervisor / unauthenticated).
    if (user.role !== Role.DOCTOR && user.role !== Role.PATIENT) {
      throw new ForbiddenException(
        "Only doctors and patients can use the game endpoints.",
      );
    }
  }
}
