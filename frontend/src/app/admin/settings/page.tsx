"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { useTranslation } from "@/features/i18n/language-provider";
import { AdminCredentialsCard } from "./ui/admin-credentials-card";

/**
 * Admin → Settings page. Mounts the shared SettingsPanel for theme / language
 * / notifications, and an admin-specific credentials editor for changing the
 * email, phone, username and display name used at sign-in. SettingsPanel's
 * built-in "Edit profile" button is intentionally not wired up here — admins
 * don't have a separate profile screen, the editor below takes that role.
 */
export default function AdminSettingsPage() {
  const t = useTranslation();
  return (
    <AdminShell
      title={t("admin.settings.title")}
      description={t("admin.settings.description")}
    >
      <div className="space-y-5">
        <AdminCredentialsCard />
        <SettingsPanel role="admin" />
      </div>
    </AdminShell>
  );
}
