"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LeaderboardBoard,
  LeaderboardSnapshot,
} from "@/features/admin/types/admin";
import {
  getGameLeaderboard,
  type GameLeaderboardSnapshot,
} from "@/features/game/services/game-api";
import { useTranslation } from "@/features/i18n/language-provider";

const panelClass =
  "overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-4 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:p-6 md:p-5";

type LeaderboardTab = "academic" | "game";

type LeaderboardViewProps = {
  snapshot: LeaderboardSnapshot | null;
  loading?: boolean;
  /** When provided, the matching row is highlighted as "you" in the full table. */
  currentUserId?: string;
};

export function LeaderboardView({
  snapshot,
  loading = false,
  currentUserId,
}: LeaderboardViewProps) {
  const [tab, setTab] = useState<LeaderboardTab>("academic");
  const t = useTranslation();

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={t("leaderboard.aria")}
        className="flex gap-3"
      >
        <TabButton
          active={tab === "academic"}
          onClick={() => setTab("academic")}
          label={t("leaderboard.tab_academic")}
        />
        <TabButton
          active={tab === "game"}
          onClick={() => setTab("game")}
          label={t("leaderboard.tab_game")}
        />
      </div>

      {tab === "academic" ? (
        <AcademicLeaderboard
          snapshot={snapshot}
          loading={loading}
          currentUserId={currentUserId}
        />
      ) : (
        <GameLeaderboard currentUserId={currentUserId} />
      )}
    </div>
  );
}

// =============================================================================
// Tab button
// =============================================================================

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-[3rem] flex-1 cursor-pointer items-center justify-center rounded-[18px] border px-4 py-3 text-sm font-semibold transition sm:flex-none sm:px-5 ${
        active
          ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)]"
          : "border-white/12 bg-white/28 text-[rgba(10,22,40,0.78)] hover:bg-white/42"
      }`}
    >
      {label}
    </button>
  );
}

// =============================================================================
// Academic leaderboard (existing behaviour)
// =============================================================================

type AcademicLeaderboardProps = {
  snapshot: LeaderboardSnapshot | null;
  loading: boolean;
  currentUserId?: string;
};

function AcademicLeaderboard({
  snapshot,
  loading,
  currentUserId,
}: AcademicLeaderboardProps) {
  const [selectedBoardKey, setSelectedBoardKey] = useState("overall");
  const t = useTranslation();

  const boards = useMemo(
    () => (snapshot ? [snapshot.overall, ...snapshot.semesters] : []),
    [snapshot],
  );

  useEffect(() => {
    if (!boards.length) return;
    if (!boards.some((board) => board.key === selectedBoardKey)) {
      setSelectedBoardKey("overall");
    }
  }, [boards, selectedBoardKey]);

  const selectedBoard = useMemo<LeaderboardBoard | null>(
    () => boards.find((board) => board.key === selectedBoardKey) || null,
    [boards, selectedBoardKey],
  );

  const topThree = useMemo(
    () => selectedBoard?.entries.slice(0, 3) || [],
    [selectedBoard],
  );

  const boardMeta = selectedBoard?.semester
    ? selectedBoard.semester.endsOn
      ? t("leaderboard.cohort_ends", {
          date: new Date(selectedBoard.semester.endsOn).toLocaleDateString(),
        })
      : t("leaderboard.semester_meta")
    : t("leaderboard.overall_meta");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {boards.map((board) => {
          const active = selectedBoardKey === board.key;
          return (
            <button
              key={board.key}
              type="button"
              onClick={() => setSelectedBoardKey(board.key)}
              className={`inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[18px] border px-5 py-3 text-sm font-semibold transition ${
                active
                  ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white shadow-[0_24px_52px_rgba(6,17,34,0.28)]"
                  : "border-white/12 bg-white/28 text-[rgba(10,22,40,0.78)] hover:bg-white/42"
              }`}
            >
              {board.semester ? board.semester.label : t("leaderboard.overall")}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className={panelClass}>
          <p className="denty-kicker">
            {selectedBoard?.semester
              ? t("leaderboard.semester_podium")
              : t("leaderboard.top_performers")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {selectedBoard?.label || t("leaderboard.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            {t("leaderboard.scoring")}
          </p>

          <div className="mt-5 rounded-[24px] border border-white/12 bg-white/24 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
            {boardMeta}
          </div>

          <div className="denty-enter-stagger mt-5 space-y-3">
            {topThree.map((entry) => {
              const isCurrentUser =
                Boolean(currentUserId) && entry.doctor.id === currentUserId;
              return (
                <div
                  key={entry.doctor.id}
                  className={`rounded-[24px] border p-4 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)] sm:p-5 ${
                    isCurrentUser
                      ? "border-[rgba(137,219,255,0.45)] bg-[linear-gradient(180deg,rgba(9,82,108,0.92),rgba(11,46,72,0.7))] ring-2 ring-[rgba(137,219,255,0.45)]"
                      : "border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                        {t("leaderboard.rank")} {entry.rank}
                        {isCurrentUser ? ` | ${t("common.you")}` : ""}
                      </p>
                      <Link
                        href={`/profiles/${entry.doctor.id}`}
                        className="mt-2 block text-lg font-semibold text-white hover:text-white/80 sm:text-xl"
                      >
                        {entry.doctor.name}
                      </Link>
                      <p className="mt-2 text-sm text-white/72 wrap-break-word">
                        @{entry.doctor.username}
                        {entry.doctor.doctorIdNumber
                          ? ` | ID ${entry.doctor.doctorIdNumber}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold">
                      {entry.points.toFixed(1)} {t("leaderboard.points")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] border border-white/10 bg-white/8 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                        {t("leaderboard.completed")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                        {entry.completedCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/8 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                        {t("leaderboard.assisted")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                        {entry.assistedCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/8 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                        {t("leaderboard.patient_stars")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                        {entry.patientRatingPoints.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/8 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                        {t("leaderboard.supervisor_stars")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                        {entry.supervisorRatingPoints.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && topThree.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/16 bg-white/14 p-5">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("leaderboard.empty")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="denty-kicker">{t("leaderboard.full_ranking")}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {selectedBoard?.semester
                  ? t("leaderboard.semester_table")
                  : t("leaderboard.overall_table")}
              </h2>
            </div>
            <div className="rounded-full border border-white/12 bg-white/26 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.62)]">
              {selectedBoard?.semester
                ? selectedBoard.semester.label
                : t("leaderboard.all_semesters")}
            </div>
          </div>

          <div className="denty-enter-stagger mt-5 max-h-[54rem] space-y-3 overflow-y-auto pr-1">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="denty-skeleton denty-skeleton-card"
                  />
                ))
              : null}

            {selectedBoard?.entries.map((entry) => {
              const isCurrentUser =
                Boolean(currentUserId) && entry.doctor.id === currentUserId;
              return (
                <div
                  key={entry.doctor.id}
                  className={`rounded-[24px] border p-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px] ${
                    isCurrentUser
                      ? "border-[rgba(7,111,133,0.45)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] ring-2 ring-[rgba(7,111,133,0.4)]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))]"
                  }`}
                >
                  <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] text-lg font-semibold text-[var(--foreground)]">
                      {entry.rank}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/profiles/${entry.doctor.id}`}
                          className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {entry.doctor.name}
                        </Link>
                        {isCurrentUser ? (
                          <span className="rounded-full border border-[rgba(7,111,133,0.36)] bg-[rgba(7,111,133,0.18)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.96)]">
                            {t("common.you")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] wrap-break-word">
                        @{entry.doctor.username}
                        {entry.doctor.doctorIdNumber
                          ? ` | Student ID ${entry.doctor.doctorIdNumber}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-4 py-2 text-sm font-semibold text-[rgba(6,83,98,0.96)]">
                      {entry.points.toFixed(1)} {t("leaderboard.points")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                        {t("leaderboard.completed")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                        {entry.completedCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                        {t("leaderboard.assisted")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                        {entry.assistedCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                        {t("leaderboard.patient_points")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                        {entry.patientRatingPoints.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                        {t("leaderboard.supervisor_points")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                        {entry.supervisorRatingPoints.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && !selectedBoard?.entries.length ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("leaderboard.empty_table")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Game leaderboard tab (lazy-loaded on first activation)
// =============================================================================

type GameLeaderboardProps = {
  currentUserId?: string;
};

function GameLeaderboard({ currentUserId }: GameLeaderboardProps) {
  const [snapshot, setSnapshot] = useState<GameLeaderboardSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGameLeaderboard();
      setSnapshot(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load the game leaderboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy: only fetch when the Game tab actually mounts (which is exactly
  // when this component mounts).
  useEffect(() => {
    void load();
  }, [load]);

  const entries = snapshot?.entries ?? [];

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="denty-kicker">{t("leaderboard.game_kicker")}</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {t("leaderboard.game_title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("leaderboard.game_description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-[16px] border border-white/14 bg-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.7)] transition hover:bg-white/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("common.refreshing") : t("common.refresh")}
        </button>
      </div>

      {error ? (
        <p className="mt-5 rounded-[20px] border border-rose-400/30 bg-rose-100/40 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <div className="denty-enter-stagger mt-5 max-h-[54rem] space-y-3 overflow-y-auto pr-1">
        {loading && !snapshot
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="denty-skeleton denty-skeleton-card" />
            ))
          : null}

        {!loading && entries.length === 0 && !error ? (
          <div className="rounded-[24px] border border-dashed border-white/16 bg-white/14 p-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("leaderboard.game_empty")}
            </p>
          </div>
        ) : null}

        {entries.map((entry) => {
          const isCurrentUser =
            Boolean(currentUserId) && entry.doctor.id === currentUserId;
          return (
            <div
              key={entry.doctor.id}
              className={`rounded-[24px] border p-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px] ${
                isCurrentUser
                  ? "border-[rgba(7,111,133,0.45)] bg-[linear-gradient(180deg,rgba(176,224,238,0.55),rgba(154,206,224,0.32))] ring-2 ring-[rgba(7,111,133,0.4)]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))]"
              }`}
            >
              <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] text-lg font-semibold text-[var(--foreground)]">
                  {entry.rank}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profiles/${entry.doctor.id}`}
                      className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {entry.doctor.name}
                    </Link>
                    {isCurrentUser ? (
                      <span className="rounded-full border border-[rgba(7,111,133,0.36)] bg-[rgba(7,111,133,0.18)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(6,83,98,0.96)]">
                        {t("common.you")}
                      </span>
                    ) : null}
                    {entry.streak > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(234,88,12,0.3)] bg-[rgba(254,215,170,0.4)] px-3 py-1 text-[11px] font-semibold text-[rgba(124,45,18,0.95)]">
                        <span aria-hidden>🔥</span>
                        {t("game.streak", { n: entry.streak })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)] wrap-break-word">
                    @{entry.doctor.username}
                    {entry.doctor.doctorIdNumber
                      ? ` | Student ID ${entry.doctor.doctorIdNumber}`
                      : ""}
                    {entry.doctor.semester
                      ? ` · ${entry.doctor.semester.label}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-4 py-2 text-sm font-semibold text-[rgba(6,83,98,0.96)]">
                  {entry.totalQuizPoints.toFixed(1)} {t("leaderboard.points")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                    {t("leaderboard.attempts")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {entry.attempts}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                    {t("leaderboard.best_score")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {entry.bestScore}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/30 px-3 py-3 sm:px-4 max-sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                    {t("leaderboard.average")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {entry.averageScore !== null ? entry.averageScore.toFixed(1) : "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
