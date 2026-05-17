"use client";

import { BrandMark } from "@/features/ui/components/brand-mark";
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
  return (
    <section className="pointer-events-auto w-full max-w-[45rem] xl:mr-24 xl:translate-y-5 xl:justify-self-end xl:self-end xl:pb-8 2xl:mr-28 2xl:max-w-[49rem]">
      <div className="rounded-[34px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.16))] p-6 shadow-[0_24px_62px_rgba(7,18,44,0.12)] backdrop-blur-[34px] sm:p-7 xl:min-h-[43rem] xl:p-9">
        <div className="flex flex-col gap-7 xl:min-h-[37rem] xl:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="denty-kicker">Access portal</p>
            <div className="rounded-full border border-white/26 bg-[rgba(255,255,255,0.18)] p-1 shadow-[0_14px_30px_rgba(7,18,44,0.06)] backdrop-blur-xl">
              <button
                onClick={() => onModeChange("login")}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === "login"
                    ? "denty-button-primary"
                    : "denty-button-secondary"
                }`}
              >
                {t.login}
              </button>
              <button
                onClick={() => onModeChange("register")}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === "register"
                    ? "denty-button-primary"
                    : "denty-button-secondary"
                }`}
              >
                {t.register}
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.15rem]">
                {mode === "login" ? t.welcome : t.create}
              </h3>
              <p className="max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                {mode === "login" ? t.subtitle : t.registerSubtitle}
              </p>
            </div>
            <div className="hidden rounded-[1.5rem] border border-white/22 bg-[rgba(255,255,255,0.14)] p-3 shadow-[0_16px_36px_rgba(10,22,40,0.06)] backdrop-blur-xl sm:block">
              <BrandMark tone="light" className="h-10 w-10" />
            </div>
          </div>

          <div className="space-y-1 rounded-[22px] border border-white/22 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]/72">
              {portalNote.label}
            </p>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {portalNote.text}
            </p>
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
                        Semester
                      </label>
                      <select
                        value={semesterId}
                        onChange={(e) => onSemesterChange(e.target.value)}
                        className="denty-field cursor-pointer text-sm"
                      >
                        <option value="">Choose semester</option>
                        {semesterOptions.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">
                        {t.doctorId || "Doctor ID"}
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
                    Phone (required)
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
                    Email {role === "patient" ? "(optional)" : "(required)"}
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
                  {t.emailOrPhone} {role === "doctor" ? "or Doctor ID" : ""}
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
              className="denty-button-primary w-full cursor-pointer px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? "Working..." : mode === "login" ? t.login : t.register}
            </button>

            {mode === "login" && resendInfo ? (
              <div className="denty-placeholder space-y-3 p-4 sm:col-span-2">
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {resendInfo.role === "supervisor"
                    ? "Supervisor login denied. Resend your approval request?"
                    : "Doctor login denied. Resend your approval request?"}
                </p>
                <button
                  type="button"
                  className="denty-button-secondary w-full cursor-pointer px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onResend}
                  disabled={loading}
                >
                  Resend for approval
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
