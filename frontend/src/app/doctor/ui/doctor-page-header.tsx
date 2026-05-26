"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import { PageHeader } from "@/features/ui/components/page-header";

export type DoctorSurface =
  | "overview"
  | "profile"
  | "notifications"
  | "approvals"
  | "report"
  | "cases"
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

/**
 * Translation-key descriptors for each doctor surface. The visible strings are
 * resolved through `useTranslation()` inside the component, so this stays a
 * pure key map and never holds raw English.
 */
type DoctorSurfaceMetaKeys = {
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
};

export const doctorSurfaceMeta: Record<DoctorSurface, DoctorSurfaceMetaKeys> = {
  overview: {
    eyebrow: "doctor.surface.overview.eyebrow",
    title: "doctor.surface.overview.title",
    description: "doctor.surface.overview.description",
    badges: [
      "doctor.surface.overview.badge1",
      "doctor.surface.overview.badge2",
      "doctor.surface.overview.badge3",
    ],
  },
  profile: {
    eyebrow: "doctor.surface.profile.eyebrow",
    title: "doctor.surface.profile.title",
    description: "doctor.surface.profile.description",
    badges: [
      "doctor.surface.profile.badge1",
      "doctor.surface.profile.badge2",
      "doctor.surface.profile.badge3",
    ],
  },
  notifications: {
    eyebrow: "doctor.surface.notifications.eyebrow",
    title: "doctor.surface.notifications.title",
    description: "doctor.surface.notifications.description",
    badges: [
      "doctor.surface.notifications.badge1",
      "doctor.surface.notifications.badge2",
      "doctor.surface.notifications.badge3",
    ],
  },
  approvals: {
    eyebrow: "doctor.surface.approvals.eyebrow",
    title: "doctor.surface.approvals.title",
    description: "doctor.surface.approvals.description",
    badges: [
      "doctor.surface.approvals.badge1",
      "doctor.surface.approvals.badge2",
      "doctor.surface.approvals.badge3",
    ],
  },
  report: {
    eyebrow: "doctor.surface.report.eyebrow",
    title: "doctor.surface.report.title",
    description: "doctor.surface.report.description",
    badges: [
      "doctor.surface.report.badge1",
      "doctor.surface.report.badge2",
      "doctor.surface.report.badge3",
    ],
  },
  cases: {
    eyebrow: "Semester cases",
    title: "My cases",
    description:
      "Every case you need to complete this semester, grouped by clinic. Tap a case to open its report and patient.",
    badges: ["Per-clinic", "Live status", "Linked reports"],
  },
  chat: {
    eyebrow: "doctor.surface.chat.eyebrow",
    title: "doctor.surface.chat.title",
    description: "doctor.surface.chat.description",
    badges: [
      "doctor.surface.chat.badge1",
      "doctor.surface.chat.badge2",
      "doctor.surface.chat.badge3",
    ],
  },
  leaderboard: {
    eyebrow: "doctor.surface.leaderboard.eyebrow",
    title: "doctor.surface.leaderboard.title",
    description: "doctor.surface.leaderboard.description",
    badges: [
      "doctor.surface.leaderboard.badge1",
      "doctor.surface.leaderboard.badge2",
      "doctor.surface.leaderboard.badge3",
    ],
  },
  game: {
    eyebrow: "doctor.surface.game.eyebrow",
    title: "doctor.surface.game.title",
    description: "doctor.surface.game.description",
    badges: [
      "doctor.surface.game.badge1",
      "doctor.surface.game.badge2",
      "doctor.surface.game.badge3",
      "doctor.surface.game.badge4",
      "doctor.surface.game.badge5",
    ],
  },
  settings: {
    eyebrow: "doctor.surface.settings.eyebrow",
    title: "doctor.surface.settings.title",
    description: "doctor.surface.settings.description",
    badges: [
      "doctor.surface.settings.badge1",
      "doctor.surface.settings.badge2",
      "doctor.surface.settings.badge3",
      "doctor.surface.settings.badge4",
    ],
  },
};

type DoctorPageHeaderProps = {
  meta: DoctorSurfaceMetaKeys;
};

export function DoctorPageHeader({ meta }: DoctorPageHeaderProps) {
  const t = useTranslation();

  return (
    <PageHeader
      title={t(meta.title)}
      description={t(meta.description)}
      badge={t("doctor.header.badge")}
    />
  );
}
