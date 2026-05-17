"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import {
  getConversationMessages,
  getConversations,
  searchChatUsers,
  sendConversationMessage,
  startConversation as startConversationAction,
} from "@/features/chat/services/chat-api";
import type {
  ChatUser,
  ConversationItem,
  MessageItem,
} from "@/features/chat/types/chat";

export function useAdminChatWorkspace() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversations(ADMIN_USERNAME);
      const next = Array.isArray(data) ? data : [];
      setConversations(next);
      setSelectedConversation((current) => {
        if (!current) return next[0] || null;
        return next.find((item) => item.id === current.id) || next[0] || null;
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setError(null);
    try {
      const data = await getConversationMessages(conversationId, ADMIN_USERNAME);
      setMessages(Array.isArray(data) ? data : []);
      setConversations((current) =>
        current.map((item) =>
          item.id === conversationId ? { ...item, unread: 0 } : item,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load messages.");
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversation.id);
  }, [selectedConversation?.id]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchChatUsers(trimmed, ADMIN_USERNAME);
        setSearchResults(
          (Array.isArray(data) ? data : []).filter(
            (user: ChatUser) => user.username !== ADMIN_USERNAME,
          ),
        );
      } catch (e: any) {
        setError(e?.message || "Failed to search users.");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const startConversation = async (recipient: ChatUser) => {
    setError(null);
    setMessage(null);
    try {
      const data = await startConversationAction(
        ADMIN_USERNAME,
        recipient.username,
      );
      await loadConversations();
      setQuery("");
      setSearchResults([]);
      setMessage(`Conversation started with ${recipient.name}.`);
      if (data?.conversationId) {
        setSelectedConversation({
          id: data.conversationId,
          unread: 0,
          otherUser: recipient,
          lastMessage: null,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Failed to start conversation.");
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || (!messageText.trim() && !imageFile)) return;
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("senderIdentifier", ADMIN_USERNAME);
      if (messageText.trim()) form.append("text", messageText.trim());
      if (imageFile) form.append("image", imageFile);
      const data = await sendConversationMessage(selectedConversation.id, form);
      setMessages((current) => [...current, data]);
      setMessageText("");
      setImageFile(null);
      await loadConversations();
    } catch (e: any) {
      setError(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const unreadConversations = useMemo(
    () => conversations.filter((item) => item.unread > 0).length,
    [conversations],
  );

  return {
    apiUrl,
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    query,
    setQuery,
    searchResults,
    messageText,
    setMessageText,
    imageFile,
    setImageFile,
    loading,
    sending,
    error,
    setError,
    message,
    setMessage,
    startConversation,
    sendMessage,
    unreadConversations,
  };
}
