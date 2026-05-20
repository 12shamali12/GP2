"use client";

import Link from "next/link";
import { useTranslation } from "@/features/i18n/language-provider";
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
  /** Returns to the inbox on the mobile one-at-a-time layout. */
  onBackToInbox?: () => void;
};

/** Shared panel height: capped to the viewport on mobile, fixed on desktop. */
const panelHeightClass =
  "min-h-[34rem] max-h-[calc(100vh-8rem)] lg:min-h-[48rem] lg:max-h-[48rem]";

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
  onBackToInbox,
}: AdminChatConversationPanelProps) {
  const t = useTranslation();
  if (!selectedConversation) {
    return (
      <div
        className={`denty-panel-strong flex ${panelHeightClass} flex-col overflow-hidden p-4 sm:p-6`}
      >
        {onBackToInbox ? (
          <button
            type="button"
            onClick={onBackToInbox}
            className="denty-button-secondary mb-4 inline-flex min-h-[2.75rem] items-center justify-center self-start px-4 py-2 text-sm font-semibold lg:hidden"
          >
            {t("admin.chat.inbox")}
          </button>
        ) : null}
        <div className="denty-placeholder flex h-full w-full items-center justify-center p-5">
          <div>
            <p className="denty-kicker">{t("nav.chat")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.chat.empty_select")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRoom = selectedConversation.kind === "ROOM";
  const title = isRoom
    ? selectedConversation.title || t("admin.chat.shared_room")
    : selectedConversation.otherUser?.name ||
      selectedConversation.otherUser?.username ||
      t("admin.chat.conversation");
  const subtitle = isRoom
    ? selectedConversation.description ||
      (selectedConversation.group
        ? `${selectedConversation.group.name} | ${
            selectedConversation.group.semesterLabel ||
            t("admin.chat.group_fallback")
          }`
        : t("admin.chat.shared_room"))
    : selectedConversation.otherUser?.phone ||
      selectedConversation.otherUser?.email ||
      selectedConversation.otherUser?.username ||
      "";

  return (
    <div
      className={`denty-panel-strong flex ${panelHeightClass} flex-col overflow-hidden p-4 sm:p-6`}
    >
      {onBackToInbox ? (
        <button
          type="button"
          onClick={onBackToInbox}
          className="denty-button-secondary mb-4 inline-flex min-h-[2.75rem] items-center justify-center self-start px-4 py-2 text-sm font-semibold lg:hidden"
        >
          {t("admin.chat.inbox")}
        </button>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-b border-white/12 pb-4 sm:gap-4">
        {isRoom ? (
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)] sm:h-14 sm:w-14">
              #
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {title}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </div>
        ) : selectedConversation.otherUser?.id ? (
          <Link
            href={`/profiles/${selectedConversation.otherUser.id}`}
            className="flex min-w-0 items-center gap-3 sm:gap-4"
          >
            {selectedConversation.otherUser?.avatar ? (
              <img
                src={selectedConversation.otherUser.avatar}
                alt={selectedConversation.otherUser?.name || "user"}
                className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)] sm:h-14 sm:w-14">
                {(selectedConversation.otherUser?.name || "U")[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-[var(--foreground)] hover:text-[rgba(7,111,133,0.96)] sm:text-xl">
                {title}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,111,133,0.14)] text-lg font-semibold text-[var(--foreground)] sm:h-14 sm:w-14">
              {(selectedConversation.otherUser?.name || "U")[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {title}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
          </div>
        )}
        {!isRoom && selectedConversation.otherUser?.id ? (
          <Link
            href={`/profiles/${selectedConversation.otherUser.id}`}
            className="denty-pill shrink-0 hover:bg-white/36"
          >
            {t("admin.chat.profile")}
          </Link>
        ) : (
          <span className="denty-pill shrink-0">
            {isRoom ? t("admin.chat.room") : t("admin.chat.direct")}
          </span>
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
                className={`max-w-[85%] break-words rounded-[24px] border px-4 py-3 shadow-[0_18px_38px_rgba(7,18,34,0.12)] sm:max-w-[72%] ${
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
                    {t("admin.chat.open_image")}
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
            <p className="denty-kicker">{t("admin.chat.conversation")}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("admin.chat.no_messages")}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/12 pt-5">
        <textarea
          value={messageText}
          onChange={(e) => onMessageTextChange(e.target.value)}
          className="denty-field min-h-[110px] text-sm"
          placeholder={
            isRoom
              ? t("admin.chat.write_room")
              : t("admin.chat.write_message")
          }
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/26 px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageFileChange(e.target.files?.[0] || null)}
            />
            <span className="truncate">
              {imageFile ? imageFile.name : t("admin.chat.attach_image")}
            </span>
          </label>
          <button
            type="button"
            disabled={sending}
            onClick={onSendMessage}
            className="denty-button-primary px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending
              ? t("admin.chat.sending")
              : t("admin.chat.send_message")}
          </button>
        </div>
      </div>
    </div>
  );
}
