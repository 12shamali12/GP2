"use client";

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
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-4 backdrop-blur-[12px]">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.84),rgba(225,234,241,0.42))] p-6 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Delete account</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Confirm permanent deletion
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              This will permanently remove{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {deleteTarget.name}
              </span>{" "}
              from the platform. Enter the admin account password to confirm the
              action.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/44 text-lg font-semibold text-[var(--foreground)] transition hover:bg-white/58"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[24px] border border-white/12 bg-white/34 p-5">
            <p className="denty-kicker !tracking-[0.18em]">Target</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {deleteTarget.name}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {deleteTarget.role}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
              The action cannot be undone. Related academic, chat, and
              scheduling records will be cleaned by the backend delete flow.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/12 bg-white/34 p-5">
            <label className="denty-kicker !tracking-[0.18em]">
              Admin password
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="denty-field mt-3 text-sm"
              placeholder="Enter the admin password"
              autoFocus
            />
            <p className="mt-3 text-xs leading-6 text-[var(--muted-foreground)]">
              Username used for verification:{" "}
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
            Cancel
          </button>
          <button
            type="button"
            disabled={!deletePassword.trim() || deleteSubmitting}
            onClick={onConfirm}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-rose-600/24 bg-[linear-gradient(135deg,rgba(190,24,93,0.96),rgba(220,38,38,0.9))] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(190,24,93,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_24px_48px_rgba(190,24,93,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteSubmitting ? "Deleting..." : "Delete user"}
          </button>
        </div>
      </div>
    </div>
  );
}
