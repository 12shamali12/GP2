"use client";

import Link from "next/link";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

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
  const summary = publicProfile?.stats;
  const profile = publicProfile?.profile;
  const history = publicProfile?.history;
  const comments = publicProfile?.comments;

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] shadow-[0_32px_84px_rgba(7,18,34,0.18)] backdrop-blur-[26px]">
      <div className="border-b border-white/12 px-7 py-7 md:px-9 md:py-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onAvatarPick}
              className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-[linear-gradient(180deg,rgba(8,18,34,0.78),rgba(11,24,42,0.58))] text-4xl font-bold text-white shadow-[0_18px_34px_rgba(4,11,26,0.22)] transition hover:scale-[1.02] hover:border-white/28"
              title="Click to add or update photo"
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
                Update photo
              </span>
            </button>

            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/16 bg-white/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.62)]">
                  Student portfolio
                </span>
                <span className="rounded-full border border-white/12 bg-[rgba(9,20,38,0.08)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                  {doctorEmoji} Doctor
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                    {editName || user.name || "Doctor"}
                  </h1>
                  <button
                    type="button"
                    onClick={onHeaderEditOpen}
                    className="denty-action denty-action-secondary px-4 py-2 text-xs"
                  >
                    Edit name
                  </button>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  Build a professional student portfolio with live clinic work,
                  patient and supervisor ratings, assisted cases, and semester-linked
                  progress.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="denty-button-secondary shrink-0 px-5 py-3 text-sm font-semibold"
          >
            Back
          </button>
        </div>
      </div>

      {headerEditing ? (
        <div className="border-b border-white/12 bg-white/18 px-7 py-5 md:px-9">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
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
              Cancel
            </button>
            <button
              type="button"
              onClick={onHeaderNameSave}
              className="denty-button-primary px-5 py-3 text-sm"
            >
              Save name
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 px-7 py-7 md:px-9 md:py-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">Role</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {(user.role || "DOCTOR").toString().toUpperCase()}
              </p>
            </div>
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">Student ID</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {doctorIdNumber || "Not set"}
              </p>
            </div>
            {profile?.semester ? (
              <div className="denty-dashboard-card-soft p-5">
                <p className="denty-kicker">Semester</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                  {profile.semester.label}
                </p>
              </div>
            ) : null}
            {profile?.groupMembership ? (
              <div className="denty-dashboard-card-soft p-5">
                <p className="denty-kicker">Group</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                  {profile.groupMembership.name}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {profile.groupMembership.semesterLabel}
                </p>
              </div>
            ) : null}
            {profile?.partner ? (
              <div className="denty-dashboard-card-soft p-5 md:col-span-2">
                <p className="denty-kicker">Partner</p>
                <Link
                  href={`/profiles/${profile.partner.id}`}
                  className="mt-3 inline-block text-2xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]"
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
                <p className="denty-kicker">Bio</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Add a short professional introduction and clinical focus.
                </p>
              </div>
              <button
                type="button"
                onClick={onBioEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {bioEditable ? "Done" : "Edit"}
              </button>
            </div>

            {bioEditable ? (
              <textarea
                value={editBio}
                onChange={(e) => onBioChange(e.target.value)}
                className="denty-field min-h-[130px] text-base"
                placeholder="Write a short introduction about your training, interests, and clinic focus."
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-sm leading-7 text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editBio?.trim()
                  ? editBio
                  : "No professional description has been added yet."}
              </div>
            )}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Phone</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Keep your contact line current for patient communication.
                </p>
              </div>
              <button
                type="button"
                onClick={onPhoneEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {phoneEditable ? "Done" : "Edit"}
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
                <p className="denty-kicker">Security</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Change your password without leaving the portfolio.
                </p>
              </div>
              <button
                type="button"
                onClick={onPasswordEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {pwdEditable ? "Done" : "Edit"}
              </button>
            </div>

            {pwdEditable ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => onOldPasswordChange(e.target.value)}
                    placeholder="Current password"
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowOldPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showOldPwd ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => onNewPasswordChange(e.target.value)}
                    placeholder="New password"
                    className="denty-field pr-20 text-base"
                  />
                  <button
                    type="button"
                    onClick={onShowNewPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                  >
                    {showNewPwd ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  placeholder="Rewrite new password"
                  className="denty-field text-base"
                />
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(148,163,184,0.2)] bg-white/36 px-4 py-5 text-sm leading-7 text-[var(--muted-foreground)]">
                Password fields stay hidden until you choose to edit them.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Patient avg</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {summary?.patientRatingAverage?.toFixed(1) || "-"}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Supervisor avg</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {summary?.supervisorRatingAverage?.toFixed(1) || "-"}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {summary?.completedCases || 0}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Assisted</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {summary?.assistedCases || 0}
              </p>
            </div>
          </div>

          {summary?.leaderboard ? (
            <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_52px_rgba(6,17,34,0.22)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
                Academic ranking
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">
                #{summary.leaderboard.rank}
              </p>
              <p className="mt-2 text-sm text-white/72">
                {summary.leaderboard.points.toFixed(1)} overall points across the
                full program ranking.
              </p>
              {summary.leaderboard.semester ? (
                <p className="mt-2 text-sm text-white/60">
                  {summary.leaderboard.semester.label}: #
                  {summary.leaderboard.semesterRank ?? "-"} with{" "}
                  {summary.leaderboard.semesterPoints?.toFixed(1) ?? "0.0"} points
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">Clinics worked</p>
              <span className="denty-pill">
                {profile?.clinicsWorked?.length || 0} clinics
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
                  No reviewed clinic work yet.
                </p>
              )}
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">Recent comments</p>
              <span className="denty-pill">
                {(comments?.patient.length || 0) + (comments?.supervisor.length || 0)} notes
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
                        {comment.stars.toFixed(1)} stars
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
                  No rating comments yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="denty-dashboard-card-soft p-5">
            <p className="denty-kicker">Portfolio history</p>
            <div className="mt-4 space-y-3">
              {history?.completedReports.slice(0, 8).map((entry) => (
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

              {!publicProfileLoading && !history?.completedReports.length ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No completed portfolio history yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showSave ? (
        <div className="border-t border-white/12 px-7 py-5 md:px-9">
          <button
            onClick={onSave}
            className="denty-button-primary px-6 py-3 text-sm font-semibold"
          >
            Save changes
          </button>
        </div>
      ) : null}
    </div>
  );
}
