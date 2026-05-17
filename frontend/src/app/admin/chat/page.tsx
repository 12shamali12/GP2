"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useAdminChatWorkspace } from "./hooks/use-admin-chat-workspace";
import { AdminChatConversationPanel } from "./ui/admin-chat-conversation-panel";
import { AdminChatInboxPanel } from "./ui/admin-chat-inbox-panel";

export default function AdminChatPage() {
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
    messageTitle: "Admin chat",
    errorTitle: "Chat issue",
  });

  return (
    <AdminShell
      title="Admin Chat Desk"
      description="The admin account now has a real direct-message workspace, so approvals can move into conversation when needed."
    >
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <AdminChatInboxPanel
          conversations={conversations}
          selectedConversation={selectedConversation}
          query={query}
          searchResults={searchResults}
          loading={loading}
          unreadConversations={unreadConversations}
          onQueryChange={setQuery}
          onStartConversation={startConversation}
          onSelectConversation={setSelectedConversation}
        />

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
        />
      </div>
    </AdminShell>
  );
}
