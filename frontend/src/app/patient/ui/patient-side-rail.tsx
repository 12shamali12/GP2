"use client";

import { useRouter } from "next/navigation";
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
  activeView: "overview" | "profile" | "notifications" | "chat" | "settings";
  unreadNotifications: number;
  chatUnreadCount: number;
  onOverview: () => void;
  onProfile: () => void;
  onNotifications: () => void;
  onChat: () => void;
  onSettings: () => void;
  onComingSoon: (content: ComingSoonContent) => void;
};

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
    | "leaderboard"
    | "settings";
  active?: boolean;
  muted?: boolean;
  badgeCount?: number;
  onClick: () => void;
};

function RailAction({
  label,
  compactLabel,
  icon,
  active = false,
  muted = false,
  badgeCount = 0,
  onClick,
}: RailActionProps) {
  return (
    <button
      onClick={onClick}
      className={`denty-rail-action flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition ${
        active
          ? "border-white/70 bg-white text-slate-900 shadow-[0_20px_34px_rgba(4,11,26,0.22)]"
          : muted
            ? "border-transparent bg-transparent text-white/74 hover:border-white/10 hover:bg-white/8"
            : "border-transparent bg-transparent text-white/78 hover:border-white/10 hover:bg-white/8"
      }`}
    >
      <span
        title={compactLabel}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
          active ? "bg-slate-900 text-white" : "bg-white/8 text-white/86"
        }`}
      >
        <DashboardIcon name={icon} />
        {badgeCount > 0 ? (
          <span className="denty-rail-badge-mini absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full border border-rose-300/40 bg-[rgba(190,24,93,0.9)] px-1 text-[10px] font-semibold text-white shadow-[0_10px_18px_rgba(76,5,25,0.3)]">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span className="denty-rail-copy min-w-0 flex-1">
        <span className={`block truncate text-[0.98rem] font-semibold ${active ? "text-slate-900" : muted ? "text-white/88" : "text-white"}`}>
          {label}
        </span>
      </span>
      {badgeCount > 0 ? (
        <span className="denty-rail-badge-full ml-auto inline-flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full bg-[rgba(190,24,93,0.14)] px-2 text-[11px] font-semibold text-rose-600">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}

export function PatientSideRail({
  userName,
  activeView,
  unreadNotifications,
  chatUnreadCount,
  onOverview,
  onProfile,
  onNotifications,
  onChat,
  onSettings,
  onComingSoon,
}: PatientSideRailProps) {
  const router = useRouter();
  return (
    <aside className="frozen-stage denty-collapsible-rail overflow-y-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(82,85,103,0.96),rgba(67,71,88,0.94))] px-4 py-5 text-white shadow-[0_34px_90px_rgba(4,11,26,0.34)] backdrop-blur-[28px]">
      <div className="flex min-h-full flex-col gap-3">
        <div className="rounded-[26px] px-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-slate-900 shadow-[0_14px_28px_rgba(4,11,26,0.22)]">
              <BrandMark className="h-8 w-8 shrink-0" />
            </span>
            <div className="denty-rail-copy min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/54">
                Patient suite
              </p>
              <h2 className="mt-1 text-[1.65rem] font-semibold text-white">DentyHub</h2>
            </div>
          </div>
          <div className="denty-rail-search rounded-[18px] border border-white/8 bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3 rounded-[14px] bg-white/8 px-3 py-3 text-sm text-white/58">
              <DashboardIcon name="search" />
              <span className="denty-rail-copy text-sm font-medium text-white/62">
                Search workspace
              </span>
            </div>
          </div>
        </div>

        <div className="denty-rail-section-label pl-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
          Workspaces
        </div>

        <RailAction
          eyebrow="Overview"
          label="Care desk"
          compactLabel="Desk"
          icon="calendar"
          active={activeView === "overview"}
          onClick={onOverview}
        />
        <RailAction
          eyebrow="Profile"
          label="Identity and account"
          compactLabel="Profile"
          icon="profile"
          active={activeView === "profile"}
          onClick={onProfile}
        />
        <RailAction
          eyebrow="Alerts"
          label="Notifications"
          compactLabel="Alerts"
          icon="notifications"
          active={activeView === "notifications"}
          badgeCount={unreadNotifications}
          onClick={onNotifications}
        />

        <div className="denty-rail-section-label pl-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
          Communication
        </div>

        <RailAction
          eyebrow="Direct"
          label="Chats and rooms"
          compactLabel="Chats"
          icon="chat"
          active={activeView === "chat"}
          badgeCount={chatUnreadCount}
          onClick={onChat}
        />

        <div className="denty-rail-section-label pl-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
          Later
        </div>

        <RailAction
          eyebrow="History"
          label="Past appointments"
          compactLabel="History"
          icon="calendar"
          muted
          onClick={() =>
            onComingSoon({
              title: "Past appointments workspace",
              description:
                "This entry will become a dedicated history surface with filters, summaries, and clearer appointment outcomes.",
              bullets: [
                "Separated past and current care flows",
                "Better search and filtering",
                "Cleaner visit and outcome summaries",
              ],
            })
          }
        />
        <RailAction
          eyebrow="In progress"
          label="Toothy Game"
          compactLabel="Game"
          icon="game"
          muted
          onClick={() =>
            onComingSoon({
              title: "Toothy Game",
              description:
                "This feature is intentionally staged until the progress loop and rewards feel worth shipping.",
              bullets: [
                "Habit and education milestones",
                "Simple reward loop",
                "Stronger dental-care storytelling",
              ],
            })
          }
        />
        <RailAction
          eyebrow="In progress"
          label="Leaderboard"
          compactLabel="Rank"
          icon="leaderboard"
          muted
          onClick={() =>
            onComingSoon({
              title: "Leaderboard",
              description:
                "The leaderboard needs a fair ranking model and more meaning before it becomes a final feature.",
              bullets: [
                "Transparent scoring rules",
                "Healthier participation goals",
                "Rewards linked to actual usage",
              ],
            })
          }
        />
        <RailAction
          eyebrow="Preferences"
          label="Settings"
          compactLabel="Prefs"
          icon="settings"
          active={activeView === "settings"}
          onClick={onSettings}
        />

        <div className="denty-rail-user rounded-[20px] border border-white/8 bg-white/7 px-3 py-3">
          <p className="text-sm font-semibold text-white">{userName || "Patient"}</p>
          <p className="mt-1 text-sm leading-6 text-white/60">
            Appointments, updates, and communication from one patient desk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="denty-rail-action mt-auto flex w-full cursor-pointer items-center gap-3 rounded-[22px] border border-white/8 bg-white/8 px-3 py-3 text-left text-white transition hover:border-white/16 hover:bg-white/12"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/12">
            <DashboardIcon name="logout" />
          </span>
          <span className="denty-rail-copy min-w-0 flex-1">
            <span className="block text-[0.98rem] font-semibold text-white">Logout</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
