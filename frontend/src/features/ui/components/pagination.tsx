"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type PaginationProps = {
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (page: number) => void;
};

/** Builds a compact page list, using -1 markers where pages are skipped. */
const buildPageList = (page: number, pageCount: number): number[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const wanted = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = Array.from(wanted)
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  const withGaps: number[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) withGaps.push(-1);
    withGaps.push(value);
  });
  return withGaps;
};

/**
 * Reusable pager. Renders nothing when there is a single page, so callers can
 * drop it in unconditionally below any list.
 */
export function Pagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPrev,
  onNext,
  onPage,
}: PaginationProps) {
  const t = useTranslation();
  if (pageCount <= 1) return null;

  const pages = buildPageList(page, pageCount);
  const buttonBase =
    "inline-flex min-h-[2.5rem] min-w-[2.5rem] cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-[var(--muted-foreground)]">
        {t("common.pagination.range", {
          start: rangeStart,
          end: rangeEnd,
          total,
        })}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className={`${buttonBase} border-white/14 bg-white/40 text-[var(--foreground)] hover:bg-white/60`}
        >
          {t("common.pagination.prev")}
        </button>

        {pages.map((value, index) =>
          value === -1 ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-[var(--muted-foreground)]"
            >
              ...
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onPage(value)}
              aria-current={value === page ? "page" : undefined}
              className={`${buttonBase} ${
                value === page
                  ? "border-transparent bg-[rgba(9,20,38,0.82)] text-white"
                  : "border-white/14 bg-white/40 text-[var(--foreground)] hover:bg-white/60"
              }`}
            >
              {value}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={page >= pageCount}
          className={`${buttonBase} border-white/14 bg-white/40 text-[var(--foreground)] hover:bg-white/60`}
        >
          {t("common.pagination.next")}
        </button>
      </div>
    </div>
  );
}
