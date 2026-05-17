"use client";

import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type PatientUser = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
};

type PatientProfilePanelProps = {
  user: PatientUser;
  avatarData: string;
  editName: string;
  editPhone: string;
  editEmail: string;
  editBio: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showOldPwd: boolean;
  showNewPwd: boolean;
  nameEditable: boolean;
  phoneEditable: boolean;
  emailEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  history: any[];
  publicProfile: PublicProfileResponse | null;
  publicProfileLoading: boolean;
  showSave: boolean;
  onAvatarPick: () => void;
  onNameEditOpen: () => void;
  onEmailEditableToggle: () => void;
  onPhoneEditableToggle: () => void;
  onBioEditableToggle: () => void;
  onPasswordEditableToggle: () => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowOldPasswordToggle: () => void;
  onShowNewPasswordToggle: () => void;
  onBack: () => void;
  onSave: () => void | Promise<void>;
};

export function PatientProfilePanel({
  user,
  avatarData,
  editName,
  editPhone,
  editEmail,
  editBio,
  oldPassword,
  newPassword,
  confirmPassword,
  showOldPwd,
  showNewPwd,
  phoneEditable,
  emailEditable,
  bioEditable,
  pwdEditable,
  history,
  publicProfile,
  publicProfileLoading,
  showSave,
  onAvatarPick,
  onNameEditOpen,
  onEmailEditableToggle,
  onPhoneEditableToggle,
  onBioEditableToggle,
  onPasswordEditableToggle,
  onEmailChange,
  onPhoneChange,
  onBioChange,
  onOldPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowOldPasswordToggle,
  onShowNewPasswordToggle,
  onBack,
  onSave,
}: PatientProfilePanelProps) {
  const careHistory = publicProfile?.history.patientAppointments || [];
  const doctorFeedback = publicProfile?.comments.staff || [];
  const cancelledCount = history.filter(
    (item) =>
      (item.status || "").toString().toUpperCase().includes("CANCEL") ||
      item.cancelledByPatient ||
      item.cancelledByDoctor,
  ).length;
  const noShowCount = history.filter((item) => item.noShow).length;
  const attendedCount = history.filter((item) => {
    const start = item.slot?.startTime ? new Date(item.slot.startTime) : null;
    return (
      (item.reportSubmitted ||
        (item.status === "APPROVED" &&
          start &&
          start.getTime() < Date.now() &&
          !item.noShow &&
          !item.cancelledByPatient &&
          !item.cancelledByDoctor)) === true
    );
  }).length;

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.74),rgba(221,232,240,0.3))] shadow-[0_32px_84px_rgba(7,18,34,0.18)] backdrop-blur-[26px]">
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
                  alt="Patient avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(user.name || "P").charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute inset-x-3 bottom-3 rounded-full border border-white/12 bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur group-hover:bg-black/40">
                Update photo
              </span>
            </button>

            <div className="min-w-0 space-y-3">
              <span className="inline-flex rounded-full border border-white/16 bg-white/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.62)]">
                Patient profile
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                    {editName || user.name || "Patient"}
                  </h1>
                  <button
                    type="button"
                    onClick={onNameEditOpen}
                    className="denty-action denty-action-secondary px-4 py-2 text-xs"
                  >
                    Edit name
                  </button>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  Keep your contact details ready, review your visit history, and
                  keep a clean record of doctor notes and completed appointments.
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

      <div className="grid gap-6 px-7 py-7 md:px-9 md:py-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">Role</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {(user.role || "PATIENT").toString().toUpperCase()}
              </p>
            </div>

            <div className="denty-dashboard-card-soft p-5">
              <p className="denty-kicker">Appointments</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {history.length}
              </p>
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Bio</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Add a short patient note or personal introduction if you want staff
                  to recognize you quickly.
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
                onChange={(event) => onBioChange(event.target.value)}
                className="denty-field min-h-[110px] text-base"
                placeholder="Add any short personal note you want on your profile."
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-sm leading-7 text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editBio?.trim()
                  ? editBio
                  : "No profile note has been added yet."}
              </div>
            )}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Email</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Primary contact for updates and booking confirmations.
                </p>
              </div>
              <button
                type="button"
                onClick={onEmailEditableToggle}
                className="denty-action denty-action-secondary px-4 py-2 text-xs"
              >
                {emailEditable ? "Done" : "Edit"}
              </button>
            </div>
            {emailEditable ? (
              <input
                value={editEmail}
                onChange={(event) => onEmailChange(event.target.value)}
                className="denty-field text-base"
                placeholder="Add an email"
              />
            ) : (
              <div className="rounded-[22px] border border-white/12 bg-white/52 px-4 py-4 text-lg font-semibold text-[var(--foreground)] shadow-[0_16px_28px_rgba(7,18,34,0.08)]">
                {editEmail || user.email || "No email set"}
              </div>
            )}
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="denty-kicker">Phone</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Used for direct communication during reservation confirmation.
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
                onChange={(event) => onPhoneChange(event.target.value)}
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
                  Change your password from the same profile workspace.
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
                    onChange={(event) => onOldPasswordChange(event.target.value)}
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
                    onChange={(event) => onNewPasswordChange(event.target.value)}
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
                  onChange={(event) => onConfirmPasswordChange(event.target.value)}
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
              <p className="denty-kicker !tracking-[0.18em]">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {attendedCount}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Cancelled</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {cancelledCount}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">No-show</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {noShowCount}
              </p>
            </div>
            <div className="denty-stat-card p-5">
              <p className="denty-kicker !tracking-[0.18em]">Doctor avg</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {publicProfile?.stats.doctorRatings?.toFixed(1) || "-"}
              </p>
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="denty-kicker">Doctor notes</p>
              <span className="denty-pill">{doctorFeedback.length} notes</span>
            </div>
            <div className="space-y-3">
              {doctorFeedback.slice(0, 6).map((comment) => (
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

              {!publicProfileLoading && doctorFeedback.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No doctor comments yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="denty-dashboard-card-soft space-y-4 p-5">
            <p className="denty-kicker">Appointment history</p>
            <div className="space-y-3">
              {careHistory.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[20px] border border-white/10 bg-white/34 px-4 py-4"
                >
                  <p className="font-semibold text-[var(--foreground)]">
                    {entry.clinicCase?.title || "Appointment"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {entry.clinicCase?.clinic?.name || "Clinic"} | {entry.status}
                  </p>
                </div>
              ))}

              {!publicProfileLoading && careHistory.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No appointment history yet.
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
