"use client";

import { useTranslation } from "@/features/i18n/language-provider";

type UserDeleteDialogProps = {
  deleteTarget: { id: string; name: string; role: string } | null;
  deletePassword: string;
  deleteSubmitting: boolean;
  adminUsername: string;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function UserDeleteDialog({
  deleteTarget,
  deletePassword,
  deleteSubmitting,
  adminUsername,
  onPasswordChange,
  onClose,
  onConfirm,
}: UserDeleteDialogProps) {
  const t = useTranslation();
  if (!deleteTarget) return null;

  return (
    <div className="denty-backdrop-enter fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-3 backdrop-blur-[12px] sm:p-4">
      <div className="denty-modal-enter max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.84),rgba(225,234,241,0.42))] p-4 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="denty-kicker">{t("admin.users.delete_eyebrow")}</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("admin.common.confirm_deletion")}
            </h2>
            <p className="mt-3 max-w-2xl break-words text-sm leading-7 text-[var(--muted-foreground)]">
              {t("admin.users.delete_intro_prefix")}
              <span className="font-semibold text-[var(--foreground)]">
                {deleteTarget.name}
              </span>
              {t("admin.users.delete_intro_suffix")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/44 text-lg font-semibold text-[var(--foreground)] transition hover:bg-white/58"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[24px] border border-white/12 bg-white/34 p-4 sm:p-5">
            <p className="denty-kicker !tracking-[0.18em]">
              {t("admin.common.target")}
            </p>
            <p className="mt-3 break-words text-xl font-semibold text-[var(--foreground)]">
              {deleteTarget.name}
            </p>
            <p className="mt-2 break-words text-sm text-[var(--muted-foreground)]">
              {deleteTarget.role}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
              {t("admin.users.delete_target_note")}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/12 bg-white/34 p-4 sm:p-5">
            <label className="denty-kicker !tracking-[0.18em]">
              {t("admin.users.admin_password")}
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="denty-field mt-3 text-sm"
              placeholder={t("admin.users.password_placeholder")}
              autoFocus
            />
            <p className="mt-3 text-xs leading-6 text-[var(--muted-foreground)]">
              {t("admin.users.verification_user")}
              <span className="font-semibold text-[var(--foreground)]">
                {adminUsername}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-white/14 bg-white/44 px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_36px_rgba(7,18,34,0.08)] backdrop-blur-[16px] transition hover:bg-white/58"
          >
            {t("admin.common.cancel")}
          </button>
          <button
            type="button"
            disabled={!deletePassword.trim() || deleteSubmitting}
            onClick={onConfirm}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-rose-600/24 bg-[linear-gradient(135deg,rgba(190,24,93,0.96),rgba(220,38,38,0.9))] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(190,24,93,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_24px_48px_rgba(190,24,93,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteSubmitting
              ? t("admin.common.deleting")
              : t("admin.users.delete_user")}
          </button>
        </div>
      </div>
    </div>
  );
}
