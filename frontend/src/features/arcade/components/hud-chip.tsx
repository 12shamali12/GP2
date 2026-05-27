"use client";

/**
 * Shared HUD chip used in the arcade focus-mode top bar.
 *
 * Each chip shows a small uppercase label on top of a large bold value, with
 * an optional accent color on the left edge. Games render their HUD chips
 * via React portal into a slot in the focus-mode header, so the visual
 * style stays consistent across Plaque Blaster, Tooth Defender, and Floss Rush.
 */

type HudChipProps = {
  label: string;
  value: string | number;
  /** Pick a tint for the chip — defaults to neutral white-on-dark. */
  variant?: "neutral" | "score" | "combo" | "level" | "timer" | "lives" | "danger";
  /** Set true to make the chip pulse — e.g. timer in the last 10 seconds. */
  urgent?: boolean;
};

const VARIANTS: Record<
  NonNullable<HudChipProps["variant"]>,
  { border: string; bg: string; accent: string; valueColor: string; labelColor: string }
> = {
  neutral: {
    border: "rgba(255,255,255,0.16)",
    bg: "rgba(255,255,255,0.06)",
    accent: "rgba(255,255,255,0.5)",
    valueColor: "#ffffff",
    labelColor: "rgba(255,255,255,0.65)",
  },
  score: {
    border: "rgba(94,234,212,0.4)",
    bg: "rgba(20,184,166,0.12)",
    accent: "rgba(94,234,212,0.9)",
    valueColor: "#ecfeff",
    labelColor: "rgba(207,250,254,0.75)",
  },
  combo: {
    border: "rgba(244,114,182,0.4)",
    bg: "rgba(219,39,119,0.14)",
    accent: "rgba(244,114,182,0.95)",
    valueColor: "#fdf2f8",
    labelColor: "rgba(252,231,243,0.75)",
  },
  level: {
    border: "rgba(252,211,77,0.4)",
    bg: "rgba(234,179,8,0.16)",
    accent: "rgba(252,211,77,0.95)",
    valueColor: "#fefce8",
    labelColor: "rgba(254,243,199,0.78)",
  },
  timer: {
    border: "rgba(125,211,252,0.4)",
    bg: "rgba(56,189,248,0.14)",
    accent: "rgba(125,211,252,0.95)",
    valueColor: "#f0f9ff",
    labelColor: "rgba(224,242,254,0.78)",
  },
  lives: {
    border: "rgba(248,113,113,0.4)",
    bg: "rgba(220,38,38,0.14)",
    accent: "rgba(252,165,165,0.95)",
    valueColor: "#fef2f2",
    labelColor: "rgba(254,226,226,0.78)",
  },
  danger: {
    border: "rgba(244,63,94,0.6)",
    bg: "rgba(244,63,94,0.25)",
    accent: "rgba(252,165,165,1)",
    valueColor: "#ffffff",
    labelColor: "rgba(255,228,230,0.85)",
  },
};

export function HudChip({ label, value, variant = "neutral", urgent }: HudChipProps) {
  const v = VARIANTS[variant];
  return (
    <div
      className={`relative inline-flex min-w-[96px] flex-1 items-center gap-3 overflow-hidden rounded-[16px] border px-4 py-2 backdrop-blur-[14px] sm:min-w-[120px] sm:px-5 sm:py-2.5 ${
        urgent ? "denty-pulse" : ""
      }`}
      style={{
        borderColor: v.border,
        background: v.bg,
        boxShadow: urgent
          ? `0 0 0 1px ${v.accent}, 0 0 26px ${v.accent}66`
          : "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[4px] rounded-r-full"
        style={{ background: v.accent }}
      />
      <div className="ml-1 flex flex-col leading-tight">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: v.labelColor }}
        >
          {label}
        </span>
        <span
          className="text-xl font-extrabold tabular-nums sm:text-2xl"
          style={{ color: v.valueColor }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
