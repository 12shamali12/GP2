"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type UsePatientNotificationsParams = {
  apiUrl: string;
  identifier: string;
  patientNotifications: any[];
  setPatientNotifications: Dispatch<SetStateAction<any[]>>;
};

export function usePatientNotifications({
  apiUrl,
  identifier,
  patientNotifications,
  setPatientNotifications,
}: UsePatientNotificationsParams) {
  const unreadPatientNotifications = useMemo(
    () => patientNotifications.filter((notification) => !notification.read).length,
    [patientNotifications]
  );

  const handlePatientNotificationAction = async (
    id: string,
    action: "read" | "delete"
  ) => {
    if (!identifier) return;

    const endpoint =
      action === "read"
        ? `${apiUrl}/notifications/${id}/read?identifier=${encodeURIComponent(
            identifier
          )}`
        : `${apiUrl}/notifications/${id}/delete?identifier=${encodeURIComponent(
            identifier
          )}`;

    try {
      await fetch(endpoint, { method: "PATCH" });
      setPatientNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* ignore */
    }
  };

  const markAllPatientNotificationsRead = async () => {
    if (!identifier || !patientNotifications.length) return;

    try {
      await Promise.all(
        patientNotifications
          .filter((notification) => !notification.read)
          .map((notification) =>
            fetch(
              `${apiUrl}/notifications/${
                notification.id
              }/read?identifier=${encodeURIComponent(identifier)}`,
              { method: "PATCH" }
            )
          )
      );

      setPatientNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch {
      /* ignore */
    }
  };

  const deleteAllPatientNotifications = async () => {
    if (!identifier || !patientNotifications.length) return;

    try {
      await fetch(
        `${apiUrl}/notifications/delete/all?identifier=${encodeURIComponent(
          identifier
        )}`,
        { method: "PATCH" }
      );
      setPatientNotifications([]);
    } catch {
      /* ignore */
    }
  };

  return {
    unreadPatientNotifications,
    handlePatientNotificationAction,
    markAllPatientNotificationsRead,
    deleteAllPatientNotifications,
  };
}
