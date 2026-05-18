"use client";

import { BrandMark } from "@/features/ui/components/brand-mark";

export type DoctorSurface =
  | "overview"
  | "profile"
  | "notifications"
  | "approvals"
  | "report"
  | "chat"
  | "game"
  | "leaderboard"
  | "settings";

export type DoctorSurfaceMeta = {
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
};

export const doctorSurfaceMeta: Record<DoctorSurface, DoctorSurfaceMeta> = {
  overview: {
    eyebrow: "Student workspace",
    title: "Doctor clinical desk",
    description:
      "Your academic clinic workspace, planning surface, approvals, and reporting tools in one wider desk.",
    badges: ["Clinical desk", "Planning", "Review actions"],
  },
  profile: {
    eyebrow: "Profile",
    title: "Doctor identity and account",
    description:
      "Keep your personal details, profile image, and password settings inside the same doctor suite.",
    badges: ["Identity", "Account", "Profile"],
  },
  notifications: {
    eyebrow: "Alerts",
    title: "Doctor notifications center",
    description:
      "Read request updates, scheduling alerts, and workflow messages without leaving the page.",
    badges: ["Alerts", "Unread tracking", "Actionable"],
  },
  approvals: {
    eyebrow: "Review",
    title: "Reservation approval desk",
    description:
      "Handle pending appointment decisions from a full-width workspace instead of a popup drawer.",
    badges: ["Pending requests", "Approve", "Reject"],
  },
  report: {
    eyebrow: "Reports",
    title: "Case report studio",
    description:
      "Review booked appointments, mark no-shows, and complete reports in a stable inline workspace.",
    badges: ["Booked cases", "No-show", "Submission"],
  },
  chat: {
    eyebrow: "Communication",
    title: "Chat and room workspace",
    description:
      "Search, open, and continue direct conversations and shared rooms from one always-visible communication desk.",
    badges: ["Direct chat", "Rooms", "Attachments"],
  },
  leaderboard: {
    eyebrow: "Standings",
    title: "Academic leaderboard",
    description:
      "See where you rank across the whole program, then switch into your semester cohort to compare against current peers.",
    badges: ["Cohort ranking", "Overall ranking", "Your standing"],
  },
  game: {
    eyebrow: "Practice",
    title: "Toothy knowledge quiz",
    description:
      "Sharpen your clinical knowledge with a ten-question quiz across anatomy, caries, periodontics, endodontics, and oral surgery. Every attempt feeds your leaderboard standing.",
    badges: ["Anatomy", "Caries", "Perio", "Endo", "Surgery"],
  },
  settings: {
    eyebrow: "Preferences",
    title: "Doctor settings",
    description:
      "Theme, language, notifications, and account controls grouped into one calm preferences surface.",
    badges: ["Appearance", "Language", "Notifications", "Account"],
  },
};

type DoctorPageHeaderProps = {
  meta: DoctorSurfaceMeta;
};

export function DoctorPageHeader({ meta }: DoctorPageHeaderProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] px-7 py-7 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:px-9 md:py-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BrandMark className="h-14 w-14 frozen-float" />
            <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.64)]">
              Doctor workspace
            </span>
          </div>

          <div>
            <p className="denty-kicker">{meta.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
              {meta.title}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
              {meta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {meta.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
