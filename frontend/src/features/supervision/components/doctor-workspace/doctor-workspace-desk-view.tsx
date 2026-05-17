"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { DoctorWorkspaceData } from "../../types";

type Props = {
  workspace: DoctorWorkspaceData | null;
  currentPartner:
    | {
        id: string;
        name: string;
        username: string;
        doctorIdNumber?: string | null;
      }
    | null
    | undefined;
  groupMembersWithoutPartner: Array<{
    doctor: {
      id: string;
      name: string;
      username: string;
      doctorIdNumber?: string | null;
    };
  }>;
  todayAssignments: DoctorWorkspaceData["schedule"];
  joinForm: {
    groupId: string;
    note: string;
  };
  partnerTargetId: string;
  partnerNote: string;
  setJoinForm: Dispatch<SetStateAction<{ groupId: string; note: string }>>;
  setPartnerTargetId: Dispatch<SetStateAction<string>>;
  setPartnerNote: Dispatch<SetStateAction<string>>;
  requestJoin: () => Promise<void>;
  sendPartnerRequest: () => Promise<void>;
};

export function DoctorWorkspaceDeskView({
  workspace,
  currentPartner,
  groupMembersWithoutPartner,
  todayAssignments,
  joinForm,
  partnerTargetId,
  partnerNote,
  setJoinForm,
  setPartnerTargetId,
  setPartnerNote,
  requestJoin,
  sendPartnerRequest,
}: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-5">
        <div className="denty-panel-strong p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Partner desk</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Semester pairing</h3>
            </div>
            <span className="denty-pill">{currentPartner ? "Confirmed" : "Admin review"}</span>
          </div>
          {workspace?.groupMembership?.group ? (
            currentPartner ? (
              <div className="mt-5 rounded-[28px] border border-white/12 bg-white/36 p-5">
                <Link
                  href={`/profiles/${currentPartner.id}`}
                  className="text-2xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                >
                  {currentPartner.name}
                </Link>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  @{currentPartner.username}
                  {currentPartner.doctorIdNumber ? ` - ${currentPartner.doctorIdNumber}` : ""}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                  Unpairing is handled by admin confirmation, not from the student dashboard.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-[28px] border border-white/12 bg-white/36 p-5">
                <select
                  value={partnerTargetId}
                  onChange={(e) => setPartnerTargetId(e.target.value)}
                  className="denty-field text-sm"
                >
                  <option value="">Choose an unpaired student from your group</option>
                  {groupMembersWithoutPartner.map((member) => (
                    <option key={member.doctor.id} value={member.doctor.id}>
                      {member.doctor.name} ({member.doctor.doctorIdNumber || member.doctor.username})
                    </option>
                  ))}
                </select>
                <textarea
                  value={partnerNote}
                  onChange={(e) => setPartnerNote(e.target.value)}
                  className="denty-field min-h-[110px] text-sm"
                  placeholder="Optional note for the admin and your requested partner"
                />
                <button onClick={sendPartnerRequest} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                  Send pairing request
                </button>
              </div>
            )
          ) : (
            <div className="mt-5 rounded-[28px] border border-white/12 bg-white/36 p-5 text-sm leading-7 text-[var(--muted-foreground)]">
              Join a group first, then request a partner from unpaired students in the same group.
            </div>
          )}
          <div className="mt-5 space-y-3">
            {workspace?.partnerRequests.incoming.map((request) => (
              <div key={request.id} className="denty-dashboard-card-soft p-4">
                <Link
                  href={`/profiles/${request.sender.id}`}
                  className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                >
                  {request.sender.name}
                </Link>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  @{request.sender.username}
                  {request.sender.doctorIdNumber ? ` - ${request.sender.doctorIdNumber}` : ""}
                </p>
                {request.note ? <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{request.note}</p> : null}
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">Waiting for admin confirmation</p>
              </div>
            ))}
            {workspace?.partnerRequests.outgoing.map((request) => (
              <div key={request.id} className="denty-dashboard-card-soft p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Request pending with {request.receiver.name}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">Admin will confirm the pairing after review.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="denty-panel-strong p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Report lane</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Visible supervisors</h3>
            </div>
            <span className="denty-pill">{workspace?.reportSupervisors.length || 0}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {workspace?.reportSupervisors.map((supervisor) => (
              <Link
                key={supervisor.id}
                href={`/profiles/${supervisor.id}`}
                className="denty-pill hover:bg-white/36"
              >
                {supervisor.name}
              </Link>
            ))}
            {workspace?.reportSupervisors.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No supervisor is attached to today's clinic yet.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="denty-panel-strong p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Today</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Clinic desk</h3>
            </div>
            <span className="denty-pill">{todayAssignments.length} duties</span>
          </div>
          <div className="mt-5 space-y-3">
            {todayAssignments.map((assignment) => (
              <div key={assignment.id} className="denty-dashboard-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-[var(--foreground)]">{assignment.clinic.name}</p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {assignment.shift.name} - {assignment.shift.startsAt} - {assignment.shift.endsAt}
                    </p>
                  </div>
                  {assignment.plan ? <span className="denty-pill">{assignment.plan.label}</span> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assignment.supervisors.map((link) => (
                    <span key={link.id} className="denty-pill">{link.supervisor.name}</span>
                  ))}
                </div>
              </div>
            ))}
            {!todayAssignments.length ? (
              <div className="denty-placeholder p-5">
                <p className="denty-kicker">Clinic desk</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">No clinic assignment is attached to today yet.</p>
              </div>
            ) : null}
          </div>
        </div>

        {!workspace?.groupMembership?.group ? (
          <div className="denty-panel-strong p-6">
            <p className="denty-kicker">Join a group</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Request semester placement</h3>
            <div className="mt-5 space-y-3">
              <select
                value={joinForm.groupId}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, groupId: e.target.value }))}
                className="denty-field text-sm"
              >
                <option value="">Choose a group</option>
                {workspace?.joinableGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name} - {group.semesterLabel}</option>
                ))}
              </select>
              <textarea
                value={joinForm.note}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, note: e.target.value }))}
                className="denty-field min-h-[120px] text-sm"
                placeholder="Optional note for the admin"
              />
              <button onClick={requestJoin} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                Request group access
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
