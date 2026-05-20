"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "@/features/i18n/language-provider";
import type {
  DoctorRequestItem,
  ManagedUser,
  SupervisorRequestItem,
} from "@/features/admin/types/admin";

type DashboardAnalyticsProps = {
  users: ManagedUser[];
  supervisorRequests: SupervisorRequestItem[];
  doctorRequests: DoctorRequestItem[];
  loading: boolean;
};

/** Theme-aligned palette (teal / bronze / slate) reused across the charts. */
const ROLE_COLORS = {
  doctors: "#0f6f85",
  supervisors: "#b78842",
  patients: "#3f7fa6",
};
const BAR_COLOR = "#0f6f85";
const PIPELINE_COLORS = ["#b78842", "#3f7fa6", "#c0506a"];

/** Fixed chart heights — recharts needs a concrete height, not a % of flex. */
const BAR_HEIGHT = 220;
const PIE_HEIGHT = 190;

/** Six calendar-month buckets, oldest first. */
function buildMonthBuckets() {
  const now = new Date();
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      count: 0,
    });
  }
  return buckets;
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="denty-dashboard-card-soft p-4 sm:p-5">
      <p className="denty-kicker !tracking-[0.18em]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
        {note}
      </p>
      <div className="mt-4 text-[var(--muted-foreground)]">{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center text-xs text-[var(--muted-foreground)]"
      style={{ height: BAR_HEIGHT }}
    >
      {label}
    </div>
  );
}

export function DashboardAnalytics({
  users,
  supervisorRequests,
  doctorRequests,
  loading,
}: DashboardAnalyticsProps) {
  const t = useTranslation();

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role !== "ADMIN"),
    [users],
  );

  const roleData = useMemo(() => {
    const counts = { DOCTOR: 0, SUPERVISOR: 0, PATIENT: 0 };
    for (const user of visibleUsers) {
      if (user.role in counts) {
        counts[user.role as keyof typeof counts] += 1;
      }
    }
    return [
      {
        name: t("admin.analytics.doctors"),
        value: counts.DOCTOR,
        color: ROLE_COLORS.doctors,
      },
      {
        name: t("admin.analytics.supervisors"),
        value: counts.SUPERVISOR,
        color: ROLE_COLORS.supervisors,
      },
      {
        name: t("admin.analytics.patients"),
        value: counts.PATIENT,
        color: ROLE_COLORS.patients,
      },
    ].filter((entry) => entry.value > 0);
  }, [visibleUsers, t]);

  const growthData = useMemo(() => {
    const buckets = buildMonthBuckets();
    const index = new Map(buckets.map((bucket, i) => [bucket.key, i]));
    for (const user of visibleUsers) {
      if (!user.createdAt) continue;
      const date = new Date(user.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const slot = index.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (slot !== undefined) buckets[slot].count += 1;
    }
    return buckets;
  }, [visibleUsers]);

  const pipelineData = useMemo(
    () => [
      {
        name: t("admin.analytics.supervisor_reqs"),
        value: supervisorRequests.length,
      },
      {
        name: t("admin.analytics.doctor_reqs"),
        value: doctorRequests.length,
      },
      {
        name: t("admin.analytics.blocked"),
        value: visibleUsers.filter((user) => user.blocked).length,
      },
    ],
    [supervisorRequests.length, doctorRequests.length, visibleUsers, t],
  );

  const tick = { fill: "currentColor", fontSize: 11 };
  const hasUsers = visibleUsers.length > 0;
  const hasGrowth = growthData.some((bucket) => bucket.count > 0);
  const hasPipeline = pipelineData.some((entry) => entry.value > 0);

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <p className="denty-kicker">{t("admin.analytics.eyebrow")}</p>
      <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
        {t("admin.analytics.title")}
      </h2>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="denty-skeleton denty-skeleton-card h-[300px]"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ChartCard
            title={t("admin.analytics.role_mix")}
            note={t("admin.analytics.role_mix_note")}
          >
            {hasUsers && roleData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={PIE_HEIGHT}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {roleData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-[11px] font-medium">
                  {roleData.map((entry) => (
                    <span
                      key={entry.name}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: entry.color }}
                      />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChart label={t("admin.analytics.empty")} />
            )}
          </ChartCard>

          <ChartCard
            title={t("admin.analytics.growth")}
            note={t("admin.analytics.growth_note")}
          >
            {hasGrowth ? (
              <ResponsiveContainer width="100%" height={BAR_HEIGHT}>
                <BarChart
                  data={growthData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(120,140,160,0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip cursor={{ fill: "rgba(120,140,160,0.12)" }} />
                  <Bar
                    dataKey="count"
                    name={t("admin.analytics.accounts")}
                    fill={BAR_COLOR}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label={t("admin.analytics.empty")} />
            )}
          </ChartCard>

          <ChartCard
            title={t("admin.analytics.pipeline")}
            note={t("admin.analytics.pipeline_note")}
          >
            {hasPipeline ? (
              <ResponsiveContainer width="100%" height={BAR_HEIGHT}>
                <BarChart
                  data={pipelineData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(120,140,160,0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip cursor={{ fill: "rgba(120,140,160,0.12)" }} />
                  <Bar
                    dataKey="value"
                    name={t("admin.analytics.pipeline")}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                  >
                    {pipelineData.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={PIPELINE_COLORS[idx % PIPELINE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label={t("admin.analytics.empty")} />
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
