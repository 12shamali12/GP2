"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type GroupCreatePanelProps = {
  groupForm: {
    name: string;
    description: string;
    semesterLabel: string;
  };
  onFieldChange: (
    field: "name" | "description" | "semesterLabel",
    value: string
  ) => void;
  onCreate: () => void;
};

export function GroupCreatePanel({
  groupForm,
  onFieldChange,
  onCreate,
}: GroupCreatePanelProps) {
  const t = useTranslation();
  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <p className="denty-kicker">{t("admin.groups.create_eyebrow")}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
        {t("admin.groups.create_heading")}
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
        {t("admin.groups.create_intro")}
      </p>
      <div className="mt-6 space-y-4">
        <input
          value={groupForm.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          className="denty-field text-sm"
          placeholder={t("admin.groups.name_placeholder")}
        />
        <input
          value={groupForm.semesterLabel}
          onChange={(e) => onFieldChange("semesterLabel", e.target.value)}
          className="denty-field text-sm"
          placeholder={t("admin.groups.semester_placeholder")}
        />
        <textarea
          value={groupForm.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          className="denty-field min-h-[130px] text-sm"
          placeholder={t("admin.groups.note_placeholder")}
        />
        <button
          onClick={onCreate}
          className="denty-button-primary w-full px-4 py-3 text-sm font-semibold"
        >
          {t("admin.groups.create_button")}
        </button>
      </div>
    </div>
  );
}
