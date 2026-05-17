import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";
import type { ChatUser, ConversationItem, MessageItem } from "@/features/chat/types/chat";

export const getConversations = (identifier: string) =>
  httpJson<ConversationItem[]>("/chat/conversations", {
    headers: { ...authHeaders() },
    query: { identifier },
  });

export const getConversationMessages = (conversationId: string, identifier: string) =>
  httpJson<MessageItem[]>(`/chat/${conversationId}/messages`, {
    headers: { ...authHeaders() },
    query: { identifier },
  });

export const searchChatUsers = (query: string, identifier?: string) =>
  httpJson<ChatUser[]>("/chat/search", {
    headers: { ...authHeaders() },
    query: { q: query, identifier },
  });

export const startConversation = (
  senderIdentifier: string,
  recipientIdentifier: string,
) =>
  httpJson<{ conversationId: string }>("/chat/start", {
    method: "POST",
    headers: { ...authHeaders() },
    body: { senderIdentifier, recipientIdentifier },
  });

export const sendConversationMessage = (
  conversationId: string,
  formData: FormData,
) =>
  httpJson<MessageItem>(`/chat/${conversationId}/messages`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
