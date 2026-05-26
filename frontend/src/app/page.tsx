"use client";

import {
  AuthShowcaseBackground,
} from "@/features/ui/components/auth-showcase";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { useTranslation } from "@/features/i18n/language-provider";
import { useAuthPortal } from "./hooks/use-auth-portal";
import { AuthLanguageSwitch } from "./ui/auth-language-switch";
import { AuthPortalCard } from "./ui/auth-portal-card";
import { AuthStage } from "./ui/auth-stage";
import { AuthThemeSwitch } from "./ui/auth-theme-switch";

export default function Home() {
  const auth = useAuthPortal();
  const t = useTranslation();

  // Build the strongly-typed `t` object the existing AuthPortalCard expects.
  // We pull from the global dictionary so the auth labels stay in sync with
  // the rest of the suite (Settings, side rails, etc.), while leaving the
  // legacy per-locale validation messages on `useAuthPortal` untouched.
  const cardCopy = {
    subtitle: t("auth.subtitle"),
    registerSubtitle: t("auth.register_subtitle"),
    welcome: t("auth.welcome"),
    create: t("auth.create"),
    login: t("auth.login"),
    register: t("auth.register"),
    fullName: t("auth.full_name"),
    age: t("auth.age"),
    gender: t("auth.gender"),
    role: t("auth.role"),
    rolePatient: t("auth.role.patient"),
    roleDoctor: t("auth.role.doctor"),
    roleSupervisor: t("auth.role.supervisor"),
    emailOrPhone: t("auth.email_or_phone"),
    password: t("auth.password"),
    doctorId: t("auth.doctor_id"),
  };

  return (
    <main dir={auth.lang === "ar" ? "rtl" : "ltr"} className="denty-screen">
      <div className="relative min-h-screen overflow-hidden">
        <AuthShowcaseBackground
          activeIndex={auth.showcaseIndex}
          lang={auth.lang}
          onChange={auth.setShowcaseIndex}
          slides={auth.slides}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(173,216,230,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
          <div className="frozen-float absolute left-[10%] top-[10%] h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div
            className="frozen-float absolute bottom-[12%] right-[8%] h-44 w-44 rounded-full bg-[rgba(11,123,138,0.12)] blur-3xl"
            style={{ animationDelay: "1.2s" }}
          />
        </div>

        <AuthLanguageSwitch
          lang={auth.lang}
          onLangChange={auth.setLang}
        />
        <AuthThemeSwitch lang={auth.lang} />

        <div className="pointer-events-none relative z-10 flex min-h-screen flex-col px-4 py-16 sm:px-6 sm:py-6 lg:px-6 xl:px-10">
          <div className="grid flex-1 gap-5 py-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(45rem,1.04fr)] xl:items-end xl:gap-12">
            <div className="hidden xl:block">
              <AuthStage
                lang={auth.lang}
                mode={auth.mode}
                title={t("auth.title")}
                subtitle={t("auth.subtitle")}
                registerSubtitle={t("auth.register_subtitle")}
                location={t("auth.location")}
                activeSlide={auth.activeSlide}
                showcaseIndex={auth.showcaseIndex}
                slidesLength={auth.slides.length}
              />
            </div>

            <div className="pointer-events-auto flex items-center gap-3 xl:hidden">
              <div className="rounded-2xl border border-white/16 bg-white/10 p-2.5 shadow-[0_18px_40px_rgba(7,18,44,0.18)] backdrop-blur-xl">
                <BrandMark tone="light" className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/70">
                  {t("auth.location")}
                </p>
                <h1 className="text-lg font-semibold tracking-[-0.03em] text-white">
                  DentyHub
                </h1>
              </div>
            </div>

            <div className="xl:ml-auto xl:-mr-6 xl:max-w-[80%]">
            <AuthPortalCard
              mode={auth.mode}
              role={auth.role}
              contact={auth.contact}
              regEmail={auth.regEmail}
              regPhone={auth.regPhone}
              regDoctorId={auth.regDoctorId}
              semesterId={auth.semesterId}
              semesterOptions={auth.semesterOptions}
              password={auth.password}
              name={auth.name}
              age={auth.age}
              gender={auth.gender}
              error={auth.error}
              message={auth.message}
              loading={auth.loading}
              resendInfo={auth.resendInfo}
              portalNote={auth.portalNote}
              t={cardCopy}
              onModeChange={auth.setMode}
              onRoleChange={auth.setRole}
              onContactChange={auth.setContact}
              onRegEmailChange={auth.setRegEmail}
              onRegPhoneChange={auth.setRegPhone}
              onRegDoctorIdChange={auth.setRegDoctorId}
              onSemesterChange={auth.setSemesterId}
              onPasswordChange={auth.setPassword}
              onNameChange={auth.setName}
              onAgeChange={auth.setAge}
              onGenderChange={auth.setGender}
              onSubmit={auth.handleSubmit}
              onResend={auth.handleResend}
            />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
