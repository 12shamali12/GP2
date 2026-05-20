import type { ManagedUser } from "@/features/admin/types/admin";
import type { CsvColumn } from "@/lib/csv";

export type UserRole = "SUPERVISOR" | "DOCTOR" | "PATIENT";

export const ALL_ROLES: UserRole[] = ["SUPERVISOR", "DOCTOR", "PATIENT"];

export type AccountStatus = "all" | "active" | "blocked";
export type DoctorStatus = "all" | "APPROVED" | "PENDING" | "REJECTED";
export type GroupFilter = "all" | "assigned" | "unassigned";

export type UserFilters = {
  /** Roles to include in the list / export. */
  roles: UserRole[];
  /** Account status. */
  status: AccountStatus;
  /** Doctor approval status — only constrains doctors. */
  doctorStatus: DoctorStatus;
  /** Semester labels to include; empty means all — only constrains doctors. */
  semesters: string[];
  /** Group membership — only constrains doctors. */
  group: GroupFilter;
};

export const DEFAULT_FILTERS: UserFilters = {
  roles: [...ALL_ROLES],
  status: "all",
  doctorStatus: "all",
  semesters: [],
  group: "all",
};

/**
 * True when `user` satisfies every active filter criterion plus the free-text
 * `query`. The doctor-specific criteria (approval, semester, group) only
 * constrain doctors — supervisors / patients pass straight through them.
 */
export function userMatches(
  user: ManagedUser,
  filters: UserFilters,
  query: string,
): boolean {
  if (!filters.roles.includes(user.role as UserRole)) return false;

  if (filters.status === "active" && user.blocked) return false;
  if (filters.status === "blocked" && !user.blocked) return false;

  if (user.role === "DOCTOR") {
    if (
      filters.doctorStatus !== "all" &&
      user.doctorStatus !== filters.doctorStatus
    ) {
      return false;
    }
    if (
      filters.semesters.length > 0 &&
      !filters.semesters.includes(user.semester?.label ?? "")
    ) {
      return false;
    }
    if (filters.group === "assigned" && !user.groupMembership) return false;
    if (filters.group === "unassigned" && user.groupMembership) return false;
  }

  const q = query.trim().toLowerCase();
  if (q) {
    const haystack = [
      user.name,
      user.username,
      user.email,
      user.phone,
      user.doctorIdNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

/** How many filter criteria differ from the defaults — drives the badge. */
export function countActiveFilters(filters: UserFilters): number {
  let count = 0;
  if (filters.roles.length < ALL_ROLES.length) count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.doctorStatus !== "all") count += 1;
  if (filters.semesters.length > 0) count += 1;
  if (filters.group !== "all") count += 1;
  return count;
}

/** CSV column layout shared by the export action. */
export const USER_CSV_COLUMNS: CsvColumn<ManagedUser>[] = [
  { header: "Name", value: (u) => u.name },
  { header: "Username", value: (u) => u.username },
  { header: "Role", value: (u) => u.role },
  { header: "Email", value: (u) => u.email },
  { header: "Phone", value: (u) => u.phone },
  { header: "Doctor ID", value: (u) => u.doctorIdNumber },
  { header: "Supervisor Status", value: (u) => u.supervisorStatus },
  { header: "Doctor Status", value: (u) => u.doctorStatus },
  { header: "Blocked", value: (u) => (u.blocked ? "Yes" : "No") },
  { header: "Blocked Until", value: (u) => u.blockedUntil },
  { header: "Semester", value: (u) => u.semester?.label },
  { header: "Group", value: (u) => u.groupMembership?.group?.name },
  { header: "Created At", value: (u) => u.createdAt },
];
