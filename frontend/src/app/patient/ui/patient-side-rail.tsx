"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/features/i18n/language-provider";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { DashboardIcon } from "@/features/ui/components/dashboard-icon";
import { logout } from "@/lib/api/auth";

type ComingSoonContent = {
  title: string;
  description: string;
  bullets: string[];
};

type PatientSideRailProps = {
  userName: string;
  userAvatar?: string | null;
  activeView:
    | "overview"
    | "profile"
    | "notifications"
    | "chat"
    | "history"
    | "game"
    | "streak"
    | "leaderboard"
    | "settings";
  unreadNotifications: number;
  chatUnreadCount: number;
  onOverview: () => void;
  onProfile: () => void;
  onNotifications: () => void;
  onChat: () => void;
  onHistory: () => void;
  onGame: () => void;
  onStreak: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
  onComingSoon: (content: ComingSoonContent) => void;
};

type RoleAccent = {
  bar: string;
  dotBg: string;
  chipBg: string;
  chipText: string;
};

const PATIENT_ACCENT: RoleAccent = {
  bar: "rgba(34,211,238,0.95)",
  dotBg: "rgba(34,211,238,0.95)",
  chipBg: "rgba(34,211,238,0.16)",
  chipText: "rgba(207,250,254,0.96)",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

type RailActionProps = {
  eyebrow: string;
  label: string;
  compactLabel: string;
  icon:
    | "profile"
    | "notifications"
    | "calendar"
    | "chat"
    | "game"
    | "streak"
    | "leaderboard"
    | "settings";
  active?: boolean;
  muted?: boolean;
  badgeCount?: number;
  badgeVariant?: "count" | "streak";
  accent: string;
  onClick: () => void;
};

function RailAction({
  label,
  compactLabel,
  icon,
  active = false,
  muted = false,
  badgeCount = 0,
  badgeVariant = "count",
  accent,
  onClick,
}: RailActionProps) {
  return (
    <button
      onClick={onClick}
      className={`denty-rail-action relative flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition-all duration-200 ease-out ${
        active
          ? "border-white/12 bg-[rgba(255,255,255,0.96)] text-slate-900 shadow-[0_8px_22px_rgba(4,11,26,0.18)]"
          : muted
            ? "border-transparent bg-transparent text-white/74 hover:translate-x-0.5 hover:border-white/10 hover:bg-white/8"
            : "border-transparent bg-transparent text-white/82 hover:translate-x-0.5 hover:border-white/10 hover:bg-white/8"
      }`}
    >
      <span
        aria-hidden
        data-active={active}
        className={`denty-rail-accent pointer-events-none absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: accent }}
      />
      <span
        title={compactLabel}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] transition-colors duration-200 ${
          active ? "bg-slate-900 text-white" : "bg-white/8 text-white/82"
        }`}
      >
        <DashboardIcon name={icon} />
        {badgeCount > 0 ? (
          <span
            className={`denty-rail-badge-mini denty-pop absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full border px-1 text-[10px] font-semibold shadow-[0_10px_18px_rgba(76,5,25,0.3)] ${
              badgeVariant === "streak"
                ? "border-amber-200/50 bg-[rgba(245,158,11,0.92)] text-white"
                : "border-rose-300/40 bg-[rgba(190,24,93,0.9)] text-white"
            }`}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span className="denty-rail-copy min-w-0 flex-1">
        <span
          className={`block truncate text-[0.98rem] font-semibold ${
            active ? "text-slate-900" : muted ? "text-white/88" : "text-white"
          }`}
        >
          {label}
        </span>
      </span>
      {badgeCount > 0 ? (
        badgeVariant === "streak" ? (
          <span className="denty-rail-badge-full ml-auto inline-flex min-h-[2rem] items-center justify-center gap-1 rounded-full border border-[rgba(234,88,12,0.35)] bg-[rgba(254,215,170,0.92)] px-2 text-[11px] font-semibold text-[rgba(124,45,18,0.95)] shadow-[0_8px_18px_rgba(124,45,18,0.18)]">
            <span aria-hidden>🔥</span>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : (
          <span className="denty-rail-badge-full ml-auto inline-flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full bg-[rgba(190,24,93,0.14)] px-2 text-[11px] font-semibold text-rose-600">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )
      ) : null}
    </button>
  );
}

type RailIdentityCardProps = {
  userName: string;
  fallbackName: string;
  roleLabel: string;
  brandSubtitle: string;
  accent: RoleAccent;
  /** Optional avatar URL — falls back to initials when omitted/empty. */
  avatar?: string | null;
};

function RailIdentityCard({
  userName,
  fallbackName,
  roleLabel,
  brandSubtitle,
  accent,
  avatar,
}: RailIdentityCardProps) {
  const displayName = userName?.trim() || fallbackName;
  const initials = initialsOf(displayName);
  return (
    <div className="denty-rail-identity rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,70,76,0.97),rgba(9,42,48,0.97))] px-3 py-3 text-white backdrop-blur-[28px]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/16 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] text-base font-semibold text-white shadow-[0_8px_18px_rgba(4,11,26,0.25)]"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="denty-rail-copy min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{displayName}</p>
          <span
            className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ backgroundColor: accent.chipBg, color: accent.chipText }}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: accent.dotBg }}
            />
            {roleLabel}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white text-slate-900 shadow-[0_4px_10px_rgba(4,11,26,0.18)]">
          <BrandMark className="h-4 w-4" />
        </span>
        <span className="denty-rail-copy truncate text-[11px] font-medium tracking-[0.04em] text-white/60">
          {brandSubtitle}
        </span>
      </div>
    </div>
  );
}

export function PatientSideRail({
  userName,
  userAvatar,
  activeView,
  unreadNotifications,
  chatUnreadCount,
  onOverview,
  onProfile,
  onNotifications,
  onChat,
  onHistory,
  onGame,
  onStreak,
  onLeaderboard,
  onSettings,
  onComingSoon,
}: PatientSideRailProps) {
  const router = useRouter();
  const t = useTranslation();
  const accent = PATIENT_ACCENT;
  return (
    <div className="denty-rail-column">
      <aside className="frozen-stage denty-collapsible-rail rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,70,76,0.97),rgba(9,42,48,0.97))] px-4 py-5 text-white backdrop-blur-[28px]">
      <div className="flex min-h-full flex-col gap-3">
        <RailIdentityCard
          userName={userName}
          avatar={userAvatar}
          fallbackName={t("auth.role.patient")}
          roleLabel={t("nav.role_chip.patient")}
          brandSubtitle={t("nav.brand.subtitle.patient")}
          accent={accent}
        />
        <div className="mx-2 my-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <RailAction
          eyebrow="Profile"
          label={t("nav.profile")}
          compactLabel="Profile"
          icon="profile"
          active={activeView === "profile"}
          accent={accent.bar}
          onClick={onProfile}
        />
        <RailAction
          eyebrow="Overview"
          label={t("nav.care_desk")}
          compactLabel="Desk"
          icon="calendar"
          active={activeView === "overview"}
          accent={accent.bar}
          onClick={onOverview}
        />
        <RailAction
          eyebrow="Alerts"
          label={t("nav.notifications")}
          compactLabel="Alerts"
          icon="notifications"
          active={activeView === "notifications"}
          badgeCount={unreadNotifications}
          accent={accent.bar}
          onClick={onNotifications}
        />

        <RailAction
          eyebrow="Direct"
          label={t("nav.chat")}
          compactLabel="Chats"
          icon="chat"
          active={activeView === "chat"}
          badgeCount={chatUnreadCount}
          accent={accent.bar}
          onClick={onChat}
        />

        <RailAction
          eyebrow="History"
          label={t("nav.past_appointments")}
          compactLabel="History"
          icon="calendar"
          active={activeView === "history"}
          accent={accent.bar}
          onClick={onHistory}
        />
        <RailAction
          eyebrow="Daily"
          label={t("nav.game")}
          compactLabel="Game"
          icon="game"
          active={activeView === "game"}
          accent={accent.bar}
          onClick={onGame}
        />
        <RailAction
          eyebrow={t("nav.streak.eyebrow")}
          label={t("nav.streak")}
          compactLabel="Streak"
          icon="streak"
          active={activeView === "streak"}
          accent={accent.bar}
          onClick={onStreak}
        />
        <RailAction
          eyebrow="Standings"
          label={t("nav.leaderboard")}
          compactLabel="Rank"
          icon="leaderboard"
          active={activeView === "leaderboard"}
          accent={accent.bar}
          onClick={onLeaderboard}
        />
        <RailAction
          eyebrow="Preferences"
          label={t("nav.settings")}
          compactLabel="Prefs"
          icon="settings"
          active={activeView === "settings"}
          accent={accent.bar}
          onClick={onSettings}
        />

        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="denty-rail-action mt-auto flex w-full cursor-pointer items-center gap-3 rounded-[22px] border border-rose-200/20 bg-rose-500/10 px-3 py-3 text-left text-rose-100 transition-all duration-200 ease-out hover:border-rose-200/30 hover:bg-rose-500/18"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-rose-500/16 text-rose-100">
            <DashboardIcon name="logout" />
          </span>
          <span className="denty-rail-copy min-w-0 flex-1">
            <span className="block text-[0.98rem] font-semibold text-rose-100">
              {t("common.logout")}
            </span>
          </span>
        </button>
      </div>
      </aside>
    </div>
  );
}
