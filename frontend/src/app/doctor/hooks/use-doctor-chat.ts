"use client";

import type { Dispatch, SetStateAction } from "react";

type UseDoctorChatParams = {
  apiUrl: string;
  identifier: string;
  conversations: any[];
  selectedConversation: any | null;
  chatText: string;
  uploadingImage: boolean;
  setConversations: Dispatch<SetStateAction<any[]>>;
  setChatSearch: Dispatch<SetStateAction<string>>;
  setChatResults: Dispatch<SetStateAction<any[]>>;
  setSelectedConversation: Dispatch<SetStateAction<any | null>>;
  setChatMessages: Dispatch<SetStateAction<any[]>>;
  setChatText: Dispatch<SetStateAction<string>>;
  setChatUnreadCount: Dispatch<SetStateAction<number>>;
  setChatLoading: Dispatch<SetStateAction<boolean>>;
};

export function useDoctorChat({
  apiUrl,
  identifier,
  conversations,
  selectedConversation,
  chatText,
  uploadingImage,
  setConversations,
  setChatSearch,
  setChatResults,
  setSelectedConversation,
  setChatMessages,
  setChatText,
  setChatUnreadCount,
  setChatLoading,
}: UseDoctorChatParams) {
  const fetchConversations = async () => {
    if (!identifier) return;

    try {
      const response = await fetch(
        `${apiUrl}/chat/conversations?identifier=${encodeURIComponent(
          identifier
        )}`
      );

      const data = await response.json();

      if (response.ok) {
        setConversations(data || []);
      }
    } catch {
      /* ignore */
    }

    try {
      const response = await fetch(
        `${apiUrl}/chat/unread-count?identifier=${encodeURIComponent(
          identifier
        )}`
      );

      const data = await response.json();

      if (response.ok && typeof data === "number") {
        setChatUnreadCount(data);
      }
    } catch {
      /* ignore */
    }
  };

  const openConversation = async (conversation: any) => {
    if (!identifier) return;

    setSelectedConversation(conversation);

    try {
      const response = await fetch(
        `${apiUrl}/chat/${conversation.id}/messages?identifier=${encodeURIComponent(
          identifier
        )}`
      );

      const data = await response.json();

      if (response.ok) {
        setChatMessages(data || []);
      }
    } catch {
      /* ignore */
    }

    try {
      await fetch(`${apiUrl}/chat/${conversation.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
    } catch {
      /* ignore */
    }

    fetchConversations();
  };

  const searchUsers = async (term: string) => {
    setChatSearch(term);

    if (!term.trim()) {
      setChatResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/chat/search?q=${encodeURIComponent(term.trim())}&identifier=${encodeURIComponent(
          identifier,
        )}`
      );

      const data = await response.json();

      if (response.ok) {
        setChatResults(data || []);
      }
    } catch {
      /* ignore */
    }
  };

  const startChatWith = async (recipientIdentifier: string) => {
    if (!identifier) return;

    setChatLoading(true);

    try {
      const response = await fetch(`${apiUrl}/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderIdentifier: identifier,
          recipientIdentifier,
          text: chatText || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.conversationId) {
        await fetchConversations();

        const conversation =
          (conversations || []).find((item: any) => item.id === data.conversationId) ||
          { id: data.conversationId, otherUser: null };

        openConversation(conversation);
      }
    } catch {
      /* ignore */
    } finally {
      setChatLoading(false);
      setChatText("");
    }
  };

  const sendChatMessage = async (opts?: { file?: File }) => {
    if (!identifier || !selectedConversation) return;

    if (!chatText.trim() && !opts?.file) return;

    const form = opts?.file || uploadingImage ? new FormData() : null;

    if (form) {
      form.append("senderIdentifier", identifier);

      if (chatText.trim()) form.append("text", chatText.trim());
      if (opts?.file) form.append("image", opts.file);
    }

    setChatLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/chat/${selectedConversation.id}/messages`,
        {
          method: "POST",
          body: form
            ? form
            : JSON.stringify({
                senderIdentifier: identifier,
                text: chatText.trim(),
              }),
          headers: form ? undefined : { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setChatMessages((prev) => [...prev, data]);
        setChatText("");
        fetchConversations();
      }
    } catch {
      /* ignore */
    } finally {
      setChatLoading(false);
    }
  };

  return {
    fetchConversations,
    openConversation,
    searchUsers,
    startChatWith,
    sendChatMessage,
  };
}
