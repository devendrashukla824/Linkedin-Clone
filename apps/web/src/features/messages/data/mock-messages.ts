import type { ChatConversation, ChatMessage, MessagingOverview } from "@linkedin-clone/shared";
import { demoUser } from "@/features/auth/data/demo-user";

export const demoConversations: ChatConversation[] = [
  {
    id: "chat-1",
    participant: {
      id: "msg-1",
      name: "Priya Menon",
      headline: "Technical Recruiter at HireLoop",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
      isOnline: true
    },
    unreadCount: 1,
    updatedAt: "2026-06-02T16:15:00.000Z"
  },
  {
    id: "chat-2",
    participant: {
      id: "msg-2",
      name: "Samar Jain",
      headline: "Frontend Engineer at CraftUI",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces",
      isOnline: false,
      lastSeenAt: "2026-06-02T13:45:00.000Z"
    },
    unreadCount: 0,
    updatedAt: "2026-06-02T12:10:00.000Z"
  },
  {
    id: "chat-3",
    participant: {
      id: "msg-3",
      name: "Aisha Khan",
      headline: "Product Manager | B2B Platforms",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
      isOnline: true
    },
    unreadCount: 0,
    updatedAt: "2026-06-01T17:20:00.000Z"
  }
];

export const demoMessagesByConversation: Record<string, ChatMessage[]> = {
  "chat-1": [
    {
      id: "m-1",
      conversationId: "chat-1",
      senderId: "msg-1",
      receiverId: demoUser.id,
      body: "Hi Devendra, I saw your LinkedIn clone project. The profile and feed work look strong.",
      status: "seen",
      createdAt: "2026-06-02T16:10:00.000Z",
      seenAt: "2026-06-02T16:11:00.000Z"
    },
    {
      id: "m-2",
      conversationId: "chat-1",
      senderId: demoUser.id,
      receiverId: "msg-1",
      body: "Thank you! I am adding real-time messaging now.",
      status: "seen",
      createdAt: "2026-06-02T16:12:00.000Z",
      seenAt: "2026-06-02T16:13:00.000Z"
    },
    {
      id: "m-3",
      conversationId: "chat-1",
      senderId: "msg-1",
      receiverId: demoUser.id,
      body: "Nice. Add typing and seen states; those details make it feel complete.",
      status: "delivered",
      createdAt: "2026-06-02T16:15:00.000Z"
    }
  ],
  "chat-2": [
    {
      id: "m-4",
      conversationId: "chat-2",
      senderId: "msg-2",
      receiverId: demoUser.id,
      body: "Can you share the repo structure later?",
      status: "seen",
      createdAt: "2026-06-02T12:10:00.000Z",
      seenAt: "2026-06-02T12:12:00.000Z"
    }
  ],
  "chat-3": [
    {
      id: "m-5",
      conversationId: "chat-3",
      senderId: demoUser.id,
      receiverId: "msg-3",
      body: "I would like your feedback on the networking screen.",
      status: "seen",
      createdAt: "2026-06-01T17:20:00.000Z",
      seenAt: "2026-06-01T17:25:00.000Z"
    }
  ]
};

export const demoMessagingOverview: MessagingOverview = {
  conversations: demoConversations.map((conversation) => ({
    ...conversation,
    lastMessage: demoMessagesByConversation[conversation.id]?.at(-1)
  })),
  activeConversation: {
    conversation: {
      ...demoConversations[0],
      lastMessage: demoMessagesByConversation["chat-1"].at(-1)
    },
    messages: demoMessagesByConversation["chat-1"]
  }
};
