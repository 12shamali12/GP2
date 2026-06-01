"use client";

/**
 * Streak summary widget for the patient overview.
 *
 * Hits /smile-streak/me on mount and renders a compact hero card with:
 *   - Current consecutive Amman-local-day streak (big number, flame icon).
 *   - Longest-ever streak (secondary).
 *   - Today's check-in state (✓ done today, or a primary CTA to open the
 *     daily check-in flow).
 *   - The latest badges earned (up to three pills).
 *
 * Clicking the widget (or its CTA button) calls onOpen() so the parent can
 * switch the active patient surface to "streak".
 */

import { useEffect, useState } from "react";
import {
  getSmileStreak,
  type SmileStreakSnapshot,
} from "@/features/smile-streak/services/smile-streak-api";
import { useTranslation } from "@/features/i18n/language-provider";

type StreakSummaryWidgetProps = {
  onOpen: () => void;
};

export function StreakSummaryWidget({ onOpen }: StreakSummaryWidgetProps) {
  const t = useTranslation();
  const [snapshot, setSnapshot] = useState<SmileStreakSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getSmileStreak();
        if (!cancelled) {
          setSnapshot(snap);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const streak = snapshot?.streak ?? 0;
  const best = snapshot?.bestStreak ?? 0;
  const doneToday = snapshot?.hasCheckedInToday ?? false;
  const recentBadges = (snapshot?.badgesEarned ?? []).slice(-3);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("streak.widget.aria")}
      className="group relative block w-full overflow-hidden rounded-[22px] border border-white/16 p-5 text-left text-white shadow-[0_18px_44px_rgba(190,24,93,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(190,24,93,0.42)]"
      style={{
        background:
          "linear-gradient(135deg,rgba(190,24,93,0.94),rgba(245,158,11,0.88))",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Flame + streak number */}
        <div className="flex flex-col items-center justify-center">
          <span
            aria-hidden
            className="text-4xl drop-shadow-[0_4px_10px_rgba(2,6,18,0.4)]"
            style={{
              animation: streak > 0 ? "denty-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both" : undefined,
            }}
          >
            🔥
          </span>
          <p className="mt-1 text-3xl font-extrabold leading-none tabular-nums">
            {loading ? "…" : streak}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
            {t("streak.widget.day_unit")}
          </p>
        </div>

        {/* Title + secondary + CTA */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">
              {t("streak.widget.eyebrow")}
            </p>
            <p className="text-lg font-extrabold leading-tight">
              {t("streak.widget.title")}
            </p>
          </div>

          {error ? (
            <p className="text-xs text-white/85">
              {t("streak.widget.error")}
            </p>
          ) : (
            <p className="text-xs text-white/85">
              {doneToday
                ? t("streak.widget.done_today")
                : streak === 0
                  ? t("streak.widget.start")
                  : t("streak.widget.continue")}
              {" · "}
              {t("streak.widget.best", { value: best })}
            </p>
          )}

          {recentBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {recentBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-white/22 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/95 backdrop-blur"
                >
                  <span aria-hidden>🏅</span>
                  {t(`streak.widget.badge.${badge}`)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* CTA pill */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-[14px] border border-white/22 bg-white/15 px-3 py-2 backdrop-blur">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          {doneToday
            ? t("streak.widget.cta_view")
            : t("streak.widget.cta_check_in")}
        </span>
        <span
          aria-hidden
          className="text-base transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>

      {/* Decorative orbs */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-white/12 blur-3xl"
      />
    </button>
  );
}
