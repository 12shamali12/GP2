"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicProfile } from "@/features/profiles/hooks/use-public-profile";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { ComingSoonModal } from "@/features/ui/components/coming-soon-modal";
import { SupervisorWorkspacePanel } from "@/features/supervision/components/supervisor-workspace-panel";
import type { SupervisorWorkspaceData } from "@/features/supervision/types";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useSupervisorBootstrap } from "./hooks/use-supervisor-bootstrap";
import { useSupervisorChat } from "./hooks/use-supervisor-chat";
import { useSupervisorNotifications } from "./hooks/use-supervisor-notifications";
import { useSupervisorProfileEditor } from "./hooks/use-supervisor-profile-editor";
import { SupervisorCalendarView } from "./ui/supervisor-calendar-view";
import { SupervisorChatWorkspace } from "./ui/supervisor-chat-workspace";
import { SupervisorNotificationsView } from "./ui/supervisor-notifications-view";
import { SupervisorProfilePanel } from "./ui/supervisor-profile-panel";
import { SupervisorSideRail } from "./ui/supervisor-side-rail";

type SupervisorSurface =
  | "overview"
  | "profile"
  | "notifications"
  | "calendar"
  | "chat";

export default function SupervisorPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [activeSurface, setActiveSurface] = useState<SupervisorSurface>("overview");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    id?: string;
    name?: string;
    email?: string | null;
  phone?: string | null;
  role?: string;
  username?: string;
  avatar?: string | null;
  bio?: string | null;
  }>({});
  const [workspacePreview, setWorkspacePreview] = useState<SupervisorWorkspaceData | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [nameEditable, setNameEditable] = useState(false);
  const [phoneEditable, setPhoneEditable] = useState(false);
  const [bioEditable, setBioEditable] = useState(false);
  const [pwdEditable, setPwdEditable] = useState(false);
  const [avatarData, setAvatarData] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatResults, setChatResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [comingSoon, setComingSoon] = useState<{
    title: string;
    description: string;
    bullets: string[];
  } | null>(null);

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Supervisor profile",
    errorTitle: "Supervisor profile",
  });

  const identifier = useMemo(
    () => user.id || user.email || user.phone || user.username || "",
    [user],
  );

  const {
    fetchConversations,
    searchUsers,
    openConversation,
    startChatWith,
    sendConversationMessage,
  } = useSupervisorChat({
    apiUrl: API_URL,
    identifier,
    chatText,
    setConversations,
    setChatSearch,
    setChatResults,
    setSelectedConversation,
    setChatMessages,
    setChatText,
    setChatUnreadCount,
    setChatLoading,
  });

  useSupervisorBootstrap({
    apiUrl: API_URL,
    user,
    identifier,
    fetchConversations,
    setUser,
    setEditName,
    setEditPhone,
    setEditBio,
    setAvatarData,
  });

  const {
    unreadNotifications,
    loadNotifications,
    deleteNotification,
    markAllNotificationsRead,
    handleNotificationClick,
    deleteAllNotifications,
  } = useSupervisorNotifications({
    apiUrl: API_URL,
    identifier,
    notifications,
    setNotifications,
    onRequestNotificationOpen: () => setActiveSurface("overview"),
  });

  const { showSave, handleAvatarPick, saveProfile } = useSupervisorProfileEditor({
    apiUrl: API_URL,
    identifier,
    user,
    editName,
    editPhone,
    editBio,
    avatarData,
    oldPassword,
    newPassword,
    confirmPassword,
    nameEditable,
    phoneEditable,
    bioEditable,
    pwdEditable,
    setUser,
    setAvatarData,
    setEditBio,
    setOldPassword,
    setNewPassword,
    setConfirmPassword,
    setNameEditable,
    setPhoneEditable,
    setBioEditable,
    setPwdEditable,
    maxAvatarBase64Len: 1_800_000,
    maxAvatarBytes: 1.5 * 1024 * 1024,
    setError,
    setMessage,
  });

  const {
    profile: publicProfile,
    loading: publicProfileLoading,
    refresh: refreshPublicProfile,
  } = usePublicProfile({
    targetId: user.id,
    viewerIdentifier: identifier,
    enabled: Boolean(user.id && identifier),
  });

  useEffect(() => {
    if (activeSurface === "chat" && conversations.length === 0) {
      void fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurface, conversations.length]);

  useEffect(() => {
    if (!identifier) return;
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  const handleAttachChatImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event: any) => {
      const file = event?.target?.files?.[0];
      if (!file) return;
      void sendConversationMessage(selectedConversation, { file });
    };
    input.click();
  };

  const prettifyBody = (text: string) =>
    text
      .replace(/\s+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();

  const surfaceMeta: Record<
    SupervisorSurface,
    { eyebrow: string; title: string; description: string; badges: string[] }
  > = {
    overview: {
      eyebrow: "Workspace",
      title: "Supervisor clinical desk",
      description:
        "Review students, clinics, reports, tasks, and exams from one structured supervision workspace.",
      badges: [
        `${workspacePreview?.stats.supervisedDoctors || 0} students`,
        `${workspacePreview?.stats.pendingReports || 0} reports`,
        `${workspacePreview?.stats.groups || 0} groups`,
      ],
    },
    profile: {
      eyebrow: "Identity",
      title: "Supervisor profile",
      description:
        "Update your supervisor identity, contact details, and account credentials without leaving the main page.",
      badges: ["Account", "Security", "Profile"],
    },
    notifications: {
      eyebrow: "Alerts",
      title: "Notification center",
      description:
        "Read and action supervisor updates from one visible stream instead of opening drawer overlays.",
      badges: [`${unreadNotifications} unread`, "Inbox", "Signals"],
    },
    calendar: {
      eyebrow: "Schedule",
      title: "Calendar and clinic coverage",
      description:
        "See assigned clinic duties and upcoming exams in one supervision calendar view.",
      badges: [
        `${workspacePreview?.clinicOverview.length || 0} duties`,
        `${workspacePreview?.upcomingExams.length || 0} exams`,
        "Coverage",
      ],
    },
    chat: {
      eyebrow: "Communication",
      title: "Chat and room workspace",
      description:
        "Search, open, and continue direct conversations and shared rooms from an always-visible supervisor desk.",
      badges: ["Direct chat", "Rooms", "Attachments"],
    },
  };

  const currentSurfaceMeta = surfaceMeta[activeSurface];

  return (
    <>
      <main className="denty-screen admin-suite-screen relative px-4 py-5 lg:pl-0 lg:pr-5 lg:py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,113,132,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(18,30,47,0.24),transparent_34%)]" />
          <div className="frozen-float absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-[rgba(95,113,132,0.22)] blur-3xl" />
          <div
            className="frozen-float absolute bottom-[8%] right-[6%] h-52 w-52 rounded-full bg-[rgba(18,30,47,0.2)] blur-3xl"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            className="frozen-float absolute left-[42%] top-[20%] h-28 w-28 rounded-[2rem] border border-white/18 bg-white/10 backdrop-blur-xl"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="denty-shell denty-dashboard-layout relative mx-0 max-w-none space-y-6 lg:space-y-0">
          <SupervisorSideRail
            userName={user.name || "Supervisor"}
            activeView={activeSurface}
            unreadNotifications={unreadNotifications}
            chatUnreadCount={chatUnreadCount}
            onOverview={() => setActiveSurface("overview")}
            onProfile={() => setActiveSurface("profile")}
            onNotifications={() => setActiveSurface("notifications")}
            onCalendar={() => setActiveSurface("calendar")}
            onChat={() => setActiveSurface("chat")}
            onComingSoon={setComingSoon}
          />

          <section className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] px-7 py-7 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] md:px-9 md:py-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BrandMark className="h-14 w-14 frozen-float" />
                    <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.64)]">
                      Supervisor workspace
                    </span>
                  </div>

                  <div>
                    <p className="denty-kicker">{currentSurfaceMeta.eyebrow}</p>
                    <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                      {currentSurfaceMeta.title}
                    </h1>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                      {currentSurfaceMeta.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {currentSurfaceMeta.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(10,22,40,0.62)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={activeSurface === "overview" ? "" : "hidden"}>
              <SupervisorWorkspacePanel
                apiUrl={API_URL}
                identifier={identifier}
                onWorkspaceChange={setWorkspacePreview}
              />
            </div>

            <div className={activeSurface === "profile" ? "" : "hidden"}>
              <SupervisorProfilePanel
                user={user}
                editName={editName}
                editPhone={editPhone}
                oldPassword={oldPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showOldPwd={showOldPwd}
                showNewPwd={showNewPwd}
                nameEditable={nameEditable}
                phoneEditable={phoneEditable}
                bioEditable={bioEditable}
                pwdEditable={pwdEditable}
                avatarData={avatarData}
                publicProfile={publicProfile}
                publicProfileLoading={publicProfileLoading}
                editBio={editBio}
                showSave={showSave}
                onAvatarPick={handleAvatarPick}
                onBack={() => setActiveSurface("overview")}
                onNameEditableToggle={() => setNameEditable((value) => !value)}
                onPhoneEditableToggle={() => setPhoneEditable((value) => !value)}
                onBioEditableToggle={() => setBioEditable((value) => !value)}
                onPasswordEditableToggle={() => setPwdEditable((value) => !value)}
                onEditNameChange={setEditName}
                onEditPhoneChange={setEditPhone}
                onEditBioChange={setEditBio}
                onOldPasswordChange={setOldPassword}
                onNewPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowOldPasswordToggle={() => setShowOldPwd((value) => !value)}
                onShowNewPasswordToggle={() => setShowNewPwd((value) => !value)}
                onSave={async () => {
                  await saveProfile();
                  await refreshPublicProfile();
                }}
              />
            </div>

            <div className={activeSurface === "notifications" ? "" : "hidden"}>
              <SupervisorNotificationsView
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                prettifyBody={prettifyBody}
                onMarkAllRead={markAllNotificationsRead}
                onDeleteAll={deleteAllNotifications}
                onNotificationClick={handleNotificationClick}
                onDeleteNotification={deleteNotification}
                onGoToWorkspace={() => setActiveSurface("overview")}
              />
            </div>

            <div className={activeSurface === "calendar" ? "" : "hidden"}>
              <SupervisorCalendarView workspace={workspacePreview} />
            </div>

            <div className={activeSurface === "chat" ? "" : "hidden"}>
              <SupervisorChatWorkspace
                apiUrl={API_URL}
                userId={user.id}
                chatSearch={chatSearch}
                chatResults={chatResults}
                conversations={conversations}
                selectedConversation={selectedConversation}
                chatMessages={chatMessages}
                chatText={chatText}
                chatLoading={chatLoading}
                onSearchChange={searchUsers}
                onStartChatWith={startChatWith}
                onOpenConversation={openConversation}
                onChatTextChange={setChatText}
                onAttachImage={handleAttachChatImage}
                onSend={() => void sendConversationMessage(selectedConversation)}
              />
            </div>
          </section>
        </div>
      </main>

      {comingSoon && (
        <ComingSoonModal
          title={comingSoon.title}
          description={comingSoon.description}
          bullets={comingSoon.bullets}
          onClose={() => setComingSoon(null)}
        />
      )}
    </>
  );
}
