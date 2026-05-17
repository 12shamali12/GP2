"use client";

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
  return (
    <div className="denty-panel-strong px-6 py-6 md:px-8 md:py-8">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="denty-kicker !tracking-[0.18em]">
            Search by name, username, email, phone, or student ID
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Type to filter..."
            className="denty-field mt-2 text-sm"
          />
        </div>
        <div>
          <label className="denty-kicker !tracking-[0.18em]">
            Filter by role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
            className="denty-field mt-2 cursor-pointer text-sm"
          >
            <option value="ALL">All</option>
            <option value="SUPERVISOR">Supervisors</option>
            <option value="DOCTOR">Doctors</option>
            <option value="PATIENT">Patients</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Loading...
        </p>
      ) : null}
    </div>
  );
}
