import { authHeaders } from "@/lib/api/auth";
import { httpJson } from "@/lib/api/http";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

export const getPublicProfile = (targetId: string, viewerIdentifier?: string) =>
  httpJson<PublicProfileResponse>(`/profiles/${targetId}`, {
    headers: authHeaders(),
    query: viewerIdentifier ? { viewerIdentifier } : undefined,
  });

export const reportProfile = (
  targetId: string,
  reporterIdentifier: string,
  reason: string,
  note?: string,
) =>
  httpJson<{ message: string }>(`/profiles/${targetId}/report`, {
    method: "POST",
    headers: authHeaders(),
    body: {
      reporterIdentifier,
      reason,
      note,
    },
  });
