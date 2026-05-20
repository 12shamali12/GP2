"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DoctorConfirmExitModal } from "@/app/doctor/ui/doctor-confirm-exit-modal";
import { DoctorApprovalsView } from "@/app/doctor/ui/doctor-approvals-view";
import { useDoctorAppointmentActions } from "@/app/doctor/hooks/use-doctor-appointment-actions";
import { useDoctorBootstrap } from "@/app/doctor/hooks/use-doctor-bootstrap";
import { useDoctorChat } from "@/app/doctor/hooks/use-doctor-chat";
import { DoctorChatWorkspace } from "@/app/doctor/ui/doctor-chat-workspace";
import { useDoctorLegacyWorkspace } from "@/app/doctor/hooks/use-doctor-legacy-workspace";
import { DoctorNotificationsView } from "@/app/doctor/ui/doctor-notifications-view";
import { useDoctorNotifications } from "@/app/doctor/hooks/use-doctor-notifications";
import { useDoctorProfileEditor } from "@/app/doctor/hooks/use-doctor-profile-editor";
import { useDoctorReportActions } from "@/app/doctor/hooks/use-doctor-report-actions";
import { DoctorOverviewSurface } from "@/app/doctor/ui/doctor-overview-surface";
import {
  DoctorPageHeader,
  doctorSurfaceMeta,
  type DoctorSurface,
} from "@/app/doctor/ui/doctor-page-header";
import { DoctorProfileSurface } from "@/app/doctor/ui/doctor-profile-surface";
import { DoctorReportSurface } from "@/app/doctor/ui/doctor-report-surface";
import { DoctorSideRail } from "@/app/doctor/ui/doctor-side-rail";
import {
  createEmptyReportFormData,
  getWeekRangeHelper,
} from "@/app/doctor/lib/report-form";
import { GameSurface } from "@/features/game/components/game-surface";
import { getToday as getGameToday } from "@/features/game/services/game-api";
import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { getLeaderboardSnapshot } from "@/features/leaderboard/services/leaderboard-api";
import type { LeaderboardSnapshot } from "@/features/admin/types/admin";
import { usePublicProfile } from "@/features/profiles/hooks/use-public-profile";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { ComingSoonModal } from "@/features/ui/components/coming-soon-modal";
import { RoleShellLayout } from "@/features/ui/components/role-shell-layout";
import type { DoctorWorkspaceData } from "@/features/supervision/types";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useToast } from "@/features/ui/components/toast-provider";
import { useTranslation } from "@/features/i18n/language-provider";

type User = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  avatar?: string | null;
  username?: string | null;
  gender?: string | null;
  bio?: string | null;
  doctorIdNumber?: string | null;
};

export default function DoctorPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [activeSurface, setActiveSurface] = useState<DoctorSurface>("overview");

  const [user, setUser] = useState<User>({});
  const [avatarData, setAvatarData] = useState<string>("");

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

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [headerEditing, setHeaderEditing] = useState(false);
  const [headerNameInput, setHeaderNameInput] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);

  const [slotForm, setSlotForm] = useState({
    date: "",
    time: "",
    purpose: "General",
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [casesOpen, setCasesOpen] = useState(false);

  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    "General",
  ]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [chatResults, setChatResults] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [comingSoon, setComingSoon] = useState<{
    title: string;
    description: string;
    bullets: string[];
  } | null>(null);
  const [showLegacyOps, setShowLegacyOps] = useState(false);

  const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;
  const MAX_AVATAR_BASE64_LEN = 1_800_000;

  const identifier = useMemo(
    () => user.id || user.email || user.phone || user.username || "",
    [user]
  );
  const approvalsOpen = activeSurface === "approvals";
  const [doctorWorkspace, setDoctorWorkspace] =
    useState<DoctorWorkspaceData | null>(null);
  const [selectedReportTaskIds, setSelectedReportTaskIds] = useState<string[]>(
    []
  );

  const [notifications, setNotifications] = useState<any[]>([]);

  const [leaderboardSnapshot, setLeaderboardSnapshot] =
    useState<LeaderboardSnapshot | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  /**
   * Current daily-quiz streak for the rail badge. Best-effort: silently
   * stays at 0 if the game API is unreachable.
   */
  const [gameStreak, setGameStreak] = useState(0);

  const doctorEmoji = useMemo(() => {
    const g = (user.gender || "").toLowerCase();
    if (g.startsWith("f")) return "\u{1F469}‍⚕️"; // woman health worker
    if (g.startsWith("m")) return "\u{1F468}‍⚕️"; // man health worker
    return "\u{1F468}‍⚕️";
  }, [user.gender]);

  const prettifyBody = (text: string) =>
    (text || "")
      .replace(/T/g, " ")
      .replace(/\.000Z?/g, "")
      .replace(/Z$/, "");

  const getWeekRange = useCallback(() => getWeekRangeHelper(), []);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [noShowCount, setNoShowCount] = useState(0);

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    supervisor: "",
  });
  const [reportFormData, setReportFormData] = useState(createEmptyReportFormData);
  const [completionNotes, setCompletionNotes] = useState("");
  const [patientFeedbackForm, setPatientFeedbackForm] = useState({
    stars: "5",
    comment: "",
  });

  const [performanceCounts, setPerformanceCounts] = useState({
    done: 0,
    rejected: 0,
    cancelledByDoctor: 0,
    cancelledByPatient: 0,
    noShow: 0,
  });

  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const { pushToast } = useToast();
  const t = useTranslation();

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("doctor.report.toast_profile"),
    errorTitle: t("doctor.report.toast_profile"),
  });

  useFeedbackToast({
    message: slotMessage,
    error: slotError,
    clearMessage: () => setSlotMessage(null),
    clearError: () => setSlotError(null),
    messageTitle: t("doctor.report.toast_planner"),
    errorTitle: t("doctor.report.toast_planner"),
  });

  useEffect(() => {
    if (!reportMessage || reportMessage === "Submitting report...") return;
    pushToast({
      kind: reportMessage.toLowerCase().includes("fail") ? "error" : "success",
      title: t("doctor.report.toast_case"),
      description: reportMessage,
    });
    setReportMessage(null);
  }, [pushToast, reportMessage, t]);

  const bookedAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "APPROVED" || appointment.status === "COMPLETED",
      ),
    [appointments]
  );

  const {
    unreadNotifications,
    deleteNotification,
    markAllNotificationsRead,
    handleNotificationClick,
    deleteAllNotifications,
  } = useDoctorNotifications({
    apiUrl: API_URL,
    identifier,
    notifications,
    setNotifications,
    onRequestNotificationOpen: () => setActiveSurface("approvals"),
  });

  const { resetEdits, showSave, saveProfile, handleAvatarPick } =
    useDoctorProfileEditor({
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
      maxAvatarBase64Len: MAX_AVATAR_BASE64_LEN,
      maxAvatarBytes: MAX_AVATAR_BYTES,
      setUser,
      setEditName,
      setEditPhone,
      setEditBio,
      setAvatarData,
      setOldPassword,
      setNewPassword,
      setConfirmPassword,
      setNameEditable,
      setPhoneEditable,
      setBioEditable,
      setPwdEditable,
      setHeaderEditing,
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

  const {
    fetchConversations,
    openConversation,
    searchUsers,
    startChatWith,
    sendChatMessage,
  } = useDoctorChat({
    apiUrl: API_URL,
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
  });

  const { fetchPerformance, loadData } = useDoctorBootstrap({
    apiUrl: API_URL,
    user,
    identifier,
    approvalsOpen,
    getWeekRange,
    fetchConversations,
    setUser,
    setEditName,
    setEditPhone,
    setEditBio,
    setAvatarData,
    setAppointments,
    setSlots,
    setNotifications,
    setPerformanceCounts,
  });

  const {
    handleAddSlot,
    handleDecision,
    handleCancel,
    handleNoShow,
    handleDeleteSlot,
  } = useDoctorAppointmentActions({
    apiUrl: API_URL,
    identifier,
    slotForm,
    setSlotForm,
    setLoadingAction,
    setError,
    setSlotError,
    setSlotMessage,
    setNoShowCount,
    setAppointments,
    loadData,
    fetchPerformance,
  });

  const weeklyPerformance = performanceCounts;

  const setReportSurfaceOpen = useCallback<Dispatch<SetStateAction<boolean>>>(
    (next) => {
      setActiveSurface((prev) => {
        const current = prev === "report";
        const resolved = typeof next === "function" ? next(current) : next;
        return resolved ? "report" : current ? "overview" : prev;
      });
    },
    [],
  );

  const {
    todayAppointments,
    pendingAppointments,
    workingHours,
    now,
    yearOptions,
    daysInView,
    slotsForSelectedDay,
    groupedSlots,
    toggleHour,
    togglePurpose,
    handleDeleteDay,
    handleAddMultipleSlots,
    handleSelectBookedSlot,
    handleOpenReportForSlot,
    handleNoShowForSlot,
  } = useDoctorLegacyWorkspace({
    apiUrl: API_URL,
    identifier,
    appointments,
    slots,
    selectedMonth,
    selectedYear,
    selectedDay,
    selectedHours,
    selectedPurposes,
    doctorWorkspace,
    loadData,
    setLoadingAction,
    setError,
    setSlotError,
    setSlotMessage,
    setSelectedHours,
    setSelectedPurposes,
    setSelectedReport,
    setReportForm,
    setSelectedReportTaskIds,
    setReportMessage,
    setReportOpen: setReportSurfaceOpen,
    handleNoShow,
  });

  useEffect(() => {
    if (activeSurface === "chat" && conversations.length === 0) {
      void fetchConversations();
    }
  }, [activeSurface, conversations.length, fetchConversations]);

  // Fetch the current daily-quiz streak once we know who the user is.
  // Best-effort: failures are swallowed so an offline game backend doesn't
  // break the doctor shell.
  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;
    getGameToday()
      .then((today) => {
        if (!cancelled) setGameStreak(today.streak);
      })
      .catch(() => {
        if (!cancelled) setGameStreak(0);
      });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  useEffect(() => {
    if (activeSurface !== "leaderboard") return;
    if (leaderboardSnapshot || leaderboardLoading) return;

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
          setLeaderboardError(
            e?.message || t("doctor.report.failed_leaderboard"),
          );
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
  }, [activeSurface, leaderboardSnapshot, leaderboardLoading]);

  useFeedbackToast({
    message: null,
    error: leaderboardError,
    clearMessage: () => undefined,
    clearError: () => setLeaderboardError(null),
    messageTitle: t("doctor.report.toast_leaderboard"),
    errorTitle: t("doctor.report.toast_leaderboard"),
  });

  const handleAttachChatImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event: any) => {
      const file = event?.target?.files?.[0];
      if (!file) return;
      setUploadingImage(true);
      sendChatMessage({ file }).finally(() => setUploadingImage(false));
    };
    input.click();
  }, [sendChatMessage]);

  const {
    handleSelectReportAppointment,
    clearReportSelection,
    handleSubmitReport,
    handleCompleteAppointment,
    handleRatePatient,
  } = useDoctorReportActions({
    apiUrl: API_URL,
    user,
    selectedReport,
    reportForm,
    reportFormData,
    completionNotes,
    patientFeedbackForm,
    selectedReportTaskIds,
    doctorWorkspace,
    setSelectedReport,
    setReportForm,
    setReportFormData,
    setCompletionNotes,
    setPatientFeedbackForm,
    setSelectedReportTaskIds,
    setReportMessage,
    setActiveSurfaceToReport: setReportSurfaceOpen,
    loadData,
    fetchPerformance,
  });

  const currentSurfaceMeta = doctorSurfaceMeta[activeSurface];

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
            topbarEyebrow={t("doctor.common.doctor")}
            notificationCount={unreadNotifications}
            onNotificationsClick={() => setActiveSurface("notifications")}
            onProfileClick={() => setActiveSurface("profile")}
            sideRail={
              <DoctorSideRail
                userName={user.name || t("doctor.common.doctor")}
                activeView={activeSurface}
                unreadNotifications={unreadNotifications}
                chatUnreadCount={chatUnreadCount}
                streakCount={gameStreak}
                onOverview={() => setActiveSurface("overview")}
                onProfile={() => setActiveSurface("profile")}
                onNotifications={() => setActiveSurface("notifications")}
                onApprovals={() => setActiveSurface("approvals")}
                onReport={() => setActiveSurface("report")}
                onChat={() => setActiveSurface("chat")}
                onGame={() => setActiveSurface("game")}
                onLeaderboard={() => setActiveSurface("leaderboard")}
                onSettings={() => setActiveSurface("settings")}
                onComingSoon={setComingSoon}
              />
            }
          >
          <section className="min-w-0 space-y-4 lg:space-y-5">
            <DoctorPageHeader meta={currentSurfaceMeta} />

            <div className={activeSurface === "overview" ? "denty-enter space-y-6" : "hidden"}>
              <DoctorOverviewSurface
                apiUrl={API_URL}
                identifier={identifier}
                userName={user.name || t("doctor.common.doctor")}
                todayAppointments={todayAppointments}
                pendingAppointments={pendingAppointments}
                appointments={appointments}
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                groupedSlots={groupedSlots}
                loadingAction={loadingAction}
                weeklyPerformance={weeklyPerformance}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                yearOptions={yearOptions}
                selectedPurposes={selectedPurposes}
                casesOpen={casesOpen}
                daysInView={daysInView}
                now={now}
                slots={slots}
                selectedDay={selectedDay}
                workingHours={workingHours}
                selectedHours={selectedHours}
                slotsForSelectedDay={slotsForSelectedDay}
                showLegacyOps={showLegacyOps}
                onToggleLegacy={() => setShowLegacyOps((value) => !value)}
                onWorkspaceChange={setDoctorWorkspace}
                getWeekRange={getWeekRange}
                onApproveDecision={(appointmentId) => handleDecision(appointmentId, true)}
                onRejectDecision={(appointmentId) => handleDecision(appointmentId, false)}
                onCancelAppointment={handleCancel}
                onMarkAllNotificationsRead={markAllNotificationsRead}
                onDeleteAllNotifications={deleteAllNotifications}
                onNotificationClick={handleNotificationClick}
                onDeleteNotification={deleteNotification}
                onDeleteDay={handleDeleteDay}
                onSelectBookedSlot={handleSelectBookedSlot}
                onFillReportForSlot={handleOpenReportForSlot}
                onMarkNoShowForSlot={handleNoShowForSlot}
                onDeleteSlot={handleDeleteSlot}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
                onCasesOpenToggle={() => setCasesOpen((value) => !value)}
                onTogglePurpose={togglePurpose}
                onSelectedDayChange={setSelectedDay}
                onToggleHour={toggleHour}
                onAddMultipleSlots={handleAddMultipleSlots}
              />
            </div>

            <div className={activeSurface === "profile" ? "denty-enter" : "hidden"}>
              <DoctorProfileSurface
                user={user}
                avatarData={avatarData}
                editName={editName}
                editPhone={editPhone}
                editBio={editBio}
                oldPassword={oldPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showOldPwd={showOldPwd}
                showNewPwd={showNewPwd}
                nameEditable={nameEditable}
                phoneEditable={phoneEditable}
                bioEditable={bioEditable}
                pwdEditable={pwdEditable}
                headerEditing={headerEditing}
                headerNameInput={headerNameInput}
                doctorEmoji={doctorEmoji}
                showSave={showSave}
                publicProfile={publicProfile}
                publicProfileLoading={publicProfileLoading}
                setEditName={setEditName}
                setEditPhone={setEditPhone}
                setEditBio={setEditBio}
                setOldPassword={setOldPassword}
                setNewPassword={setNewPassword}
                setConfirmPassword={setConfirmPassword}
                setShowOldPwd={setShowOldPwd}
                setShowNewPwd={setShowNewPwd}
                setNameEditable={setNameEditable}
                setPhoneEditable={setPhoneEditable}
                setBioEditable={setBioEditable}
                setPwdEditable={setPwdEditable}
                setHeaderEditing={setHeaderEditing}
                setHeaderNameInput={setHeaderNameInput}
                onAvatarPick={handleAvatarPick}
                onBack={() => {
                  if (showSave) {
                    setConfirmExit(true);
                  } else {
                    setActiveSurface("overview");
                  }
                }}
                onSave={async () => {
                  await saveProfile();
                  await refreshPublicProfile();
                }}
              />
            </div>

            <div className={activeSurface === "approvals" ? "denty-enter" : "hidden"}>
              <DoctorApprovalsView
                pendingAppointments={pendingAppointments}
                loadingAction={loadingAction}
                onApprove={(appointmentId) => handleDecision(appointmentId, true)}
                onReject={(appointmentId, note) => handleDecision(appointmentId, false, note)}
              />
            </div>

            <div className={activeSurface === "notifications" ? "denty-enter" : "hidden"}>
              <DoctorNotificationsView
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                prettifyBody={prettifyBody}
                onMarkAllRead={markAllNotificationsRead}
                onDeleteAll={deleteAllNotifications}
                onNotificationClick={handleNotificationClick}
                onDeleteNotification={deleteNotification}
                onGoToApprovals={() => setActiveSurface("approvals")}
              />
            </div>

            <div className={activeSurface === "chat" ? "denty-enter" : "hidden"}>
              <DoctorChatWorkspace
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
                onSend={() => void sendChatMessage()}
              />
            </div>

            <div className={activeSurface === "leaderboard" ? "denty-enter" : "hidden"}>
              <div className="denty-panel p-6 md:p-7">
                <LeaderboardView
                  snapshot={leaderboardSnapshot}
                  loading={leaderboardLoading}
                  currentUserId={user.id}
                />
              </div>
            </div>

            <div className={activeSurface === "game" ? "denty-enter" : "hidden"}>
              <div className="denty-panel p-6 md:p-7">
                <GameSurface
                  onViewLeaderboard={() => setActiveSurface("leaderboard")}
                />
              </div>
            </div>

            <div className={activeSurface === "settings" ? "denty-enter" : "hidden"}>
              <SettingsPanel
                role="doctor"
                onEditProfile={() => setActiveSurface("profile")}
              />
            </div>

            <div className={activeSurface === "report" ? "denty-enter" : "hidden"}>
              <DoctorReportSurface
                userName={user.name || ""}
                noShowCount={noShowCount}
                bookedAppointments={bookedAppointments}
                selectedReport={selectedReport}
                reportForm={reportForm}
                reportFormData={reportFormData}
                completionNotes={completionNotes}
                patientFeedbackForm={patientFeedbackForm}
                selectedReportTaskIds={selectedReportTaskIds}
                doctorWorkspace={doctorWorkspace}
                reportMessage={reportMessage}
                setSelectedReport={setSelectedReport}
                setReportForm={setReportForm}
                setReportFormData={setReportFormData}
                setSelectedReportTaskIds={setSelectedReportTaskIds}
                setCompletionNotes={setCompletionNotes}
                setPatientFeedbackForm={setPatientFeedbackForm}
                onNoShow={handleNoShow}
                onSelectReport={handleSelectReportAppointment}
                onCloseReportForm={clearReportSelection}
                onCompleteAppointment={() => void handleCompleteAppointment()}
                onSubmitPatientFeedback={() => void handleRatePatient()}
                onSubmit={handleSubmitReport}
              />
            </div>
          </section>
          </RoleShellLayout>
        </div>

        <DoctorConfirmExitModal
          open={confirmExit}
          onDiscard={() => {
            resetEdits();
            setConfirmExit(false);
            setActiveSurface("overview");
            setMessage(null);
            setError(null);
          }}
          onSave={async () => {
            await saveProfile();
            setConfirmExit(false);
            setActiveSurface("overview");
          }}
        />
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
