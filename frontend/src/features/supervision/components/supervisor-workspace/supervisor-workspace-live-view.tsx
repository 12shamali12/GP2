"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
import type { SupervisorWorkspaceData } from "../../types";
import type { SearchDoctorItem } from "./supervisor-workspace-types";

type Props = {
  workspace: SupervisorWorkspaceData | null;
  searchTerm: string;
  searchResults: SearchDoctorItem[];
  selectedStudent: SearchDoctorItem | null;
  freezeUntil: string;
  freezeReason: string;
  selectedStudentFreeze: { id: string } | undefined;
  setSearchTerm: (value: string) => void;
  setSelectedStudent: (student: SearchDoctorItem) => void;
  setFreezeUntil: (value: string) => void;
  setFreezeReason: (value: string) => void;
  submitFreeze: () => Promise<void>;
  unfreezeDoctor: (doctorId: string) => Promise<void>;
};

export function SupervisorWorkspaceLiveView({
  workspace,
  searchTerm,
  searchResults,
  selectedStudent,
  freezeUntil,
  freezeReason,
  selectedStudentFreeze,
  setSearchTerm,
  setSelectedStudent,
  setFreezeUntil,
  setFreezeReason,
  submitFreeze,
  unfreezeDoctor,
}: Props) {
  const t = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">
              {t("supervision.sup.live.duties_eyebrow")}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.sup.live.duties_title")}
            </h2>
          </div>
          <span className="denty-pill">
            {t("supervision.sup.live.duties_count", {
              count: workspace?.clinicOverview.length || 0,
            })}
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {workspace?.clinicOverview.map((duty) => (
            <div key={duty.id} className="denty-dashboard-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-[var(--foreground)]">{duty.clinic.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {new Date(duty.assignmentDate).toLocaleDateString()} - {duty.shift.name} - {duty.shift.startsAt} - {duty.shift.endsAt}
                  </p>
                </div>
                {duty.plan ? <span className="denty-pill">{duty.plan.label}</span> : null}
              </div>
              <div className="mt-4 space-y-3">
                {duty.groupAssignments.map((assignment) => (
                  <div key={assignment.id} className="denty-dashboard-card-soft p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">{assignment.group.name}</p>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          {t("supervision.sup.live.group_summary", {
                            students: assignment.group.members.length,
                            pairs: assignment.group.partnerPairs.length,
                          })}
                        </p>
                      </div>
                      <span className="denty-pill">
                        {t("supervision.sup.live.booked", {
                          count: assignment.slots.filter(
                            (slot) => slot.appointment,
                          ).length,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {workspace && workspace.clinicOverview.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">
                {t("supervision.sup.live.duties_eyebrow")}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("supervision.sup.live.no_duties")}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <div className="denty-panel-strong p-4 sm:p-6">
          <p className="denty-kicker">
            {t("supervision.sup.live.finder_eyebrow")}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("supervision.sup.live.finder_title")}
          </h2>
          <div className="mt-5 space-y-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="denty-field text-sm"
              placeholder={t("supervision.sup.live.finder_placeholder")}
            />
            <div className="space-y-2">
              {searchResults.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setSelectedStudent(doctor)}
                  className="denty-dashboard-card-soft w-full p-4 text-left transition hover:-translate-y-1"
                >
                  <p className="text-lg font-semibold text-[var(--foreground)]">{doctor.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    @{doctor.username}
                    {doctor.doctorIdNumber ? ` - ${doctor.doctorIdNumber}` : ""}
                  </p>
                  {doctor.groupMembership?.group ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">{doctor.groupMembership.group.name}</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="denty-panel-strong p-4 sm:p-6">
          <p className="denty-kicker">
            {t("supervision.sup.live.selected_eyebrow")}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {selectedStudent?.name || t("supervision.sup.live.choose_student")}
          </h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            {selectedStudent
              ? `${selectedStudent.doctorIdNumber || selectedStudent.username}${selectedStudent.groupMembership?.group ? ` - ${selectedStudent.groupMembership.group.name}` : ""}`
              : t("supervision.sup.live.choose_student_hint")}
          </p>
          {selectedStudent ? (
            <div className="mt-5 space-y-3">
              <Link
                href={`/profiles/${selectedStudent.id}`}
                className="inline-flex rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-white/42"
              >
                {t("supervision.sup.live.open_profile")}
              </Link>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" value={freezeUntil} onChange={(e) => setFreezeUntil(e.target.value)} className="denty-field text-sm" />
                <input value={freezeReason} onChange={(e) => setFreezeReason(e.target.value)} className="denty-field text-sm" placeholder={t("supervision.sup.live.freeze_reason")} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={submitFreeze} className="denty-button-secondary px-4 py-3 text-sm font-semibold">
                  {t("supervision.sup.live.freeze_account")}
                </button>
                {selectedStudentFreeze ? (
                  <button
                    onClick={() => unfreezeDoctor(selectedStudent.id)}
                    className="rounded-full border border-emerald-600/28 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >
                    {t("supervision.sup.live.unfreeze_account")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
