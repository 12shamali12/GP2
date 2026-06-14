"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getLeaderboardSnapshot } from "@/features/admin/services/admin-api";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { AdminLeaderboardSwitcher } from "./ui/admin-leaderboard-switcher";

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
      title="Leaderboards"
      description="Switch between three views: academic semester progress for students, the per-game per-level arcade leaderboard, and the patient Healthy Smile Streak rankings."
    >
      <AdminLeaderboardSwitcher snapshot={snapshot} loading={loading} />
    </AdminShell>
  );
}
