"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminNotificationsWorkspace } from "./hooks/use-admin-notifications-workspace";
import { NotificationsFilterPanel } from "./ui/notifications-filter-panel";
import { NotificationsStream } from "./ui/notifications-stream";

export default function AdminNotificationsPage() {
  const {
    items,
    loading,
    error,
    setError,
    message,
    setMessage,
    filter,
    setFilter,
    unreadCount,
    filteredItems,
    updateItem,
    markAllRead,
    removeAll,
  } = useAdminNotificationsWorkspace();

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Notifications updated",
    errorTitle: "Notifications issue",
  });

  return (
    <AdminShell
      title="Admin Notifications"
      description="Unread approvals, join requests, and moderation events now land in a dedicated admin inbox instead of getting lost inside status text."
    >
      <NotificationsFilterPanel
        itemsCount={items.length}
        unreadCount={unreadCount}
        filter={filter}
        onFilterChange={setFilter}
        onMarkAllRead={markAllRead}
        onRemoveAll={removeAll}
      />

      <NotificationsStream
        loading={loading}
        filteredItems={filteredItems}
        onUpdateItem={updateItem}
      />
    </AdminShell>
  );
}
