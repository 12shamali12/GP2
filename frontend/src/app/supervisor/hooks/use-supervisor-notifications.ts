"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseSupervisorNotificationsParams = {
  apiUrl: string;
  identifier: string;
  notifications: any[];
  setNotifications: Dispatch<SetStateAction<any[]>>;
  onRequestNotificationOpen: () => void;
};

export function useSupervisorNotifications({
  apiUrl,
  identifier,
  notifications,
  setNotifications,
  onRequestNotificationOpen,
}: UseSupervisorNotificationsParams) {
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = async () => {
    if (!identifier) return;

    try {
      const response = await fetch(
        `${apiUrl}/notifications?identifier=${encodeURIComponent(identifier)}`,
      );
      const data = await response.json();

      if (response.ok) {
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      /* ignore */
    }
  };

  const markNotificationRead = async (id: string, read = true) => {
    if (!identifier) return;

    try {
      const response = await fetch(
        `${apiUrl}/notifications/${id}/read?identifier=${encodeURIComponent(identifier)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read }),
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read } : notification,
          ),
        );
      }
    } catch {
      /* ignore */
    }
  };

  const deleteNotification = async (id: string) => {
    if (!identifier) return;

    try {
      const response = await fetch(
        `${apiUrl}/notifications/${id}/delete?identifier=${encodeURIComponent(identifier)}`,
        { method: "PATCH" },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== id),
        );
      }
    } catch {
      /* ignore */
    }
  };

  const markAllNotificationsRead = async () => {
    if (!identifier || !notifications.length) return;

    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (!unreadIds.length) return;

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(
            `${apiUrl}/notifications/${id}/read?identifier=${encodeURIComponent(identifier)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ read: true }),
            },
          ),
        ),
      );

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );
    } catch {
      /* ignore */
    }
  };

  const deleteAllNotifications = async () => {
    if (!identifier || !notifications.length) return;

    try {
      const response = await fetch(
        `${apiUrl}/notifications/delete/all?identifier=${encodeURIComponent(identifier)}`,
        { method: "PATCH" },
      );

      if (response.ok) {
        setNotifications([]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleNotificationClick = (notification: any) => {
    const title = String(notification.title || "").toLowerCase();
    const body = String(notification.body || notification.text || "").toLowerCase();

    if (notification.id) {
      void markNotificationRead(notification.id, true);
    }

    const isRequest =
      title.includes("request") ||
      body.includes("request") ||
      body.includes("report") ||
      body.includes("exam");

    if (isRequest) {
      onRequestNotificationOpen();
    }
  };

  return {
    unreadNotifications,
    loadNotifications,
    deleteNotification,
    markAllNotificationsRead,
    handleNotificationClick,
    deleteAllNotifications,
  };
}
