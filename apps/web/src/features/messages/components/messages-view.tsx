"use client";

import type { ChatConversation, ChatMessage } from "@linkedin-clone/shared";
import Link from "next/link";
import { CheckCheck, Circle, Send } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMessaging } from "@/features/messages/hooks/use-messaging";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function MessagesView() {
  const user = useAuthStore((state) => state.user);
  const { overview, activeConversation, messages, typingByConversation, sendMessage, isSending, selectConversation, sendTyping } =
    useMessaging();
  const [body, setBody] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  function submitMessage() {
    const text = body.trim();
    if (!text || !activeConversation) {
      return;
    }

    sendMessage({ body: text, conversation: activeConversation });
    setBody("");
    sendTyping(false);
  }

  function handleTyping(value: string) {
    setBody(value);
    sendTyping(Boolean(value.trim()));

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      setTimeout(() => {
        sendTyping(false);
      }, 800)
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid min-h-[calc(100vh-8rem)] p-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b bg-card lg:border-b-0 lg:border-r">
          <div className="border-b p-4">
            <h1 className="text-xl font-semibold">Messaging</h1>
            <p className="text-sm text-muted-foreground">Realtime one-to-one conversations</p>
          </div>
          <div className="max-h-[340px] overflow-y-auto lg:max-h-[calc(100vh-13rem)]">
            {overview.conversations.map((conversation) => (
              <ConversationButton
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversation?.id}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}
          </div>
        </aside>

        {activeConversation ? (
          <section className="flex min-h-[640px] flex-col">
            <ChatHeader conversation={activeConversation} isTyping={Boolean(typingByConversation[activeConversation.id])} />
            <div className="flex-1 overflow-y-auto bg-secondary/30 p-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                ))}
                {typingByConversation[activeConversation.id] ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex gap-1 rounded-full bg-card px-3 py-2">
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                    </span>
                    {activeConversation.participant.name} is typing
                  </div>
                ) : null}
              </div>
            </div>
            <form
              className="flex gap-2 border-t bg-card p-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage();
              }}
            >
              <Input
                value={body}
                onChange={(event) => handleTyping(event.target.value)}
                placeholder={`Message ${activeConversation.participant.name}`}
              />
              <Button size="icon" disabled={!body.trim() || isSending} aria-label="Send message">
                <Send />
              </Button>
            </form>
          </section>
        ) : (
          <div className="grid place-items-center p-8 text-center text-muted-foreground">Select a conversation</div>
        )}
      </CardContent>
    </Card>
  );
}

function ConversationButton({
  conversation,
  isActive,
  onClick
}: {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full gap-3 border-b p-4 text-left transition-colors hover:bg-secondary",
        isActive && "bg-secondary"
      )}
      onClick={onClick}
    >
      <PresenceAvatar conversation={conversation} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{conversation.participant.name}</p>
          <span className="text-xs text-muted-foreground">{formatTime(conversation.updatedAt)}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage?.body ?? conversation.participant.headline}</p>
      </div>
      {conversation.unreadCount ? <Badge>{conversation.unreadCount}</Badge> : null}
    </button>
  );
}

function ChatHeader({ conversation, isTyping }: { conversation: ChatConversation; isTyping: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b bg-card p-4">
      <PresenceAvatar conversation={conversation} />
      <div className="min-w-0">
        <h2 className="truncate font-semibold">{conversation.participant.name}</h2>
        <p className="truncate text-sm text-muted-foreground">
          {isTyping ? "Typing..." : conversation.participant.isOnline ? "Online now" : "Offline"}
        </p>
      </div>
    </div>
  );
}

function PresenceAvatar({ conversation }: { conversation: ChatConversation }) {
  return (
    <div className="relative">
      <Avatar className="size-12">
        <AvatarImage src={conversation.participant.avatarUrl} />
        <AvatarFallback>{initials(conversation.participant.name)}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute bottom-0 right-0 grid size-4 place-items-center rounded-full border-2 border-card",
          conversation.participant.isOnline ? "bg-accent" : "bg-muted"
        )}
      >
        <Circle className="size-2 fill-current text-card" />
      </span>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-4 py-2 text-sm shadow-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
        )}
      >
        <p className="leading-6">{message.body}</p>
        {message.sharedPost ? (
          <Link
            href={`/#post-${message.sharedPost.postId}`}
            className={cn(
              "mt-2 block rounded-md border px-3 py-2 text-xs font-medium",
              isOwn ? "border-primary-foreground/30 bg-primary-foreground/10" : "bg-secondary"
            )}
          >
            Open shared post
          </Link>
        ) : null}
        <div className={cn("mt-1 flex items-center justify-end gap-1 text-[11px]", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn ? (
            <>
              <CheckCheck className="size-3" />
              <span>{message.status === "seen" ? "Seen" : message.status}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
