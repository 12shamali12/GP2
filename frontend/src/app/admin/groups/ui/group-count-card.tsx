"use client";

type GroupCountCardProps = {
  label: string;
  value: string | number;
  note: string;
};

export function GroupCountCard({
  label,
  value,
  note,
}: GroupCountCardProps) {
  return (
    <div className="denty-dashboard-card-soft p-4">
      <p className="denty-kicker">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{note}</p>
    </div>
  );
}
