import type { MessageRepository } from "#src/domain/repositories/message-repository.js";
import { ConversationModel, type ConversationDocument } from "#src/infrastructure/database/models/conversation-model.js";
import { MessageModel, type MessageDocument } from "#src/infrastructure/database/models/message-model.js";

export class MongoMessageRepository implements MessageRepository {
  findConversationById(id: string) {
    return ConversationModel.findById(id).exec();
  }

  findConversationByParticipants(userA: string, userB: string) {
    return ConversationModel.findOne({ participantIds: { $all: [userA, userB], $size: 2 } }).exec();
  }

  createConversation(participantIds: string[]) {
    return ConversationModel.create({ participantIds, unreadBy: [] });
  }

  listConversations(userId: string) {
    return ConversationModel.find({ participantIds: userId }).sort({ updatedAt: -1 }).exec();
  }

  saveConversation(conversation: ConversationDocument) {
    return conversation.save();
  }

  createMessage(input: Partial<MessageDocument>) {
    return MessageModel.create(input);
  }

  listMessages(conversationId: string, limit: number) {
    return MessageModel.find({ conversationId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  findMessagesByIds(ids: string[]) {
    return MessageModel.find({ _id: { $in: ids } }).exec();
  }

  saveMessage(message: MessageDocument) {
    return message.save();
  }

  findLastMessage(conversationId: string) {
    return MessageModel.findOne({ conversationId }).sort({ createdAt: -1 }).exec();
  }
}
