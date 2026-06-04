import { Schema, model, type HydratedDocument } from "mongoose";
import type { ConversationEntity } from "#src/domain/entities/conversation.js";

export type ConversationDocument = HydratedDocument<ConversationEntity>;

const conversationSchema = new Schema<ConversationEntity>(
  {
    participantIds: { type: [String], required: true, index: true },
    lastMessageId: String,
    unreadBy: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const ConversationModel = model<ConversationEntity>("Conversation", conversationSchema);
