"use client";

import Link from "next/link";
import { Bell, BriefcaseBusiness, CheckCheck, MessageCircle, ThumbsUp, UserPlus, UsersRound } from "lucide-react";
import type { NotificationItem, NotificationType } from "@linkedin-clone/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/features/notifications/hooks/use-notifications";

const iconByType: Record<NotificationType, typeof Bell> = {
  post_like: ThumbsUp,
  post_comment: MessageCircle,
  post_repost: UsersRound,
  post_share: MessageCircle,
  connection_request: UserPlus,
  connection_accepted: UsersRound,
  job_application: BriefcaseBusiness,
  system: Bell
};

export function NotificationsView() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Notifications</h1>
          <p className="text-sm text-muted-foreground">{data?.unreadCount ?? 0} unread updates</p>
        </div>
        <Button variant="outline" disabled={!data?.unreadCount || markAllRead.isPending} onClick={() => markAllRead.mutate()}>
          <CheckCheck /> Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={() => markRead.mutate([notification.id])}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({ notification, onRead }: { notification: NotificationItem; onRead: () => void }) {
  const Icon = iconByType[notification.type] ?? Bell;
  const content = (
    <div className="flex min-w-0 flex-1 gap-3">
      <Avatar className="size-11">
        <AvatarImage src={notification.actor?.avatarUrl} />
        <AvatarFallback>{initials(notification.actor?.name ?? notification.title)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold leading-tight">{notification.title}</p>
          {!notification.isRead ? <Badge>New</Badge> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.body}</p>
        <p className="mt-2 text-xs text-muted-foreground">{formatTime(notification.createdAt)}</p>
      </div>
    </div>
  );

  return (
    <div className={notification.isRead ? "flex gap-3 p-4" : "flex gap-3 bg-primary/5 p-4"}>
      <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" />
      </div>
      {notification.href ? (
        <Link href={notification.href} onClick={onRead} className="min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        content
      )}
      {!notification.isRead ? (
        <Button variant="ghost" size="sm" onClick={onRead}>
          Mark read
        </Button>
      ) : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
