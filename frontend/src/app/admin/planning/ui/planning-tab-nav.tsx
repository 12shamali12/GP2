"use client";

type PlanningTab = "resources" | "plans" | "assignments" | "supervisors";

type PlanningTabNavProps = {
  tab: PlanningTab;
  onChange: (tab: PlanningTab) => void;
  baseClass: string;
  activeClass: string;
  inactiveClass: string;
};

const tabs: Array<{ key: PlanningTab; label: string }> = [
  { key: "resources", label: "Clinics&Shifts" },
  { key: "plans", label: "Plans" },
  { key: "assignments", label: "Assignments" },
  { key: "supervisors", label: "Supervisors" },
];

export function PlanningTabNav({
  tab,
  onChange,
  baseClass,
  activeClass,
  inactiveClass,
}: PlanningTabNavProps) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.14)] p-2 shadow-[0_18px_44px_rgba(7,18,34,0.08)] backdrop-blur-[18px]">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`${baseClass} ${
            tab === key ? activeClass : inactiveClass
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
