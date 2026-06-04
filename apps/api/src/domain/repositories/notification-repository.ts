import type { NotificationDocument } from "#src/infrastructure/database/models/notification-model.js";

export interface NotificationRepository {
  create(input: Partial<NotificationDocument>): Promise<NotificationDocument>;
  listByRecipient(recipientId: string, limit: number): Promise<NotificationDocument[]>;
  countUnread(recipientId: string): Promise<number>;
  markRead(recipientId: string, notificationIds: string[]): Promise<void>;
  markAllRead(recipientId: string): Promise<void>;
}
