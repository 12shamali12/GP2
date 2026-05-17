import { httpJson } from "@/lib/api/http";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

export const getPublicProfile = (targetId: string, viewerIdentifier?: string) =>
  httpJson<PublicProfileResponse>(`/profiles/${targetId}`, {
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
    body: {
      reporterIdentifier,
      reason,
      note,
    },
  });
