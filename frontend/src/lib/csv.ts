/**
 * Tiny dependency-free CSV export helper.
 *
 * Builds an RFC-4180-style CSV string from a list of rows and triggers a
 * browser download. Every cell is quoted and inner quotes are doubled so
 * commas, quotes, and newlines in the data never corrupt the file. A UTF-8
 * BOM is prepended so Excel opens Arabic / accented text correctly.
 */

export type CsvColumn<T> = {
  /** Column header shown in the first CSV row. */
  header: string;
  /** Pulls the cell value for a given row. */
  value: (row: T) => string | number | boolean | null | undefined;
};

const escapeCell = (
  raw: string | number | boolean | null | undefined,
): string => {
  const text = raw == null ? "" : String(raw);
  return `"${text.replace(/"/g, '""')}"`;
};

/** Serialise `rows` to CSV text using the given `columns`. */
export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(","),
    )
    .join("\r\n");
  return body ? `${header}\r\n${body}` : header;
}

/**
 * Build a CSV from `rows` and download it as `<filename>-<YYYY-MM-DD>.csv`.
 * No-op outside the browser. Returns the number of data rows written.
 */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): number {
  if (typeof window === "undefined") return 0;

  const csv = rowsToCsv(rows, columns);
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return rows.length;
}
