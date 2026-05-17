"use client";

import Link from "next/link";
import type { ManagedUser } from "@/features/admin/types/admin";
import type { AdminGroupItem } from "@/features/supervision/types";
import { GroupCountCard } from "./group-count-card";
import { GroupPlanList } from "./group-plan-list";

type GroupDetailModalProps = {
  selectedGroup: AdminGroupItem | null;
  groupEditor: {
    name: string;
    description: string;
    semesterLabel: string;
    active: boolean;
  };
  doctors: ManagedUser[];
  doctorSelections: Record<string, string>;
  onClose: () => void;
  onDelete: (group: { id: string; label: string }) => void;
  onGroupEditorChange: (
    field: "name" | "description" | "semesterLabel" | "active",
    value: string | boolean
  ) => void;
  onDoctorSelectionChange: (groupId: string, doctorId: string) => void;
  onSaveGroupChanges: () => void;
  onAddDoctorToGroup: (groupId: string) => void;
};

export function GroupDetailModal({
  selectedGroup,
  groupEditor,
  doctors,
  doctorSelections,
  onClose,
  onDelete,
  onGroupEditorChange,
  onDoctorSelectionChange,
  onSaveGroupChanges,
  onAddDoctorToGroup,
}: GroupDetailModalProps) {
  if (!selectedGroup) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(5,12,24,0.42)] px-4 py-6 backdrop-blur-[10px]">
      <div className="mx-auto flex h-full max-w-6xl items-start justify-center">
        <div className="denty-panel-strong max-h-full w-full overflow-y-auto rounded-[34px] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Group detail</p>
              <h2 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
                {selectedGroup.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {selectedGroup.semesterLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="denty-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="denty-dashboard-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="denty-kicker">Group settings</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    Edit details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onDelete({ id: selectedGroup.id, label: selectedGroup.name })
                  }
                  className="rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700"
                >
                  Delete group
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={groupEditor.name}
                  onChange={(e) =>
                    onGroupEditorChange("name", e.target.value)
                  }
                  className="denty-field text-sm"
                  placeholder="Group name"
                />
                <input
                  value={groupEditor.semesterLabel}
                  onChange={(e) =>
                    onGroupEditorChange("semesterLabel", e.target.value)
                  }
                  className="denty-field text-sm"
                  placeholder="Semester label"
                />
                <textarea
                  value={groupEditor.description}
                  onChange={(e) =>
                    onGroupEditorChange("description", e.target.value)
                  }
                  className="denty-field min-h-[110px] text-sm"
                  placeholder="Description"
                />
                <label className="flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/34 px-4 py-3 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={groupEditor.active}
                    onChange={(e) =>
                      onGroupEditorChange("active", e.target.checked)
                    }
                  />
                  Group active
                </label>
                <button
                  type="button"
                  onClick={onSaveGroupChanges}
                  className="denty-button-primary px-4 py-3 text-sm font-semibold"
                >
                  Save group changes
                </button>
              </div>
            </div>

            <div className="denty-dashboard-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="denty-kicker">Assigned plans</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    Planning for this group
                  </h3>
                </div>
                <span className="denty-pill">
                  {(selectedGroup.currentPlan ? 1 : 0) +
                    (selectedGroup.nextPlans?.length || 0)}{" "}
                  plans
                </span>
              </div>
              <div className="mt-4">
                <GroupPlanList
                  currentPlan={selectedGroup.currentPlan}
                  nextPlans={selectedGroup.nextPlans}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 denty-panel-strong p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="denty-kicker">Moderation desk</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  Group review lives in its own page
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  Join requests, partner approvals, student removals, and
                  unpairing now stay inside the dedicated moderation workspace
                  instead of this detail panel.
                </p>
              </div>
              <Link
                href="/admin/group-moderation"
                className="denty-button-secondary px-4 py-3 text-sm font-semibold"
              >
                Open moderation desk
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <GroupCountCard
                label="Join queue"
                value={selectedGroup.joinRequests.length}
                note="Pending membership approvals."
              />
              <GroupCountCard
                label="Partner queue"
                value={selectedGroup.partnerRequests?.length || 0}
                note="Pending pair confirmations."
              />
              <GroupCountCard
                label="Active pairs"
                value={selectedGroup.partnerPairs?.length || 0}
                note="Confirmed pairings in this group."
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-5">
              <div className="denty-dashboard-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    Students
                  </p>
                  <span className="denty-pill">
                    {selectedGroup.members.length} assigned
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <select
                    value={doctorSelections[selectedGroup.id] || ""}
                    onChange={(e) =>
                      onDoctorSelectionChange(selectedGroup.id, e.target.value)
                    }
                    className="denty-field text-sm"
                  >
                    <option value="">Select student</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                        {doctor.doctorIdNumber
                          ? ` - ${doctor.doctorIdNumber}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onAddDoctorToGroup(selectedGroup.id)}
                    className="denty-button-secondary px-4 py-3 text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {[...selectedGroup.members]
                    .sort((left, right) =>
                      left.doctor.name.localeCompare(right.doctor.name, undefined, {
                        sensitivity: "base",
                      })
                    )
                    .map((member) => (
                      <div
                        key={member.doctor.id}
                        className="denty-dashboard-card-soft p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Link
                              href={`/profiles/${member.doctor.id}`}
                              className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                            >
                              {member.doctor.name}
                            </Link>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              @{member.doctor.username}
                              {member.doctor.doctorIdNumber
                                ? ` - ${member.doctor.doctorIdNumber}`
                                : ""}
                            </p>
                          </div>
                          <span className="denty-pill">Assigned</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="denty-dashboard-card p-5">
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  Active partner pairs
                </p>
                <div className="mt-4 space-y-3">
                  {[...(selectedGroup.partnerPairs || [])]
                    .sort((left, right) =>
                      `${left.doctorOne.name} ${left.doctorTwo.name}`.localeCompare(
                        `${right.doctorOne.name} ${right.doctorTwo.name}`,
                        undefined,
                        { sensitivity: "base" }
                      )
                    )
                    .map((pair) => (
                      <div key={pair.id} className="denty-dashboard-card-soft p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-[var(--foreground)]">
                              <Link
                                href={`/profiles/${pair.doctorOne.id}`}
                                className="hover:text-[rgba(7,111,133,0.96)]"
                              >
                                {pair.doctorOne.name}
                              </Link>{" "}
                              +{" "}
                              <Link
                                href={`/profiles/${pair.doctorTwo.id}`}
                                className="hover:text-[rgba(7,111,133,0.96)]"
                              >
                                {pair.doctorTwo.name}
                              </Link>
                            </p>
                            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                              @{pair.doctorOne.username} - @{pair.doctorTwo.username}
                            </p>
                          </div>
                          <span className="denty-pill">Confirmed</span>
                        </div>
                      </div>
                    ))}
                  {!selectedGroup.partnerPairs?.length ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No active pairs yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="denty-dashboard-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-[var(--foreground)]">
                      Group snapshot
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      One quick read of membership, planning, and activity before
                      you leave the group panel.
                    </p>
                  </div>
                  <span className="denty-pill">
                    {selectedGroup.members.length} students
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <GroupCountCard
                    label="Pairs"
                    value={selectedGroup.partnerPairs?.length || 0}
                    note="Active partner pairs confirmed for this group."
                  />
                  <GroupCountCard
                    label="Plans"
                    value={
                      (selectedGroup.currentPlan ? 1 : 0) +
                      (selectedGroup.nextPlans?.length || 0)
                    }
                    note="One current plan plus any queued next windows."
                  />
                  <GroupCountCard
                    label="Current plan"
                    value={selectedGroup.currentPlan ? "Live" : "None"}
                    note={
                      selectedGroup.currentPlan?.plan.label ||
                      "No active plan window right now."
                    }
                  />
                  <GroupCountCard
                    label="Next queued"
                    value={selectedGroup.nextPlans?.length || 0}
                    note="Plans queued after the current group window."
                  />
                </div>
              </div>

              <div className="denty-dashboard-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    Recent group feed
                  </p>
                  <span className="denty-pill">
                    {selectedGroup.posts.length} posts
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedGroup.posts.map((post) => (
                    <div key={post.id} className="denty-dashboard-card-soft p-4">
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {post.title || "Shared update"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                        {post.body}
                      </p>
                      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                        <Link
                          href={`/profiles/${post.author.id}`}
                          className="hover:text-[var(--foreground)]"
                        >
                          {post.author.name}
                        </Link>{" "}
                        - {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {!selectedGroup.posts.length ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No posts yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
