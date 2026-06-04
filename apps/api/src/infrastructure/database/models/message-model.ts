import { Schema, model, type HydratedDocument } from "mongoose";
import type { MessageEntity } from "#src/domain/entities/message.js";

export type MessageDocument = HydratedDocument<MessageEntity>;

const messageSchema = new Schema<MessageEntity>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    sharedPostId: String,
    sharedPostPostId: String,
    seenAt: Date
  },
  { timestamps: true }
);

export const MessageModel = model<MessageEntity>("Message", messageSchema);
