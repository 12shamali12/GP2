"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getAdminShellCounts, type AdminShellCounts } from "@/features/admin/services/admin-api";
import { useTranslation } from "@/features/i18n/language-provider";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { DashboardIcon } from "@/features/ui/components/dashboard-icon";
import { RoleShellLayout } from "@/features/ui/components/role-shell-layout";
import { logout } from "@/lib/api/auth";

type NavItem = {
  href: string;
  /** i18n key for the user-facing label */
  labelKey: string;
  /** plain-English fallback used for the search filter haystack */
  searchLabel: string;
  note: string;
  icon:
    | "calendar"
    | "approvals"
    | "report"
    | "global"
    | "leaderboard"
    | "profile"
    | "notifications"
    | "chat";
  countKey?:
    | "pendingQueue"
    | "supervisorRequests"
    | "doctorRequests"
    | "groupModeration"
    | "groups"
    | "planning"
    | "users"
    | "userReports"
    | "notifications"
    | "chat";
};

const navItems: NavItem[] = [
  {
    href: "/admin",
    labelKey: "nav.pending_queue",
    searchLabel: "Pending Queue",
    note: "Queue",
    icon: "calendar",
    countKey: "pendingQueue",
  },
  {
    href: "/admin/supervisor-requests",
    labelKey: "nav.supervisor_requests",
    searchLabel: "Supervisor Requests",
    note: "Review",
    icon: "approvals",
    countKey: "supervisorRequests",
  },
  {
    href: "/admin/doctor-requests",
    labelKey: "nav.doctor_requests",
    searchLabel: "Doctor Requests",
    note: "Review",
    icon: "report",
    countKey: "doctorRequests",
  },
  {
    href: "/admin/group-moderation",
    labelKey: "nav.group_moderation",
    searchLabel: "Group Moderation",
    note: "Review",
    icon: "global",
    countKey: "groupModeration",
  },
  {
    href: "/admin/groups",
    labelKey: "nav.groups",
    searchLabel: "Groups",
    note: "Studio",
    icon: "global",
    countKey: "groups",
  },
  {
    href: "/admin/planning",
    labelKey: "nav.planning",
    searchLabel: "Planning",
    note: "Studio",
    icon: "calendar",
    countKey: "planning",
  },
  {
    href: "/admin/leaderboard",
    labelKey: "nav.leaderboard",
    searchLabel: "Leaderboard",
    note: "Rank",
    icon: "leaderboard",
  },
  {
    href: "/admin/users",
    labelKey: "nav.users",
    searchLabel: "Users",
    note: "Control",
    icon: "profile",
    countKey: "users",
  },
  {
    href: "/admin/user-reports",
    labelKey: "nav.user_reports",
    searchLabel: "User Reports",
    note: "Safety",
    icon: "report",
    countKey: "userReports",
  },
  {
    href: "/admin/notifications",
    labelKey: "nav.notifications",
    searchLabel: "Notifications",
    note: "Inbox",
    icon: "notifications",
    countKey: "notifications",
  },
  {
    href: "/admin/chat",
    labelKey: "nav.chat",
    searchLabel: "Chat",
    note: "Live",
    icon: "chat",
    countKey: "chat",
  },
];

const emptyCounts: AdminShellCounts = {
  pendingQueue: 0,
  supervisorRequests: 0,
  doctorRequests: 0,
  groupModeration: 0,
  groups: 0,
  planning: 0,
  users: 0,
  userReports: 0,
  notifications: 0,
  chat: 0,
};

const ADMIN_ACCENT = {
  bar: "rgba(251,191,36,0.95)",
  dotBg: "rgba(251,191,36,0.95)",
  chipBg: "rgba(251,191,36,0.18)",
  chipText: "rgba(254,243,199,0.96)",
};

/**
 * Best-effort initials from a free-form name (matches the helper used in
 * the doctor/patient/supervisor rails — kept duplicated to avoid a shared
 * util file for what is currently one small four-line function).
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

type StoredUser = {
  name?: string | null;
  email?: string | null;
};

const readStoredUser = (): StoredUser => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("currentUser");
    if (!raw) return {};
    return JSON.parse(raw) as StoredUser;
  } catch {
    return {};
  }
};

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminShell({
  title,
  description,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslation();
  const [counts, setCounts] = useState<AdminShellCounts>(emptyCounts);
  const [navSearch, setNavSearch] = useState("");
  const [adminName, setAdminName] = useState<string>("");

  useEffect(() => {
    // sessionStorage is only available in the browser; read once on mount
    // so the identity card can show the actual admin's name + initials.
    const stored = readStoredUser();
    if (stored.name) setAdminName(stored.name);
    else if (stored.email) setAdminName(stored.email);
  }, []);

  const filteredNavItems = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => {
      // Match against the localized label AND the stable English search label
      // so users typing in either language can find the right entry.
      const haystack =
        `${t(item.labelKey)} ${item.searchLabel} ${item.note}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [navSearch, t]);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      const nextCounts = await getAdminShellCounts();
      if (!cancelled) {
        setCounts(nextCounts);
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const displayName = adminName.trim() || t("nav.role_chip.admin");
  const initials = initialsOf(displayName);

  const sideRail = (
    <aside className="frozen-stage denty-collapsible-rail overflow-y-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(82,85,103,0.96),rgba(67,71,88,0.94))] px-3 py-4 text-white backdrop-blur-[28px]">
          <div className="flex min-h-full flex-col gap-3">
            {/* Identity card — same shape as the other three rails. Linked to
                /admin so clicking the brand still acts as a "home" jump. */}
            <Link
              href="/admin"
              className="block rounded-[20px] border border-white/10 bg-white/6 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/8"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/16 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] text-base font-semibold text-white shadow-[0_8px_18px_rgba(4,11,26,0.25)]"
                >
                  {initials}
                </span>
                <div className="denty-rail-copy min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{displayName}</p>
                  <span
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ backgroundColor: ADMIN_ACCENT.chipBg, color: ADMIN_ACCENT.chipText }}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: ADMIN_ACCENT.dotBg }}
                    />
                    {t("nav.role_chip.admin")}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white text-slate-900 shadow-[0_4px_10px_rgba(4,11,26,0.18)]">
                  <BrandMark className="h-4 w-4" />
                </span>
                <span className="denty-rail-copy truncate text-[11px] font-medium tracking-[0.04em] text-white/60">
                  {t("nav.brand.subtitle.admin")}
                </span>
              </div>
            </Link>

            {/* Admin's nav search is load-bearing (filters real nav items
                across 11 destinations), so it stays — restyled to match the
                rest of the rail. The other three rails dropped their stub
                search since it was non-functional. */}
            <div className="denty-rail-search rounded-[16px] border border-white/8 bg-white/6 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <label className="flex items-center gap-2 rounded-[12px] bg-white/8 px-2.5 py-2 text-sm text-white/58">
                <DashboardIcon name="search" />
                <input
                  type="search"
                  value={navSearch}
                  onChange={(event) => setNavSearch(event.target.value)}
                  placeholder={t("common.search")}
                  className="denty-rail-copy w-full bg-transparent text-sm font-medium text-white placeholder:text-white/42 focus:outline-none"
                />
              </label>
            </div>

            <div className="mx-2 my-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="denty-rail-section-label mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/56">
              {t("nav.section.workspaces")}
            </div>

            <nav className="grid gap-2">
              {filteredNavItems.map((item, index) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const count = item.countKey ? counts[item.countKey] : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`denty-rail-action relative flex items-center gap-3 rounded-[22px] border p-3 transition-all duration-200 ease-out ${
                      active
                        ? "border-white/12 bg-[rgba(255,255,255,0.96)] text-slate-900 shadow-[0_8px_22px_rgba(4,11,26,0.18)]"
                        : "border-transparent bg-transparent text-white/82 hover:translate-x-0.5 hover:border-white/10 hover:bg-white/8"
                    }`}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <span
                      aria-hidden
                      data-active={active}
                      className={`denty-rail-accent pointer-events-none absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-opacity duration-200 ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ backgroundColor: ADMIN_ACCENT.bar }}
                    />
                    <span
                      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] transition-colors duration-200 ${
                        active ? "bg-slate-900 text-white" : "bg-white/8 text-white/82"
                      }`}
                    >
                        <DashboardIcon name={item.icon} />
                        {count !== null && count > 0 ? (
                          <span className="denty-rail-badge-mini denty-pop absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full border border-rose-300/40 bg-[rgba(190,24,93,0.9)] px-1 text-[10px] font-semibold text-white shadow-[0_10px_18px_rgba(76,5,25,0.3)]">
                            {count > 9 ? "9+" : count}
                          </span>
                        ) : null}
                    </span>
                    <div className="denty-rail-copy min-w-0 flex-1">
                      <p className={`truncate text-[0.98rem] font-semibold ${active ? "text-slate-900" : "text-white"}`}>
                        {t(item.labelKey)}
                      </p>
                    </div>
                    {count !== null ? (
                      <span
                        className={`denty-rail-badge-full inline-flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold ${
                          count > 0
                            ? "bg-[rgba(190,24,93,0.14)] text-rose-600"
                            : active
                              ? "bg-slate-100 text-slate-500"
                              : "bg-white/8 text-white/62"
                        }`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {filteredNavItems.length === 0 ? (
              <div className="denty-rail-copy rounded-[18px] border border-white/8 bg-white/6 px-3 py-3 text-sm text-white/62">
                {t("nav.empty_search")}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="denty-rail-action mt-auto flex w-full cursor-pointer items-center gap-3 rounded-[18px] border border-rose-200/20 bg-rose-500/10 px-3 py-2.5 text-left text-rose-100 transition-all duration-200 ease-out hover:border-rose-200/30 hover:bg-rose-500/18"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-rose-500/16 text-rose-100">
                <DashboardIcon name="logout" />
              </span>
              <span className="denty-rail-copy min-w-0 flex-1">
                <span className="block text-[0.92rem] font-semibold text-rose-100">
                  {t("common.logout")}
                </span>
              </span>
            </button>
          </div>
    </aside>
  );

  return (
    <main className="denty-screen admin-suite-screen relative px-3 py-3 sm:px-4 sm:py-4 lg:pl-0 lg:pr-5 lg:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-14 h-[34rem] w-[34rem] rounded-full bg-[rgba(8,18,36,0.34)] blur-[120px]" />
        <div className="absolute right-[12%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-[rgba(70,90,112,0.24)] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[6%] h-[26rem] w-[26rem] rounded-full bg-[rgba(18,28,44,0.22)] blur-[120px]" />
      </div>

      <div className="denty-shell denty-dashboard-layout mx-0 max-w-none space-y-4 lg:space-y-0">
        <RoleShellLayout
          topbarEyebrow="Admin"
          sideRail={sideRail}
        >
          <section className="min-w-0 space-y-4 lg:space-y-5">
            <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] px-4 py-4 shadow-[0_22px_56px_rgba(7,18,34,0.13)] backdrop-blur-[24px] sm:px-5 sm:py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <BrandMark className="h-11 w-11 frozen-float" />
                    <span className="rounded-full border border-white/20 bg-white/26 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.64)]">
                      Admin workspace
                    </span>
                  </div>

                  <div>
                    <p className="denty-kicker">Administrative workspace</p>
                    <h1 className="mt-2 max-w-4xl text-xl font-semibold text-[var(--foreground)] sm:text-xl md:text-xl">
                      {title}
                    </h1>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted-foreground)] md:text-[0.95rem] md:leading-7">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <span className="rounded-full border border-white/20 bg-white/26 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                    Approval control
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/26 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                    Group moderation
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/26 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                    Inbox and chat
                  </span>
                </div>
              </div>
            </div>

            <div key={pathname} className="denty-enter space-y-4 lg:space-y-5">
              {children}
            </div>
          </section>
        </RoleShellLayout>
      </div>
    </main>
  );
}
