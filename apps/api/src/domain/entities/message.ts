import type { MessageStatus } from "@linkedin-clone/shared";

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  body: string;
  status: MessageStatus;
  sharedPostId?: string;
  sharedPostPostId?: string;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
