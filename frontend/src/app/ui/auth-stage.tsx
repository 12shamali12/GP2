"use client";

import { BrandMark } from "@/features/ui/components/brand-mark";
import type { AuthShowcaseSlide } from "@/features/ui/components/auth-showcase";

type AuthStageProps = {
  lang: "en" | "ar";
  mode: "login" | "register";
  title: string;
  subtitle: string;
  registerSubtitle: string;
  location: string;
  activeSlide: AuthShowcaseSlide;
  showcaseIndex: number;
  slidesLength: number;
};

export function AuthStage({
  location,
  activeSlide,
  showcaseIndex,
  slidesLength,
}: AuthStageProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <section className="flex flex-col justify-between gap-5 xl:min-h-[calc(100vh-9rem)] xl:py-2">
        <div className="max-w-[56rem] space-y-5">
          <div className="flex items-center gap-5">
            <div className="rounded-[1.75rem] border border-white/16 bg-white/10 p-3 shadow-[0_24px_50px_rgba(7,18,44,0.18)] backdrop-blur-xl">
              <BrandMark tone="light" className="h-16 w-16 sm:h-20 sm:w-20 xl:h-24 xl:w-24" />
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl xl:text-6xl">
              DentyHub
            </h2>
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/68">
            {location}
          </p>
        </div>

        <div className="w-full max-w-[44rem] overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] p-6 shadow-[0_24px_54px_rgba(7,18,44,0.22)] backdrop-blur-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="inline-block h-1.5 w-7 rounded-full bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(56,189,248,0.7))]"
              />
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-white/74">
                {activeSlide.eyebrow}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
              <span className="text-base font-semibold text-white">
                {String(showcaseIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/52">
                of {String(slidesLength).padStart(2, "0")}
              </span>
            </div>
          </div>

          <h3 className="mt-5 max-w-[34rem] text-2xl font-semibold leading-[1.18] tracking-[-0.02em] text-white sm:text-[1.8rem]">
            {activeSlide.title}
          </h3>
          <p className="mt-3 max-w-[38rem] text-sm leading-6 text-white/78">
            {activeSlide.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {activeSlide.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/84"
              >
                {chip}
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-[36rem] border-t border-white/10 pt-4 text-[12px] leading-5 text-white/64">
            {activeSlide.footer}
          </p>
        </div>
      </section>
    </div>
  );
}
