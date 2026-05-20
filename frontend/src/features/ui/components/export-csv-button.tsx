"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type ExportCsvButtonProps = {
  onExport: () => void;
  disabled?: boolean;
};

/** Pill button that triggers a CSV export of the surrounding data set. */
export function ExportCsvButton({ onExport, disabled }: ExportCsvButtonProps) {
  const t = useTranslation();
  return (
    <button
      type="button"
      onClick={onExport}
      disabled={disabled}
      className="inline-flex min-h-[2.6rem] cursor-pointer items-center gap-2 rounded-full border border-white/14 bg-[rgba(9,20,38,0.82)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[rgba(9,20,38,0.92)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {t("admin.export.csv")}
    </button>
  );
}
