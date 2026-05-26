"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
import { usePublicProfile } from "@/features/profiles/hooks/use-public-profile";
import { PageHeader } from "@/features/ui/components/page-header";
import { ComingSoonModal } from "@/features/ui/components/coming-soon-modal";
import { SupervisorWorkspacePanel } from "@/features/supervision/components/supervisor-workspace-panel";
import type { SupervisorWorkspaceData } from "@/features/supervision/types";
import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { getLeaderboardSnapshot } from "@/features/leaderboard/services/leaderboard-api";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { RoleShellLayout } from "@/features/ui/components/role-shell-layout";
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
  | "chat"
  | "leaderboard"
  | "settings";

export default function SupervisorPage() {
  const t = useTranslation();
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

  const [leaderboardSnapshot, setLeaderboardSnapshot] =
    useState<LeaderboardSnapshot | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("supervisor.common.toast_profile"),
    errorTitle: t("supervisor.common.toast_profile"),
  });

  useFeedbackToast({
    message: null,
    error: leaderboardError,
    clearMessage: () => undefined,
    clearError: () => setLeaderboardError(null),
    messageTitle: t("supervisor.common.toast_leaderboard"),
    errorTitle: t("supervisor.common.toast_leaderboard"),
  });

  useEffect(() => {
    if (activeSurface !== "leaderboard") return;
    if (leaderboardSnapshot) return;

    let cancelled = false;
    setLeaderboardLoading(true);
    setLeaderboardError(null);

    getLeaderboardSnapshot()
      .then((data) => {
        if (!cancelled) {
          setLeaderboardSnapshot(data);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setLeaderboardError(e?.message || t("supervisor.common.failed_leaderboard"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLeaderboardLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurface, leaderboardSnapshot]);

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
      eyebrow: t("supervisor.surface.overview.eyebrow"),
      title: t("supervisor.surface.overview.title"),
      description: t("supervisor.surface.overview.description"),
      badges: [
        t("supervisor.surface.overview.students", {
          count: workspacePreview?.stats.supervisedDoctors || 0,
        }),
        t("supervisor.surface.overview.reports", {
          count: workspacePreview?.stats.pendingReports || 0,
        }),
        t("supervisor.surface.overview.groups", {
          count: workspacePreview?.stats.groups || 0,
        }),
      ],
    },
    profile: {
      eyebrow: t("supervisor.surface.profile.eyebrow"),
      title: t("supervisor.surface.profile.title"),
      description: t("supervisor.surface.profile.description"),
      badges: [
        t("supervisor.surface.profile.badge1"),
        t("supervisor.surface.profile.badge2"),
        t("supervisor.surface.profile.badge3"),
      ],
    },
    notifications: {
      eyebrow: t("supervisor.surface.notifications.eyebrow"),
      title: t("supervisor.surface.notifications.title"),
      description: t("supervisor.surface.notifications.description"),
      badges: [
        t("supervisor.surface.notifications.unread", {
          count: unreadNotifications,
        }),
        t("supervisor.surface.notifications.badge2"),
        t("supervisor.surface.notifications.badge3"),
      ],
    },
    calendar: {
      eyebrow: t("supervisor.surface.calendar.eyebrow"),
      title: t("supervisor.surface.calendar.title"),
      description: t("supervisor.surface.calendar.description"),
      badges: [
        t("supervisor.surface.calendar.duties", {
          count: workspacePreview?.clinicOverview.length || 0,
        }),
        t("supervisor.surface.calendar.exams", {
          count: workspacePreview?.upcomingExams.length || 0,
        }),
        t("supervisor.surface.calendar.coverage"),
      ],
    },
    chat: {
      eyebrow: t("supervisor.surface.chat.eyebrow"),
      title: t("supervisor.surface.chat.title"),
      description: t("supervisor.surface.chat.description"),
      badges: [
        t("supervisor.surface.chat.badge1"),
        t("supervisor.surface.chat.badge2"),
        t("supervisor.surface.chat.badge3"),
      ],
    },
    leaderboard: {
      eyebrow: t("supervisor.surface.leaderboard.eyebrow"),
      title: t("supervisor.surface.leaderboard.title"),
      description: t("supervisor.surface.leaderboard.description"),
      badges: [
        t("supervisor.surface.leaderboard.badge1"),
        t("supervisor.surface.leaderboard.badge2"),
        t("supervisor.surface.leaderboard.badge3"),
      ],
    },
    settings: {
      eyebrow: t("supervisor.surface.settings.eyebrow"),
      title: t("supervisor.surface.settings.title"),
      description: t("supervisor.surface.settings.description"),
      badges: [
        t("supervisor.surface.settings.badge1"),
        t("supervisor.surface.settings.badge2"),
        t("supervisor.surface.settings.badge3"),
        t("supervisor.surface.settings.badge4"),
      ],
    },
  };

  const currentSurfaceMeta = surfaceMeta[activeSurface];

  return (
    <>
      <main className="denty-screen admin-suite-screen relative px-3 py-3 sm:px-4 sm:py-4 lg:pl-0 lg:pr-5 lg:py-6">
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

        <div className="denty-shell denty-dashboard-layout relative mx-0 max-w-none space-y-4 lg:space-y-0">
          <RoleShellLayout
            topbarEyebrow={t("supervisor.common.topbar")}
            notificationCount={unreadNotifications}
            onNotificationsClick={() => setActiveSurface("notifications")}
            onProfileClick={() => setActiveSurface("profile")}
            sideRail={
              <SupervisorSideRail
                userName={user.name || t("supervisor.common.supervisor")}
                activeView={activeSurface}
                unreadNotifications={unreadNotifications}
                chatUnreadCount={chatUnreadCount}
                onOverview={() => setActiveSurface("overview")}
                onProfile={() => setActiveSurface("profile")}
                onNotifications={() => setActiveSurface("notifications")}
                onCalendar={() => setActiveSurface("calendar")}
                onChat={() => setActiveSurface("chat")}
                onLeaderboard={() => setActiveSurface("leaderboard")}
                onSettings={() => setActiveSurface("settings")}
                onComingSoon={setComingSoon}
              />
            }
          >
          <section className="min-w-0 space-y-4 lg:space-y-5">
            <PageHeader
              title={currentSurfaceMeta.title}
              description={currentSurfaceMeta.description}
              badge={t("supervisor.common.workspace_badge")}
            />

            <div className={activeSurface === "overview" ? "denty-enter" : "hidden"}>
              <SupervisorWorkspacePanel
                apiUrl={API_URL}
                identifier={identifier}
                onWorkspaceChange={setWorkspacePreview}
              />
            </div>

            <div className={activeSurface === "profile" ? "denty-enter" : "hidden"}>
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

            <div className={activeSurface === "notifications" ? "denty-enter" : "hidden"}>
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

            <div className={activeSurface === "calendar" ? "denty-enter" : "hidden"}>
              <SupervisorCalendarView workspace={workspacePreview} />
            </div>

            <div className={activeSurface === "leaderboard" ? "denty-enter" : "hidden"}>
              <div className="denty-panel p-6 md:p-7">
                <LeaderboardView
                  snapshot={leaderboardSnapshot}
                  loading={leaderboardLoading}
                />
              </div>
            </div>

            <div className={activeSurface === "chat" ? "denty-enter" : "hidden"}>
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

            <div className={activeSurface === "settings" ? "denty-enter" : "hidden"}>
              <SettingsPanel
                role="supervisor"
                onEditProfile={() => setActiveSurface("profile")}
              />
            </div>
          </section>
          </RoleShellLayout>
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
