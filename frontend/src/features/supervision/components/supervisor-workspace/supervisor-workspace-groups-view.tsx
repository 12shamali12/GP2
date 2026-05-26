"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/features/i18n/language-provider";
import { ProfilePopup } from "@/features/profiles/components/profile-popup";
import type { SupervisorWorkspaceData } from "../../types";

type GroupDirectoryItem = NonNullable<SupervisorWorkspaceData["groupDirectory"]>[number];

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-white/8 p-4 backdrop-blur-[8px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
          {label}
        </span>
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-300/20 text-teal-100"
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SectionTitle({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        aria-hidden
        className="h-5 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(94,234,212,0.95),rgba(45,212,191,0.5))]"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/75">
        {label}
      </p>
      <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[11px] font-semibold text-white/80">
        {count}
      </span>
      <span className="ml-auto h-px flex-1 bg-[linear-gradient(90deg,rgba(94,234,212,0.25),transparent)]" />
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[16px] border border-dashed border-white/12 bg-white/4 px-4 py-3 text-sm text-white/55">
      {children}
    </p>
  );
}

/** Read-only group detail popup — dark teal aesthetic matching ProfilePopup. */
function GroupDetailPopup({
  group,
  onClose,
  onOpenProfile,
}: {
  group: GroupDirectoryItem | null;
  onClose: () => void;
  onOpenProfile: (doctorId: string) => void;
}) {
  useEffect(() => {
    if (!group) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [group, onClose]);

  if (!group) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="denty-backdrop-enter fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(4,11,24,0.62)] p-4 backdrop-blur-[12px] sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="denty-modal-enter relative flex max-h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[rgba(8,30,38,0.94)] text-white shadow-[0_40px_140px_rgba(0,30,40,0.55)]"
      >
        <div className="relative h-24 flex-none overflow-hidden bg-[linear-gradient(120deg,rgba(15,118,110,0.95),rgba(8,145,178,0.82))]">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_85%_120%,rgba(56,189,248,0.55),transparent_55%)]" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-4 px-6 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">
                  {group.semesterLabel}
                </p>
                <h2 className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">
                  {group.name}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M6 9V6a4 4 0 018 0v3M5 9h10v8H5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Read-only
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          {group.description ? (
            <div className="rounded-[20px] border border-white/12 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                About this group
              </p>
              <p className="mt-2 text-sm leading-7 text-white/85">{group.description}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Students"
              value={group.members.length}
              icon={
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatTile
              label="Partner pairs"
              value={group.partnerPairs?.length ?? 0}
              icon={
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.7"/>
                  <circle cx="13" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M3 17c0-2.5 2-4.5 4.5-4.5M17 17c0-2.5-2-4.5-4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatTile
              label="Posts"
              value={group.posts.length}
              icon={
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <path d="M4 5h12v10H4z M7 9h6 M7 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>

          <section>
            <SectionTitle label="Students" count={group.members.length} />
            {group.members.length ? (
              <div className="flex flex-wrap gap-2">
                {[...group.members]
                  .sort((a, b) =>
                    a.doctor.name.localeCompare(b.doctor.name, undefined, { sensitivity: "base" }),
                  )
                  .map((member) => (
                    <button
                      key={member.doctor.id}
                      type="button"
                      onClick={() => onOpenProfile(member.doctor.id)}
                      title="View profile"
                      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/35 bg-teal-400/12 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-teal-300/60 hover:bg-teal-400/22 hover:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
                    >
                      <span
                        aria-hidden
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/30 text-teal-50"
                      >
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                          <path
                            d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <span>{member.doctor.name}</span>
                      <span className="text-[10px] text-white/50">@{member.doctor.username}</span>
                    </button>
                  ))}
              </div>
            ) : (
              <EmptyMessage>No members in this group yet.</EmptyMessage>
            )}
          </section>

          <section>
            <SectionTitle label="Active partner pairs" count={group.partnerPairs?.length ?? 0} />
            {group.partnerPairs?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {group.partnerPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex flex-wrap items-center gap-2 rounded-[18px] border border-white/12 bg-white/5 px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProfile(pair.doctorOne.id)}
                      className="cursor-pointer rounded-full border border-teal-300/30 bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:border-teal-300/55 hover:bg-teal-400/20"
                    >
                      {pair.doctorOne.name}
                    </button>
                    <span className="text-xs text-white/55">+</span>
                    <button
                      type="button"
                      onClick={() => onOpenProfile(pair.doctorTwo.id)}
                      className="cursor-pointer rounded-full border border-teal-300/30 bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:border-teal-300/55 hover:bg-teal-400/20"
                    >
                      {pair.doctorTwo.name}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMessage>No active partner pairs yet.</EmptyMessage>
            )}
          </section>

          <section>
            <SectionTitle label="Recent feed" count={group.posts.length} />
            {group.posts.length ? (
              <div className="space-y-3">
                {group.posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-[20px] border border-white/12 bg-white/5 p-4"
                  >
                    <p className="text-base font-semibold text-white">
                      {post.title || "Shared update"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/75">{post.body}</p>
                    <p className="mt-3 text-xs text-white/55">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(post.author.id)}
                        className="cursor-pointer underline decoration-dotted underline-offset-4 hover:text-white"
                      >
                        {post.author.name}
                      </button>{" "}
                      · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMessage>No posts shared yet.</EmptyMessage>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type Props = {
  workspace: SupervisorWorkspaceData | null;
  viewerIdentifier: string;
};

function MemberChip({
  name,
  username,
  onClick,
}: {
  name: string;
  username: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="View profile"
      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-teal-300/55 hover:bg-teal-400/20"
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/30 text-teal-50"
      >
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{name}</span>
      <span className="text-[10px] opacity-50">@{username}</span>
    </button>
  );
}

export function SupervisorWorkspaceGroupsView({ workspace, viewerIdentifier }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [profileTargetId, setProfileTargetId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const groups = workspace?.groupDirectory ?? [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const semesters = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => set.add(g.semesterLabel));
    return Array.from(set).sort();
  }, [groups]);

  const needle = searchTerm.trim().toLowerCase();
  const filtered = groups.filter((group) => {
    if (semesterFilter !== "all" && group.semesterLabel !== semesterFilter) return false;
    if (!needle) return true;
    if (group.name.toLowerCase().includes(needle)) return true;
    if (group.semesterLabel.toLowerCase().includes(needle)) return true;
    if (group.description?.toLowerCase().includes(needle)) return true;
    return group.members.some(
      (m) =>
        m.doctor.name.toLowerCase().includes(needle) ||
        m.doctor.username.toLowerCase().includes(needle),
    );
  });

  return (
    <div className="denty-panel-strong p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="denty-kicker">Cohorts</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            Groups & partner pairs
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Browse the cohort directory. Search across group names, semesters, and member names — click any member to open their profile.
          </p>
        </div>
        <span className="denty-pill">
          {filtered.length}
          {filtered.length !== groups.length ? ` / ${groups.length}` : ""}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups by name, semester, or member"
            className="denty-field w-full pl-10 text-sm"
          />
        </div>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="denty-field cursor-pointer text-sm sm:min-w-[180px]"
        >
          <option value="all">All semesters</option>
          {semesters.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 max-h-[72vh] space-y-3 overflow-y-auto pr-1">
        {filtered.length ? (
          filtered.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className="denty-dashboard-card group relative w-full overflow-hidden p-5 text-left transition hover:border-white/20 hover:bg-white/5"
            >
              <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-teal-300/70" />
              <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {group.semesterLabel}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {group.name}
                  </p>
                  {group.description ? (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                      {group.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className="denty-pill">{group.members.length} students</span>
                  <span className="denty-pill">{group.partnerPairs?.length ?? 0} pairs</span>
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[var(--foreground)] transition group-hover:translate-x-0.5 group-hover:bg-white/15"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 4L13 10L7 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No groups match your filter.</p>
        )}
      </div>

      <GroupDetailPopup
        group={selectedGroup}
        onClose={() => setSelectedGroupId(null)}
        onOpenProfile={(id) => setProfileTargetId(id)}
      />

      <ProfilePopup
        targetId={profileTargetId}
        viewerIdentifier={viewerIdentifier}
        onClose={() => setProfileTargetId(null)}
      />
    </div>
  );
}
