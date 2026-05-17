type DashboardIconName =
  | "profile"
  | "notifications"
  | "approvals"
  | "report"
  | "calendar"
  | "search"
  | "chat"
  | "global"
  | "game"
  | "leaderboard"
  | "settings"
  | "logout";

type DashboardIconProps = {
  name: DashboardIconName;
  className?: string;
};

const iconClass =
  "h-[1.1rem] w-[1.1rem] stroke-current transition-transform duration-200 group-hover:scale-[1.06]";

export function DashboardIcon({
  name,
  className = iconClass,
}: DashboardIconProps) {
  switch (name) {
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="1.8" />
          <path d="M5 20a7 7 0 0 1 14 0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 16h12" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 16V11a4 4 0 1 1 8 0v5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "approvals":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 12.5 10 16l8-9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" strokeWidth="1.5" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M8 7h8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 12h8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 17h5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 3.5h8l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5Z" strokeWidth="1.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 3.5v3M17 3.5v3M4 9.5h16" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="4" y="5.5" width="16" height="15" rx="3" strokeWidth="1.5" />
          <path d="M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="11" cy="11" r="5.5" strokeWidth="1.8" />
          <path d="m15.2 15.2 3.3 3.3" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 17.5 4.5 20V7a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7Z" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8.5 10.5h7M8.5 14h5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "global":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" strokeWidth="1.5" />
          <path d="M3.8 12h16.4M12 3.8c2.4 2.4 3.7 5.2 3.7 8.2 0 3-1.3 5.8-3.7 8.2-2.4-2.4-3.7-5.2-3.7-8.2 0-3 1.3-5.8 3.7-8.2Z" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "game":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M8 10.5h2.5V8M8 10.5v2.5M16 9.5h.01M17.8 11.3h.01" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 18.5h8.2a3 3 0 0 0 2.9-3.8l-1.1-3.8a3 3 0 0 0-2.9-2.2H9a3 3 0 0 0-2.9 2.2L5 14.7a3 3 0 0 0 3 3.8Z" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 20V11M12 20V7M17 20v-5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 20h14" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.6 5.3 12 3.5l1.4 1.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-1.7-1L14.5 3h-5L9.2 6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.5L5 11a7 7 0 0 0 0 2l-1.9 1.5 2 3.5 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 3h5l.3-3a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.5L18.9 13c.1-.3.1-.7.1-1Z" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M10 7.5V6a2.5 2.5 0 0 1 2.5-2.5H18A2.5 2.5 0 0 1 20.5 6v12A2.5 2.5 0 0 1 18 20.5h-5.5A2.5 2.5 0 0 1 10 18v-1.5" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13.5 12H4.5M7.5 9 4.5 12l3 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
