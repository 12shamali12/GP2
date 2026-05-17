"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decideGroupJoinRequest,
  decidePartnerRequest as decidePartnerRequestAction,
  getGroups,
  removeDoctorFromGroup as removeDoctorFromGroupAction,
  removePartnerPair as removePartnerPairAction,
} from "@/features/admin/services/admin-api";
import {
  sectionByLetter,
  type AlphabetSection,
} from "@/features/admin/utils/collection";
import type { AdminGroupItem } from "@/features/supervision/types";

export type ModerationTab = "join" | "partner" | "students" | "pairs";

export type ModeratedJoinRequest = AdminGroupItem["joinRequests"][number] & {
  group: {
    id: string;
    name: string;
    semesterLabel: string;
  };
};

export type ModeratedPartnerRequest =
  NonNullable<AdminGroupItem["partnerRequests"]>[number] & {
    group: {
      id: string;
      name: string;
      semesterLabel: string;
    };
  };

export type MembershipModerationGroup = AdminGroupItem & {
  members: AdminGroupItem["members"];
};

export type PairModerationGroup = AdminGroupItem & {
  partnerPairs: NonNullable<AdminGroupItem["partnerPairs"]>;
};

export type ModerationCounts = {
  join: number;
  partner: number;
  students: number;
  pairs: number;
};

export function useAdminGroupModerationWorkspace() {
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<ModerationTab>("join");
  const [query, setQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load group moderation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const joinRequests = useMemo<ModeratedJoinRequest[]>(
    () =>
      groups.flatMap((group) =>
        (group.joinRequests || []).map((request) => ({
          ...request,
          group: {
            id: group.id,
            name: group.name,
            semesterLabel: group.semesterLabel,
          },
        })),
      ),
    [groups],
  );

  const partnerRequests = useMemo<ModeratedPartnerRequest[]>(
    () =>
      groups.flatMap((group) =>
        (group.partnerRequests || []).map((request) => ({
          ...request,
          group: {
            id: group.id,
            name: group.name,
            semesterLabel: group.semesterLabel,
          },
        })),
      ),
    [groups],
  );

  const membershipGroups = useMemo<MembershipModerationGroup[]>(
    () =>
      [...groups].sort((left, right) =>
        `${left.name} ${left.semesterLabel}`.localeCompare(
          `${right.name} ${right.semesterLabel}`,
          undefined,
          { sensitivity: "base" },
        ),
      ),
    [groups],
  );

  const pairGroups = useMemo<PairModerationGroup[]>(
    () =>
      membershipGroups.filter(
        (group): group is PairModerationGroup =>
          (group.partnerPairs?.length || 0) > 0,
      ),
    [membershipGroups],
  );

  const counts = useMemo<ModerationCounts>(
    () => ({
      join: joinRequests.length,
      partner: partnerRequests.length,
      students: membershipGroups.reduce(
        (total, group) => total + group.members.length,
        0,
      ),
      pairs: pairGroups.reduce(
        (total, group) => total + (group.partnerPairs?.length || 0),
        0,
      ),
    }),
    [joinRequests.length, membershipGroups, pairGroups, partnerRequests.length],
  );

  const filteredJoinRequests = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return joinRequests.filter((request) => {
      if (!lowerQuery) return true;
      const text = [
        request.applicant.name,
        request.applicant.username,
        request.applicant.email || "",
        request.applicant.phone || "",
        request.group.name,
        request.group.semesterLabel,
        request.note || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(lowerQuery);
    });
  }, [joinRequests, query]);

  const filteredPartnerRequests = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return partnerRequests.filter((request) => {
      if (!lowerQuery) return true;
      const text = [
        request.sender.name,
        request.receiver.name,
        request.sender.username,
        request.receiver.username,
        request.sender.doctorIdNumber || "",
        request.receiver.doctorIdNumber || "",
        request.group.name,
        request.group.semesterLabel,
        request.note || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(lowerQuery);
    });
  }, [partnerRequests, query]);

  const filteredMembershipGroups = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return membershipGroups
      .map((group) => ({
        ...group,
        members: [...group.members]
          .sort((left, right) =>
            left.doctor.name.localeCompare(right.doctor.name, undefined, {
              sensitivity: "base",
            }),
          )
          .filter((member) => {
            if (!lowerQuery) return true;
            const text = [
              group.name,
              group.semesterLabel,
              member.doctor.name,
              member.doctor.username,
              member.doctor.doctorIdNumber || "",
            ]
              .join(" ")
              .toLowerCase();
            return text.includes(lowerQuery);
          }),
      }))
      .filter((group) => group.members.length > 0);
  }, [membershipGroups, query]);

  const filteredPairGroups = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return pairGroups
      .map((group) => ({
        ...group,
        partnerPairs: [...(group.partnerPairs || [])]
          .sort((left, right) =>
            `${left.doctorOne.name} ${left.doctorTwo.name}`.localeCompare(
              `${right.doctorOne.name} ${right.doctorTwo.name}`,
              undefined,
              { sensitivity: "base" },
            ),
          )
          .filter((pair) => {
            if (!lowerQuery) return true;
            const text = [
              group.name,
              group.semesterLabel,
              pair.doctorOne.name,
              pair.doctorTwo.name,
              pair.doctorOne.doctorIdNumber || "",
              pair.doctorTwo.doctorIdNumber || "",
            ]
              .join(" ")
              .toLowerCase();
            return text.includes(lowerQuery);
          }),
      }))
      .filter((group) => (group.partnerPairs?.length || 0) > 0);
  }, [pairGroups, query]);

  const joinSections = useMemo<AlphabetSection<ModeratedJoinRequest>[]>(
    () => sectionByLetter(filteredJoinRequests, (request) => request.applicant.name),
    [filteredJoinRequests],
  );

  const partnerSections = useMemo<AlphabetSection<ModeratedPartnerRequest>[]>(
    () =>
      sectionByLetter(filteredPartnerRequests, (request) => request.sender.name),
    [filteredPartnerRequests],
  );

  const membershipSections = useMemo<AlphabetSection<MembershipModerationGroup>[]>(
    () => sectionByLetter(filteredMembershipGroups, (group) => group.name),
    [filteredMembershipGroups],
  );

  const pairSections = useMemo<AlphabetSection<PairModerationGroup>[]>(
    () => sectionByLetter(filteredPairGroups, (group) => group.name),
    [filteredPairGroups],
  );

  const decideJoinRequest = async (requestId: string, approve: boolean) => {
    setError(null);
    setMessage(null);
    try {
      await decideGroupJoinRequest(requestId, approve);
      setMessage(approve ? "Join request approved." : "Join request rejected.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to update join request.");
    }
  };

  const decidePartnerRequest = async (requestId: string, approve: boolean) => {
    setError(null);
    setMessage(null);
    try {
      await decidePartnerRequestAction(requestId, approve);
      setMessage(
        approve ? "Partner request approved." : "Partner request rejected.",
      );
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to update partner request.");
    }
  };

  const removeDoctorFromGroup = async (groupId: string, doctorId: string) => {
    setError(null);
    setMessage(null);
    try {
      await removeDoctorFromGroupAction(groupId, doctorId);
      setMessage("Student removed from group.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to remove student from group.");
    }
  };

  const removePair = async (pairId: string) => {
    setError(null);
    setMessage(null);
    try {
      await removePartnerPairAction(pairId);
      setMessage("Partner pair removed.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to remove partner pair.");
    }
  };

  return {
    loading,
    error,
    setError,
    message,
    setMessage,
    tab,
    setTab,
    query,
    setQuery,
    counts,
    joinSections,
    partnerSections,
    membershipSections,
    pairSections,
    filteredJoinRequests,
    filteredPartnerRequests,
    decideJoinRequest,
    decidePartnerRequest,
    removeDoctorFromGroup,
    removePair,
  };
}
