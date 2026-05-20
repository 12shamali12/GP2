"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type SupervisorUser = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
};

type SupervisorProfilePanelProps = {
  user: SupervisorUser;
  editName: string;
  editPhone: string;
  editBio: string;
  avatarData: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showOldPwd: boolean;
  showNewPwd: boolean;
  nameEditable: boolean;
  phoneEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  publicProfile: PublicProfileResponse | null;
  publicProfileLoading: boolean;
  showSave: boolean;
  onAvatarPick: () => void;
  onBack: () => void;
  onNameEditableToggle: () => void;
  onPhoneEditableToggle: () => void;
  onBioEditableToggle: () => void;
  onPasswordEditableToggle: () => void;
  onEditNameChange: (value: string) => void;
  onEditPhoneChange: (value: string) => void;
  onEditBioChange: (value: string) => void;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowOldPasswordToggle: () => void;
  onShowNewPasswordToggle: () => void;
  onSave: () => void | Promise<void>;
};

export function SupervisorProfilePanel({
  user,
  editName,
  editPhone,
  editBio,
  avatarData,
  oldPassword,
  newPassword,
  confirmPassword,
  showOldPwd,
  showNewPwd,
  nameEditable,
  phoneEditable,
  bioEditable,
  pwdEditable,
  publicProfile,
  publicProfileLoading,
  showSave,
  onAvatarPick,
  onBack,
  onNameEditableToggle,
  onPhoneEditableToggle,
  onBioEditableToggle,
  onPasswordEditableToggle,
  onEditNameChange,
  onEditPhoneChange,
  onEditBioChange,
  onOldPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowOldPasswordToggle,
  onShowNewPasswordToggle,
  onSave,
}: SupervisorProfilePanelProps) {
  const t = useTranslation();
  const profile = publicProfile?.profile;
  const stats = publicProfile?.stats;
  const recentReviews = publicProfile?.history.recentReviews || [];

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] shadow-[0_32px_84px_rgba(7,18,34,0.18)] backdrop-blur-[26px]">
      <div className="border-b border-white/12 px-4 py-5 sm:px-5 md:px-7 md:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              onClick={onAvatarPick}
              className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[22px] border border-white/20 bg-[linear-gradient(180deg,rgba(8,18,34,0.78),rgba(11,24,42,0.58))] text-3xl font-bold text-white shadow-[0_18px_34px_rgba(4,11,26,0.22)] transition hover:scale-[1.02] hover:border-white/28 sm:h-28 sm:w-28"
              title={t("supervisor.profile.photo_title")}
            >
              {avatarData || user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarData || user.avatar || ""}
                  alt={t("supervisor.profile.avatar_alt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(user.name || "S").charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute inset-x-3 bottom-3 rounded-full border border-white/12 bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur group-hover:bg-black/40">
                {t("supervisor.profile.update_photo")}
              </span>
            </button>

            <div className="min-w-0 space-y-3">
              <span className="inline-flex rounded-full border border-white/16 bg-white/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.62)]">
                {t("supervisor.profile.tag")}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
                    {editName || user.name || t("supervisor.common.supervisor")}
                  </h1>
                  <button
                    type="button"
                    onClick={onNameEditableToggle}
                    className="denty-action denty-action-secondary px-4 py-2 text-xs"
                  >
                    {nameEditable
                      ? t("supervisor.profile.done")
                      : t("supervisor.profile.edit_name")}
                  </button>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  {t("supervisor.profile.intro")}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="denty-button-secondary shrink-0 px-5 py-3 text-sm font-semibold"
          >
            {t("supervisor.common.back")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-5 sm:px-5 md:px-7 md:py-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">{t("supervisor.profile.role")}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {(user.role || "SUPERVISOR").toString().toUpperCase()}
              </p>
            </div>
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">
                {t("supervisor.profile.reviewed_reports")}
              </p>
              <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {stats?.reviewedReports || 0}
              </p>
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">
                  {t("supervisor.profile.display_name")}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("supervisor.profile.display_name_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onNameEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {nameEditable
                  ? t("supervisor.profile.done")
                  : t("supervisor.profile.edit")}
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              disabled={!nameEditable}
              className="denty-field text-base disabled:cursor-default disabled:opacity-70"
            />
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">{t("supervisor.profile.bio")}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("supervisor.profile.bio_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onBioEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {bioEditable
                  ? t("supervisor.profile.done")
                  : t("supervisor.profile.edit")}
              </button>
            </div>
            {bioEditable ? (
              <textarea
                value={editBio}
                onChange={(e) => onEditBioChange(e.target.value)}
                className="denty-field min-h-[130px] text-base"
                placeholder={t("supervisor.profile.bio_placeholder")}
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-sm leading-7 text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editBio?.trim()
                  ? editBio
                  : t("supervisor.profile.bio_empty")}
              </div>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="denty-dashboard-card-soft space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="denty-kicker">{t("supervisor.profile.email")}</p>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-lg font-semibold text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {user.email || "supervisor@example.com"}
              </div>
            </div>

            <div className="denty-dashboard-card-soft space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="denty-kicker">{t("supervisor.profile.phone")}</p>
                </div>
                <button
                  type="button"
                  onClick={onPhoneEditableToggle}
                  className="denty-action denty-action-secondary px-4 py-2 text-xs"
                >
                  {phoneEditable
                    ? t("supervisor.profile.done")
                    : t("supervisor.profile.edit")}
                </button>
              </div>
              <input
                value={editPhone}
                onChange={(e) => onEditPhoneChange(e.target.value)}
                disabled={!phoneEditable}
                className="denty-field text-base disabled:cursor-default disabled:opacity-70"
              />
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">{t("supervisor.profile.security")}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("supervisor.profile.security_hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={onPasswordEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {pwdEditable
                  ? t("supervisor.profile.done")
                  : t("supervisor.profile.edit")}
              </button>
            </div>
            {pwdEditable ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => onOldPasswordChange(e.target.value)}
                    placeholder={t("supervisor.profile.current_password")}
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowOldPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showOldPwd
                      ? t("supervisor.profile.hide")
                      : t("supervisor.profile.show")}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => onNewPasswordChange(e.target.value)}
                    placeholder={t("supervisor.profile.new_password")}
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowNewPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showNewPwd
                      ? t("supervisor.profile.hide")
                      : t("supervisor.profile.show")}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  placeholder={t("supervisor.profile.rewrite_password")}
                  className="denty-field text-base"
                />
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(148,163,184,0.2)] bg-white/36 px-4 py-5 text-sm leading-7 text-[var(--muted-foreground)]">
                {t("supervisor.profile.password_hidden")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("supervisor.profile.clinics")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {profile?.clinicsWorked?.length || 0}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">
                {t("supervisor.profile.reviews")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {stats?.reviewedReports || 0}
              </p>
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">
                {t("supervisor.profile.working_clinics")}
              </p>
              <span className="denty-pill">
                {t("supervisor.profile.clinics_active", {
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
                  {t("supervisor.profile.no_clinics")}
                </p>
              )}
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">
                {t("supervisor.profile.recent_review_activity")}
              </p>
              <span className="denty-pill">
                {t("supervisor.profile.reports_count", {
                  count: recentReviews.length,
                })}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {recentReviews.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                >
                  <p className="font-semibold text-[var(--foreground)]">
                    {entry.doctor?.name || t("supervisor.profile.doctor_fallback")}{" "}
                    |{" "}
                    {entry.clinicCase?.title ||
                      entry.title ||
                      t("supervisor.profile.reviewed_case_fallback")}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {entry.clinicCase?.clinic?.name ||
                      t("supervisor.profile.clinic_fallback")}{" "}
                    | {entry.status}
                  </p>
                </div>
              ))}

              {!publicProfileLoading && recentReviews.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("supervisor.profile.no_review_history")}
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
            {t("supervisor.profile.save_changes")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
