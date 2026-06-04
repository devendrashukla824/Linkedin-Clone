import type { FeedAuthor, NotificationType } from "@linkedin-clone/shared";

export interface NotificationEntity {
  id: string;
  recipientId: string;
  actor?: FeedAuthor;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  entityId?: string;
  entityType?: "post" | "comment" | "connection" | "job" | "shared_post" | "message";
  href?: string;
  createdAt: Date;
  updatedAt: Date;
}
