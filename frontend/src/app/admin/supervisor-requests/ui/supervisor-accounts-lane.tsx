"use client";

import Link from "next/link";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { ManagedUser } from "@/features/admin/types/admin";

type SupervisorAccountsLaneProps = {
  supervisorQuery: string;
  filteredCount: number;
  sections: AlphabetSection<ManagedUser>[];
  onSupervisorQueryChange: (value: string) => void;
  onReapproveSupervisor: (id: string) => void;
  onToggleBlock: (id: string, blocked: boolean) => void;
};

export function SupervisorAccountsLane({
  supervisorQuery,
  filteredCount,
  sections,
  onSupervisorQueryChange,
  onReapproveSupervisor,
  onToggleBlock,
}: SupervisorAccountsLaneProps) {
  const accountCountLabel = filteredCount === 1 ? "account" : "accounts";

  return (
    <div className="denty-panel-strong flex min-h-[45rem] max-h-[45rem] flex-col overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="denty-kicker">Review studio</p>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Supervisors
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Live supervisor accounts, sorted alphabetically.
          </p>
        </div>
        <div className="rounded-full border border-white/12 bg-white/30 px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
          {filteredCount} accounts
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.2)] p-4 shadow-[0_14px_34px_rgba(7,18,34,0.06)] backdrop-blur-[18px]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <input
            type="text"
            value={supervisorQuery}
            onChange={(e) => onSupervisorQueryChange(e.target.value)}
            placeholder="Search supervisors by name, email, phone, or notes"
            className="denty-field text-sm"
          />
          <div className="rounded-full border border-white/14 bg-[rgba(9,20,38,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.6)]">
            {filteredCount} {accountCountLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.letter}>
                <div className="flex items-center justify-between gap-3">
                  <p className="denty-kicker !tracking-[0.18em]">
                    {section.letter}
                  </p>
                  <span className="rounded-full border border-white/12 bg-white/24 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.56)]">
                    {section.items.length} listed
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {section.items.map((supervisor) => (
                    <div
                      key={supervisor.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] px-5 py-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.08fr)_auto] xl:items-start">
                        <div>
                          <Link
                            href={`/profiles/${supervisor.id}`}
                            className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {supervisor.name}
                          </Link>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            @{supervisor.username}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            Supervisor account
                          </p>
                        </div>

                        <div className="grid gap-2 text-sm text-[var(--muted-foreground)] md:grid-cols-2">
                          <p>Email: {supervisor.email || "-"}</p>
                          <p>Phone: {supervisor.phone || "-"}</p>
                          <p>Status: {supervisor.supervisorStatus || "UNKNOWN"}</p>
                          <p>Blocked: {supervisor.blocked ? "Yes" : "No"}</p>
                          {supervisor.blockedUntil ? (
                            <p className="md:col-span-2">
                              Frozen until: {new Date(supervisor.blockedUntil).toLocaleString()}
                            </p>
                          ) : null}
                          {supervisor.blockReason ? (
                            <p className="md:col-span-2">
                              Freeze note: {supervisor.blockReason}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 xl:min-w-[9rem]">
                          <Link
                            href={`/profiles/${supervisor.id}`}
                            className="cursor-pointer rounded-full border border-white/12 bg-white/34 px-4 py-2.5 text-center text-xs font-semibold text-[var(--foreground)] hover:bg-white/46"
                          >
                            View profile
                          </Link>
                          {supervisor.supervisorStatus === "REJECTED" ? (
                            <button
                              onClick={() => onReapproveSupervisor(supervisor.id)}
                              className="cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Re-approve
                            </button>
                          ) : null}
                          <button
                            onClick={() =>
                              onToggleBlock(supervisor.id, !supervisor.blocked)
                            }
                            className="cursor-pointer rounded-full border border-[rgba(183,136,66,0.34)] bg-[rgba(183,136,66,0.14)] px-4 py-2.5 text-xs font-semibold text-[#855f1d] hover:bg-[rgba(183,136,66,0.22)]"
                          >
                            {supervisor.blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : !filteredCount ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Directory</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No supervisors found.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
