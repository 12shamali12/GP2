"use client";

import Link from "next/link";
import type {
  ConversationItem,
  MessageItem,
} from "@/features/chat/types/chat";

type AdminChatConversationPanelProps = {
  apiUrl: string;
  currentUsername: string;
  selectedConversation: ConversationItem | null;
  messages: MessageItem[];
  messageText: string;
  imageFile: File | null;
  sending: boolean;
  onMessageTextChange: (value: string) => void;
  onImageFileChange: (file: File | null) => void;
  onSendMessage: () => void;
};

export function AdminChatConversationPanel({
  apiUrl,
  currentUsername,
  selectedConversation,
  messages,
  messageText,
  imageFile,
  sending,
  onMessageTextChange,
  onImageFileChange,
  onSendMessage,
}: AdminChatConversationPanelProps) {
  if (!selectedConversation) {
    return (
      <div className="denty-panel-strong flex min-h-[48rem] max-h-[48rem] overflow-hidden p-6">
        <div className="denty-placeholder flex h-full w-full items-center justify-center p-5">
          <div>
            <p className="denty-kicker">Chat</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Select a conversation or search for a user to start chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRoom = selectedConversation.kind === "ROOM";
  const title = isRoom
    ? selectedConversation.title || "Shared room"
    : selectedConversation.otherUser?.name ||
      selectedConversation.otherUser?.username ||
      "Conversation";
  const subtitle = isRoom
    ? selectedConversation.description ||
      (selectedConversation.group
        ? `${selectedConversation.group.name} | ${
            selectedConversation.group.semesterLabel || "Group"
          }`
        : "Shared room")
    : selectedConversation.otherUser?.phone ||
      selectedConversation.otherUser?.email ||
      selectedConversation.otherUser?.username ||
      "";

  return (
    <div className="denty-panel-strong flex min-h-[48rem] max-h-[48rem] flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-4">
        {isRoom ? (
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)]">
              #
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </div>
        ) : selectedConversation.otherUser?.id ? (
          <Link
            href={`/profiles/${selectedConversation.otherUser.id}`}
            className="flex items-center gap-4"
          >
            {selectedConversation.otherUser?.avatar ? (
              <img
                src={selectedConversation.otherUser.avatar}
                alt={selectedConversation.otherUser?.name || "user"}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)]">
                {(selectedConversation.otherUser?.name || "U")[0]}
              </div>
            )}
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)]">
                {title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)]">
              {(selectedConversation.otherUser?.name || "U")[0]}
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </div>
        )}
        {!isRoom && selectedConversation.otherUser?.id ? (
          <Link
            href={`/profiles/${selectedConversation.otherUser.id}`}
            className="denty-pill hover:bg-white/36"
          >
            Profile
          </Link>
        ) : (
          <span className="denty-pill">{isRoom ? "Room" : "Direct"}</span>
        )}
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((item, index) => {
          const mine = item.sender.username === currentUsername;
          const showSender =
            index === 0 || messages[index - 1].sender.username !== item.sender.username;
          return (
            <div
              key={item.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[72%] rounded-[24px] border px-4 py-3 shadow-[0_18px_38px_rgba(7,18,34,0.12)] ${
                  mine
                    ? "border-[rgba(7,111,133,0.18)] bg-[linear-gradient(135deg,rgba(7,111,133,0.96),rgba(11,130,148,0.9))] text-white"
                    : "border-white/10 bg-white/26 text-[var(--foreground)]"
                }`}
              >
                {!mine && showSender ? (
                  <div className="mb-2 flex items-center gap-2">
                    {item.sender.id ? (
                      <Link
                        href={`/profiles/${item.sender.id}`}
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.48)] hover:text-[var(--foreground)]"
                      >
                        {item.sender.name}
                      </Link>
                    ) : (
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(10,22,40,0.48)]">
                        {item.sender.name}
                      </p>
                    )}
                  </div>
                ) : null}
                {item.text ? <p className="text-sm leading-7">{item.text}</p> : null}
                {item.imageUrl ? (
                  <a
                    href={`${apiUrl}${item.imageUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-[16px] border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold"
                  >
                    Open image
                  </a>
                ) : null}
                <p
                  className={`mt-2 text-[11px] ${
                    mine ? "text-white/74" : "text-[rgba(10,22,40,0.48)]"
                  }`}
                >
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}

        {messages.length === 0 ? (
          <div className="denty-placeholder p-5">
            <p className="denty-kicker">Conversation</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/12 pt-5">
        <textarea
          value={messageText}
          onChange={(e) => onMessageTextChange(e.target.value)}
          className="denty-field min-h-[110px] text-sm"
          placeholder={isRoom ? "Write to the room" : "Write a message"}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/26 px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageFileChange(e.target.files?.[0] || null)}
            />
            {imageFile ? imageFile.name : "Attach image"}
          </label>
          <button
            type="button"
            disabled={sending}
            onClick={onSendMessage}
            className="denty-button-primary px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send message"}
          </button>
        </div>
      </div>
    </div>
  );
}
