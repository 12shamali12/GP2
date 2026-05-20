"use client";

import Link from "next/link";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";
import { useTranslation } from "@/features/i18n/language-provider";

type DoctorProfilePanelProps = {
  user: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    avatar?: string | null;
  };
  doctorIdNumber?: string | null;
  avatarData: string;
  editName: string;
  editPhone: string;
  editBio: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showOldPwd: boolean;
  showNewPwd: boolean;
  nameEditable: boolean;
  phoneEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  headerEditing: boolean;
  headerNameInput: string;
  doctorEmoji: string;
  showSave: boolean;
  publicProfile: PublicProfileResponse | null;
  publicProfileLoading: boolean;
  onAvatarPick: () => void;
  onHeaderEditOpen: () => void;
  onHeaderEditingChange: (next: boolean) => void;
  onHeaderNameInputChange: (value: string) => void;
  onHeaderNameSave: () => void;
  onPhoneEditableToggle: () => void;
  onPhoneChange: (value: string) => void;
  onBioEditableToggle: () => void;
  onBioChange: (value: string) => void;
  onPasswordEditableToggle: () => void;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowOldPasswordToggle: () => void;
  onShowNewPasswordToggle: () => void;
  onBack: () => void;
  onSave: () => void | Promise<void>;
};

export function DoctorProfilePanel({
  user,
  doctorIdNumber,
  avatarData,
  editName,
  editPhone,
  editBio,
  oldPassword,
  newPassword,
  confirmPassword,
  showOldPwd,
  showNewPwd,
  phoneEditable,
  bioEditable,
  pwdEditable,
  headerEditing,
  headerNameInput,
  doctorEmoji,
  showSave,
  publicProfile,
  publicProfileLoading,
  onAvatarPick,
  onHeaderEditOpen,
  onHeaderEditingChange,
  onHeaderNameInputChange,
  onHeaderNameSave,
  onPhoneEditableToggle,
  onPhoneChange,
  onBioEditableToggle,
  onBioChange,
  onPasswordEditableToggle,
  onOldPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowOldPasswordToggle,
  onShowNewPasswordToggle,
  onBack,
  onSave,
}: DoctorProfilePanelProps) {
  const t = useTranslation();
  const summary = publicProfile?.stats;
  const profile = publicProfile?.profile;
  const history = publicProfile?.history;
  const comments = publicProfile?.comments;

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] shadow-[0_32px_84px_rgba(7,18,34,0.18)] backdrop-blur-[26px]">
      <div className="border-b border-white/12 px-4 py-5 sm:px-5 md:px-7 md:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              onClick={onAvatarPick}
              className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[22px] border border-white/20 bg-[linear-gradient(180deg,rgba(8,18,34,0.78),rgba(11,24,42,0.58))] text-3xl font-bold text-white shadow-[0_18px_34px_rgba(4,11,26,0.22)] transition hover:scale-[1.02] hover:border-white/28 sm:h-28 sm:w-28"
              title={t("doctor.profile.photo_title")}
            >
              {avatarData || user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarData || user.avatar || ""}
                  alt="Doctor avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(user.name || "D").charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute inset-x-3 bottom-3 rounded-full border border-white/12 bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur group-hover:bg-black/40">
                {t("doctor.profile.update_photo")}
              </span>
            </button>

            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/16 bg-white/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.62)]">
                  {t("doctor.profile.student_portfolio")}
                </span>
                <span className="rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                  {doctorEmoji} {t("doctor.profile.role_doctor")}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
                    {editName || user.name || t("doctor.common.doctor")}
                  </h1>
                  <button
                    type="button"
                    onClick={onHeaderEditOpen}
                    className="denty-action denty-action-secondary px-4 py-2 text-xs"
                  >
                    {t("doctor.profile.edit_name")}
                  </button>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  {t("doctor.profile.intro")}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="denty-button-secondary shrink-0 px-5 py-3 text-sm font-semibold"
          >
            {t("doctor.common.back")}
          </button>
        </div>
      </div>

      {headerEditing ? (
        <div className="border-b border-white/12 bg-white/18 px-4 py-5 sm:px-5 md:px-7">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <input
              value={headerNameInput}
              onChange={(e) => onHeaderNameInputChange(e.target.value)}
              className="denty-field text-base"
              autoFocus
            />
            <button
              type="button"
              onClick={() => onHeaderEditingChange(false)}
              className="denty-action denty-action-secondary px-4 py-3 text-sm"
            >
              {t("doctor.common.cancel")}
            </button>
            <button
              type="button"
              onClick={onHeaderNameSave}
              className="denty-button-primary px-5 py-3 text-sm"
            >
              {t("doctor.profile.save_name")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 px-4 py-5 sm:px-5 md:px-7 md:py-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">{t("doctor.profile.role")}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {(user.role || "DOCTOR").toString().toUpperCase()}
              </p>
            </div>
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">{t("doctor.profile.student_id")}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {doctorIdNumber || t("common.not_set")}
              </p>
            </div>
            {profile?.semester ? (
              <div className="denty-dashboard-card-soft p-5">
                <p className="denty-kicker">{t("doctor.profile.semester")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {profile.semester.label}
                </p>
              </div>
            ) : null}
            {profile?.groupMembership ? (
              <div className="denty-dashboard-card-soft p-5">
                <p className="denty-kicker">{t("doctor.profile.group")}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  {profile.groupMembership.name}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {profile.groupMembership.semesterLabel}
                </p>
              </div>
            ) : null}
            {profile?.partner ? (
              <div className="denty-dashboard-card-soft p-5 md:col-span-2">
                <p className="denty-kicker">{t("doctor.profile.partner")}</p>
                <Link
                  href={`/profiles/${profile.partner.id}`}
                  className="mt-3 inline-block text-xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
                >
                  {profile.partner.name}
                </Link>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  @{profile.partner.username}
                </p>
              </div>
            ) : null}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">{t("doctor.profile.bio")}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.bio_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onBioEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {bioEditable
                  ? t("doctor.profile.done")
                  : t("doctor.profile.edit")}
              </button>
            </div>

            {bioEditable ? (
              <textarea
                value={editBio}
                onChange={(e) => onBioChange(e.target.value)}
                className="denty-field min-h-[130px] text-base"
                placeholder={t("doctor.profile.bio_placeholder")}
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-sm leading-7 text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editBio?.trim()
                  ? editBio
                  : t("doctor.profile.bio_empty")}
              </div>
            )}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">{t("doctor.profile.phone")}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.phone_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onPhoneEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {phoneEditable
                  ? t("doctor.profile.done")
                  : t("doctor.profile.edit")}
              </button>
            </div>
            {phoneEditable ? (
              <input
                value={editPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="denty-field text-base"
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-lg font-semibold text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editPhone || user.phone || "-"}
              </div>
            )}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">{t("doctor.profile.security")}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.security_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onPasswordEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {pwdEditable
                  ? t("doctor.profile.done")
                  : t("doctor.profile.edit")}
              </button>
            </div>

            {pwdEditable ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => onOldPasswordChange(e.target.value)}
                    placeholder={t("doctor.profile.current_password")}
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowOldPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showOldPwd
                      ? t("doctor.profile.hide")
                      : t("doctor.profile.show")}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => onNewPasswordChange(e.target.value)}
                    placeholder={t("doctor.profile.new_password")}
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowNewPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showNewPwd
                      ? t("doctor.profile.hide")
                      : t("doctor.profile.show")}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  placeholder={t("doctor.profile.rewrite_password")}
                  className="denty-field text-base"
                />
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(148,163,184,0.2)] bg-white/36 px-4 py-5 text-sm leading-7 text-[var(--muted-foreground)]">
                {t("doctor.profile.password_hidden")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("doctor.profile.patient_avg")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {summary?.patientRatingAverage?.toFixed(1) || "-"}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("doctor.profile.supervisor_avg")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {summary?.supervisorRatingAverage?.toFixed(1) || "-"}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("doctor.profile.completed")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {summary?.completedCases || 0}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("doctor.profile.assisted")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {summary?.assistedCases || 0}
              </p>
            </div>
          </div>

          {summary?.leaderboard ? (
            <div className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
                {t("doctor.profile.academic_ranking")}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                #{summary.leaderboard.rank}
              </p>
              <p className="mt-2 text-sm text-white/72">
                {t("doctor.profile.overall_points", {
                  points: summary.leaderboard.points.toFixed(1),
                })}
              </p>
              {summary.leaderboard.semester ? (
                <p className="mt-2 text-sm text-white/60">
                  {t("doctor.profile.semester_rank", {
                    label: summary.leaderboard.semester.label,
                    rank: summary.leaderboard.semesterRank ?? "-",
                    points:
                      summary.leaderboard.semesterPoints?.toFixed(1) ?? "0.0",
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">{t("doctor.profile.clinics_worked")}</p>
              <span className="denty-pill">
                {t("doctor.profile.clinics_count", {
                  count: profile?.clinicsWorked?.length || 0,
                })}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile?.clinicsWorked?.length ? (
                profile.clinicsWorked.map((clinic) => (
                  <span key={clinic.id} className="denty-pill">
                    {clinic.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.no_clinics")}
                </p>
              )}
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">{t("doctor.profile.recent_comments")}</p>
              <span className="denty-pill">
                {t("doctor.profile.notes_count", {
                  count:
                    (comments?.patient.length || 0) +
                    (comments?.supervisor.length || 0),
                })}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[...(comments?.patient || []), ...(comments?.supervisor || [])]
                .slice(0, 6)
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
                        {t("doctor.profile.stars", {
                          value: comment.stars.toFixed(1),
                        })}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {comment.comment}
                    </p>
                  </div>
                ))}

              {!publicProfileLoading &&
              (comments?.patient.length || 0) + (comments?.supervisor.length || 0) === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.no_comments")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <p className="denty-kicker">{t("doctor.profile.portfolio_history")}</p>
            <div className="mt-4 space-y-3">
              {history?.completedReports.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                >
                  <p className="font-semibold text-[var(--foreground)]">
                    {entry.clinicCase?.title ||
                      entry.title ||
                      t("doctor.profile.completed_case")}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {entry.clinicCase?.clinic?.name || t("doctor.profile.clinic")}{" "}
                    |{" "}
                    {entry.reviewedAt
                      ? new Date(entry.reviewedAt).toLocaleDateString()
                      : t("doctor.profile.reviewed")}
                  </p>
                </div>
              ))}

              {!publicProfileLoading && !history?.completedReports.length ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("doctor.profile.no_history")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showSave ? (
        <div className="border-t border-white/12 px-4 py-5 sm:px-5 md:px-7">
          <button
            onClick={onSave}
            className="denty-button-primary w-full px-6 py-3 text-sm font-semibold sm:w-auto"
          >
            {t("doctor.profile.save_changes")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
