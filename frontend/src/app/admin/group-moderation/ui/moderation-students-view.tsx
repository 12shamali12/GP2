"use client";

import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="denty-panel-strong max-h-[48rem] overflow-hidden p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {t("admin.mod.students_title")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t("admin.mod.students_subtitle")}
          </p>
        </div>
        <span className="denty-pill">
          {t("admin.mod.students_count", { count: total })}
        </span>
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
                    <div key={group.id} className="denty-dashboard-card p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-xl font-semibold text-[var(--foreground)]">
                            {group.name}
                          </p>
                          <p className="mt-2 break-words text-sm text-[var(--muted-foreground)]">
                            {group.semesterLabel}
                          </p>
                        </div>
                        <span className="denty-pill shrink-0">
                          {t("admin.mod.students_count", {
                            count: group.members.length,
                          })}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        {group.members.map((member) => (
                          <div
                            key={member.doctor.id}
                            className="denty-dashboard-card-soft p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-base font-semibold text-[var(--foreground)]">
                                  {member.doctor.name}
                                </p>
                                <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
                                  {member.doctor.doctorIdNumber ||
                                    member.doctor.username}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  onRemove(group.id, member.doctor.id)
                                }
                                className="min-h-[2.5rem] shrink-0 rounded-full border border-rose-600/24 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                              >
                                {t("admin.common.remove")}
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
            <p className="denty-kicker">{t("admin.mod.membership_desk")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.mod.students_empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
