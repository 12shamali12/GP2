"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
import type { ChatUser, ConversationItem } from "@/features/chat/types/chat";

type AdminChatInboxPanelProps = {
  conversations: ConversationItem[];
  selectedConversation: ConversationItem | null;
  query: string;
  searchResults: ChatUser[];
  loading: boolean;
  unreadConversations: number;
  onQueryChange: (value: string) => void;
  onStartConversation: (recipient: ChatUser) => void;
  onSelectConversation: (conversation: ConversationItem) => void;
};

export function AdminChatInboxPanel({
  conversations,
  selectedConversation,
  query,
  searchResults,
  loading,
  unreadConversations,
  onQueryChange,
  onStartConversation,
  onSelectConversation,
}: AdminChatInboxPanelProps) {
  const t = useTranslation();
  const getConversationTitle = (conversation: ConversationItem) =>
    conversation.kind === "ROOM"
      ? conversation.title || t("admin.chat.shared_room")
      : conversation.otherUser?.name ||
        conversation.otherUser?.username ||
        t("admin.chat.conversation");

  const getConversationMeta = (conversation: ConversationItem) =>
    conversation.kind === "ROOM"
      ? conversation.description ||
        (conversation.group
          ? `${conversation.group.name} | ${conversation.group.semesterLabel || t("admin.chat.group_fallback")}`
          : t("admin.chat.shared_room"))
      : conversation.lastMessage?.text ||
        (conversation.lastMessage?.imageUrl
          ? t("admin.chat.image_tag")
          : t("admin.chat.start_chatting"));

  return (
    <div className="denty-panel-strong flex min-h-[34rem] max-h-[calc(100vh-8rem)] flex-col overflow-hidden p-4 sm:p-6 lg:min-h-[48rem] lg:max-h-[48rem]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="denty-kicker">{t("admin.chat.inbox")}</p>
          <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            {t("admin.chat.conversations")}
          </h2>
        </div>
        <span className="denty-pill shrink-0">
          {t("admin.chat.unread_count", { count: unreadConversations })}
        </span>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t("admin.chat.search_placeholder")}
        className="denty-field mt-4 text-sm"
      />

      {searchResults.length ? (
        <div className="mt-4 max-h-52 space-y-2 overflow-y-auto rounded-[24px] border border-white/12 bg-white/24 p-3">
          {searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onStartConversation(user)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/30 px-4 py-3 text-left transition hover:bg-white/42"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {user.name}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                  @{user.username}
                  {user.role ? ` | ${user.role}` : ""}
                  {user.doctorIdNumber ? ` | ${user.doctorIdNumber}` : ""}
                </p>
              </div>
              <span className="denty-pill shrink-0">{t("admin.chat.start")}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("admin.chat.loading")}
          </p>
        ) : null}

        <div className="space-y-3">
          {conversations.map((conversation) => {
            const active = selectedConversation?.id === conversation.id;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation)}
                className={`w-full cursor-pointer rounded-[24px] border p-4 text-left transition ${
                  active
                    ? "border-[rgba(137,219,255,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(226,238,246,0.34))]"
                    : "border-white/10 bg-white/24 hover:bg-white/34"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--foreground)]">
                      {getConversationTitle(conversation)}
                    </p>
                    <p className="mt-2 line-clamp-2 break-words text-sm text-[var(--muted-foreground)]">
                      {getConversationMeta(conversation)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {conversation.kind === "ROOM" ? (
                      <span className="rounded-full border border-white/12 bg-white/24 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.56)]">
                        {t("admin.chat.room")}
                      </span>
                    ) : conversation.otherUser?.id ? (
                      <Link
                        href={`/profiles/${conversation.otherUser.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-full border border-white/12 bg-white/24 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(10,22,40,0.56)] hover:bg-white/36"
                      >
                        {t("admin.chat.profile")}
                      </Link>
                    ) : null}
                    <span className="denty-pill">{conversation.unread}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {!loading && conversations.length === 0 && searchResults.length === 0 ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">{t("nav.chat")}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("admin.chat.no_conversations")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
