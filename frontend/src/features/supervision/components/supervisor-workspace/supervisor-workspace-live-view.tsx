"use client";

import Link from "next/link";
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
  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Clinic duties</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Who is in your clinic today</h2>
          </div>
          <span className="denty-pill">{workspace?.clinicOverview.length || 0} duties</span>
        </div>
        <div className="mt-5 space-y-4">
          {workspace?.clinicOverview.map((duty) => (
            <div key={duty.id} className="denty-dashboard-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{duty.clinic.name}</p>
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
                          {assignment.group.members.length} students - {assignment.group.partnerPairs.length} pairs
                        </p>
                      </div>
                      <span className="denty-pill">{assignment.slots.filter((slot) => slot.appointment).length} booked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {workspace && workspace.clinicOverview.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">Clinic duties</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">No clinic duties are assigned yet.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <div className="denty-panel-strong p-6">
          <p className="denty-kicker">Student finder</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Search by name or student ID</h2>
          <div className="mt-5 space-y-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="denty-field text-sm"
              placeholder="Search doctors by student ID, name, or username"
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

        <div className="denty-panel-strong p-6">
          <p className="denty-kicker">Selected student</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{selectedStudent?.name || "Choose a student"}</h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            {selectedStudent
              ? `${selectedStudent.doctorIdNumber || selectedStudent.username}${selectedStudent.groupMembership?.group ? ` - ${selectedStudent.groupMembership.group.name}` : ""}`
              : "Search a student first, then freeze, unfreeze, schedule exams, or assign an individual task."}
          </p>
          {selectedStudent ? (
            <div className="mt-5 space-y-3">
              <Link
                href={`/profiles/${selectedStudent.id}`}
                className="inline-flex rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-white/42"
              >
                Open profile
              </Link>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" value={freezeUntil} onChange={(e) => setFreezeUntil(e.target.value)} className="denty-field text-sm" />
                <input value={freezeReason} onChange={(e) => setFreezeReason(e.target.value)} className="denty-field text-sm" placeholder="Freeze reason" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={submitFreeze} className="denty-button-secondary px-4 py-3 text-sm font-semibold">Freeze account</button>
                {selectedStudentFreeze ? (
                  <button
                    onClick={() => unfreezeDoctor(selectedStudent.id)}
                    className="rounded-full border border-emerald-600/28 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >
                    Unfreeze account
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
