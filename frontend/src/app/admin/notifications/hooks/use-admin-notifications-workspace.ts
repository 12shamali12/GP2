"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  setNotificationReadState,
} from "@/features/notifications/services/notifications-api";
import type { NotificationItem } from "@/features/notifications/types/notification";

export type NotificationsFilter = "all" | "unread";

export function useAdminNotificationsWorkspace() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationsFilter>("all");

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(ADMIN_USERNAME);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const filteredItems = useMemo(
    () => items.filter((item) => (filter === "unread" ? !item.read : true)),
    [filter, items],
  );

  const updateItem = async (
    id: string,
    action: "read" | "delete",
    read = true,
  ) => {
    setError(null);
    setMessage(null);
    try {
      if (action === "delete") {
        await deleteNotification(id, ADMIN_USERNAME);
        setItems((current) => current.filter((item) => item.id !== id));
        setMessage("Notification deleted.");
      } else {
        await setNotificationReadState(id, ADMIN_USERNAME, read);
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, read } : item)),
        );
        setMessage(
          read ? "Notification marked read." : "Notification marked unread.",
        );
      }
    } catch (e: any) {
      setError(e?.message || "Failed to update notification.");
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((item) => !item.read);
    if (!unread.length) return;
    setError(null);
    setMessage(null);
    try {
      await Promise.all(
        unread.map((item) =>
          setNotificationReadState(item.id, ADMIN_USERNAME, true),
        ),
      );
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setMessage("All notifications marked read.");
    } catch (e: any) {
      setError(e?.message || "Failed to mark notifications read.");
    }
  };

  const removeAll = async () => {
    setError(null);
    setMessage(null);
    try {
      await deleteAllNotifications(ADMIN_USERNAME);
      setItems([]);
      setMessage("All notifications deleted.");
    } catch (e: any) {
      setError(e?.message || "Failed to remove notifications.");
    }
  };

  return {
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
  };
}
