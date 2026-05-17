"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import {
  getPublicProfile,
  reportProfile,
} from "@/features/profiles/services/profile-api";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type CurrentViewer = {
  id?: string;
  username?: string;
  email?: string | null;
  phone?: string | null;
};

const mainPanel =
  "overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] shadow-[0_32px_84px_rgba(7,18,34,0.18)] backdrop-blur-[26px]";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const targetId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [viewer, setViewer] = useState<CurrentViewer | null>(null);
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Profile",
    errorTitle: "Profile",
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("currentUser");
    if (!raw) {
      setViewer(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setViewer(parsed);
    } catch {
      setViewer(null);
    }
  }, []);

  const viewerIdentifier = useMemo(
    () => viewer?.id || viewer?.email || viewer?.phone || viewer?.username || "",
    [viewer],
  );

  useEffect(() => {
    let cancelled = false;
    if (!targetId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicProfile(targetId, viewerIdentifier || undefined);
        if (!cancelled) {
          setProfile(data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [targetId, viewerIdentifier]);

  const handleReport = async () => {
    if (!targetId || !viewerIdentifier) {
      setError("You need to be signed in before reporting a profile.");
      return;
    }
    if (!reportReason.trim()) {
      setError("Add a reason before sending the report.");
      return;
    }
    setReporting(true);
    try {
      const data = await reportProfile(
        targetId,
        viewerIdentifier,
        reportReason.trim(),
        reportNote.trim() || undefined,
      );
      setMessage(data.message || "Report submitted.");
      setReportOpen(false);
      setReportReason("");
      setReportNote("");
    } catch (e: any) {
      setError(e?.message || "Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <main className="denty-screen admin-suite-screen relative px-4 py-5 lg:px-6 lg:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,113,132,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(18,30,47,0.24),transparent_34%)]" />
      </div>

      <div className="denty-shell relative mx-auto max-w-[120rem] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-[18px] border border-white/12 bg-white/24 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/36"
          >
            Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[18px] border border-white/12 bg-white/24 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/36"
          >
            Home
          </Link>
        </div>

        {loading ? (
          <div className={mainPanel}>
            <div className="px-8 py-12">
              <p className="text-sm text-[var(--muted-foreground)]">Loading profile...</p>
            </div>
          </div>
        ) : null}

        {profile ? (
          <>
            <div className={mainPanel}>
              <div className="border-b border-white/12 px-7 py-7 md:px-9 md:py-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/18 bg-[linear-gradient(180deg,rgba(8,18,34,0.78),rgba(11,24,42,0.58))] text-4xl font-bold text-white shadow-[0_18px_34px_rgba(4,11,26,0.22)]">
                      {profile.profile.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.profile.avatar}
                          alt={profile.profile.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profile.profile.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <BrandMark className="h-12 w-12" />
                        <span className="rounded-full border border-white/16 bg-white/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.62)]">
                          {profile.profile.role.toLowerCase()} profile
                        </span>
                      </div>
                      <div>
                        <h1 className="text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                          {profile.profile.name}
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                          @{profile.profile.username}
                          {profile.profile.doctorIdNumber
                            ? ` | Student ID ${profile.profile.doctorIdNumber}`
                            : ""}
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                          {profile.profile.bio?.trim()
                            ? profile.profile.bio
                            : "No personal description has been added yet."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {profile.profile.canReport ? (
                      <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-rose-300/34 bg-[rgba(190,24,93,0.16)] px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-[rgba(190,24,93,0.22)]"
                      >
                        Report profile
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-7 py-7 md:px-9 md:py-8 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="denty-dashboard-card-soft p-5">
                      <p className="denty-kicker">Role</p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {profile.profile.role}
                      </p>
                    </div>
                    {profile.profile.semester ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">Semester</p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                          {profile.profile.semester.label}
                        </p>
                      </div>
                    ) : null}
                    {profile.profile.groupMembership ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">Group</p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                          {profile.profile.groupMembership.name}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          {profile.profile.groupMembership.semesterLabel}
                        </p>
                      </div>
                    ) : null}
                    {profile.profile.partner ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">Partner</p>
                        <Link
                          href={`/profiles/${profile.profile.partner.id}`}
                          className="mt-3 inline-block text-2xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                        >
                          {profile.profile.partner.name}
                        </Link>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          @{profile.profile.partner.username}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {profile.profile.clinicsWorked?.length ? (
                    <div className="denty-dashboard-card-soft p-5">
                      <p className="denty-kicker">Clinics</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.profile.clinicsWorked.map((clinic) => (
                          <span key={clinic.id} className="denty-pill">
                            {clinic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="denty-dashboard-card-soft p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="denty-kicker">Comments</p>
                      <span className="denty-pill">
                        {profile.comments.patient.length +
                          profile.comments.supervisor.length +
                          profile.comments.staff.length}{" "}
                        notes
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[...profile.comments.patient, ...profile.comments.supervisor, ...profile.comments.staff]
                        .slice(0, 8)
                        .map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-[var(--foreground)]">
                                {comment.rater.name}
                              </p>
                              <span className="rounded-full border border-amber-300/34 bg-amber-50/70 px-3 py-1 text-xs font-semibold text-amber-700">
                                {comment.stars.toFixed(1)} stars
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                              {comment.comment}
                            </p>
                          </div>
                        ))}

                      {profile.comments.patient.length +
                        profile.comments.supervisor.length +
                        profile.comments.staff.length ===
                      0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          No comments yet.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">Patient avg</p>
                      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                        {profile.stats.patientRatingAverage?.toFixed(1) || "-"}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">Supervisor avg</p>
                      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                        {profile.stats.supervisorRatingAverage?.toFixed(1) || "-"}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">Completed</p>
                      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                        {profile.stats.completedCases}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">Assisted</p>
                      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                        {profile.stats.assistedCases}
                      </p>
                    </div>
                  </div>

                  {profile.stats.leaderboard ? (
                    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
                        Academic ranking
                      </p>
                      <p className="mt-3 text-4xl font-semibold text-white">
                        #{profile.stats.leaderboard.rank}
                      </p>
                      <p className="mt-2 text-sm text-white/72">
                        {profile.stats.leaderboard.points.toFixed(1)} overall points in
                        the full academic leaderboard.
                      </p>
                      {profile.stats.leaderboard.semester ? (
                        <p className="mt-2 text-sm text-white/60">
                          {profile.stats.leaderboard.semester.label}: #
                          {profile.stats.leaderboard.semesterRank ?? "-"} with{" "}
                          {profile.stats.leaderboard.semesterPoints?.toFixed(1) ?? "0.0"} points
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="denty-dashboard-card-soft p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="denty-kicker">Work history</p>
                      <span className="denty-pill">
                        {profile.history.completedReports.length +
                          profile.history.assistedReports.length +
                          profile.history.recentReviews.length +
                          profile.history.patientAppointments.length}{" "}
                        records
                      </span>
                    </div>
                    <div className="mt-4 space-y-5">
                      {profile.history.completedReports.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            Completed cases
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.completedReports.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title || entry.title || "Completed case"}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  {entry.clinicCase?.clinic?.name || "Clinic"} |{" "}
                                  {entry.reviewedAt
                                    ? new Date(entry.reviewedAt).toLocaleDateString()
                                    : "Reviewed"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.assistedReports.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            Assisted work
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.assistedReports.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title || entry.title || "Assisted case"}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  Assisted with{" "}
                                  {entry.doctor?.id ? (
                                    <Link
                                      href={`/profiles/${entry.doctor.id}`}
                                      className="hover:text-[var(--foreground)]"
                                    >
                                      {entry.doctor.name}
                                    </Link>
                                  ) : (
                                    entry.doctor?.name || "another student"
                                  )}{" "}
                                  in {entry.clinicCase?.clinic?.name || "Clinic"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.recentReviews.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            Recent faculty reviews
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.recentReviews.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title || entry.title || "Reviewed report"}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  Status: {entry.status} |{" "}
                                  {entry.doctor?.id ? (
                                    <Link
                                      href={`/profiles/${entry.doctor.id}`}
                                      className="hover:text-[var(--foreground)]"
                                    >
                                      {entry.doctor.name}
                                    </Link>
                                  ) : (
                                    "Doctor"
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.patientAppointments.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            Visit history
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.patientAppointments.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title || "Clinic appointment"}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  {entry.doctor?.id ? (
                                    <Link
                                      href={`/profiles/${entry.doctor.id}`}
                                      className="hover:text-[var(--foreground)]"
                                    >
                                      {entry.doctor.name}
                                    </Link>
                                  ) : (
                                    "Doctor"
                                  )}{" "}
                                  | {entry.clinicCase?.clinic?.name || "Clinic"} | {entry.status}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.completedReports.length === 0 &&
                      profile.history.assistedReports.length === 0 &&
                      profile.history.recentReviews.length === 0 &&
                      profile.history.patientAppointments.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          No visible history yet.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reportOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,10,18,0.62)] px-4 backdrop-blur-[10px]">
                <div className="w-full max-w-xl rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(249,252,255,0.94),rgba(228,236,242,0.88))] p-6 shadow-[0_32px_80px_rgba(7,18,34,0.24)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="denty-kicker">Safety</p>
                      <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        Report profile
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReportOpen(false)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/36 text-xl font-semibold text-[var(--foreground)]"
                    >
                      x
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Reason"
                      className="denty-field text-sm"
                    />
                    <textarea
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      placeholder="Add a note for staff"
                      className="denty-field min-h-[160px] text-sm"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setReportOpen(false)}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-white/12 bg-white/34 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/46"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={reporting}
                        onClick={handleReport}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-rose-300/34 bg-[rgba(190,24,93,0.16)] px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-[rgba(190,24,93,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reporting ? "Sending..." : "Send report"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : !loading ? (
          <div className={mainPanel}>
            <div className="px-8 py-12">
              <p className="text-sm text-[var(--muted-foreground)]">
                Profile could not be loaded.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
