import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";
import type { NotificationItem } from "@/features/notifications/types/notification";

export const getNotifications = (identifier: string) =>
  httpJson<NotificationItem[]>("/notifications", {
    headers: { ...authHeaders() },
    query: { identifier },
  });

export const setNotificationReadState = (
  id: string,
  identifier: string,
  read: boolean,
) =>
  httpJson<unknown>(`/notifications/${id}/read`, {
    method: "PATCH",
    headers: { ...authHeaders() },
    query: { identifier },
    body: { read },
  });

export const deleteNotification = (id: string, identifier: string) =>
  httpJson<unknown>(`/notifications/${id}/delete`, {
    method: "PATCH",
    headers: { ...authHeaders() },
    query: { identifier },
  });

export const deleteAllNotifications = (identifier: string) =>
  httpJson<unknown>("/notifications/delete/all", {
    method: "PATCH",
    headers: { ...authHeaders() },
    query: { identifier },
  });
