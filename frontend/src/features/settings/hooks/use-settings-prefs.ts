"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "en" | "ar";

export type NotificationPrefs = {
  appointmentUpdates: boolean;
  caseReviews: boolean;
  chatMessages: boolean;
  systemAnnouncements: boolean;
};

const THEME_KEY = "denty-theme";
const REDUCED_MOTION_KEY = "denty-reduced-motion";
const LANGUAGE_KEY = "denty-language";
const NOTIFICATIONS_KEY = "denty-notifications-prefs";

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  appointmentUpdates: true,
  caseReviews: true,
  chatMessages: true,
  systemAnnouncements: false,
};

const isBrowser = typeof window !== "undefined";

const readString = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeString = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const parseTheme = (raw: string | null): ThemePreference => {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
};

const parseLanguage = (raw: string | null): LanguagePreference => {
  return raw === "ar" ? "ar" : "en";
};

const parseNotifications = (raw: string | null): NotificationPrefs => {
  if (!raw) return DEFAULT_NOTIFICATIONS;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      appointmentUpdates:
        typeof parsed.appointmentUpdates === "boolean"
          ? parsed.appointmentUpdates
          : DEFAULT_NOTIFICATIONS.appointmentUpdates,
      caseReviews:
        typeof parsed.caseReviews === "boolean"
          ? parsed.caseReviews
          : DEFAULT_NOTIFICATIONS.caseReviews,
      chatMessages:
        typeof parsed.chatMessages === "boolean"
          ? parsed.chatMessages
          : DEFAULT_NOTIFICATIONS.chatMessages,
      systemAnnouncements:
        typeof parsed.systemAnnouncements === "boolean"
          ? parsed.systemAnnouncements
          : DEFAULT_NOTIFICATIONS.systemAnnouncements,
    };
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
};

const prefersDark = (): boolean => {
  if (!isBrowser || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

const applyTheme = (theme: ThemePreference): void => {
  if (!isBrowser) return;
  const root = document.documentElement;
  const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark());
  root.classList.toggle("dark", shouldBeDark);
  root.dataset.theme = theme;
};

const applyReducedMotion = (reduced: boolean): void => {
  if (!isBrowser) return;
  const root = document.documentElement;
  if (reduced) {
    root.dataset.reducedMotion = "true";
  } else {
    delete root.dataset.reducedMotion;
  }
};

const applyLanguage = (language: LanguagePreference): void => {
  if (!isBrowser) return;
  const root = document.documentElement;
  root.dataset.lang = language;
};

export function useSettingsPrefs() {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);
  const [language, setLanguageState] = useState<LanguagePreference>("en");
  const [notifications, setNotificationsState] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATIONS,
  );
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount and apply effects to <html>.
  useEffect(() => {
    const storedTheme = parseTheme(readString(THEME_KEY));
    const storedReducedMotion = readString(REDUCED_MOTION_KEY) === "true";
    const storedLanguage = parseLanguage(readString(LANGUAGE_KEY));
    const storedNotifications = parseNotifications(readString(NOTIFICATIONS_KEY));

    setThemeState(storedTheme);
    setReducedMotionState(storedReducedMotion);
    setLanguageState(storedLanguage);
    setNotificationsState(storedNotifications);

    applyTheme(storedTheme);
    applyReducedMotion(storedReducedMotion);
    applyLanguage(storedLanguage);

    setHydrated(true);
  }, []);

  // Track system theme changes when in "system" mode.
  useEffect(() => {
    if (!isBrowser || theme !== "system") return;
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    writeString(THEME_KEY, next);
    applyTheme(next);
  }, []);

  const setReducedMotion = useCallback((next: boolean) => {
    setReducedMotionState(next);
    writeString(REDUCED_MOTION_KEY, next ? "true" : "false");
    applyReducedMotion(next);
  }, []);

  const setLanguage = useCallback((next: LanguagePreference) => {
    setLanguageState(next);
    writeString(LANGUAGE_KEY, next);
    applyLanguage(next);
  }, []);

  const setNotifications = useCallback(
    (
      next:
        | NotificationPrefs
        | ((prev: NotificationPrefs) => NotificationPrefs),
    ) => {
      setNotificationsState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        writeString(NOTIFICATIONS_KEY, JSON.stringify(resolved));
        return resolved;
      });
    },
    [],
  );

  const toggleNotification = useCallback(
    (key: keyof NotificationPrefs) => {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [setNotifications],
  );

  return {
    hydrated,
    theme,
    reducedMotion,
    language,
    notifications,
    setTheme,
    setReducedMotion,
    setLanguage,
    setNotifications,
    toggleNotification,
  };
}
