"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getLeaderboardSnapshot } from "@/features/admin/services/admin-api";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";
import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";

export default function AdminLeaderboardPage() {
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

  return (
    <AdminShell
      title="Leaderboard"
      description="Track academic performance across the full program, then switch into any semester cohort to compare students against their current peers."
    >
      <LeaderboardView snapshot={snapshot} loading={loading} />
    </AdminShell>
  );
}
