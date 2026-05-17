"use client";

import {
  AuthShowcaseBackground,
} from "@/features/ui/components/auth-showcase";
import { useAuthPortal } from "./hooks/use-auth-portal";
import { AuthLanguageSwitch } from "./ui/auth-language-switch";
import { AuthPortalCard } from "./ui/auth-portal-card";
import { AuthStage } from "./ui/auth-stage";

export default function Home() {
  const auth = useAuthPortal();

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

        <div className="pointer-events-none relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <div className="grid flex-1 gap-8 py-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(45rem,1.04fr)] xl:items-end xl:gap-12">
            <AuthStage
              lang={auth.lang}
              mode={auth.mode}
              title={auth.t.title}
              subtitle={auth.t.subtitle}
              registerSubtitle={auth.t.registerSubtitle}
              location={auth.t.location}
              activeSlide={auth.activeSlide}
              showcaseIndex={auth.showcaseIndex}
              slidesLength={auth.slides.length}
            />

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
              t={auth.t}
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
    </main>
  );
}
