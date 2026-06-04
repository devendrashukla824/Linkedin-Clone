import type { FeedAuthor, NotificationItem, NotificationsOverview, NotificationType } from "@linkedin-clone/shared";
import type { NotificationRepository } from "#src/domain/repositories/notification-repository.js";
import type { NotificationDocument } from "#src/infrastructure/database/models/notification-model.js";
import { emitNotification, emitNotificationRead } from "#src/interfaces/realtime/notification-bus.js";

export interface CreateNotificationInput {
  recipientId: string;
  actor?: FeedAuthor;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: NotificationItem["entityType"];
  href?: string;
}

export class NotificationUseCases {
  constructor(private readonly notifications: NotificationRepository) {}

  async overview(recipientId: string, limit = 30): Promise<NotificationsOverview> {
    const [items, unreadCount] = await Promise.all([
      this.notifications.listByRecipient(recipientId, limit),
      this.notifications.countUnread(recipientId)
    ]);

    return {
      items: items.map((item) => this.toItem(item)),
      unreadCount
    };
  }

  async create(input: CreateNotificationInput): Promise<NotificationItem | undefined> {
    if (input.actor?.id === input.recipientId) {
      return undefined;
    }

    const notification = await this.notifications.create({
      ...input,
      isRead: false
    });
    const item = this.toItem(notification);
    emitNotification(input.recipientId, item);
    return item;
  }

  async markRead(recipientId: string, notificationIds: string[]) {
    await this.notifications.markRead(recipientId, notificationIds);
    const unreadCount = await this.notifications.countUnread(recipientId);
    emitNotificationRead(recipientId, notificationIds, unreadCount);
    return { unreadCount };
  }

  async markAllRead(recipientId: string) {
    await this.notifications.markAllRead(recipientId);
    emitNotificationRead(recipientId, [], 0);
    return { unreadCount: 0 };
  }

  private toItem(notification: NotificationDocument): NotificationItem {
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      actor: notification.actor,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      entityId: notification.entityId,
      entityType: notification.entityType,
      href: notification.href,
      createdAt: notification.createdAt.toISOString()
    };
  }
}
