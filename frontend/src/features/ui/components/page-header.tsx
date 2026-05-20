import { BrandMark } from "@/features/ui/components/brand-mark";

type PageHeaderProps = {
  title: string;
  description: string;
  /** Short uppercase tag shown beside the title (e.g. "Doctor workspace"). */
  badge?: string;
};

/**
 * Compact workspace header shared by every role (admin / doctor / patient /
 * supervisor). A slim brand + title + one-line description bar — it replaced
 * the older full-width banner cards that ate most of the first screen.
 */
export function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.8),rgba(222,233,241,0.36))] px-4 py-3 shadow-[0_16px_40px_rgba(7,18,34,0.12)] backdrop-blur-[24px] sm:px-5 sm:py-3.5">
      <div className="flex items-center gap-3">
        <BrandMark className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="text-base font-semibold leading-tight text-[var(--foreground)] sm:text-lg">
              {title}
            </h1>
            {badge ? (
              <span className="shrink-0 rounded-full border border-white/22 bg-white/35 px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.6)]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
