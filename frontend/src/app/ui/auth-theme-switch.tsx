"use client";

import { useEffect, useState } from "react";
import { useSettingsPrefs } from "@/features/settings/hooks/use-settings-prefs";

/**
 * Theme toggle for the auth screen. Mirrors `AuthLanguageSwitch` styling so
 * the two controls feel like a matched pair, but renders a single
 * sun/moon icon button instead of paired language pills.
 *
 * The active scheme is resolved from `prefers-color-scheme` when the user
 * has not made an explicit choice, so the toggle still reflects the
 * effective theme on first paint.
 */
type AuthThemeSwitchProps = {
  lang: "en" | "ar";
};

export function AuthThemeSwitch({ lang }: AuthThemeSwitchProps) {
  const { theme, hydrated, setTheme } = useSettingsPrefs();
  const [isDark, setIsDark] = useState(false);

  // After hydration, observe the actual `.dark` class on <html> so the icon
  // tracks both explicit choices and the system-mode preference.
  useEffect(() => {
    if (!hydrated) return;
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [hydrated, theme]);

  return (
    <div
      className={`pointer-events-auto absolute top-4 z-20 sm:top-6 ${
        lang === "ar"
          ? "right-4 sm:right-6 lg:right-8 xl:right-10"
          : "left-4 sm:left-6 lg:left-8 xl:left-10"
      }`}
    >
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/22 bg-white/12 text-white shadow-[0_18px_40px_rgba(7,18,44,0.22)] backdrop-blur-xl transition hover:border-white/40 hover:bg-white/22"
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: isDark
              ? "radial-gradient(circle at 30% 30%, rgba(255,221,87,0.45), transparent 60%)"
              : "radial-gradient(circle at 70% 30%, rgba(94,234,212,0.45), transparent 60%)",
          }}
        />
        <span
          aria-hidden
          className={`relative flex items-center justify-center transition-transform duration-500 ${
            isDark ? "rotate-0" : "-rotate-180"
          }`}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5Z"
                fill="currentColor"
                fillOpacity="0.18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
