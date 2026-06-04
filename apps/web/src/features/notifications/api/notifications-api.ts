import type { NotificationsOverview } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export function fetchNotifications() {
  return apiClient<NotificationsOverview>("/notifications");
}

export function markNotificationsRead(notificationIds: string[]) {
  return apiClient<{ unreadCount: number }>("/notifications/read", {
    method: "PATCH",
    body: JSON.stringify({ notificationIds })
  });
}

export function markAllNotificationsRead() {
  return apiClient<{ unreadCount: number }>("/notifications/read-all", {
    method: "PATCH"
  });
}
