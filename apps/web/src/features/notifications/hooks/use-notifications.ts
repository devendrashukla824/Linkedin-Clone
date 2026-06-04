"use client";

import type { FeedAuthor, NotificationItem, NotificationsOverview, NotificationType } from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead
} from "@/features/notifications/api/notifications-api";
import { mockNotifications } from "@/features/notifications/data/mock-notifications";
import { useAuthStore } from "@/stores/auth-store";

export const notificationsKey = ["notifications", "overview"] as const;

export function useNotifications() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  useEffect(() => {
    if (!accessToken || isDemo) {
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000", {
      auth: { token: accessToken },
      transports: ["websocket"]
    });

    socket.on("notification:new", (notification: NotificationItem) => {
      addNotificationToCache(queryClient, notification);
    });
    socket.on("notification:read", ({ notificationIds, unreadCount }) => {
      queryClient.setQueryData<NotificationsOverview>(notificationsKey, (overview) =>
        overview
          ? {
              items: notificationIds.length
                ? overview.items.map((item) => (notificationIds.includes(item.id) ? { ...item, isRead: true } : item))
                : overview.items.map((item) => ({ ...item, isRead: true })),
              unreadCount
            }
          : overview
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, isDemo, queryClient]);

  return useQuery({
    queryKey: notificationsKey,
    queryFn: () => (isDemo ? Promise.resolve(getDemoOverview()) : fetchNotifications()),
    initialData: getDemoOverview(),
    retry: false
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (notificationIds: string[]) => (isDemo ? Promise.resolve(markReadLocally(notificationIds)) : markNotificationsRead(notificationIds)),
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      queryClient.setQueryData<NotificationsOverview>(notificationsKey, (overview) =>
        overview ? markOverviewRead(overview, notificationIds) : overview
      );
    }
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: () => (isDemo ? Promise.resolve(markReadLocally([])) : markAllNotificationsRead()),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      queryClient.setQueryData<NotificationsOverview>(notificationsKey, (overview) =>
        overview ? { items: overview.items.map((item) => ({ ...item, isRead: true })), unreadCount: 0 } : overview
      );
    }
  });
}

export function createDemoNotification({
  actor,
  type,
  title,
  body,
  entityId,
  entityType,
  href
}: {
  actor?: FeedAuthor;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: NotificationItem["entityType"];
  href?: string;
}): NotificationItem {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    recipientId: demoUser.id,
    actor,
    type,
    title,
    body,
    isRead: false,
    entityId,
    entityType,
    href,
    createdAt: new Date().toISOString()
  };
}

export function addNotificationToCache(queryClient: QueryClient, notification: NotificationItem) {
  queryClient.setQueryData<NotificationsOverview>(notificationsKey, (overview) => {
    const current = overview ?? getDemoOverview();
    if (current.items.some((item) => item.id === notification.id)) {
      return current;
    }
    return {
      items: [notification, ...current.items].slice(0, 30),
      unreadCount: current.unreadCount + (notification.isRead ? 0 : 1)
    };
  });
}

function getDemoOverview(): NotificationsOverview {
  return {
    items: mockNotifications,
    unreadCount: mockNotifications.filter((item) => !item.isRead).length
  };
}

function markReadLocally(notificationIds: string[]) {
  if (notificationIds.length) {
    mockNotifications.forEach((item) => {
      if (notificationIds.includes(item.id)) {
        item.isRead = true;
      }
    });
  } else {
    mockNotifications.forEach((item) => {
      item.isRead = true;
    });
  }

  return { unreadCount: mockNotifications.filter((item) => !item.isRead).length };
}

function markOverviewRead(overview: NotificationsOverview, notificationIds: string[]): NotificationsOverview {
  const items = notificationIds.length
    ? overview.items.map((item) => (notificationIds.includes(item.id) ? { ...item, isRead: true } : item))
    : overview.items.map((item) => ({ ...item, isRead: true }));

  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length
  };
}
