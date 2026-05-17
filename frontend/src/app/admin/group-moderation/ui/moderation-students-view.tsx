"use client";

import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { MembershipModerationGroup } from "../hooks/use-admin-group-moderation-workspace";

type ModerationStudentsViewProps = {
  sections: AlphabetSection<MembershipModerationGroup>[];
  total: number;
  onRemove: (groupId: string, doctorId: string) => void;
};

export function ModerationStudentsView({
  sections,
  total,
  onRemove,
}: ModerationStudentsViewProps) {
  return (
    <div className="denty-panel-strong max-h-[48rem] overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Student memberships
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Remove students from groups from one place.
          </p>
        </div>
        <span className="denty-pill">{total} students</span>
      </div>

      <div className="mt-5 max-h-[38rem] overflow-y-auto pr-2">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.letter}>
                <p className="denty-kicker !tracking-[0.18em]">
                  {section.letter}
                </p>
                <div className="mt-3 space-y-4">
                  {section.items.map((group) => (
                    <div key={group.id} className="denty-dashboard-card p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xl font-semibold text-[var(--foreground)]">
                            {group.name}
                          </p>
                          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                            {group.semesterLabel}
                          </p>
                        </div>
                        <span className="denty-pill">
                          {group.members.length} students
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        {group.members.map((member) => (
                          <div
                            key={member.doctor.id}
                            className="denty-dashboard-card-soft p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-[var(--foreground)]">
                                  {member.doctor.name}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                  {member.doctor.doctorIdNumber ||
                                    member.doctor.username}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  onRemove(group.id, member.doctor.id)
                                }
                                className="rounded-full border border-rose-600/24 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Membership desk</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No group members match the current filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
