"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type DeleteDialogState =
  | {
      kind: "clinic" | "shift" | "plan" | "semester" | "clinicCase";
      id: string;
      label: string;
    }
  | null;

type PlanningDeleteDialogProps = {
  deleteDialog: DeleteDialogState;
  deleteSubmitting: boolean;
  secondaryAction: string;
  dangerAction: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function PlanningDeleteDialog({
  deleteDialog,
  deleteSubmitting,
  secondaryAction,
  dangerAction,
  onClose,
  onConfirm,
}: PlanningDeleteDialogProps) {
  const t = useTranslation();
  if (!deleteDialog) return null;

  const kindLabel = t(`admin.plan.kind_${deleteDialog.kind}`);

  return (
    <div className="denty-backdrop-enter fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-3 backdrop-blur-[12px] sm:p-4">
      <div className="denty-modal-enter max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.84),rgba(225,234,241,0.42))] p-4 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="denty-kicker">
              {t("admin.plan.delete_kind", { kind: kindLabel })}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("admin.common.confirm_deletion")}
            </h2>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--muted-foreground)]">
              {t("admin.plan.delete_intro_prefix")}
              <span className="font-semibold text-[var(--foreground)]">
                {deleteDialog.label}
              </span>
              {t("admin.plan.delete_intro_suffix")}
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

        <div className="mt-6 rounded-[24px] border border-white/12 bg-white/34 p-4 sm:p-5">
          <p className="denty-kicker">{t("admin.common.target")}</p>
          <p className="mt-3 break-words text-xl font-semibold text-[var(--foreground)]">
            {deleteDialog.label}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t("admin.plan.delete_type", { kind: kindLabel })}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryAction}>
            {t("admin.common.cancel")}
          </button>
          <button
            type="button"
            disabled={deleteSubmitting}
            onClick={onConfirm}
            className={`${dangerAction} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {deleteSubmitting
              ? t("admin.common.deleting")
              : t("admin.common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
