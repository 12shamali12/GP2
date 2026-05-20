"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import { useTranslation } from "@/features/i18n/language-provider";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminChatWorkspace } from "./hooks/use-admin-chat-workspace";
import { AdminChatConversationPanel } from "./ui/admin-chat-conversation-panel";
import { AdminChatInboxPanel } from "./ui/admin-chat-inbox-panel";
import type { ChatUser, ConversationItem } from "@/features/chat/types/chat";

export default function AdminChatPage() {
  const t = useTranslation();
  const {
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
  } = useAdminChatWorkspace();

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("admin.chat.toast_title"),
    errorTitle: t("admin.chat.toast_issue"),
  });

  // On phones the inbox + conversation cannot sit side by side, so we show
  // one at a time. `mobileView` only steers the lg-and-below layout; from lg
  // up both panels are always visible regardless of this value.
  const [mobileView, setMobileView] = useState<"inbox" | "conversation">(
    "inbox",
  );

  const handleSelectConversation = (conversation: ConversationItem) => {
    setSelectedConversation(conversation);
    setMobileView("conversation");
  };

  const handleStartConversation = (recipient: ChatUser) => {
    startConversation(recipient);
    setMobileView("conversation");
  };

  return (
    <AdminShell
      title={t("admin.chat.title")}
      description={t("admin.chat.description")}
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div
          className={`${mobileView === "inbox" ? "block" : "hidden"} lg:block`}
        >
          <AdminChatInboxPanel
            conversations={conversations}
            selectedConversation={selectedConversation}
            query={query}
            searchResults={searchResults}
            loading={loading}
            unreadConversations={unreadConversations}
            onQueryChange={setQuery}
            onStartConversation={handleStartConversation}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        <div
          className={`${
            mobileView === "conversation" ? "block" : "hidden"
          } lg:block`}
        >
          <AdminChatConversationPanel
            apiUrl={apiUrl}
            currentUsername={ADMIN_USERNAME}
            selectedConversation={selectedConversation}
            messages={messages}
            messageText={messageText}
            imageFile={imageFile}
            sending={sending}
            onMessageTextChange={setMessageText}
            onImageFileChange={setImageFile}
            onSendMessage={sendMessage}
            onBackToInbox={() => setMobileView("inbox")}
          />
        </div>
      </div>
    </AdminShell>
  );
}
