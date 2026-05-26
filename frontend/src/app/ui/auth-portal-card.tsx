"use client";

import { useTranslation } from "@/features/i18n/language-provider";
import type { Role } from "../hooks/use-auth-portal";

type PortalNote = {
  label: string;
  text: string;
};

type AuthPortalCardProps = {
  mode: "login" | "register";
  role: Role;
  contact: string;
  regEmail: string;
  regPhone: string;
  regDoctorId: string;
  semesterId: string;
  semesterOptions: Array<{ id: string; label: string }>;
  password: string;
  name: string;
  age: string;
  gender: "male" | "female";
  error: string | null;
  message: string | null;
  loading: boolean;
  resendInfo: { identifier: string; password: string; role: "supervisor" | "doctor" } | null;
  portalNote: PortalNote;
  t: {
    subtitle: string;
    registerSubtitle: string;
    welcome: string;
    create: string;
    login: string;
    register: string;
    fullName: string;
    age: string;
    gender: string;
    role: string;
    rolePatient: string;
    roleDoctor: string;
    roleSupervisor: string;
    emailOrPhone: string;
    password: string;
    doctorId?: string;
  };
  onModeChange: (mode: "login" | "register") => void;
  onRoleChange: (role: Role) => void;
  onContactChange: (value: string) => void;
  onRegEmailChange: (value: string) => void;
  onRegPhoneChange: (value: string) => void;
  onRegDoctorIdChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onGenderChange: (value: "male" | "female") => void;
  onSubmit: () => void;
  onResend: () => void;
};

export function AuthPortalCard({
  mode,
  role,
  contact,
  regEmail,
  regPhone,
  regDoctorId,
  semesterId,
  semesterOptions,
  password,
  name,
  age,
  gender,
  error,
  message,
  loading,
  resendInfo,
  portalNote,
  t,
  onModeChange,
  onRoleChange,
  onContactChange,
  onRegEmailChange,
  onRegPhoneChange,
  onRegDoctorIdChange,
  onSemesterChange,
  onPasswordChange,
  onNameChange,
  onAgeChange,
  onGenderChange,
  onSubmit,
  onResend,
}: AuthPortalCardProps) {
  const tr = useTranslation();
  return (
    <section className="pointer-events-auto w-full max-w-[40rem] xl:mr-16 xl:translate-y-5 xl:justify-self-end xl:self-end xl:pb-6 2xl:mr-24 2xl:max-w-[44rem]">
      <div className="denty-auth-portal rounded-[24px] border border-[rgba(20,184,166,0.22)] bg-[linear-gradient(180deg,rgba(252,255,254,0.58),rgba(232,250,247,0.40))] p-5 shadow-[0_24px_60px_rgba(7,18,44,0.18),0_4px_12px_rgba(7,18,44,0.08)] backdrop-blur-2xl sm:p-6 xl:min-h-[38rem] xl:p-7">
        <div className="flex flex-col gap-5 xl:min-h-[32rem] xl:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="denty-kicker">{tr("auth.portal")}</p>
            <div className="inline-flex rounded-full border border-[rgba(20,184,166,0.22)] bg-white/55 p-1 shadow-[0_10px_24px_rgba(7,18,44,0.06)] backdrop-blur-xl">
              <button
                onClick={() => onModeChange("login")}
                className={`min-h-[2.1rem] cursor-pointer rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition ${
                  mode === "login"
                    ? "bg-[linear-gradient(160deg,rgba(13,148,136,0.96),rgba(11,90,98,0.96))] text-white shadow-[0_6px_14px_rgba(13,90,98,0.28)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.login}
              </button>
              <button
                onClick={() => onModeChange("register")}
                className={`min-h-[2.1rem] cursor-pointer rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition ${
                  mode === "register"
                    ? "bg-[linear-gradient(160deg,rgba(13,148,136,0.96),rgba(11,90,98,0.96))] text-white shadow-[0_6px_14px_rgba(13,90,98,0.28)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.register}
              </button>
            </div>
          </div>

          <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.2rem]">
            {mode === "login" ? t.welcome : t.create}
          </h3>

          <div className="flex gap-3 rounded-[14px] border border-[rgba(20,184,166,0.22)] bg-[rgba(20,184,166,0.07)] px-4 py-3">
            <span
              aria-hidden
              className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(13,148,136,0.95)]"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(11,90,98,0.88)]">
                {portalNote.label}
              </p>
              <p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">
                {portalNote.text}
              </p>
            </div>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder={t.fullName}
                    className="denty-field text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {t.age}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => onAgeChange(e.target.value)}
                    placeholder={t.age}
                    className="denty-field text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {t.gender}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      onGenderChange(e.target.value as "male" | "female")
                    }
                    className="denty-field cursor-pointer text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {t.role}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value as Role)}
                    className="denty-field cursor-pointer text-sm"
                  >
                    <option value="patient">{t.rolePatient}</option>
                    <option value="doctor">{t.roleDoctor}</option>
                    <option value="supervisor">{t.roleSupervisor}</option>
                  </select>
                </div>

                {role === "doctor" ? (
                  <div className="grid gap-4 sm:col-span-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">
                        {tr("auth.semester")}
                      </label>
                      <select
                        value={semesterId}
                        onChange={(e) => onSemesterChange(e.target.value)}
                        className="denty-field cursor-pointer text-sm"
                      >
                        <option value="">{tr("auth.semester_choose")}</option>
                        {semesterOptions.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">
                        {t.doctorId || tr("auth.doctor_id")}
                      </label>
                      <input
                        type="text"
                        value={regDoctorId}
                        onChange={(e) => onRegDoctorIdChange(e.target.value)}
                        placeholder="College ID"
                        className="denty-field text-sm"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {tr("auth.phone_required")}
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => onRegPhoneChange(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="denty-field text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    {role === "patient"
                      ? tr("auth.email_optional")
                      : tr("auth.email_required")}
                  </label>
                  <input
                    type="text"
                    value={regEmail}
                    onChange={(e) => onRegEmailChange(e.target.value)}
                    placeholder="you@example.com"
                    className="denty-field text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-[var(--foreground)]">
                  {t.emailOrPhone}
                  {role === "doctor" ? ` ${tr("auth.doctor_id")}` : ""}
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => onContactChange(e.target.value)}
                  placeholder="you@example.com or 0791234567 or ID"
                  className="denty-field text-sm"
                />
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="********"
                className="denty-field text-sm"
              />
            </div>

            {error ? (
              <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700 sm:col-span-2">
                {message}
              </div>
            ) : null}

            <button
              type="button"
              className="w-full cursor-pointer rounded-[14px] bg-[linear-gradient(160deg,rgba(13,148,136,0.96),rgba(8,80,90,0.96))] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(13,90,98,0.34)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading
                ? tr("common.working")
                : mode === "login"
                  ? t.login
                  : t.register}
            </button>

            {mode === "login" && resendInfo ? (
              <div className="denty-placeholder space-y-3 p-4 sm:col-span-2">
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {resendInfo.role === "supervisor"
                    ? tr("auth.resend_supervisor")
                    : tr("auth.resend_doctor")}
                </p>
                <button
                  type="button"
                  className="denty-button-secondary w-full cursor-pointer px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onResend}
                  disabled={loading}
                >
                  {tr("auth.resend_for_approval")}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
