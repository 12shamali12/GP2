"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicProfile } from "@/features/profiles/services/profile-api";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type UsePublicProfileParams = {
  targetId?: string;
  viewerIdentifier?: string;
  enabled?: boolean;
};

export function usePublicProfile({
  targetId,
  viewerIdentifier,
  enabled = true,
}: UsePublicProfileParams) {
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !targetId || !viewerIdentifier) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPublicProfile(targetId, viewerIdentifier);
      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err?.message || "Failed to load profile.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, targetId, viewerIdentifier]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    loading,
    error,
    refresh,
  };
}
