"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, logout } from "@/lib/api/auth";
import { useToast } from "@/features/ui/components/toast-provider";
import { useLanguage, useTranslation } from "@/features/i18n/language-provider";
import {
  useSettingsPrefs,
  type LanguagePreference,
  type NotificationPrefs,
  type ThemePreference,
} from "@/features/settings/hooks/use-settings-prefs";

export type SettingsRole = "doctor" | "patient" | "supervisor";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  username?: string | null;
  semester?: { label?: string | null } | string | null;
  semesterLabel?: string | null;
};

type SettingsPanelProps = {
  role: SettingsRole;
  onEditProfile?: () => void;
};

type ThemeOption = {
  value: ThemePreference;
  labelKey: string;
  hintKey: string;
};
type LanguageOption = {
  value: LanguagePreference;
  labelKey: string;
  hintKey: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    labelKey: "settings.theme.light",
    hintKey: "settings.theme.light_hint",
  },
  {
    value: "dark",
    labelKey: "settings.theme.dark",
    hintKey: "settings.theme.dark_hint",
  },
  {
    value: "system",
    labelKey: "settings.theme.system",
    hintKey: "settings.theme.system_hint",
  },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: "en",
    labelKey: "settings.language.en",
    hintKey: "settings.language.en_hint",
  },
  {
    value: "ar",
    labelKey: "settings.language.ar",
    hintKey: "settings.language.ar_hint",
  },
];

const NOTIFICATION_FIELDS: Array<{
  key: keyof NotificationPrefs;
  labelKey: string;
  descKey: string;
}> = [
  {
    key: "appointmentUpdates",
    labelKey: "settings.notifications.appointment_updates",
    descKey: "settings.notifications.appointment_updates_desc",
  },
  {
    key: "caseReviews",
    labelKey: "settings.notifications.case_reviews",
    descKey: "settings.notifications.case_reviews_desc",
  },
  {
    key: "chatMessages",
    labelKey: "settings.notifications.chat_messages",
    descKey: "settings.notifications.chat_messages_desc",
  },
  {
    key: "systemAnnouncements",
    labelKey: "settings.notifications.system_announcements",
    descKey: "settings.notifications.system_announcements_desc",
  },
];

const ROLE_COPY_KEYS: Record<
  SettingsRole,
  { eyebrow: string; description: string }
> = {
  doctor: {
    eyebrow: "settings.eyebrow.doctor",
    description: "settings.role.description.doctor",
  },
  patient: {
    eyebrow: "settings.eyebrow.patient",
    description: "settings.role.description.patient",
  },
  supervisor: {
    eyebrow: "settings.eyebrow.supervisor",
    description: "settings.role.description.supervisor",
  },
};

const readStoredUser = (): StoredUser => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("currentUser");
    if (!raw) return {};
    return JSON.parse(raw) as StoredUser;
  } catch {
    return {};
  }
};

const formatRoleLabel = (role: SettingsRole, fallback?: string | null): string => {
  if (fallback && fallback.trim().length > 0) {
    const lower = fallback.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const readSemesterLabel = (user: StoredUser): string | null => {
  if (typeof user.semesterLabel === "string" && user.semesterLabel) {
    return user.semesterLabel;
  }
  if (user.semester && typeof user.semester === "object") {
    const label = (user.semester as { label?: string | null }).label;
    if (typeof label === "string" && label.length > 0) return label;
  }
  if (typeof user.semester === "string" && user.semester.length > 0) {
    return user.semester;
  }
  return null;
};

const PASSWORD_ENDPOINT = "/auth/change-password";

export function SettingsPanel({ role, onEditProfile }: SettingsPanelProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const t = useTranslation();
  const { lang, setLang } = useLanguage();
  const {
    hydrated,
    theme,
    reducedMotion,
    notifications,
    setTheme,
    setReducedMotion,
    toggleNotification,
  } = useSettingsPrefs();

  const [storedUser, setStoredUser] = useState<StoredUser>({});
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [languageHint, setLanguageHint] = useState<string | null>(null);

  useEffect(() => {
    setStoredUser(readStoredUser());
  }, []);

  const identifier = useMemo(
    () =>
      storedUser.email ||
      storedUser.phone ||
      storedUser.username ||
      storedUser.id ||
      "",
    [storedUser],
  );

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const semesterLabel = useMemo(() => readSemesterLabel(storedUser), [storedUser]);
  const roleLabel = useMemo(
    () => formatRoleLabel(role, storedUser.role ?? null),
    [role, storedUser.role],
  );
  const roleCopyKeys = ROLE_COPY_KEYS[role];

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier) {
      pushToast({
        kind: "error",
        title: t("settings.change_password"),
        description:
          "We could not identify the current account. Please sign in again.",
      });
      return;
    }
    if (nextPassword.length < 8) {
      pushToast({
        kind: "error",
        title: t("settings.change_password"),
        description: "Choose a new password with at least 8 characters.",
      });
      return;
    }
    if (nextPassword !== confirmPassword) {
      pushToast({
        kind: "error",
        title: t("settings.change_password"),
        description: "The new password and confirmation do not match.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}${PASSWORD_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          identifier,
          currentPassword,
          newPassword: nextPassword,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data === "object" && "message" in data
            ? String((data as { message: unknown }).message)
            : null) || "Failed to change password.";
        pushToast({
          kind: "error",
          title: t("settings.change_password"),
          description: message,
        });
        return;
      }
      pushToast({
        kind: "success",
        title: "Password updated",
        description: "Use the new password on your next sign in.",
      });
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch {
      pushToast({
        kind: "error",
        title: t("settings.change_password"),
        description: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (next: LanguagePreference) => {
    setLang(next);
    setLanguageHint(t("settings.language.saved"));
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="space-y-5">
      <section className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="denty-kicker">{t(roleCopyKeys.eyebrow)}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-2xl">
              {t("settings.title")}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
              {t(roleCopyKeys.description)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="denty-status-chip denty-status-chip-strong">{roleLabel}</span>
            {hydrated ? (
              <span className="denty-status-chip">
                {t("settings.chip.theme")}: {theme}
              </span>
            ) : null}
            {hydrated ? (
              <span className="denty-status-chip">
                {t("settings.chip.language")}: {lang.toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="denty-panel p-4 sm:p-6">
        <header className="space-y-2">
          <p className="denty-kicker">{t("settings.appearance")}</p>
          <h3 className="text-xl font-semibold text-[var(--foreground)] md:text-xl">
            {t("settings.theme_and_motion")}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("settings.appearance.description")}
          </p>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={`denty-subpanel cursor-pointer p-4 text-left transition ${
                  active
                    ? "ring-2 ring-[rgba(11,123,138,0.45)] shadow-[0_18px_36px_rgba(10,22,40,0.12)]"
                    : "hover:-translate-y-[2px]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t(option.labelKey)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  {t(option.hintKey)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 denty-subpanel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.reduced_motion")}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
              {t("settings.reduced_motion.description")}
            </p>
          </div>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => setReducedMotion(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-navy)]"
            />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {reducedMotion ? t("common.on") : t("common.off")}
            </span>
          </label>
        </div>
      </section>

      <section className="denty-panel p-4 sm:p-6">
        <header className="space-y-2">
          <p className="denty-kicker">{t("settings.language")}</p>
          <h3 className="text-xl font-semibold text-[var(--foreground)] md:text-xl">
            {t("settings.language.title")}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("settings.language.description")}
          </p>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {LANGUAGE_OPTIONS.map((option) => {
            const active = lang === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleLanguageChange(option.value)}
                aria-pressed={active}
                className={`denty-subpanel cursor-pointer p-4 text-left transition ${
                  active
                    ? "ring-2 ring-[rgba(11,123,138,0.45)] shadow-[0_18px_36px_rgba(10,22,40,0.12)]"
                    : "hover:-translate-y-[2px]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t(option.labelKey)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  {t(option.hintKey)}
                </p>
              </button>
            );
          })}
        </div>

        {languageHint ? (
          <p className="mt-4 text-xs leading-5 text-[var(--muted-foreground)]">
            {languageHint}
          </p>
        ) : null}
      </section>

      <section className="denty-panel p-4 sm:p-6">
        <header className="space-y-2">
          <p className="denty-kicker">{t("settings.notifications")}</p>
          <h3 className="text-xl font-semibold text-[var(--foreground)] md:text-xl">
            {t("settings.notifications.title")}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {t("settings.notifications.description")}
          </p>
        </header>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_FIELDS.map((field) => {
            const checked = notifications[field.key];
            return (
              <li key={field.key}>
                <label className="denty-subpanel flex h-full cursor-pointer items-start gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNotification(field.key)}
                    className="mt-1 h-5 w-5 accent-[var(--color-navy)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--foreground)]">
                      {t(field.labelKey)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
                      {t(field.descKey)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="denty-panel p-4 sm:p-6">
        <header className="space-y-2">
          <p className="denty-kicker">{t("settings.account")}</p>
          <h3 className="text-xl font-semibold text-[var(--foreground)] md:text-xl">
            {t("settings.account.signed_in")}
          </h3>
        </header>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="denty-subpanel p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {t("settings.field.name")}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--foreground)]">
              {storedUser.name || t("common.not_set")}
            </dd>
          </div>
          <div className="denty-subpanel p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {t("settings.field.email")}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--foreground)] break-all">
              {storedUser.email || t("common.not_set")}
            </dd>
          </div>
          <div className="denty-subpanel p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {t("settings.field.phone")}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--foreground)]">
              {storedUser.phone || t("common.not_set")}
            </dd>
          </div>
          <div className="denty-subpanel p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {t("settings.field.role")}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--foreground)]">
              {roleLabel}
            </dd>
          </div>
          {role === "doctor" ? (
            <div className="denty-subpanel p-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {t("settings.field.semester")}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {semesterLabel || t("common.not_set")}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {onEditProfile ? (
            <button
              type="button"
              onClick={onEditProfile}
              className="denty-button-primary px-5 py-2.5 text-sm font-semibold"
            >
              {t("settings.edit_profile")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPasswordOpen((value) => !value)}
            className="denty-button-secondary px-5 py-2.5 text-sm font-semibold"
            aria-expanded={passwordOpen}
          >
            {passwordOpen
              ? t("settings.cancel_password")
              : t("settings.change_password")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="denty-action denty-action-danger px-5 py-2.5 text-sm font-semibold"
          >
            {t("settings.log_out")}
          </button>
        </div>

        {passwordOpen ? (
          <form
            onSubmit={handlePasswordSubmit}
            className="mt-6 denty-subpanel space-y-4 p-5"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("settings.current_password")}
                </span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  className="denty-field"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("settings.new_password")}
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  autoComplete="new-password"
                  className="denty-field"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("settings.confirm_new")}
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="denty-field"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("settings.password_hint")}
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="denty-button-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {submitting
                  ? t("settings.updating")
                  : t("settings.update_password")}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
