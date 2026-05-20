"use client";

import { BrandMark } from "@/features/ui/components/brand-mark";

type ComingSoonModalProps = {
  title: string;
  description: string;
  bullets?: string[];
  onClose: () => void;
};

export function ComingSoonModal({
  title,
  description,
  bullets = [],
  onClose,
}: ComingSoonModalProps) {
  return (
    <div className="denty-backdrop-enter fixed inset-0 z-40 flex items-center justify-center bg-[rgba(19,37,58,0.22)] p-4 backdrop-blur-md">
      <div className="denty-modal denty-modal-enter w-full max-w-4xl overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="frozen-stage border-b border-[rgba(148,163,184,0.14)] bg-[linear-gradient(180deg,rgba(230,244,246,0.9),rgba(255,255,255,0.96))] p-6 md:border-b-0 md:border-r md:p-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="denty-pill">Feature workshop</span>
                <BrandMark className="h-12 w-12 frozen-float" />
              </div>

              <div className="space-y-3">
                <p className="denty-kicker">In progress</p>
                <h3 className="max-w-md text-2xl font-semibold text-[var(--foreground)] md:text-2xl">
                  {title}
                </h3>
                <p className="max-w-md text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  {description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="frozen-swatch bg-[linear-gradient(180deg,#0B7B8A,#0E8B9C)] p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    Core
                  </p>
                  <p className="mt-12 text-lg font-semibold">Structure</p>
                </div>
                <div className="frozen-swatch bg-[linear-gradient(180deg,#E6F4F6,#F4FBFC)] p-4 text-[var(--foreground)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,22,40,0.72)]">
                    Surface
                  </p>
                  <p className="mt-12 text-lg font-semibold">Clarity</p>
                </div>
                <div className="frozen-swatch bg-[linear-gradient(180deg,#10B981,#34C79B)] p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    Accent
                  </p>
                  <p className="mt-12 text-lg font-semibold">Focus</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="denty-kicker">What comes next</p>
                <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  The section is visible now so the interface stays honest, but
                  it will become more polished once the product flow behind it
                  is defined properly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="denty-button-secondary px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {bullets.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {bullets.map((bullet, index) => (
                  <li
                    key={bullet}
                    className="denty-subpanel flex items-start gap-4 p-4"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span className="denty-status-dot mt-1.5 shrink-0" />
                    <span className="text-sm leading-7 text-[var(--foreground)] md:text-base">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="denty-placeholder mt-6 p-5">
                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                  This section is staged but not yet scoped into its final
                  feature breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
