import type { NotificationRepository } from "#src/domain/repositories/notification-repository.js";
import { NotificationModel, type NotificationDocument } from "#src/infrastructure/database/models/notification-model.js";

export class MongoNotificationRepository implements NotificationRepository {
  create(input: Partial<NotificationDocument>) {
    return NotificationModel.create(input);
  }

  listByRecipient(recipientId: string, limit: number) {
    return NotificationModel.find({ recipientId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  countUnread(recipientId: string) {
    return NotificationModel.countDocuments({ recipientId, isRead: false }).exec();
  }

  async markRead(recipientId: string, notificationIds: string[]) {
    await NotificationModel.updateMany({ recipientId, _id: { $in: notificationIds } }, { $set: { isRead: true } }).exec();
  }

  async markAllRead(recipientId: string) {
    await NotificationModel.updateMany({ recipientId, isRead: false }, { $set: { isRead: true } }).exec();
  }
}
