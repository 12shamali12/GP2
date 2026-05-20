"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
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
    messageTitle: t("profile.toast"),
    errorTitle: t("profile.toast"),
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
          setError(e?.message || t("profile.load_failed"));
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
      setError(t("profile.report.signin_required"));
      return;
    }
    if (!reportReason.trim()) {
      setError(t("profile.report.reason_required"));
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
      setMessage(data.message || t("profile.report.submitted"));
      setReportOpen(false);
      setReportReason("");
      setReportNote("");
    } catch (e: any) {
      setError(e?.message || t("profile.report.failed"));
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
            {t("profile.back")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[18px] border border-white/12 bg-white/24 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/36"
          >
            {t("profile.home")}
          </Link>
        </div>

        {loading ? (
          <div className={mainPanel}>
            <div className="px-6 py-12">
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("profile.loading")}
              </p>
            </div>
          </div>
        ) : null}

        {profile ? (
          <>
            <div className={mainPanel}>
              <div className="border-b border-white/12 px-5 py-5 md:px-7 md:py-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/18 bg-[linear-gradient(180deg,rgba(8,18,34,0.78),rgba(11,24,42,0.58))] text-3xl font-bold text-white shadow-[0_18px_34px_rgba(4,11,26,0.22)] sm:h-28 sm:w-28">
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
                          {t("profile.role_suffix", {
                            role: profile.profile.role.toLowerCase(),
                          })}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-semibold text-[var(--foreground)] wrap-break-word sm:text-3xl">
                          {profile.profile.name}
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] wrap-break-word">
                          @{profile.profile.username}
                          {profile.profile.doctorIdNumber
                            ? ` | ${t("profile.student_id", {
                                value: profile.profile.doctorIdNumber,
                              })}`
                            : ""}
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                          {profile.profile.bio?.trim()
                            ? profile.profile.bio
                            : t("profile.no_bio")}
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
                        {t("profile.report_profile")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-5 md:px-7 md:py-6 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="denty-dashboard-card-soft p-5">
                      <p className="denty-kicker">{t("profile.role")}</p>
                      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                        {profile.profile.role}
                      </p>
                    </div>
                    {profile.profile.semester ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">{t("profile.semester")}</p>
                        <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                          {profile.profile.semester.label}
                        </p>
                      </div>
                    ) : null}
                    {profile.profile.groupMembership ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">{t("profile.group")}</p>
                        <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                          {profile.profile.groupMembership.name}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          {profile.profile.groupMembership.semesterLabel}
                        </p>
                      </div>
                    ) : null}
                    {profile.profile.partner ? (
                      <div className="denty-dashboard-card-soft p-5">
                        <p className="denty-kicker">{t("profile.partner")}</p>
                        <Link
                          href={`/profiles/${profile.profile.partner.id}`}
                          className="mt-3 inline-block text-xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
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
                      <p className="denty-kicker">{t("profile.clinics")}</p>
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
                      <p className="denty-kicker">{t("profile.comments")}</p>
                      <span className="denty-pill">
                        {t("profile.notes_count", {
                          count:
                            profile.comments.patient.length +
                            profile.comments.supervisor.length +
                            profile.comments.staff.length,
                        })}
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
                                {t("profile.stars", {
                                  value: comment.stars.toFixed(1),
                                })}
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
                          {t("profile.no_comments")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">
                        {t("profile.patient_avg")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {profile.stats.patientRatingAverage?.toFixed(1) || "-"}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">
                        {t("profile.supervisor_avg")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {profile.stats.supervisorRatingAverage?.toFixed(1) || "-"}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">
                        {t("profile.completed")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {profile.stats.completedCases}
                      </p>
                    </div>
                    <div className="denty-stat-card p-5">
                      <p className="denty-kicker !tracking-[0.18em]">
                        {t("profile.assisted")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {profile.stats.assistedCases}
                      </p>
                    </div>
                  </div>

                  {profile.stats.leaderboard ? (
                    <div className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
                        {t("profile.academic_ranking")}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        #{profile.stats.leaderboard.rank}
                      </p>
                      <p className="mt-2 text-sm text-white/72">
                        {t("profile.overall_points", {
                          points: profile.stats.leaderboard.points.toFixed(1),
                        })}
                      </p>
                      {profile.stats.leaderboard.semester ? (
                        <p className="mt-2 text-sm text-white/60">
                          {t("profile.semester_rank", {
                            label: profile.stats.leaderboard.semester.label,
                            rank: profile.stats.leaderboard.semesterRank ?? "-",
                            points:
                              profile.stats.leaderboard.semesterPoints?.toFixed(1) ??
                              "0.0",
                          })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="denty-dashboard-card-soft p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="denty-kicker">{t("profile.work_history")}</p>
                      <span className="denty-pill">
                        {t("profile.records_count", {
                          count:
                            profile.history.completedReports.length +
                            profile.history.assistedReports.length +
                            profile.history.recentReviews.length +
                            profile.history.patientAppointments.length,
                        })}
                      </span>
                    </div>
                    <div className="mt-4 space-y-5">
                      {profile.history.completedReports.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            {t("profile.completed_cases")}
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.completedReports.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title ||
                                    entry.title ||
                                    t("profile.completed_case_fallback")}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  {entry.clinicCase?.clinic?.name ||
                                    t("profile.clinic_fallback")}{" "}
                                  |{" "}
                                  {entry.reviewedAt
                                    ? new Date(entry.reviewedAt).toLocaleDateString()
                                    : t("profile.reviewed_fallback")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.assistedReports.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            {t("profile.assisted_work")}
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.assistedReports.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title ||
                                    entry.title ||
                                    t("profile.assisted_case_fallback")}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  {t("profile.assisted_with")}{" "}
                                  {entry.doctor?.id ? (
                                    <Link
                                      href={`/profiles/${entry.doctor.id}`}
                                      className="hover:text-[var(--foreground)]"
                                    >
                                      {entry.doctor.name}
                                    </Link>
                                  ) : (
                                    entry.doctor?.name || t("profile.another_student")
                                  )}{" "}
                                  {t("profile.in_clinic", {
                                    clinic:
                                      entry.clinicCase?.clinic?.name ||
                                      t("profile.clinic_fallback"),
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {profile.history.recentReviews.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.48)]">
                            {t("profile.recent_reviews")}
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.recentReviews.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title ||
                                    entry.title ||
                                    t("profile.reviewed_report_fallback")}
                                </p>
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                  {t("profile.status_label", {
                                    value: entry.status,
                                  })}{" "}
                                  |{" "}
                                  {entry.doctor?.id ? (
                                    <Link
                                      href={`/profiles/${entry.doctor.id}`}
                                      className="hover:text-[var(--foreground)]"
                                    >
                                      {entry.doctor.name}
                                    </Link>
                                  ) : (
                                    t("profile.doctor_fallback")
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
                            {t("profile.visit_history")}
                          </p>
                          <div className="mt-3 space-y-3">
                            {profile.history.patientAppointments.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                              >
                                <p className="font-semibold text-[var(--foreground)]">
                                  {entry.clinicCase?.title ||
                                    t("profile.appointment_fallback")}
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
                                    t("profile.doctor_fallback")
                                  )}{" "}
                                  |{" "}
                                  {entry.clinicCase?.clinic?.name ||
                                    t("profile.clinic_fallback")}{" "}
                                  | {entry.status}
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
                          {t("profile.no_history")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reportOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,10,18,0.62)] px-4 py-6 backdrop-blur-[10px]">
                <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[22px] border border-white/14 bg-[linear-gradient(180deg,rgba(249,252,255,0.94),rgba(228,236,242,0.88))] p-5 shadow-[0_32px_80px_rgba(7,18,34,0.24)] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="denty-kicker">{t("profile.report.safety")}</p>
                      <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                        {t("profile.report.title")}
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
                      placeholder={t("profile.report.reason_placeholder")}
                      className="denty-field text-sm"
                    />
                    <textarea
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      placeholder={t("profile.report.note_placeholder")}
                      className="denty-field min-h-[160px] text-sm"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setReportOpen(false)}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-white/12 bg-white/34 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/46"
                      >
                        {t("profile.report.cancel")}
                      </button>
                      <button
                        type="button"
                        disabled={reporting}
                        onClick={handleReport}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[18px] border border-rose-300/34 bg-[rgba(190,24,93,0.16)] px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-[rgba(190,24,93,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reporting
                          ? t("profile.report.sending")
                          : t("profile.report.send")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : !loading ? (
          <div className={mainPanel}>
            <div className="px-6 py-12">
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("profile.could_not_load")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
