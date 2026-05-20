"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { RoleFilter } from "../hooks/use-admin-users-workspace";

type UsersFilterPanelProps = {
  query: string;
  roleFilter: RoleFilter;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: RoleFilter) => void;
};

export function UsersFilterPanel({
  query,
  roleFilter,
  loading,
  onQueryChange,
  onRoleFilterChange,
}: UsersFilterPanelProps) {
  const t = useTranslation();
  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="denty-kicker !tracking-[0.18em]">
            {t("admin.users.search_label")}
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("admin.users.search_placeholder")}
            className="denty-field mt-2 text-sm"
          />
        </div>
        <div>
          <label className="denty-kicker !tracking-[0.18em]">
            {t("admin.users.filter_label")}
          </label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
            className="denty-field mt-2 cursor-pointer text-sm"
          >
            <option value="ALL">{t("admin.users.filter_all")}</option>
            <option value="SUPERVISOR">
              {t("admin.users.filter_supervisors")}
            </option>
            <option value="DOCTOR">{t("admin.users.filter_doctors")}</option>
            <option value="PATIENT">{t("admin.users.filter_patients")}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          {t("admin.common.loading")}
        </p>
      ) : null}
    </div>
  );
}
