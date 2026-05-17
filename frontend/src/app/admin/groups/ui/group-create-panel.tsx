"use client";

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
  return (
    <div className="denty-panel-strong p-6">
      <p className="denty-kicker">Create group</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
        Semester group setup
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
        Keep the group setup simple here, then open one focused detail panel
        for membership, planning, and activity.
      </p>
      <div className="mt-6 space-y-4">
        <input
          value={groupForm.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          className="denty-field text-sm"
          placeholder="Group 17 - Batch 2022"
        />
        <input
          value={groupForm.semesterLabel}
          onChange={(e) => onFieldChange("semesterLabel", e.target.value)}
          className="denty-field text-sm"
          placeholder="Batch 2022"
        />
        <textarea
          value={groupForm.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          className="denty-field min-h-[130px] text-sm"
          placeholder="Internal note for the admin"
        />
        <button
          onClick={onCreate}
          className="denty-button-primary w-full px-4 py-3 text-sm font-semibold"
        >
          Create group
        </button>
      </div>
    </div>
  );
}
