import type { ConversationDocument } from "#src/infrastructure/database/models/conversation-model.js";
import type { MessageDocument } from "#src/infrastructure/database/models/message-model.js";

export interface MessageRepository {
  findConversationById(id: string): Promise<ConversationDocument | null>;
  findConversationByParticipants(userA: string, userB: string): Promise<ConversationDocument | null>;
  createConversation(participantIds: string[]): Promise<ConversationDocument>;
  listConversations(userId: string): Promise<ConversationDocument[]>;
  saveConversation(conversation: ConversationDocument): Promise<ConversationDocument>;
  createMessage(input: Partial<MessageDocument>): Promise<MessageDocument>;
  listMessages(conversationId: string, limit: number): Promise<MessageDocument[]>;
  findMessagesByIds(ids: string[]): Promise<MessageDocument[]>;
  saveMessage(message: MessageDocument): Promise<MessageDocument>;
  findLastMessage(conversationId: string): Promise<MessageDocument | null>;
}
