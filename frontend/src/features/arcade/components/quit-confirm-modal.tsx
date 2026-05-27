"use client";

/**
 * Shared "quit this round?" confirm modal for the arcade games.
 *
 * Replaces the native confirm() dialog so the game stays in-style during
 * the immersive full-screen mode. Locks focus to the dialog while open and
 * supports Esc to cancel.
 */

import { useEffect, useRef } from "react";

type QuitConfirmModalProps = {
  open: boolean;
  /** Game label shown in the dialog header (e.g. "Plaque Blaster"). */
  gameLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function QuitConfirmModal({
  open,
  gameLabel,
  onCancel,
  onConfirm,
}: QuitConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the destructive action so keyboard users land somewhere sensible.
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arcade-quit-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[rgba(4,10,22,0.7)] backdrop-blur-[8px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,32,55,0.96),rgba(10,18,34,0.96))] p-6 text-white shadow-[0_40px_80px_rgba(2,6,18,0.55)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.45),transparent_70%)]"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200/80">
            {gameLabel}
          </p>
          <h3
            id="arcade-quit-title"
            className="mt-2 text-2xl font-extrabold tracking-tight"
          >
            Quit this run?
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Your current score won't be saved, and today's attempt will still
            count — you can't play this game again until tomorrow.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[14px] border border-white/18 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Keep playing
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[14px] border border-rose-300/40 bg-[linear-gradient(135deg,rgba(244,63,94,0.95),rgba(190,24,93,0.95))] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(190,24,93,0.45)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-200/60"
            >
              Quit anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
