"use client";

import type { ChatConversation, ChatMessage, MessagingOverview } from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import { fetchMessagingOverview } from "@/features/messages/api/messages-api";
import { demoMessagingOverview } from "@/features/messages/data/mock-messages";
import { useAuthStore } from "@/stores/auth-store";

export const messagingKey = ["messages", "overview"] as const;

export function useMessaging() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user) ?? demoUser;
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;
  const [activeConversationId, setActiveConversationId] = useState<string>(demoMessagingOverview.activeConversation?.conversation.id ?? "");
  const [typingByConversation, setTypingByConversation] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

  const overviewQuery = useQuery({
    queryKey: messagingKey,
    queryFn: () => (isDemo ? Promise.resolve(demoMessagingOverview) : fetchMessagingOverview()),
    initialData: demoMessagingOverview,
    retry: false
  });

  const overview = overviewQuery.data;
  const activeConversation = useMemo(
    () => overview.conversations.find((conversation) => conversation.id === activeConversationId) ?? overview.conversations[0],
    [activeConversationId, overview.conversations]
  );
  const messages = useMemo(
    () => overview.activeConversation?.conversation.id === activeConversation?.id ? overview.activeConversation.messages : [],
    [activeConversation?.id, overview.activeConversation]
  );

  useEffect(() => {
    if (!activeConversation && overview.conversations[0]) {
      setActiveConversationId(overview.conversations[0].id);
    }
  }, [activeConversation, overview.conversations]);

  useEffect(() => {
    if (!accessToken || isDemo) {
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000", {
      auth: { token: accessToken },
      transports: ["websocket"]
    });
    socketRef.current = socket;

    socket.on("message:new", (message: ChatMessage) => {
      updateMessaging(queryClient, (current) => appendMessage(current, message, user.id));
    });
    socket.on("message:seen", ({ conversationId, messageIds, seenAt }) => {
      updateMessaging(queryClient, (current) => markSeen(current, conversationId, messageIds, seenAt));
    });
    socket.on("typing:update", ({ conversationId, isTyping }) => {
      setTypingByConversation((current) => ({ ...current, [conversationId]: isTyping }));
    });
    socket.on("presence:update", ({ userId, isOnline, lastSeenAt }) => {
      updateMessaging(queryClient, (current) => updatePresence(current, userId, isOnline, lastSeenAt));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, isDemo, queryClient, user.id]);

  const sendMutation = useMutation({
    mutationFn: async ({ body, conversation }: { body: string; conversation: ChatConversation }) => {
      if (isDemo) {
        return buildMessage(body, conversation.id, user.id, conversation.participant.id, "seen");
      }

      return new Promise<ChatMessage>((resolve, reject) => {
        socketRef.current?.emit(
          "message:send",
          { conversationId: conversation.id, receiverId: conversation.participant.id, body },
          (response: { success: boolean; message?: ChatMessage; error?: string }) => {
            if (response.success && response.message) {
              resolve(response.message);
              return;
            }
            reject(new Error(response.error ?? "Could not send message"));
          }
        );
      });
    },
    onMutate: async ({ body, conversation }) => {
      await queryClient.cancelQueries({ queryKey: messagingKey });
      const previous = queryClient.getQueryData<MessagingOverview>(messagingKey);
      const optimistic = buildMessage(body, conversation.id, user.id, conversation.participant.id, "sent", `temp-${Date.now()}`);
      updateMessaging(queryClient, (current) => appendMessage(current, optimistic, user.id));

      if (isDemo) {
        setTypingByConversation((current) => ({ ...current, [conversation.id]: true }));
        window.setTimeout(() => {
          setTypingByConversation((current) => ({ ...current, [conversation.id]: false }));
          const reply = buildMessage(
            "Looks good. The realtime states make this feel much closer to LinkedIn messaging.",
            conversation.id,
            conversation.participant.id,
            user.id,
            "delivered",
            `reply-${Date.now()}`
          );
          updateMessaging(queryClient, (current) => appendMessage(current, reply, user.id));
        }, 1000);
      }

      return { previous, tempId: optimistic.id };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagingKey, context.previous);
      }
    },
    onSuccess: (message, _input, context) => {
      updateMessaging(queryClient, (current) => replaceMessage(current, context?.tempId, message));
    }
  });

  function selectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    if (!isDemo) {
      socketRef.current?.emit("conversation:join", { conversationId });
    }
    const unreadIds = (overview.activeConversation?.messages ?? [])
      .filter((message) => message.receiverId === user.id && message.status !== "seen")
      .map((message) => message.id);
    if (unreadIds.length) {
      if (!isDemo) {
        socketRef.current?.emit("message:seen", { conversationId, messageIds: unreadIds });
      }
      updateMessaging(queryClient, (current) => markSeen(current, conversationId, unreadIds, new Date().toISOString()));
    }
  }

  function sendTyping(isTyping: boolean) {
    if (!activeConversation) {
      return;
    }

    if (isDemo) {
      return;
    }

    socketRef.current?.emit("typing:update", {
      conversationId: activeConversation.id,
      receiverId: activeConversation.participant.id,
      isTyping
    });
  }

  return {
    overview,
    activeConversation,
    messages,
    typingByConversation,
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    selectConversation,
    sendTyping
  };
}

function updateMessaging(queryClient: ReturnType<typeof useQueryClient>, updater: (overview: MessagingOverview) => MessagingOverview) {
  queryClient.setQueryData<MessagingOverview>(messagingKey, (overview) => (overview ? updater(overview) : overview));
}

function appendMessage(overview: MessagingOverview, message: ChatMessage, currentUserId: string): MessagingOverview {
  const conversations = overview.conversations.map((conversation) =>
    conversation.id === message.conversationId
      ? {
          ...conversation,
          lastMessage: message,
          unreadCount: message.receiverId === currentUserId ? conversation.unreadCount + 1 : conversation.unreadCount,
          updatedAt: message.createdAt
        }
      : conversation
  );

  return {
    ...overview,
    conversations,
    activeConversation:
      overview.activeConversation?.conversation.id === message.conversationId
        ? {
            conversation: conversations.find((conversation) => conversation.id === message.conversationId)!,
            messages: [...overview.activeConversation.messages, message]
          }
        : overview.activeConversation
  };
}

function replaceMessage(overview: MessagingOverview, tempId: string | undefined, message: ChatMessage): MessagingOverview {
  if (!tempId || !overview.activeConversation) {
    return overview;
  }

  return {
    ...overview,
    activeConversation: {
      ...overview.activeConversation,
      messages: overview.activeConversation.messages.map((current) => (current.id === tempId ? message : current))
    },
    conversations: overview.conversations.map((conversation) =>
      conversation.id === message.conversationId ? { ...conversation, lastMessage: message } : conversation
    )
  };
}

function markSeen(overview: MessagingOverview, conversationId: string, messageIds: string[], seenAt: string): MessagingOverview {
  return {
    ...overview,
    conversations: overview.conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
    ),
    activeConversation:
      overview.activeConversation?.conversation.id === conversationId
        ? {
            ...overview.activeConversation,
            messages: overview.activeConversation.messages.map((message) =>
              messageIds.includes(message.id) ? { ...message, status: "seen", seenAt } : message
            )
          }
        : overview.activeConversation
  };
}

function updatePresence(overview: MessagingOverview, userId: string, isOnline: boolean, lastSeenAt?: string): MessagingOverview {
  return {
    ...overview,
    conversations: overview.conversations.map((conversation) =>
      conversation.participant.id === userId
        ? {
            ...conversation,
            participant: { ...conversation.participant, isOnline, lastSeenAt }
          }
        : conversation
    )
  };
}

function buildMessage(
  body: string,
  conversationId: string,
  senderId: string,
  receiverId: string,
  status: ChatMessage["status"],
  id = `m-${Date.now()}`
): ChatMessage {
  return {
    id,
    conversationId,
    senderId,
    receiverId,
    body,
    status,
    createdAt: new Date().toISOString(),
    seenAt: status === "seen" ? new Date().toISOString() : undefined
  };
}
