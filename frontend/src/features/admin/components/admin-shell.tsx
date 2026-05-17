"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getAdminShellCounts, type AdminShellCounts } from "@/features/admin/services/admin-api";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { DashboardIcon } from "@/features/ui/components/dashboard-icon";

type NavItem = {
  href: string;
  label: string;
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
    label: "Pending Queue",
    note: "Queue",
    icon: "calendar",
    countKey: "pendingQueue",
  },
  {
    href: "/admin/supervisor-requests",
    label: "Supervisor Requests",
    note: "Review",
    icon: "approvals",
    countKey: "supervisorRequests",
  },
  {
    href: "/admin/doctor-requests",
    label: "Doctor Requests",
    note: "Review",
    icon: "report",
    countKey: "doctorRequests",
  },
  {
    href: "/admin/group-moderation",
    label: "Group Moderation",
    note: "Review",
    icon: "global",
    countKey: "groupModeration",
  },
  {
    href: "/admin/groups",
    label: "Groups",
    note: "Studio",
    icon: "global",
    countKey: "groups",
  },
  {
    href: "/admin/planning",
    label: "Planning",
    note: "Studio",
    icon: "calendar",
    countKey: "planning",
  },
  { href: "/admin/leaderboard", label: "Leaderboard", note: "Rank", icon: "leaderboard" },
  { href: "/admin/users", label: "Users", note: "Control", icon: "profile", countKey: "users" },
  {
    href: "/admin/user-reports",
    label: "User Reports",
    note: "Safety",
    icon: "report",
    countKey: "userReports",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    note: "Inbox",
    icon: "notifications",
    countKey: "notifications",
  },
  { href: "/admin/chat", label: "Chat", note: "Live", icon: "chat", countKey: "chat" },
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
  const [counts, setCounts] = useState<AdminShellCounts>(emptyCounts);
  const [navSearch, setNavSearch] = useState("");

  const filteredNavItems = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => {
      const haystack = `${item.label} ${item.note}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [navSearch]);

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

  return (
    <main className="denty-screen admin-suite-screen relative px-4 py-5 lg:pl-0 lg:pr-5 lg:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-14 h-[34rem] w-[34rem] rounded-full bg-[rgba(8,18,36,0.34)] blur-[120px]" />
        <div className="absolute right-[12%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-[rgba(70,90,112,0.24)] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[6%] h-[26rem] w-[26rem] rounded-full bg-[rgba(18,28,44,0.22)] blur-[120px]" />
      </div>

      <div className="denty-shell denty-dashboard-layout mx-0 max-w-none space-y-6 lg:space-y-0">
        <aside className="frozen-stage denty-collapsible-rail overflow-y-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(82,85,103,0.96),rgba(67,71,88,0.94))] px-4 py-5 text-white shadow-[0_34px_90px_rgba(4,11,26,0.34)] backdrop-blur-[28px]">
          <div className="flex min-h-full flex-col gap-5">
            <Link href="/admin" className="flex items-center gap-3 rounded-[22px] px-1 py-1">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-slate-900 shadow-[0_14px_28px_rgba(4,11,26,0.22)]">
                <BrandMark className="h-8 w-8" />
              </span>
              <div className="denty-rail-copy">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/54">
                  Admin suite
                </p>
                <h2 className="mt-1 text-[1.65rem] font-semibold text-white">DentyHub</h2>
              </div>
            </Link>

            <div className="denty-rail-search rounded-[18px] border border-white/8 bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <label className="flex items-center gap-3 rounded-[14px] bg-white/8 px-3 py-3 text-sm text-white/58">
                <DashboardIcon name="search" />
                <input
                  type="search"
                  value={navSearch}
                  onChange={(event) => setNavSearch(event.target.value)}
                  placeholder="Search workspace"
                  className="denty-rail-copy w-full bg-transparent text-sm font-medium text-white placeholder:text-white/42 focus:outline-none"
                />
              </label>
            </div>

            <nav className="grid gap-2.5">
              {filteredNavItems.map((item, index) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const count = item.countKey ? counts[item.countKey] : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`denty-rail-action group flex items-center gap-3 rounded-[22px] border p-3 transition ${
                      active
                        ? "border-white/70 bg-white text-slate-900 shadow-[0_20px_34px_rgba(4,11,26,0.22)]"
                        : "border-transparent bg-transparent text-white/78 hover:border-white/10 hover:bg-white/8"
                    }`}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <span
                      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
                        active ? "bg-slate-900 text-white" : "bg-white/8 text-white/86"
                      }`}
                    >
                        <DashboardIcon name={item.icon} />
                        {count !== null && count > 0 ? (
                          <span className="denty-rail-badge-mini absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full border border-rose-300/40 bg-[rgba(190,24,93,0.9)] px-1 text-[10px] font-semibold text-white shadow-[0_10px_18px_rgba(76,5,25,0.3)]">
                            {count > 9 ? "9+" : count}
                          </span>
                        ) : null}
                    </span>
                    <div className="denty-rail-copy min-w-0 flex-1">
                      <p className={`truncate text-[0.98rem] font-semibold ${active ? "text-slate-900" : "text-white"}`}>
                        {item.label}
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
                No sections match this search.
              </div>
            ) : null}

            <Link
              href="/"
              className="denty-rail-action mt-auto flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-white/8 px-3 py-3 text-left text-white transition hover:border-white/16 hover:bg-white/12"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/12 text-white">
                <DashboardIcon name="logout" />
              </span>
              <span className="denty-rail-copy min-w-0 flex-1">
                <span className="block text-[0.98rem] font-semibold text-white">Logout</span>
              </span>
            </Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] px-7 py-7 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:px-9 md:py-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BrandMark className="h-14 w-14 frozen-float" />
                  <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.64)]">
                    Admin workspace
                  </span>
                </div>

                <div>
                  <p className="denty-kicker">Administrative workspace</p>
                  <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                  Approval control
                </span>
                <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                  Group moderation
                </span>
                <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]">
                  Inbox and chat
                </span>
              </div>
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
