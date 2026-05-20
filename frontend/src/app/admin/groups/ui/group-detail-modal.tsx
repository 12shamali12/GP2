"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  if (!selectedGroup) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(5,12,24,0.42)] px-3 py-4 backdrop-blur-[10px] sm:px-4 sm:py-6">
      <div className="mx-auto flex h-full max-w-6xl items-start justify-center">
        <div className="denty-panel-strong max-h-full w-full overflow-y-auto rounded-[24px] p-4 sm:rounded-[34px] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="denty-kicker">{t("admin.groups.detail_eyebrow")}</p>
              <h2 className="mt-3 break-words text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
                {selectedGroup.name}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--muted-foreground)]">
                {selectedGroup.semesterLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="denty-button-secondary shrink-0 px-4 py-3 text-sm font-semibold"
            >
              {t("admin.common.close")}
            </button>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="denty-dashboard-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="denty-kicker">{t("admin.groups.group_settings")}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {t("admin.groups.edit_details")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onDelete({ id: selectedGroup.id, label: selectedGroup.name })
                  }
                  className="min-h-[2.5rem] shrink-0 rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700"
                >
                  {t("admin.groups.delete_button")}
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={groupEditor.name}
                  onChange={(e) =>
                    onGroupEditorChange("name", e.target.value)
                  }
                  className="denty-field text-sm"
                  placeholder={t("admin.groups.field_name")}
                />
                <input
                  value={groupEditor.semesterLabel}
                  onChange={(e) =>
                    onGroupEditorChange("semesterLabel", e.target.value)
                  }
                  className="denty-field text-sm"
                  placeholder={t("admin.groups.field_semester")}
                />
                <textarea
                  value={groupEditor.description}
                  onChange={(e) =>
                    onGroupEditorChange("description", e.target.value)
                  }
                  className="denty-field min-h-[110px] text-sm"
                  placeholder={t("admin.groups.field_description")}
                />
                <label className="flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/34 px-4 py-3 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={groupEditor.active}
                    onChange={(e) =>
                      onGroupEditorChange("active", e.target.checked)
                    }
                  />
                  {t("admin.groups.group_active")}
                </label>
                <button
                  type="button"
                  onClick={onSaveGroupChanges}
                  className="denty-button-primary px-4 py-3 text-sm font-semibold"
                >
                  {t("admin.groups.save_changes")}
                </button>
              </div>
            </div>

            <div className="denty-dashboard-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="denty-kicker">{t("admin.groups.assigned_plans")}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {t("admin.groups.planning_for_group")}
                  </h3>
                </div>
                <span className="denty-pill shrink-0">
                  {t("admin.groups.plans_count", {
                    count:
                      (selectedGroup.currentPlan ? 1 : 0) +
                      (selectedGroup.nextPlans?.length || 0),
                  })}
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

          <div className="mt-6 denty-panel-strong p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="denty-kicker">{t("admin.groups.mod_desk_eyebrow")}</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {t("admin.groups.mod_desk_heading")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  {t("admin.groups.mod_desk_intro")}
                </p>
              </div>
              <Link
                href="/admin/group-moderation"
                className="denty-button-secondary px-4 py-3 text-sm font-semibold"
              >
                {t("admin.groups.open_mod_desk")}
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <GroupCountCard
                label={t("admin.groups.join_queue")}
                value={selectedGroup.joinRequests.length}
                note={t("admin.groups.join_queue_note")}
              />
              <GroupCountCard
                label={t("admin.groups.partner_queue")}
                value={selectedGroup.partnerRequests?.length || 0}
                note={t("admin.groups.partner_queue_note")}
              />
              <GroupCountCard
                label={t("admin.groups.active_pairs")}
                value={selectedGroup.partnerPairs?.length || 0}
                note={t("admin.groups.active_pairs_note")}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-5">
              <div className="denty-dashboard-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    {t("admin.groups.students")}
                  </p>
                  <span className="denty-pill shrink-0">
                    {t("admin.groups.assigned_count", {
                      count: selectedGroup.members.length,
                    })}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <select
                    value={doctorSelections[selectedGroup.id] || ""}
                    onChange={(e) =>
                      onDoctorSelectionChange(selectedGroup.id, e.target.value)
                    }
                    className="denty-field min-w-0 text-sm"
                  >
                    <option value="">{t("admin.groups.select_student")}</option>
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
                    className="denty-button-secondary shrink-0 px-4 py-3 text-sm font-semibold"
                  >
                    {t("admin.groups.add")}
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
                          <div className="min-w-0">
                            <Link
                              href={`/profiles/${member.doctor.id}`}
                              className="break-words text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                            >
                              {member.doctor.name}
                            </Link>
                            <p className="break-words text-sm text-[var(--muted-foreground)]">
                              @{member.doctor.username}
                              {member.doctor.doctorIdNumber
                                ? ` - ${member.doctor.doctorIdNumber}`
                                : ""}
                            </p>
                          </div>
                          <span className="denty-pill shrink-0">
                            {t("admin.groups.assigned")}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="denty-dashboard-card p-4 sm:p-5">
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  {t("admin.groups.active_partner_pairs")}
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
                          <div className="min-w-0">
                            <p className="break-words text-lg font-semibold text-[var(--foreground)]">
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
                            <p className="mt-2 break-words text-sm text-[var(--muted-foreground)]">
                              @{pair.doctorOne.username} - @{pair.doctorTwo.username}
                            </p>
                          </div>
                          <span className="denty-pill shrink-0">
                            {t("admin.groups.confirmed")}
                          </span>
                        </div>
                      </div>
                    ))}
                  {!selectedGroup.partnerPairs?.length ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {t("admin.groups.no_active_pairs")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="denty-dashboard-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-[var(--foreground)]">
                      {t("admin.groups.snapshot")}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {t("admin.groups.snapshot_note")}
                    </p>
                  </div>
                  <span className="denty-pill shrink-0">
                    {t("admin.groups.students_count", {
                      count: selectedGroup.members.length,
                    })}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <GroupCountCard
                    label={t("admin.groups.count_pairs")}
                    value={selectedGroup.partnerPairs?.length || 0}
                    note={t("admin.groups.count_pairs_note")}
                  />
                  <GroupCountCard
                    label={t("admin.groups.count_plans")}
                    value={
                      (selectedGroup.currentPlan ? 1 : 0) +
                      (selectedGroup.nextPlans?.length || 0)
                    }
                    note={t("admin.groups.count_plans_note")}
                  />
                  <GroupCountCard
                    label={t("admin.groups.count_current_plan")}
                    value={
                      selectedGroup.currentPlan
                        ? t("admin.groups.current_live")
                        : t("admin.groups.current_none")
                    }
                    note={
                      selectedGroup.currentPlan?.plan.label ||
                      t("admin.groups.no_active_window")
                    }
                  />
                  <GroupCountCard
                    label={t("admin.groups.count_next_queued")}
                    value={selectedGroup.nextPlans?.length || 0}
                    note={t("admin.groups.next_queued_note")}
                  />
                </div>
              </div>

              <div className="denty-dashboard-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    {t("admin.groups.recent_feed")}
                  </p>
                  <span className="denty-pill shrink-0">
                    {t("admin.groups.posts_count", {
                      count: selectedGroup.posts.length,
                    })}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedGroup.posts.map((post) => (
                    <div key={post.id} className="denty-dashboard-card-soft p-4">
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {post.title || t("admin.groups.shared_update")}
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
                      {t("admin.groups.no_posts")}
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
