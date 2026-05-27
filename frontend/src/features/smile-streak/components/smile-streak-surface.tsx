"use client";

/**
 * Healthy Smile Streak — patient game surface.
 *
 * A short daily mouth-care check-in (NOT a quiz). The state machine walks
 * the patient through 3 mini-rituals:
 *   1. Brushing pattern (4-quadrant tap-in-order)
 *   2. Habits checklist (floss / mouthwash / water toggles)
 *   3. Summary screen (score + streak + badges)
 *
 * All persistence is local — see ./lib/storage.ts. There is no backend.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCard } from "@/features/smile-streak/components/badge-card";
import {
  MouthDiagram,
  type MouthQuadrant,
} from "@/features/smile-streak/components/mouth-diagram";
import { FlameStreak } from "@/features/game/components/flame-streak";
import { useTranslation } from "@/features/i18n/language-provider";
import {
  ALL_BADGES,
  computeCumulative,
  getAmmanDateKey,
  getNextAmmanMidnight,
  hasCheckedInToday,
  loadSmileData,
  saveCheckin,
  scoreCheckin,
  type SmileBadgeId,
  type SmileHabits,
  type SmileStreakData,
} from "@/features/smile-streak/lib/storage";
import {
  getSmileStreak,
  importSmileCheckins,
  submitSmileCheckin,
  type SmileCheckinPayload,
} from "@/features/smile-streak/services/smile-streak-api";

type SmilePhase =
  | { kind: "loading" }
  | { kind: "already-done"; data: SmileStreakData; resetIn: number }
  | { kind: "step-brushing"; data: SmileStreakData }
  | {
      kind: "step-habits";
      data: SmileStreakData;
      brushingPatternDone: boolean;
    }
  | {
      kind: "summary";
      data: SmileStreakData;
      brushingPatternDone: boolean;
      habits: SmileHabits;
      score: number;
      newlyEarned: SmileBadgeId[];
    };

const EXPECTED_ORDER: MouthQuadrant[] = [
  "top-right",
  "top-left",
  "bottom-left",
  "bottom-right",
];

const panelInnerClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:p-6 md:p-5";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function SmileStreakSurface() {
  const t = useTranslation();
  const [phase, setPhase] = useState<SmilePhase>({ kind: "loading" });
  // We track which habits the patient has toggled separately so the toggles
  // stay editable until they advance.
  const [habits, setHabits] = useState<SmileHabits>({
    flossed: false,
    mouthwash: false,
    water: false,
  });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* -------------------------------------------------------------------- */
  /* Bootstrap                                                            */
  /* -------------------------------------------------------------------- */

  const applyData = useCallback(
    (data: SmileStreakData, alreadyDone?: boolean) => {
      // The server can override the "already done today" check (test mode
      // returns false even when there's a row for today). Otherwise fall back
      // to the local check so an offline tester still sees the right phase.
      const done = alreadyDone ?? hasCheckedInToday(data);
      if (done) {
        setPhase({
          kind: "already-done",
          data,
          resetIn: Math.max(0, getNextAmmanMidnight() - Date.now()),
        });
      } else {
        setPhase({ kind: "step-brushing", data });
      }
    },
    [],
  );

  const bootstrap = useCallback(() => {
    // Show local cache instantly so the page never sits on "loading"; the
    // server fetch below replaces it once it returns.
    const local = loadSmileData();
    applyData(local);

    void (async () => {
      try {
        // Migrate any localStorage-only entries to the server (skip-duplicates
        // server-side so re-running is safe).
        if (local.entries.length > 0) {
          await importSmileCheckins(
            local.entries.map((e) => ({
              dateKey: e.date,
              brushingPatternDone: e.score >= 40,
              flossed: e.habits.flossed,
              mouthwash: e.habits.mouthwash,
              water: e.habits.water,
            })),
          );
        }
        const server = await getSmileStreak();
        const merged: SmileStreakData = {
          entries: server.entries.map((e) => ({
            date: e.date,
            score: e.score,
            habits: e.habits,
          })),
          streak: server.streak,
          bestStreak: server.bestStreak,
          badgesEarned: server.badgesEarned,
        };
        applyData(merged, server.hasCheckedInToday);
      } catch {
        // Offline / unauthenticated — fall back to local-only mode.
      }
    })();
  }, [applyData]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  /* -------------------------------------------------------------------- */
  /* Reset countdown (only while in already-done)                         */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (phase.kind !== "already-done") {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    countdownRef.current = setInterval(() => {
      setPhase((prev) =>
        prev.kind === "already-done"
          ? {
              ...prev,
              resetIn: Math.max(0, getNextAmmanMidnight() - Date.now()),
            }
          : prev,
      );
    }, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [phase.kind]);

  /* -------------------------------------------------------------------- */
  /* Step handlers                                                        */
  /* -------------------------------------------------------------------- */

  const handleBrushingComplete = useCallback((success: boolean) => {
    setPhase((prev) => {
      if (prev.kind !== "step-brushing") return prev;
      return {
        kind: "step-habits",
        data: prev.data,
        brushingPatternDone: success,
      };
    });
  }, []);

  const handleHabitsSubmit = useCallback(() => {
    setPhase((prev) => {
      if (prev.kind !== "step-habits") return prev;
      const result = saveCheckin(prev.brushingPatternDone, habits);
      // Fire-and-forget the server sync so the leaderboard updates without
      // blocking the celebration screen. Local cache already shows the
      // correct streak/badge state.
      const payload: SmileCheckinPayload = {
        dateKey: getAmmanDateKey(),
        brushingPatternDone: prev.brushingPatternDone,
        flossed: habits.flossed,
        mouthwash: habits.mouthwash,
        water: habits.water,
      };
      void submitSmileCheckin(payload).catch(() => {
        /* offline / unauthenticated — local copy still saved */
      });
      return {
        kind: "summary",
        data: result.data,
        brushingPatternDone: prev.brushingPatternDone,
        habits,
        score: result.score,
        newlyEarned: result.newlyEarned,
      };
    });
  }, [habits]);

  /* -------------------------------------------------------------------- */
  /* Derived view-model                                                   */
  /* -------------------------------------------------------------------- */

  const data = useMemo(() => {
    if (phase.kind === "loading") return null;
    return phase.data;
  }, [phase]);

  const stepNumber = useMemo(() => {
    if (phase.kind === "step-brushing") return 1;
    if (phase.kind === "step-habits") return 2;
    if (phase.kind === "summary") return 3;
    return 0;
  }, [phase.kind]);

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      <section className={panelInnerClass}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="denty-kicker">{t("smile.eyebrow")}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {t("smile.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              {t("smile.description")}
            </p>
          </div>
          {data && data.streak > 0 ? (
            <FlameStreak count={data.streak} size="md" />
          ) : null}
        </div>

        {phase.kind === "loading" ? (
          <div className="mt-6 rounded-[20px] border border-white/12 bg-white/28 px-4 py-4 text-sm font-medium text-[rgba(10,22,40,0.74)]">
            {t("smile.loading")}
          </div>
        ) : null}

        {stepNumber > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.55)]">
            <span>{t("smile.step_label", { n: stepNumber })}</span>
            <div className="flex gap-1.5 sm:ml-2">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 w-7 rounded-full transition-all sm:w-8 ${
                    n <= stepNumber
                      ? "bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))]"
                      : "bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {phase.kind === "already-done" ? (
          <AlreadyDoneView data={phase.data} resetIn={phase.resetIn} />
        ) : null}

        {phase.kind === "step-brushing" ? (
          <BrushingStep onComplete={handleBrushingComplete} />
        ) : null}

        {phase.kind === "step-habits" ? (
          <HabitsStep
            habits={habits}
            onToggle={(key) =>
              setHabits((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onSubmit={handleHabitsSubmit}
            previewScore={scoreCheckin(phase.brushingPatternDone, habits)}
          />
        ) : null}

        {phase.kind === "summary" ? (
          <SummaryView
            data={phase.data}
            score={phase.score}
            newlyEarned={phase.newlyEarned}
            onClose={bootstrap}
          />
        ) : null}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Brushing step                                                              */
/* -------------------------------------------------------------------------- */

function BrushingStep({
  onComplete,
}: {
  onComplete: (success: boolean) => void;
}) {
  const t = useTranslation();
  return (
    <div className="mt-6 space-y-5 denty-card-in">
      <div className="rounded-[22px] border border-white/14 bg-white/30 p-5 text-center">
        <p className="denty-kicker">{t("smile.brushing.title")}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
          {t("smile.brushing.instruction")}
        </p>
      </div>
      <MouthDiagram expectedOrder={EXPECTED_ORDER} onComplete={onComplete} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Habits step                                                                */
/* -------------------------------------------------------------------------- */

function HabitsStep({
  habits,
  onToggle,
  onSubmit,
  previewScore,
}: {
  habits: SmileHabits;
  onToggle: (key: keyof SmileHabits) => void;
  onSubmit: () => void;
  previewScore: number;
}) {
  const t = useTranslation();
  const items: Array<{ key: keyof SmileHabits; label: string; icon: string }> = [
    { key: "flossed", label: t("smile.habits.flossed"), icon: "🧵" },
    { key: "mouthwash", label: t("smile.habits.mouthwash"), icon: "🧴" },
    { key: "water", label: t("smile.habits.water"), icon: "💧" },
  ];

  return (
    <div className="mt-6 space-y-5 denty-card-in">
      <div className="rounded-[22px] border border-white/14 bg-white/30 p-5 text-center">
        <p className="denty-kicker">{t("smile.habits.title")}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
          {t("smile.habits.instruction")}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const on = habits[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggle(item.key)}
              className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition-all duration-200 ${
                on
                  ? "border-[rgba(34,197,94,0.45)] bg-[linear-gradient(180deg,rgba(187,247,208,0.6),rgba(134,239,172,0.32))] shadow-[0_14px_32px_rgba(22,101,52,0.18)]"
                  : "border-white/14 bg-white/30 hover:-translate-y-[1px] hover:bg-white/45"
              }`}
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/55 text-2xl">
                {item.icon}
              </span>
              <span className="flex-1 text-sm font-semibold text-[var(--foreground)]">
                {item.label}
              </span>
              <span
                className={`inline-flex h-7 w-12 items-center rounded-full border transition-all ${
                  on
                    ? "border-emerald-600 bg-emerald-500 justify-end"
                    : "border-white/30 bg-white/30 justify-start"
                }`}
              >
                <span
                  className={`mx-0.5 h-6 w-6 rounded-full ${
                    on ? "bg-white" : "bg-white/70"
                  } shadow`}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-[18px] border border-white/14 bg-white/26 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.6)]">
          {t("smile.score_today")}
        </span>
        <span className="text-lg font-bold tabular-nums text-[var(--foreground)]">
          {previewScore} / 100
        </span>
      </div>

      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-[18px] border border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)] transition hover:brightness-110 sm:w-auto"
        >
          {t("smile.habits.next")}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary view                                                               */
/* -------------------------------------------------------------------------- */

function SummaryView({
  data,
  score,
  newlyEarned,
  onClose,
}: {
  data: SmileStreakData;
  score: number;
  newlyEarned: SmileBadgeId[];
  onClose: () => void;
}) {
  const t = useTranslation();
  const cumulative = computeCumulative(data.entries);

  return (
    <div className="mt-6 space-y-5 denty-card-in">
      <div className="relative overflow-hidden rounded-[26px] border border-[rgba(7,111,133,0.18)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] p-5 text-center shadow-[0_24px_56px_rgba(7,18,34,0.12)] sm:p-6">
        <p className="denty-kicker">{t("smile.summary.title")}</p>
        <p className="mt-3 text-5xl font-bold leading-none tabular-nums text-[var(--foreground)] sm:text-6xl">
          {score}
        </p>
        <p className="mt-2 text-sm font-semibold text-[rgba(6,83,98,0.95)]">
          {t("smile.summary.points", { points: score })}
        </p>
        <div className="mt-4 flex justify-center">
          <FlameStreak count={data.streak} size="md" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatChip
          label={t("smile.score_today")}
          value={`${score}`}
        />
        <StatChip
          label={t("smile.cumulative_score")}
          value={`${cumulative}`}
        />
        <StatChip
          label={t("smile.best_streak")}
          value={`${data.bestStreak}d`}
        />
      </div>

      <div className="rounded-[22px] border border-white/14 bg-white/26 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.6)]">
          {t("smile.badges")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_BADGES.map((id) => (
            <BadgeCard
              key={id}
              id={id}
              earned={data.badgesEarned.includes(id)}
              fresh={newlyEarned.includes(id)}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        {t("smile.summary.again_tomorrow")}
      </p>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[2.75rem] cursor-pointer items-center justify-center rounded-[18px] border border-white/16 bg-white/35 px-6 py-2 text-sm font-semibold text-[rgba(10,22,40,0.8)] transition hover:bg-white/55"
        >
          {t("smile.summary.close")}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Already-done view                                                          */
/* -------------------------------------------------------------------------- */

function AlreadyDoneView({
  data,
  resetIn,
}: {
  data: SmileStreakData;
  resetIn: number;
}) {
  const t = useTranslation();
  const todayEntry = useMemo(() => {
    if (data.entries.length === 0) return null;
    return [...data.entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [data.entries]);
  const cumulative = computeCumulative(data.entries);

  return (
    <div className="mt-6 space-y-5 denty-card-in">
      <div className="rounded-[26px] border border-white/16 bg-[linear-gradient(180deg,rgba(248,250,252,0.66),rgba(226,232,240,0.32))] p-5 text-center shadow-[0_20px_48px_rgba(7,18,34,0.08)] sm:p-7">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/55 text-[rgba(10,22,40,0.7)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <path
              d="M12 3c-3 5-7 6-7 10a7 7 0 0 0 14 0c0-4-4-5-7-10Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">
          {t("smile.come_back_tomorrow")}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.55)]">
          {t("smile.next_checkin_in")}
        </p>
        <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-[var(--foreground)]">
          {formatCountdown(resetIn)}
        </p>
        {data.streak > 0 ? (
          <div className="mt-5 flex justify-center">
            <FlameStreak count={data.streak} size="md" />
          </div>
        ) : null}
      </div>

      {todayEntry ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatChip
            label={t("smile.score_today")}
            value={`${todayEntry.score}`}
          />
          <StatChip
            label={t("smile.cumulative_score")}
            value={`${cumulative}`}
          />
          <StatChip
            label={t("smile.best_streak")}
            value={`${data.bestStreak}d`}
          />
        </div>
      ) : null}

      <div className="rounded-[22px] border border-white/14 bg-white/22 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.6)]">
          {t("smile.badges")}
        </p>
        {data.badgesEarned.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            {t("smile.no_badges")}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_BADGES.map((id) => (
              <BadgeCard
                key={id}
                id={id}
                earned={data.badgesEarned.includes(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small reusable stat chip                                                   */
/* -------------------------------------------------------------------------- */

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/14 bg-white/26 p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.55)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
