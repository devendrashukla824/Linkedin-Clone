import type { ChatMessage, NotificationItem, ServerToClientEvents } from "@linkedin-clone/shared";
import type { Server } from "socket.io";
import type { ClientToServerEvents } from "@linkedin-clone/shared";

let ioServer: Server<ClientToServerEvents, ServerToClientEvents> | undefined;

export function registerNotificationSocketServer(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  ioServer = io;
}

export function emitNotification(recipientId: string, notification: NotificationItem) {
  ioServer?.to(userRoom(recipientId)).emit("notification:new", notification);
}

export function emitNotificationRead(recipientId: string, notificationIds: string[], unreadCount: number) {
  ioServer?.to(userRoom(recipientId)).emit("notification:read", { notificationIds, unreadCount });
}

export function emitMessage(recipientId: string, message: ChatMessage) {
  ioServer?.to(userRoom(recipientId)).emit("message:new", message);
}

export function userRoom(userId: string) {
  return `user:${userId}`;
}
