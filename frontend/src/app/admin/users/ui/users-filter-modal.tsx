"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ManagedUser } from "@/features/admin/types/admin";
import {
  ALL_ROLES,
  DEFAULT_FILTERS,
  userMatches,
  type UserFilters,
  type UserRole,
} from "../lib/user-filters";

type UsersFilterModalProps = {
  open: boolean;
  onClose: () => void;
  filters: UserFilters;
  query: string;
  users: ManagedUser[];
  semesterOptions: string[];
  onApply: (filters: UserFilters) => void;
  onExport: (users: ManagedUser[]) => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  DOCTOR: "Doctors",
  SUPERVISOR: "Supervisors",
  PATIENT: "Patients",
};

/** A multi-select pill toggle. */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[2.4rem] cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
        active
          ? "border-transparent bg-[rgba(9,20,38,0.86)] text-white shadow-[0_8px_18px_rgba(7,18,34,0.18)]"
          : "border-white/16 bg-white/45 text-[var(--foreground)] hover:bg-white/65"
      }`}
    >
      {children}
    </button>
  );
}

/** A single-choice segmented control. */
function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[14px] border border-white/14 bg-white/35 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-[2.1rem] cursor-pointer rounded-[10px] px-3.5 text-xs font-semibold transition ${
            value === option.value
              ? "bg-[rgba(9,20,38,0.86)] text-white"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="denty-kicker !tracking-[0.18em]">{label}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * "Filter & export" hub for the admin account list. Edits a draft of the
 * filter set, previews how many accounts match live, and can either apply
 * the filter to the page list or download the matching rows as CSV.
 */
export function UsersFilterModal({
  open,
  onClose,
  filters,
  query,
  users,
  semesterOptions,
  onApply,
  onExport,
}: UsersFilterModalProps) {
  const [draft, setDraft] = useState<UserFilters>(filters);

  // Re-sync the draft with the applied filters every time the modal opens.
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const matching = useMemo(
    () => users.filter((user) => userMatches(user, draft, query)),
    [users, draft, query],
  );

  if (!open) return null;

  const toggleRole = (role: UserRole) =>
    setDraft((d) => ({
      ...d,
      roles: d.roles.includes(role)
        ? d.roles.filter((r) => r !== role)
        : [...d.roles, role],
    }));

  const toggleSemester = (semester: string) =>
    setDraft((d) => ({
      ...d,
      semesters: d.semesters.includes(semester)
        ? d.semesters.filter((s) => s !== semester)
        : [...d.semesters, semester],
    }));

  return (
    <div
      className="denty-backdrop-enter fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,18,34,0.42)] p-3 backdrop-blur-[12px] sm:p-4"
      onClick={onClose}
    >
      <div
        className="denty-modal-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.86),rgba(225,234,241,0.46))] p-4 shadow-[0_34px_90px_rgba(4,11,26,0.28)] backdrop-blur-[28px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="denty-kicker">Accounts</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              Filter &amp; export
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Narrow the account list, then apply it to the page or download
              the result as a CSV file.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/44 text-lg font-semibold text-[var(--foreground)] transition hover:bg-white/58"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-[18px] border border-white/12 bg-[rgba(9,20,38,0.06)] px-4 py-3">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[var(--foreground)]">
              {matching.length}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              of {users.length} accounts match
            </span>
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field label="Roles">
            {ALL_ROLES.map((role) => (
              <Pill
                key={role}
                active={draft.roles.includes(role)}
                onClick={() => toggleRole(role)}
              >
                {ROLE_LABELS[role]}
              </Pill>
            ))}
          </Field>

          <Field label="Account status">
            <Segmented
              value={draft.status}
              onChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  status: value as UserFilters["status"],
                }))
              }
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "blocked", label: "Blocked" },
              ]}
            />
          </Field>

          <Field label="Doctor approval (doctors only)">
            <Segmented
              value={draft.doctorStatus}
              onChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  doctorStatus: value as UserFilters["doctorStatus"],
                }))
              }
              options={[
                { value: "all", label: "All" },
                { value: "APPROVED", label: "Approved" },
                { value: "PENDING", label: "Pending" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
          </Field>

          <Field label="Group (doctors only)">
            <Segmented
              value={draft.group}
              onChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  group: value as UserFilters["group"],
                }))
              }
              options={[
                { value: "all", label: "All" },
                { value: "assigned", label: "In a group" },
                { value: "unassigned", label: "No group" },
              ]}
            />
          </Field>

          {semesterOptions.length > 0 ? (
            <Field label="Semester (doctors only)">
              {semesterOptions.map((semester) => (
                <Pill
                  key={semester}
                  active={draft.semesters.includes(semester)}
                  onClick={() => toggleSemester(semester)}
                >
                  {semester}
                </Pill>
              ))}
              {draft.semesters.length === 0 ? (
                <span className="text-xs text-[var(--muted-foreground)]">
                  All semesters
                </span>
              ) : null}
            </Field>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className="text-sm font-semibold text-[var(--muted-foreground)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
          >
            Reset filters
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[16px] border border-white/14 bg-white/44 px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={matching.length === 0}
              onClick={() => onExport(matching)}
              className="inline-flex min-h-[2.9rem] items-center justify-center gap-2 rounded-[16px] border border-[rgba(9,20,38,0.2)] bg-white/55 px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download CSV ({matching.length})
            </button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[16px] border border-white/14 bg-[rgba(9,20,38,0.86)] px-5 text-sm font-semibold text-white transition hover:bg-[rgba(9,20,38,0.95)]"
            >
              Apply to list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
