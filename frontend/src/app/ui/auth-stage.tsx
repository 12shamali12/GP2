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
  mode,
  title,
  subtitle,
  registerSubtitle,
  location,
  activeSlide,
  showcaseIndex,
  slidesLength,
}: AuthStageProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-8">
      <div className="pointer-events-auto flex flex-wrap items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-[1.75rem] border border-white/16 bg-white/10 p-3 shadow-[0_24px_50px_rgba(7,18,44,0.18)] backdrop-blur-xl">
            <BrandMark tone="light" className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              Medical design system
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              DentyHub
            </h1>
          </div>
        </div>
      </div>

      <section className="flex flex-col justify-between gap-8 xl:min-h-[calc(100vh-9rem)] xl:py-2">
        <div className="max-w-[56rem] space-y-4">
          <p className="inline-flex rounded-full border border-white/16 bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82 backdrop-blur-xl">
            Modern care platform
          </p>
          <h2 className="max-w-[56rem] text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl xl:text-[5.6rem] xl:leading-[0.92]">
            {title}
          </h2>
          <p className="max-w-3xl text-base leading-7 text-white/78 sm:text-lg">
            {mode === "login" ? subtitle : registerSubtitle}
          </p>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/68">
            {location}
          </p>
        </div>

        <div className="w-full max-w-[48rem] rounded-[30px] border border-white/14 bg-white/10 p-5 shadow-[0_24px_54px_rgba(7,18,44,0.2)] backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="inline-flex rounded-full border border-white/16 bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82 backdrop-blur-xl">
              {activeSlide.eyebrow}
            </p>
            <div className="inline-flex items-baseline gap-1 rounded-full border border-white/16 bg-white/12 px-4 py-3 text-white backdrop-blur-xl">
              <span className="text-2xl font-semibold">
                {String(showcaseIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-white/72">
                / {String(slidesLength).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <h3 className="max-w-[38rem] text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {activeSlide.title}
            </h3>
            <p className="max-w-[40rem] text-sm leading-7 text-white/82 sm:text-base">
              {activeSlide.description}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {activeSlide.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white/84 backdrop-blur-xl"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-5 border-t border-white/14 pt-5">
            <p className="max-w-[38rem] text-sm leading-6 text-white/76">
              {activeSlide.footer}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
