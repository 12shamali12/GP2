"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getLeaderboardSnapshot } from "@/features/admin/services/admin-api";
import type { LeaderboardBoard, LeaderboardSnapshot } from "@/features/admin/types/admin";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";

const panelClass =
  "overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] p-6 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:p-7";

export default function AdminLeaderboardPage() {
  const [selectedBoardKey, setSelectedBoardKey] = useState("overall");
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Leaderboard",
    errorTitle: "Leaderboard",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboardSnapshot();
        if (!cancelled) {
          setSnapshot(data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load leaderboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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
      ? `Cohort ends ${new Date(selectedBoard.semester.endsOn).toLocaleDateString()}`
      : "Semester cohort ranking"
    : "All approved students across every semester";

  return (
    <AdminShell
      title="Leaderboard"
      description="Track academic performance across the full program, then switch into any semester cohort to compare students against their current peers."
    >
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
              {board.semester ? board.semester.label : "Overall"}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className={panelClass}>
          <p className="denty-kicker">
            {selectedBoard?.semester ? "Semester podium" : "Top performers"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {selectedBoard?.label || "Academic leaderboard"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Completed appointments score five points, assisted appointments score
            two, patient stars add 0.5 each, and supervisor stars add one point
            each.
          </p>

          <div className="mt-5 rounded-[24px] border border-white/12 bg-white/24 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
            {boardMeta}
          </div>

          <div className="mt-5 space-y-3">
            {topThree.map((entry) => (
              <div
                key={entry.doctor.id}
                className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Rank {entry.rank}
                    </p>
                    <Link
                      href={`/profiles/${entry.doctor.id}`}
                      className="mt-2 block text-2xl font-semibold text-white hover:text-white/80"
                    >
                      {entry.doctor.name}
                    </Link>
                    <p className="mt-2 text-sm text-white/72">
                      @{entry.doctor.username}
                      {entry.doctor.doctorIdNumber
                        ? ` | ID ${entry.doctor.doctorIdNumber}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold">
                    {entry.points.toFixed(1)} pts
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                      Completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {entry.completedCount}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                      Assisted
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {entry.assistedCount}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                      Patient stars
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {entry.patientRatingPoints.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                      Supervisor stars
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {entry.supervisorRatingPoints.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!loading && topThree.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/16 bg-white/14 p-5">
                <p className="text-sm text-[var(--muted-foreground)]">
                  No leaderboard entries yet for this board.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="denty-kicker">Full ranking</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {selectedBoard?.semester ? "Semester table" : "Overall table"}
              </h2>
            </div>
            <div className="rounded-full border border-white/12 bg-white/26 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.62)]">
              {selectedBoard?.semester ? selectedBoard.semester.label : "All semesters"}
            </div>
          </div>

          <div className="mt-5 max-h-[54rem] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Loading leaderboard...
              </p>
            ) : null}

            {selectedBoard?.entries.map((entry) => (
              <div
                key={entry.doctor.id}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] p-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
              >
                <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] text-lg font-semibold text-[var(--foreground)]">
                    {entry.rank}
                  </div>
                  <div>
                    <Link
                      href={`/profiles/${entry.doctor.id}`}
                      className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                    >
                      {entry.doctor.name}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      @{entry.doctor.username}
                      {entry.doctor.doctorIdNumber
                        ? ` | Student ID ${entry.doctor.doctorIdNumber}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-[rgba(7,111,133,0.16)] bg-[rgba(7,111,133,0.1)] px-4 py-2 text-sm font-semibold text-[rgba(6,83,98,0.96)]">
                    {entry.points.toFixed(1)} pts
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Completed
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      {entry.completedCount}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Assisted
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      {entry.assistedCount}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Patient points
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      {entry.patientRatingPoints.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                      Supervisor points
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      {entry.supervisorRatingPoints.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!loading && !selectedBoard?.entries.length ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No students have entered this leaderboard yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
