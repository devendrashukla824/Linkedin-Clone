import type { ChatConversation, ChatMessage, MessagingOverview } from "@linkedin-clone/shared";
import type { MessageRepository } from "#src/domain/repositories/message-repository.js";
import type { UserRepository } from "#src/domain/repositories/user-repository.js";
import type { ConversationDocument } from "#src/infrastructure/database/models/conversation-model.js";
import type { MessageDocument } from "#src/infrastructure/database/models/message-model.js";
import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";
import { AppError } from "#src/shared/errors/app-error.js";

export class MessageUseCases {
  constructor(
    private readonly messages: MessageRepository,
    private readonly users: UserRepository
  ) {}

  async overview(userId: string): Promise<MessagingOverview> {
    const conversations = await this.messages.listConversations(userId);
    const chatConversations = await Promise.all(conversations.map((conversation) => this.toChatConversation(conversation, userId)));
    const activeConversation = chatConversations[0]
      ? {
          conversation: chatConversations[0],
          messages: await this.listMessages(chatConversations[0].id, userId)
        }
      : undefined;

    return { conversations: chatConversations, activeConversation };
  }

  async listMessages(conversationId: string, userId: string) {
    const conversation = await this.requireConversation(conversationId, userId);
    const messages = await this.messages.listMessages(conversation.id, 60);
    return messages.reverse().map((message) => this.toChatMessage(message));
  }

  async sendMessage(input: {
    conversationId?: string;
    senderId: string;
    receiverId: string;
    body: string;
    sharedPostId?: string;
    sharedPostPostId?: string;
  }) {
    const body = input.body.trim();
    if (!body || body.length > 2000) {
      throw new AppError(400, "Message must be between 1 and 2000 characters");
    }

    const receiver = await this.users.findById(input.receiverId);
    if (!receiver) {
      throw new AppError(404, "Message receiver not found");
    }

    let conversation = input.conversationId
      ? await this.requireConversation(input.conversationId, input.senderId)
      : await this.messages.findConversationByParticipants(input.senderId, input.receiverId);

    if (conversation && !conversation.participantIds.includes(input.receiverId)) {
      throw new AppError(403, "Message receiver is not part of this conversation");
    }

    if (!conversation) {
      conversation = await this.messages.createConversation([input.senderId, input.receiverId]);
    }

    const message = await this.messages.createMessage({
      conversationId: conversation.id,
      senderId: input.senderId,
      receiverId: input.receiverId,
      body,
      status: "delivered",
      sharedPostId: input.sharedPostId,
      sharedPostPostId: input.sharedPostPostId
    });

    conversation.lastMessageId = message.id;
    conversation.unreadBy = addUnique(conversation.unreadBy, input.receiverId);
    await this.messages.saveConversation(conversation);
    return this.toChatMessage(message);
  }

  async markSeen(conversationId: string, userId: string, messageIds: string[]) {
    const conversation = await this.requireConversation(conversationId, userId);
    const messages = await this.messages.findMessagesByIds(messageIds);
    const seenAt = new Date();

    await Promise.all(
      messages
        .filter((message) => message.receiverId === userId && message.conversationId === conversation.id)
        .map((message) => {
          message.status = "seen";
          message.seenAt = seenAt;
          return this.messages.saveMessage(message);
        })
    );

    conversation.unreadBy = conversation.unreadBy.filter((id) => id !== userId);
    await this.messages.saveConversation(conversation);

    return { conversationId, messageIds, seenAt: seenAt.toISOString() };
  }

  private async requireConversation(conversationId: string, userId: string) {
    const conversation = await this.messages.findConversationById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new AppError(404, "Conversation not found");
    }

    return conversation;
  }

  private async toChatConversation(conversation: ConversationDocument, currentUserId: string): Promise<ChatConversation> {
    const participantId = conversation.participantIds.find((id) => id !== currentUserId);
    if (!participantId) {
      throw new AppError(500, "Conversation participant could not be resolved");
    }

    const participant = await this.users.findById(participantId);
    if (!participant) {
      throw new AppError(500, "Conversation participant could not be loaded");
    }

    const lastMessage = await this.messages.findLastMessage(conversation.id);

    return {
      id: conversation.id,
      participant: toParticipant(participant, false),
      lastMessage: lastMessage ? this.toChatMessage(lastMessage) : undefined,
      unreadCount: conversation.unreadBy.includes(currentUserId) ? 1 : 0,
      updatedAt: conversation.updatedAt.toISOString()
    };
  }

  private toChatMessage(message: MessageDocument): ChatMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      body: message.body,
      status: message.status,
      sharedPost:
        message.sharedPostId && message.sharedPostPostId
          ? {
              id: message.sharedPostId,
              postId: message.sharedPostPostId
            }
          : undefined,
      createdAt: message.createdAt.toISOString(),
      seenAt: message.seenAt?.toISOString()
    };
  }
}

export function toParticipant(user: UserDocument, isOnline: boolean) {
  return {
    id: user.id,
    name: user.name,
    headline: user.headline,
    avatarUrl: user.avatarUrl,
    isOnline
  };
}

function addUnique(values: string[] = [], value: string) {
  return values.includes(value) ? values : [...values, value];
}
