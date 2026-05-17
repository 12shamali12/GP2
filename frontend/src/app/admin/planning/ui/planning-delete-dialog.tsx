"use client";

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
  if (!deleteDialog) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-4 backdrop-blur-[12px]">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.84),rgba(225,234,241,0.42))] p-6 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Delete {deleteDialog.kind}</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Confirm permanent deletion
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
              This will permanently remove{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {deleteDialog.label}
              </span>
              . This dialog matches the admin style, but does not require a
              password.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/44 text-lg font-semibold text-[var(--foreground)] transition hover:bg-white/58"
          >
            x
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/12 bg-white/34 p-5">
          <p className="denty-kicker">Target</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {deleteDialog.label}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Type: {deleteDialog.kind}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryAction}>
            Cancel
          </button>
          <button
            type="button"
            disabled={deleteSubmitting}
            onClick={onConfirm}
            className={`${dangerAction} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
