"use client";

import Link from "next/link";
import type { ManagedUser } from "@/features/admin/types/admin";
import type {
  GroupedUserRole,
  RoleFilter,
} from "../hooks/use-admin-users-workspace";

type UsersRoleSectionsProps = {
  groupedUsers: GroupedUserRole[];
  expandedRoles: RoleFilter[];
  onToggleRole: (role: RoleFilter) => void;
  onBlockUser: (id: string, blocked: boolean) => void;
  onOpenDeleteModal: (user: ManagedUser) => void;
  onReapproveSupervisor: (id: string) => void;
  onReapproveDoctor: (id: string) => void;
  hasActiveTimedFreeze: (user: ManagedUser) => boolean;
};

export function UsersRoleSections({
  groupedUsers,
  expandedRoles,
  onToggleRole,
  onBlockUser,
  onOpenDeleteModal,
  onReapproveSupervisor,
  onReapproveDoctor,
  hasActiveTimedFreeze,
}: UsersRoleSectionsProps) {
  return (
    <div className="mt-6 space-y-4">
      {groupedUsers.map((group) => {
        const expanded = expandedRoles.includes(group.role);
        return (
          <div key={group.role} className="denty-dashboard-card p-5">
            <button
              type="button"
              onClick={() => onToggleRole(group.role)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/28 px-4 py-4 text-left transition hover:bg-white/40"
            >
              <div>
                <p className="denty-kicker !tracking-[0.18em]">{group.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  {group.count} accounts
                </p>
              </div>
              <span className="inline-flex min-h-[2.8rem] min-w-[2.8rem] items-center justify-center rounded-full border border-white/14 bg-white/38 text-xl font-semibold text-[var(--foreground)]">
                {expanded ? "-" : "+"}
              </span>
            </button>

            {expanded ? (
              <div className="mt-4 space-y-4">
                {group.count === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]/80">
                    No accounts.
                  </p>
                ) : null}

                {group.sections.map((section) => (
                  <section key={`${group.role}-${section.letter}`}>
                    <p className="denty-kicker !tracking-[0.18em]">
                      {section.letter}
                    </p>
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      {section.items.map((user) => (
                        <div
                          key={user.id}
                          className="denty-dashboard-card-soft p-4 text-xs text-[var(--muted-foreground)]"
                        >
                          <Link
                            href={`/profiles/${user.id}`}
                            className="text-xl font-black leading-tight text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {user.name}
                          </Link>
                          <p className="mt-2">Email: {user.email || "-"}</p>
                          <p>Phone: {user.phone || "-"}</p>
                          {user.role === "DOCTOR" ? (
                            <p>Doctor ID: {user.doctorIdNumber || "-"}</p>
                          ) : null}
                          {user.role === "SUPERVISOR" ? (
                            <p>Status: {user.supervisorStatus || "UNKNOWN"}</p>
                          ) : null}
                          {user.role === "DOCTOR" ? (
                            <p>Status: {user.doctorStatus || "UNKNOWN"}</p>
                          ) : null}
                          <p>Blocked: {user.blocked ? "Yes" : "No"}</p>
                          {hasActiveTimedFreeze(user) ? (
                            <p>
                              Frozen until:{" "}
                              {new Date(user.blockedUntil as string).toLocaleString()}
                            </p>
                          ) : null}
                          {user.blockReason ? (
                            <p>Freeze note: {user.blockReason}</p>
                          ) : null}
                          {user.role === "DOCTOR" ? (
                            <p>
                              Group:{" "}
                              {user.groupMembership?.group
                                ? `${user.groupMembership.group.name} - ${user.groupMembership.group.semesterLabel}`
                                : "Not assigned"}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {user.role === "SUPERVISOR" &&
                            (user.supervisorStatus === "REJECTED" ||
                              user.supervisorStatus === "PENDING") ? (
                              <button
                                onClick={() => onReapproveSupervisor(user.id)}
                                className="cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                {user.supervisorStatus === "REJECTED"
                                  ? "Re-approve"
                                  : "Approve now"}
                              </button>
                            ) : null}

                            {user.role === "DOCTOR" &&
                            (user.doctorStatus === "REJECTED" ||
                              user.doctorStatus === "PENDING") ? (
                              <button
                                onClick={() => onReapproveDoctor(user.id)}
                                className="cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                {user.doctorStatus === "REJECTED"
                                  ? "Re-approve"
                                  : "Approve now"}
                              </button>
                            ) : null}

                            <button
                              onClick={() => onBlockUser(user.id, !user.blocked)}
                              className="cursor-pointer rounded-full border border-[rgba(183,136,66,0.34)] bg-[rgba(183,136,66,0.14)] px-4 py-2 text-sm font-semibold text-[#855f1d] hover:bg-[rgba(183,136,66,0.22)]"
                            >
                              {user.blocked ? "Unblock" : "Block"}
                            </button>

                            <button
                              onClick={() => onOpenDeleteModal(user)}
                              className="cursor-pointer rounded-full border border-rose-600/30 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
