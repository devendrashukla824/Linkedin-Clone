import type { ChatMessage, MessagingOverview } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export function fetchMessagingOverview() {
  return apiClient<MessagingOverview>("/messages");
}

export function fetchConversationMessages(conversationId: string) {
  return apiClient<ChatMessage[]>(`/messages/${conversationId}/messages`);
}
