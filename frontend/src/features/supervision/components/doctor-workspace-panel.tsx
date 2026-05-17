"use client";

import { useEffect, useMemo, useState } from "react";
import type { DoctorWorkspaceData } from "../types";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { DoctorWorkspaceCommunityView } from "./doctor-workspace/doctor-workspace-community-view";
import { DoctorWorkspaceDeskView } from "./doctor-workspace/doctor-workspace-desk-view";
import { DoctorWorkspaceHero } from "./doctor-workspace/doctor-workspace-hero";
import { DoctorWorkspacePlanView } from "./doctor-workspace/doctor-workspace-plan-view";
import { DoctorWorkspaceTasksView } from "./doctor-workspace/doctor-workspace-tasks-view";
import { DoctorWorkspaceViewSwitch } from "./doctor-workspace/doctor-workspace-view-switch";
import type { DoctorWorkspaceViewKey } from "./doctor-workspace/doctor-workspace-types";

type Props = {
  apiUrl: string;
  identifier: string;
  onWorkspaceChange?: (workspace: DoctorWorkspaceData | null) => void;
};

const tabBaseClass =
  "inline-flex min-h-[3.4rem] items-center justify-center rounded-[20px] border px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] backdrop-blur-[18px] shadow-[0_18px_38px_rgba(4,11,26,0.12)] transition";

const tabActiveClass =
  "border-[rgba(7,111,133,0.22)] bg-[linear-gradient(180deg,rgba(7,111,133,0.16),rgba(7,111,133,0.1))] text-[rgba(7,111,133,0.96)] shadow-[0_20px_42px_rgba(7,111,133,0.14)]";

const tabInactiveClass =
  "border-white/12 bg-[rgba(255,255,255,0.34)] text-[rgba(10,22,40,0.76)] hover:border-white/18 hover:bg-[rgba(255,255,255,0.5)]";

export function DoctorWorkspacePanel({ apiUrl, identifier, onWorkspaceChange }: Props) {
  const [workspace, setWorkspace] = useState<DoctorWorkspaceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<DoctorWorkspaceViewKey>("desk");
  const [joinForm, setJoinForm] = useState({ groupId: "", note: "" });
  const [partnerTargetId, setPartnerTargetId] = useState("");
  const [partnerNote, setPartnerNote] = useState("");
  const [postForm, setPostForm] = useState({ title: "", body: "" });

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Student workspace",
    errorTitle: "Student workspace",
  });

  const loadWorkspace = async () => {
    if (!identifier) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/supervisor/doctor-workspace?identifier=${encodeURIComponent(identifier)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load doctor workspace.");
      setWorkspace(data);
      onWorkspaceChange?.(data);
    } catch (e: any) {
      const nextError = e?.message || "Failed to load doctor workspace.";
      setError(nextError);
      onWorkspaceChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  const currentPartner = useMemo(() => {
    if (!workspace?.partnerPair) return null;
    return workspace.partnerPair.doctorOne.id === workspace.doctor.id
      ? workspace.partnerPair.doctorTwo
      : workspace.partnerPair.doctorOne;
  }, [workspace]);

  const groupMembersWithoutPartner = useMemo(() => {
    if (!workspace?.groupMembership?.group) return [];
    const pairedIds = new Set<string>();
    workspace.groupMembership.group.partnerPairs.forEach((pair) => {
      pairedIds.add(pair.doctorOne.id);
      pairedIds.add(pair.doctorTwo.id);
    });
    return workspace.groupMembership.group.members.filter(
      (member) => member.doctor.id !== workspace.doctor.id && !pairedIds.has(member.doctor.id),
    );
  }, [workspace]);

  const todayAssignments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      workspace?.schedule.filter((assignment) => {
        const next = new Date(assignment.assignmentDate);
        next.setHours(0, 0, 0, 0);
        return next.getTime() === today.getTime();
      }) || []
    );
  }, [workspace]);

  const requestJoin = async () => {
    if (!joinForm.groupId) {
      setError("Choose a group first.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/group-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantIdentifier: identifier,
          groupId: joinForm.groupId,
          note: joinForm.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to request group access.");
      setMessage("Group request sent to admin.");
      setJoinForm({ groupId: "", note: "" });
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || "Failed to request group access.");
    }
  };

  const sendPartnerRequest = async () => {
    if (!partnerTargetId) {
      setError("Choose a partner first.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/supervisor/partner-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderIdentifier: identifier,
          receiverIdentifier: partnerTargetId,
          note: partnerNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send partner request.");
      setMessage("Pairing request sent for admin confirmation.");
      setPartnerTargetId("");
      setPartnerNote("");
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || "Failed to send partner request.");
    }
  };

  const createPost = async () => {
    if (!workspace?.groupMembership?.group.id) return;
    if (!postForm.body.trim()) {
      setError("Write something before publishing.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${apiUrl}/supervisor/groups/${workspace.groupMembership.group.id}/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorIdentifier: identifier,
            title: postForm.title || undefined,
            body: postForm.body,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to publish post.");
      setMessage("Post published to the group feed.");
      setPostForm({ title: "", body: "" });
      await loadWorkspace();
    } catch (e: any) {
      setError(e?.message || "Failed to publish post.");
    }
  };

  return (
    <div className="space-y-5">
      <DoctorWorkspaceHero view={view} workspace={workspace} currentPartner={currentPartner} />

      <DoctorWorkspaceViewSwitch
        view={view}
        onChange={setView}
        tabBaseClass={tabBaseClass}
        tabActiveClass={tabActiveClass}
        tabInactiveClass={tabInactiveClass}
      />

      {loading ? <p className="text-sm text-[var(--muted-foreground)]">Loading workspace...</p> : null}

      {view === "desk" ? (
        <DoctorWorkspaceDeskView
          workspace={workspace}
          currentPartner={currentPartner}
          groupMembersWithoutPartner={groupMembersWithoutPartner}
          todayAssignments={todayAssignments}
          joinForm={joinForm}
          partnerTargetId={partnerTargetId}
          partnerNote={partnerNote}
          setJoinForm={setJoinForm}
          setPartnerTargetId={setPartnerTargetId}
          setPartnerNote={setPartnerNote}
          requestJoin={requestJoin}
          sendPartnerRequest={sendPartnerRequest}
        />
      ) : null}

      {view === "plan" ? <DoctorWorkspacePlanView workspace={workspace} /> : null}

      {view === "tasks" ? <DoctorWorkspaceTasksView workspace={workspace} /> : null}

      {view === "community" ? (
        <DoctorWorkspaceCommunityView
          workspace={workspace}
          postForm={postForm}
          setPostForm={setPostForm}
          createPost={createPost}
        />
      ) : null}
    </div>
  );
}
