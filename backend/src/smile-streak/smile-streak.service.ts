import { ForbiddenException, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthUser } from "../auth/jwt-payload";
import { SmileCheckinDto } from "./dto";

// ---------------------------------------------------------------------------
// Smile Streak — patient daily mouth-care check-in, server-backed so the
// lifetime total can drive the patient leaderboard. Date keys use the same
// Asia/Amman (UTC+3) day boundary the rest of the platform uses.
// ---------------------------------------------------------------------------

const AMMAN_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Same toggle as the quiz: bypass the once-per-day check during testing. */
function gameTestMode(): boolean {
  return process.env.GAME_TEST_MODE === "true";
}

function ammanDateKey(d: Date = new Date()): string {
  const t = new Date(d.getTime() + AMMAN_OFFSET_MS);
  return t.toISOString().slice(0, 10);
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

/**
 * Same rubric the frontend used: brushing pattern 40 + each habit 20.
 * Clamped 0..100 so a bad payload can't blow up the leaderboard.
 */
function scoreFor(dto: {
  brushingPatternDone: boolean;
  flossed: boolean;
  mouthwash: boolean;
  water: boolean;
}): number {
  let total = 0;
  if (dto.brushingPatternDone) total += 40;
  if (dto.flossed) total += 20;
  if (dto.mouthwash) total += 20;
  if (dto.water) total += 20;
  return Math.max(0, Math.min(100, total));
}

function computeCurrentStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;
  const sorted = [...dateKeys].sort();
  const today = ammanDateKey();
  const yesterday = previousDay(today);
  const latest = sorted[sorted.length - 1];
  if (latest !== today && latest !== yesterday) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (sorted[i - 1] === previousDay(sorted[i])) streak += 1;
    else break;
  }
  return streak;
}

function computeBestStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;
  const sorted = [...dateKeys].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1] === previousDay(sorted[i])) {
      run += 1;
      if (run > best) best = run;
    } else if (sorted[i - 1] !== sorted[i]) {
      run = 1;
    }
  }
  return best;
}

function computeBadges(entries: { dateKey: string }[]): string[] {
  const out: string[] = [];
  if (entries.length >= 1) out.push("first-checkin");
  const best = computeBestStreak(entries.map((e) => e.dateKey));
  if (best >= 3) out.push("streak-3");
  if (best >= 7) out.push("streak-7");
  if (best >= 30) out.push("streak-30");
  return out;
}

@Injectable()
export class SmileStreakService {
  constructor(private readonly prisma: PrismaService) {}

  private requirePatient(user: AuthUser) {
    if (user.role !== Role.PATIENT) {
      throw new ForbiddenException(
        "Only patients can record smile-streak check-ins.",
      );
    }
  }

  async getMine(user: AuthUser) {
    this.requirePatient(user);
    const entries = await this.prisma.smileCheckin.findMany({
      where: { patientId: user.id },
      orderBy: { dateKey: "asc" },
    });
    const dateKeys = entries.map((e) => e.dateKey);
    const today = ammanDateKey();
    return {
      entries: entries.map((e) => ({
        date: e.dateKey,
        score: e.score,
        habits: {
          flossed: e.flossed,
          mouthwash: e.mouthwash,
          water: e.water,
        },
        brushingPatternDone: e.brushingPatternDone,
      })),
      streak: computeCurrentStreak(dateKeys),
      bestStreak: computeBestStreak(dateKeys),
      badgesEarned: computeBadges(entries),
      cumulative: entries.reduce((acc, e) => acc + e.score, 0),
      // In test mode always claim "not checked in" so the UI lets the tester
      // redo the ritual end-to-end as many times as they want.
      hasCheckedInToday: gameTestMode() ? false : dateKeys.includes(today),
    };
  }

  /** Insert-or-update today's check-in. Score is recomputed server-side. */
  async submit(user: AuthUser, dto: SmileCheckinDto) {
    this.requirePatient(user);
    const score = scoreFor(dto);
    await this.prisma.smileCheckin.upsert({
      where: {
        patientId_dateKey: { patientId: user.id, dateKey: dto.dateKey },
      },
      create: {
        patientId: user.id,
        dateKey: dto.dateKey,
        score,
        brushingPatternDone: dto.brushingPatternDone,
        flossed: dto.flossed,
        mouthwash: dto.mouthwash,
        water: dto.water,
      },
      update: {
        score,
        brushingPatternDone: dto.brushingPatternDone,
        flossed: dto.flossed,
        mouthwash: dto.mouthwash,
        water: dto.water,
      },
    });
    return this.getMine(user);
  }

  /**
   * One-shot migration of legacy localStorage entries. Only creates rows
   * that aren't already on the server (skipDuplicates on the compound
   * patient+date unique), so re-running it is safe.
   */
  async bulkImport(user: AuthUser, entries: SmileCheckinDto[]) {
    this.requirePatient(user);
    if (entries.length === 0) return this.getMine(user);
    await this.prisma.smileCheckin.createMany({
      data: entries.map((e) => ({
        patientId: user.id,
        dateKey: e.dateKey,
        score: scoreFor(e),
        brushingPatternDone: e.brushingPatternDone,
        flossed: e.flossed,
        mouthwash: e.mouthwash,
        water: e.water,
      })),
      skipDuplicates: true,
    });
    return this.getMine(user);
  }

  /**
   * Ranks every patient by lifetime cumulative score. Empty entries are
   * still included so a fresh patient sees their (0) rank on the board.
   */
  async leaderboard() {
    const now = new Date();
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
        smileCheckins: {
          select: { dateKey: true, score: true, createdAt: true },
        },
      },
    });

    const rows = patients.map((p) => {
      const cumulative = p.smileCheckins.reduce(
        (acc, e) => acc + (e.score ?? 0),
        0,
      );
      const dateKeys = p.smileCheckins.map((e) => e.dateKey);
      const streak = computeCurrentStreak(dateKeys);
      const bestStreak = computeBestStreak(dateKeys);
      const checkinCount = p.smileCheckins.length;
      const lastCheckinAt = p.smileCheckins.reduce<Date | null>(
        (acc, e) => (acc == null || e.createdAt > acc ? e.createdAt : acc),
        null,
      );
      return {
        patient: {
          id: p.id,
          name: p.name,
          username: p.username,
          avatar: p.avatar,
        },
        cumulative,
        checkinCount,
        streak,
        bestStreak,
        lastCheckinAt: lastCheckinAt ? lastCheckinAt.toISOString() : null,
      };
    });

    rows.sort((a, b) => {
      if (b.cumulative !== a.cumulative) return b.cumulative - a.cumulative;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.checkinCount - a.checkinCount;
    });

    return {
      generatedAt: now.toISOString(),
      entries: rows.map((r, i) => ({ rank: i + 1, ...r })),
    };
  }
}
