"use client";

import Link from "next/link";
import type { AlphabetSection } from "@/features/admin/utils/collection";
import type { ManagedUser } from "@/features/admin/types/admin";

type DoctorAccountsLaneProps = {
  doctorQuery: string;
  filteredCount: number;
  sections: AlphabetSection<ManagedUser>[];
  onDoctorQueryChange: (value: string) => void;
  onReapproveDoctor: (id: string) => void;
  onToggleBlock: (id: string, blocked: boolean) => void;
};

export function DoctorAccountsLane({
  doctorQuery,
  filteredCount,
  sections,
  onDoctorQueryChange,
  onReapproveDoctor,
  onToggleBlock,
}: DoctorAccountsLaneProps) {
  const accountCountLabel = filteredCount === 1 ? "account" : "accounts";

  return (
    <div className="denty-panel-strong flex min-h-[45rem] max-h-[45rem] flex-col overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="denty-kicker">Review studio</p>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Doctors
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Live doctor accounts, sorted alphabetically.
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
            value={doctorQuery}
            onChange={(e) => onDoctorQueryChange(e.target.value)}
            placeholder="Search doctors by name, email, phone, or student ID"
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
                  {section.items.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(229,237,243,0.16))] px-5 py-4 shadow-[0_18px_42px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.08fr)_auto] xl:items-start">
                        <div>
                          <Link
                            href={`/profiles/${doctor.id}`}
                            className="text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                          >
                            {doctor.name}
                          </Link>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            @{doctor.username}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.48)]">
                            Student ID {doctor.doctorIdNumber || "-"}
                          </p>
                        </div>

                        <div className="grid gap-2 text-sm text-[var(--muted-foreground)] md:grid-cols-2">
                          <p>Email: {doctor.email || "-"}</p>
                          <p>Phone: {doctor.phone || "-"}</p>
                          <p>Status: {doctor.doctorStatus || "UNKNOWN"}</p>
                          <p>Blocked: {doctor.blocked ? "Yes" : "No"}</p>
                          {doctor.blockedUntil ? (
                            <p className="md:col-span-2">
                              Frozen until: {new Date(doctor.blockedUntil).toLocaleString()}
                            </p>
                          ) : null}
                          {doctor.groupMembership?.group ? (
                            <p className="md:col-span-2">
                              Group: {doctor.groupMembership.group.name} - {doctor.groupMembership.group.semesterLabel}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 xl:min-w-[9rem]">
                          <Link
                            href={`/profiles/${doctor.id}`}
                            className="cursor-pointer rounded-full border border-white/12 bg-white/34 px-4 py-2.5 text-center text-xs font-semibold text-[var(--foreground)] hover:bg-white/46"
                          >
                            View profile
                          </Link>
                          {doctor.doctorStatus === "REJECTED" ? (
                            <button
                              onClick={() => onReapproveDoctor(doctor.id)}
                              className="cursor-pointer rounded-full border border-emerald-600/40 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Re-approve
                            </button>
                          ) : null}
                          <button
                            onClick={() => onToggleBlock(doctor.id, !doctor.blocked)}
                            className="cursor-pointer rounded-full border border-[rgba(183,136,66,0.34)] bg-[rgba(183,136,66,0.14)] px-4 py-2.5 text-xs font-semibold text-[#855f1d] hover:bg-[rgba(183,136,66,0.22)]"
                          >
                            {doctor.blocked ? "Unblock" : "Block"}
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
              No doctors found.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
