"use client";

import type {
  ModerationCounts,
  ModerationTab,
} from "../hooks/use-admin-group-moderation-workspace";

const moderationTabClass =
  "inline-flex min-h-[3rem] cursor-pointer items-center justify-center gap-3 rounded-[20px] border px-4 py-3 text-sm font-semibold shadow-[0_18px_38px_rgba(7,18,34,0.1)] backdrop-blur-[18px] transition";

type ModerationTabNavProps = {
  tab: ModerationTab;
  counts: ModerationCounts;
  onTabChange: (tab: ModerationTab) => void;
};

export function ModerationTabNav({
  tab,
  counts,
  onTabChange,
}: ModerationTabNavProps) {
  const tabButtons: Array<{
    key: ModerationTab;
    label: string;
    count: number;
  }> = [
    { key: "join", label: "Join requests", count: counts.join },
    { key: "partner", label: "Partner requests", count: counts.partner },
    { key: "students", label: "Student memberships", count: counts.students },
    { key: "pairs", label: "Active pairs", count: counts.pairs },
  ];

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {tabButtons.map((item) => {
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={`${moderationTabClass} ${
              active
                ? "border-[rgba(137,219,255,0.28)] bg-[linear-gradient(135deg,rgba(12,32,54,0.95),rgba(9,68,94,0.92))] text-white"
                : "border-white/12 bg-[rgba(255,255,255,0.28)] text-[rgba(10,22,40,0.76)] hover:border-[rgba(137,219,255,0.2)] hover:bg-[rgba(255,255,255,0.42)]"
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-1 text-xs ${
                active
                  ? "bg-white/14 text-white"
                  : "bg-[rgba(10,22,40,0.08)] text-[var(--foreground)]"
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
