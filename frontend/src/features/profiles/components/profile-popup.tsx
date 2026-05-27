"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getPublicProfile } from "@/features/profiles/services/profile-api";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type Props = {
  targetId: string | null;
  viewerIdentifier: string;
  onClose: () => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-[8px]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

export function ProfilePopup({ targetId, viewerIdentifier, onClose }: Props) {
  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) return;
    let aborted = false;
    setLoading(true);
    setError(null);
    setData(null);
    getPublicProfile(targetId, viewerIdentifier)
      .then((res) => {
        if (!aborted) setData(res);
      })
      .catch((e: unknown) => {
        if (!aborted) setError((e as { message?: string })?.message || "Failed to load profile");
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [targetId, viewerIdentifier]);

  useEffect(() => {
    if (!targetId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [targetId, onClose]);

  if (!targetId) return null;
  if (typeof document === "undefined") return null;

  const profile = data?.profile;
  const stats = data?.stats;

  return createPortal(
    <div
      className="denty-backdrop-enter fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(4,11,24,0.62)] px-3 py-6 backdrop-blur-[12px]"
      onClick={onClose}
    >
      <div
        className="denty-modal-enter relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/12 bg-[rgba(8,30,38,0.94)] text-white shadow-[0_40px_140px_rgba(0,30,40,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-24 overflow-visible bg-[linear-gradient(120deg,rgba(15,118,110,0.95),rgba(8,145,178,0.82))]">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Avatar pinned to the bottom-left of the header band, half over,
              half on the dark body — so the body text below starts cleanly. */}
          <div className="absolute -bottom-10 left-6 z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border-4 border-[rgba(8,30,38,0.94)] bg-[linear-gradient(135deg,rgba(15,118,110,0.95),rgba(8,145,178,0.82))] text-xl font-bold text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:left-8">
            {profile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.name || "avatar"}
                className="h-full w-full object-cover"
              />
            ) : profile ? (
              initials(profile.name)
            ) : (
              "…"
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pl-32 pt-4 sm:px-8 sm:pb-8 sm:pl-36">
          <div className="min-w-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                {profile?.role ?? "Profile"}
              </p>
              <h2 className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">
                {profile?.name ?? (loading ? "Loading…" : error ?? "Profile")}
              </h2>
              <p className="mt-1 truncate text-sm text-white/65">
                @{profile?.username ?? "—"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="h-20 rounded-[18px] bg-white/5" />
              <div className="h-20 rounded-[18px] bg-white/5" />
              <div className="h-20 rounded-[18px] bg-white/5" />
            </div>
          ) : error ? (
            <p className="mt-5 rounded-[14px] border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : profile ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatTile
                  label="Completed cases"
                  value={String(stats?.completedCases ?? 0)}
                />
                <StatTile
                  label="Patient rating"
                  value={
                    stats?.patientRatingAverage
                      ? `${stats.patientRatingAverage.toFixed(1)} / 5`
                      : "—"
                  }
                />
                <StatTile
                  label="Supervisor rating"
                  value={
                    stats?.supervisorRatingAverage
                      ? `${stats.supervisorRatingAverage.toFixed(1)} / 5`
                      : "—"
                  }
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Group
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {profile.groupMembership?.name ?? "—"}
                  </p>
                  <p className="text-xs text-white/55">
                    {profile.groupMembership?.semesterLabel ?? ""}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Contact
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {profile.email ?? "—"}
                  </p>
                  <p className="truncate text-xs text-white/55">
                    {profile.phone ?? "—"}
                  </p>
                </div>
                {profile.doctorIdNumber ? (
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Doctor ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.doctorIdNumber}
                    </p>
                  </div>
                ) : null}
                {profile.partner ? (
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Partner
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {profile.partner.name}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      @{profile.partner.username}
                    </p>
                  </div>
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-5 rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/85">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-6 flex justify-end">
                <Link
                  href={`/profiles/${profile.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
                >
                  Open full profile
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path
                      d="M7 4H16V13M16 4L4 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
