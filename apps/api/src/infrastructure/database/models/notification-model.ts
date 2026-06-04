import { Schema, model, type HydratedDocument } from "mongoose";
import type { NotificationEntity } from "#src/domain/entities/notification.js";

export type NotificationDocument = HydratedDocument<NotificationEntity>;

const actorSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    headline: { type: String, required: true },
    avatarUrl: String
  },
  { _id: false }
);

const notificationSchema = new Schema<NotificationEntity>(
  {
    recipientId: { type: String, ref: "User", required: true, index: true },
    actor: actorSchema,
    type: {
      type: String,
      enum: [
        "post_like",
        "post_comment",
        "post_repost",
        "post_share",
        "connection_request",
        "connection_accepted",
        "job_application",
        "system"
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    entityId: String,
    entityType: { type: String, enum: ["post", "comment", "connection", "job", "shared_post", "message"] },
    href: String
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const NotificationModel = model<NotificationEntity>("Notification", notificationSchema);
