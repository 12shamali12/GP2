"use client";

import { useEffect, useMemo, useState } from "react";

export type Pagination<T> = {
  /** Current 1-based page. */
  page: number;
  /** Total number of pages (always >= 1). */
  pageCount: number;
  /** The slice of `items` for the current page. */
  pageItems: T[];
  /** Index of the first item on the page (1-based), or 0 when empty. */
  rangeStart: number;
  /** Index of the last item on the page (1-based), or 0 when empty. */
  rangeEnd: number;
  /** Total item count across all pages. */
  total: number;
  setPage: (page: number) => void;
  next: () => void;
  prev: () => void;
};

/**
 * Client-side pagination over an in-memory array.
 *
 * The page auto-clamps when `items` shrinks (e.g. after a search filter), so
 * callers never have to reset it by hand.
 */
export function usePagination<T>(items: T[], pageSize = 12): Pagination<T> {
  const [page, setPage] = useState(1);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Clamp when the list changes underneath us.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    pageCount,
    pageItems,
    rangeStart,
    rangeEnd,
    total,
    setPage: (next) => setPage(Math.min(Math.max(1, next), pageCount)),
    next: () => setPage((current) => Math.min(current + 1, pageCount)),
    prev: () => setPage((current) => Math.max(current - 1, 1)),
  };
}
