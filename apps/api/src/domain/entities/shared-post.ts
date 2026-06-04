import type { SharedPostStatus } from "@linkedin-clone/shared";

export interface SharedPostEntity {
  id: string;
  senderId: string;
  receiverId: string;
  postId: string;
  message?: string;
  sentAt: Date;
  seenAt?: Date;
  status: SharedPostStatus;
  conversationId?: string;
  messageId?: string;
  createdAt: Date;
  updatedAt: Date;
}
