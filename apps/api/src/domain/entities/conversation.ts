export interface ConversationEntity {
  id: string;
  participantIds: string[];
  lastMessageId?: string;
  unreadBy: string[];
  createdAt: Date;
  updatedAt: Date;
}
