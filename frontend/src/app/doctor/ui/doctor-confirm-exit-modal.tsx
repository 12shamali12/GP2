"use client";

type DoctorConfirmExitModalProps = {
  open: boolean;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
};

export function DoctorConfirmExitModal({
  open,
  onDiscard,
  onSave,
}: DoctorConfirmExitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900/90 p-6 shadow-2xl text-slate-50">
        <h3 className="mb-2 text-xl font-bold">Leave without saving?</h3>

        <p className="mb-4 text-sm text-slate-100/90">
          You have unsaved changes. Save them or leave and discard.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onDiscard}
            className="cursor-pointer rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600/40"
          >
            Leave without saving
          </button>

          <button
            onClick={onSave}
            className="cursor-pointer rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-50 shadow hover:bg-slate-500"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
