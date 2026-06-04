import { Schema, model, type HydratedDocument } from "mongoose";
import type { SharedPostEntity } from "#src/domain/entities/shared-post.js";

export type SharedPostDocument = HydratedDocument<SharedPostEntity>;

const sharedPostSchema = new Schema<SharedPostEntity>(
  {
    senderId: { type: String, ref: "User", required: true, index: true },
    receiverId: { type: String, ref: "User", required: true, index: true },
    postId: { type: String, ref: "Post", required: true, index: true },
    message: { type: String, trim: true, maxlength: 1200 },
    sentAt: { type: Date, default: Date.now, index: true },
    seenAt: Date,
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent", index: true },
    conversationId: String,
    messageId: String
  },
  { timestamps: true }
);

sharedPostSchema.index({ senderId: 1, sentAt: -1 });
sharedPostSchema.index({ receiverId: 1, sentAt: -1 });
sharedPostSchema.index({ postId: 1, sentAt: -1 });

sharedPostSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const SharedPostModel = model<SharedPostEntity>("SharedPost", sharedPostSchema);
