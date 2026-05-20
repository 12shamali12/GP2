"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type GroupDeleteDialogProps = {
  deleteDialog: { id: string; label: string } | null;
  deleteSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function GroupDeleteDialog({
  deleteDialog,
  deleteSubmitting,
  onClose,
  onConfirm,
}: GroupDeleteDialogProps) {
  const t = useTranslation();
  if (!deleteDialog) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-3 backdrop-blur-[12px] sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.84),rgba(225,234,241,0.42))] p-4 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="denty-kicker">{t("admin.groups.delete_eyebrow")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("admin.common.confirm_deletion")}
            </h2>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--muted-foreground)]">
              {t("admin.groups.delete_intro_prefix")}
              <span className="font-semibold text-[var(--foreground)]">
                {deleteDialog.label}
              </span>
              {t("admin.groups.delete_intro_suffix")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/44 text-lg font-semibold text-[var(--foreground)] transition hover:bg-white/58"
          >
            x
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="denty-button-secondary px-4 py-3 text-sm font-semibold"
          >
            {t("admin.common.cancel")}
          </button>
          <button
            type="button"
            disabled={deleteSubmitting}
            onClick={onConfirm}
            className="rounded-full border border-rose-300/40 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteSubmitting
              ? t("admin.common.deleting")
              : t("admin.groups.delete_button")}
          </button>
        </div>
      </div>
    </div>
  );
}
