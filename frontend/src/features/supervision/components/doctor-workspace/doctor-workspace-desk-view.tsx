"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-5">
        <div className="denty-panel-strong p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">
                {t("supervision.desk.partner_eyebrow")}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {t("supervision.desk.partner_title")}
              </h3>
            </div>
            <span className="denty-pill">
              {currentPartner
                ? t("supervision.desk.partner_confirmed")
                : t("supervision.desk.partner_review")}
            </span>
          </div>
          {workspace?.groupMembership?.group ? (
            currentPartner ? (
              <div className="mt-5 rounded-[22px] border border-white/12 bg-white/36 p-5">
                <Link
                  href={`/profiles/${currentPartner.id}`}
                  className="text-xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                >
                  {currentPartner.name}
                </Link>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  @{currentPartner.username}
                  {currentPartner.doctorIdNumber ? ` - ${currentPartner.doctorIdNumber}` : ""}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                  {t("supervision.desk.unpair_note")}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-[22px] border border-white/12 bg-white/36 p-5">
                <select
                  value={partnerTargetId}
                  onChange={(e) => setPartnerTargetId(e.target.value)}
                  className="denty-field text-sm"
                >
                  <option value="">
                    {t("supervision.desk.choose_partner")}
                  </option>
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
                  placeholder={t("supervision.desk.partner_note_placeholder")}
                />
                <button onClick={sendPartnerRequest} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                  {t("supervision.desk.send_pairing")}
                </button>
              </div>
            )
          ) : (
            <div className="mt-5 rounded-[22px] border border-white/12 bg-white/36 p-5 text-sm leading-7 text-[var(--muted-foreground)]">
              {t("supervision.desk.join_first")}
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
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                  {t("supervision.desk.waiting_admin")}
                </p>
              </div>
            ))}
            {workspace?.partnerRequests.outgoing.map((request) => (
              <div key={request.id} className="denty-dashboard-card-soft p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t("supervision.desk.request_pending_with", {
                    name: request.receiver.name,
                  })}
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {t("supervision.desk.admin_will_confirm")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="denty-panel-strong p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">
                {t("supervision.desk.report_eyebrow")}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {t("supervision.desk.report_title")}
              </h3>
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
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("supervision.desk.no_supervisor")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="denty-panel-strong flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">{t("supervision.desk.today_eyebrow")}</p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {t("supervision.desk.today_title")}
              </h3>
            </div>
            <span className="denty-pill">
              {t("supervision.desk.duties_count", {
                count: todayAssignments.length,
              })}
            </span>
          </div>
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {todayAssignments.map((assignment) => (
              <div key={assignment.id} className="denty-dashboard-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-[var(--foreground)]">{assignment.clinic.name}</p>
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
                <p className="denty-kicker">
                  {t("supervision.desk.today_title")}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("supervision.desk.no_clinic_today")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {!workspace?.groupMembership?.group ? (
          <div className="denty-panel-strong p-4 sm:p-6">
            <p className="denty-kicker">{t("supervision.desk.join_eyebrow")}</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.desk.join_title")}
            </h3>
            <div className="mt-5 space-y-3">
              <select
                value={joinForm.groupId}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, groupId: e.target.value }))}
                className="denty-field text-sm"
              >
                <option value="">{t("supervision.desk.choose_group")}</option>
                {workspace?.joinableGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name} - {group.semesterLabel}</option>
                ))}
              </select>
              <textarea
                value={joinForm.note}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, note: e.target.value }))}
                className="denty-field min-h-[120px] text-sm"
                placeholder={t("supervision.desk.join_note_placeholder")}
              />
              <button onClick={requestJoin} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                {t("supervision.desk.request_group_access")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
