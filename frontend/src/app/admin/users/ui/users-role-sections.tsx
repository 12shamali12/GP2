"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
import type { ManagedUser } from "@/features/admin/types/admin";
import { sectionByLetter } from "@/features/admin/utils/collection";
import { Pagination } from "@/features/ui/components/pagination";
import { usePagination } from "@/features/ui/hooks/use-pagination";
import type { UserRole } from "../lib/user-filters";
import type { GroupedUserRole } from "../hooks/use-admin-users-workspace";

const roleLabelKey: Record<UserRole, string> = {
  SUPERVISOR: "admin.users.filter_supervisors",
  DOCTOR: "admin.users.filter_doctors",
  PATIENT: "admin.users.filter_patients",
};

/** Accounts shown per page inside an expanded role panel. */
const USERS_PER_PAGE = 20;

type RoleActions = {
  onBlockUser: (id: string, blocked: boolean) => void;
  onOpenDeleteModal: (user: ManagedUser) => void;
  onReapproveSupervisor: (id: string) => void;
  onReapproveDoctor: (id: string) => void;
  hasActiveTimedFreeze: (user: ManagedUser) => boolean;
};

type UsersRoleSectionsProps = RoleActions & {
  groupedUsers: GroupedUserRole[];
  expandedRoles: UserRole[];
  /** Active search query — when set, matching role panels auto-expand. */
  query: string;
  onToggleRole: (role: UserRole) => void;
};

/** Single account card with re-approve / block / delete actions. */
function UserCard({
  user,
  onBlockUser,
  onOpenDeleteModal,
  onReapproveSupervisor,
  onReapproveDoctor,
  hasActiveTimedFreeze,
}: { user: ManagedUser } & RoleActions) {
  const t = useTranslation();
  return (
    <div className="denty-dashboard-card-soft p-4 text-xs text-[var(--muted-foreground)] break-words">
      <Link
        href={`/profiles/${user.id}`}
        className="break-words text-xl font-black leading-tight text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
      >
        {user.name}
      </Link>
      <p className="mt-2">
        {t("admin.users.email_field", { value: user.email || "-" })}
      </p>
      <p>{t("admin.users.phone_field", { value: user.phone || "-" })}</p>
      {user.role === "DOCTOR" ? (
        <p>
          {t("admin.users.doctor_id_field", {
            value: user.doctorIdNumber || "-",
          })}
        </p>
      ) : null}
      {user.role === "SUPERVISOR" ? (
        <p>
          {t("admin.users.status_field", {
            value: user.supervisorStatus || t("admin.common.unknown"),
          })}
        </p>
      ) : null}
      {user.role === "DOCTOR" ? (
        <p>
          {t("admin.users.status_field", {
            value: user.doctorStatus || t("admin.common.unknown"),
          })}
        </p>
      ) : null}
      <p>
        {t("admin.users.blocked_field", {
          value: user.blocked ? t("admin.common.yes") : t("admin.common.no"),
        })}
      </p>
      {hasActiveTimedFreeze(user) ? (
        <p>
          {t("admin.users.frozen_field", {
            value: new Date(user.blockedUntil as string).toLocaleString(),
          })}
        </p>
      ) : null}
      {user.blockReason ? (
        <p>
          {t("admin.users.freeze_note_field", { value: user.blockReason })}
        </p>
      ) : null}
      {user.role === "DOCTOR" ? (
        <p>
          {t("admin.users.group_field", {
            value: user.groupMembership?.group
              ? `${user.groupMembership.group.name} - ${user.groupMembership.group.semesterLabel}`
              : t("admin.users.not_assigned"),
          })}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {user.role === "SUPERVISOR" &&
        (user.supervisorStatus === "REJECTED" ||
          user.supervisorStatus === "PENDING") ? (
          <button
            onClick={() => onReapproveSupervisor(user.id)}
            className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            {user.supervisorStatus === "REJECTED"
              ? t("admin.common.re_approve")
              : t("admin.common.approve_now")}
          </button>
        ) : null}

        {user.role === "DOCTOR" &&
        (user.doctorStatus === "REJECTED" ||
          user.doctorStatus === "PENDING") ? (
          <button
            onClick={() => onReapproveDoctor(user.id)}
            className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            {user.doctorStatus === "REJECTED"
              ? t("admin.common.re_approve")
              : t("admin.common.approve_now")}
          </button>
        ) : null}

        <button
          onClick={() => onBlockUser(user.id, !user.blocked)}
          className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-full border border-[rgba(183,136,66,0.34)] bg-[rgba(183,136,66,0.14)] px-4 py-2 text-sm font-semibold text-[#855f1d] hover:bg-[rgba(183,136,66,0.22)]"
        >
          {user.blocked
            ? t("admin.common.unblock")
            : t("admin.common.block")}
        </button>

        <button
          onClick={() => onOpenDeleteModal(user)}
          className="inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center rounded-full border border-rose-600/30 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          {t("admin.common.delete")}
        </button>
      </div>
    </div>
  );
}

/** One collapsible role panel — paginates and scrolls its accounts. */
function UsersRolePanel({
  group,
  expanded,
  onToggle,
  actions,
}: {
  group: GroupedUserRole;
  expanded: boolean;
  onToggle: () => void;
  actions: RoleActions;
}) {
  const t = useTranslation();
  const pagination = usePagination(group.users, USERS_PER_PAGE);
  const sections = sectionByLetter(pagination.pageItems, (user) => user.name);

  return (
    <div className="denty-dashboard-card p-4 sm:p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/28 px-4 py-4 text-left transition hover:bg-white/40"
      >
        <div className="min-w-0">
          <p className="denty-kicker !tracking-[0.18em]">
            {t(roleLabelKey[group.role])}
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {t("admin.common.accounts_count", { count: group.count })}
          </p>
        </div>
        <span className="inline-flex min-h-[2.8rem] min-w-[2.8rem] shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/38 text-xl font-semibold text-[var(--foreground)]">
          {expanded ? "-" : "+"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-4">
          {group.count === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]/80">
              {t("admin.users.no_accounts")}
            </p>
          ) : (
            <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
              {sections.map((section) => (
                <section key={`${group.role}-${section.letter}`}>
                  <p className="denty-kicker !tracking-[0.18em]">
                    {section.letter}
                  </p>
                  <div className="denty-enter-stagger mt-3 grid gap-3 xl:grid-cols-2">
                    {section.items.map((user) => (
                      <UserCard key={user.id} user={user} {...actions} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            total={pagination.total}
            onPrev={pagination.prev}
            onNext={pagination.next}
            onPage={pagination.setPage}
          />
        </div>
      ) : null}
    </div>
  );
}

export function UsersRoleSections({
  groupedUsers,
  expandedRoles,
  query,
  onToggleRole,
  onBlockUser,
  onOpenDeleteModal,
  onReapproveSupervisor,
  onReapproveDoctor,
  hasActiveTimedFreeze,
}: UsersRoleSectionsProps) {
  const actions: RoleActions = {
    onBlockUser,
    onOpenDeleteModal,
    onReapproveSupervisor,
    onReapproveDoctor,
    hasActiveTimedFreeze,
  };
  const searching = query.trim() !== "";

  return (
    <div className="mt-6 space-y-4">
      {groupedUsers.map((group) => (
        <UsersRolePanel
          key={group.role}
          group={group}
          // While searching, matching panels open automatically so results
          // are never hidden behind a collapsed section.
          expanded={
            searching
              ? group.count > 0
              : expandedRoles.includes(group.role)
          }
          onToggle={() => onToggleRole(group.role)}
          actions={actions}
        />
      ))}
    </div>
  );
}
