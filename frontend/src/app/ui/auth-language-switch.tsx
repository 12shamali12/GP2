"use client";

type AuthLanguageSwitchProps = {
  lang: "en" | "ar";
  onLangChange: (lang: "en" | "ar") => void;
};

export function AuthLanguageSwitch({
  lang,
  onLangChange,
}: AuthLanguageSwitchProps) {
  return (
    <div
      className={`pointer-events-auto absolute top-4 z-20 flex gap-2 sm:top-6 ${
        lang === "ar"
          ? "left-4 flex-row-reverse sm:left-6 lg:left-8 xl:left-10"
          : "right-4 sm:right-6 lg:right-8 xl:right-10"
      }`}
    >
      <button
        onClick={() => onLangChange("en")}
        className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
          lang === "en"
            ? "denty-button-primary"
            : "border border-white/16 bg-white/12 text-white backdrop-blur-xl"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onLangChange("ar")}
        className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
          lang === "ar"
            ? "denty-button-primary"
            : "border border-white/16 bg-white/12 text-white backdrop-blur-xl"
        }`}
      >
        AR
      </button>
    </div>
  );
}
