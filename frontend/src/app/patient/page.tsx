"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
import { usePublicProfile } from "@/features/profiles/hooks/use-public-profile";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SmileStreakSurface } from "@/features/smile-streak/components/smile-streak-surface";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { ComingSoonModal } from "@/features/ui/components/coming-soon-modal";
import { RoleShellLayout } from "@/features/ui/components/role-shell-layout";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { usePatientBookingActions } from "./hooks/use-patient-booking-actions";
import { usePatientBootstrap } from "./hooks/use-patient-bootstrap";
import { usePatientChat } from "./hooks/use-patient-chat";
import { usePatientNotifications } from "./hooks/use-patient-notifications";
import { usePatientProfileEditor } from "./hooks/use-patient-profile-editor";
import { PatientAppointmentModal } from "./ui/patient-appointment-modal";
import { PatientCareDeskView } from "./ui/patient-care-desk-view";
import { PatientChatWorkspace } from "./ui/patient-chat-workspace";
import { PatientNotificationsView } from "./ui/patient-notifications-view";
import { PatientProfilePanel } from "./ui/patient-profile-panel";
import { PatientSideRail } from "./ui/patient-side-rail";
import { PatientSlotModal } from "./ui/patient-slot-modal";

type PatientUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
  username?: string | null;
  bio?: string | null;
};

type PatientSurface =
  | "overview"
  | "profile"
  | "notifications"
  | "chat"
  | "game"
  | "settings";

export default function PatientPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const t = useTranslation();
  const [activeSurface, setActiveSurface] = useState<PatientSurface>("overview");
  const [user, setUser] = useState<PatientUser>({});
  const [bookingForm, setBookingForm] = useState({
    slotId: "",
    clinicCaseId: "",
    clinicName: "",
    caseTitle: "",
    reason: "General",
    doctor: "",
  });
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [patientNotifications, setPatientNotifications] = useState<any[]>([]);
  const reservationRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null,
  );
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("all");
  const [selectedClinicCaseId, setSelectedClinicCaseId] = useState("all");
  const [cancellingId, setCancellingId] = useState("");
  const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;
  const MAX_AVATAR_BASE64_LEN = 1_800_000;
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [nameEditable, setNameEditable] = useState(false);
  const [phoneEditable, setPhoneEditable] = useState(false);
  const [emailEditable, setEmailEditable] = useState(false);
  const [bioEditable, setBioEditable] = useState(false);
  const [pwdEditable, setPwdEditable] = useState(false);
  const [avatarData, setAvatarData] = useState<string>("");
  const [chatSearch, setChatSearch] = useState("");
  const [chatResults, setChatResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [comingSoon, setComingSoon] = useState<{
    title: string;
    description: string;
    bullets: string[];
  } | null>(null);

  const uniqueUpcoming = useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const appointment of upcoming) {
      const key = appointment.slotId || appointment.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(appointment);
      }
    }
    return result;
  }, [upcoming]);

  const filteredDays = useMemo(() => {
    const map: Record<string, Date> = {};
    availableSlots.forEach((slot) => {
      const date = new Date(slot.startTime);
      const purpose = (slot.purpose || "").toLowerCase();
      const matchesType =
        !selectedType || purpose.includes(selectedType.toLowerCase());
      const monthOk = selectedMonth === "all" || date.getMonth() === selectedMonth;
      const yearOk = selectedYear === "all" || date.getFullYear() === selectedYear;
      const clinicOk =
        selectedClinicId === "all" || slot.clinic?.id === selectedClinicId;
      const caseOk =
        selectedClinicCaseId === "all" ||
        (slot.caseOptions || []).some((item: any) => item.id === selectedClinicCaseId);
      if (monthOk && yearOk && matchesType && clinicOk && caseOk) {
        map[date.toDateString()] = date;
      }
    });
    return Object.values(map).sort((a, b) => a.getTime() - b.getTime());
  }, [
    availableSlots,
    selectedClinicCaseId,
    selectedClinicId,
    selectedMonth,
    selectedType,
    selectedYear,
  ]);

  const clinicOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    availableSlots.forEach((slot) => {
      if (slot.clinic?.id && slot.clinic?.name) {
        map.set(slot.clinic.id, { id: slot.clinic.id, name: slot.clinic.name });
      }
    });
    return Array.from(map.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [availableSlots]);

  const caseOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string; clinicName: string }>();
    availableSlots.forEach((slot) => {
      if (selectedClinicId !== "all" && slot.clinic?.id !== selectedClinicId) return;
      (slot.caseOptions || []).forEach((item: any) => {
        map.set(item.id, {
          id: item.id,
          title: item.title,
          clinicName: item.clinic?.name || slot.clinic?.name || "Clinic",
        });
      });
    });
    return Array.from(map.values()).sort((left, right) =>
      left.title.localeCompare(right.title),
    );
  }, [availableSlots, selectedClinicId]);

  const identifier = useMemo(
    () => user.id || user.email || user.phone || user.username || "",
    [user],
  );

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: t("patient.common.toast_workspace"),
    errorTitle: t("patient.common.toast_workspace"),
  });

  const {
    fetchConversations,
    searchUsers,
    openConversation,
    startChatWith,
    sendConversationMessage,
  } = usePatientChat({
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

  const { loadSlots, loadData } = usePatientBootstrap({
    apiUrl: API_URL,
    user,
    identifier,
    fetchConversations,
    setUser,
    setEditName,
    setEditPhone,
    setEditEmail,
    setEditBio,
    setAvatarData,
    setAvailableSlots,
    setUpcoming,
    setHistory,
    setPatientNotifications,
  });

  const {
    unreadPatientNotifications,
    handlePatientNotificationAction,
    markAllPatientNotificationsRead,
    deleteAllPatientNotifications,
  } = usePatientNotifications({
    apiUrl: API_URL,
    identifier,
    patientNotifications,
    setPatientNotifications,
  });

  const { showSave, handleAvatarPick, saveProfile } = usePatientProfileEditor({
    apiUrl: API_URL,
    identifier,
    user,
    editName,
    editPhone,
    editEmail,
    editBio,
    avatarData,
    oldPassword,
    newPassword,
    confirmPassword,
    nameEditable,
    phoneEditable,
    emailEditable,
    bioEditable,
    pwdEditable,
    maxAvatarBase64Len: MAX_AVATAR_BASE64_LEN,
    maxAvatarBytes: MAX_AVATAR_BYTES,
    setUser,
    setAvatarData,
    setEditBio,
    setOldPassword,
    setNewPassword,
    setConfirmPassword,
    setNameEditable,
    setPhoneEditable,
    setEmailEditable,
    setBioEditable,
    setPwdEditable,
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

  const { handleBook, handleCancel, handleRateDoctor } = usePatientBookingActions({
    apiUrl: API_URL,
    identifier,
    user,
    bookingForm,
    setLoading,
    setPendingSlotId,
    setError,
    setMessage,
    setUpcoming,
    setHistory,
    setSelectedAppointment,
    setCancellingId,
    loadData,
    loadSlots,
  });

  useEffect(() => {
    if (activeSurface === "chat" && conversations.length === 0) {
      void fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurface, conversations.length]);

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
    PatientSurface,
    { eyebrow: string; title: string; description: string; badges: string[] }
  > = {
    overview: {
      eyebrow: t("patient.surface.overview.eyebrow"),
      title: t("patient.surface.overview.title"),
      description: t("patient.surface.overview.description"),
      badges: [
        t("patient.surface.overview.badge_upcoming", {
          count: uniqueUpcoming.length,
        }),
        t("patient.surface.overview.badge_slots", {
          count: availableSlots.length,
        }),
        t("patient.surface.overview.badge_focus", { value: selectedType }),
      ],
    },
    profile: {
      eyebrow: t("patient.surface.profile.eyebrow"),
      title: t("patient.surface.profile.title"),
      description: t("patient.surface.profile.description"),
      badges: [
        t("patient.surface.profile.badge1"),
        t("patient.surface.profile.badge2"),
        t("patient.surface.profile.badge3"),
      ],
    },
    notifications: {
      eyebrow: t("patient.surface.notifications.eyebrow"),
      title: t("patient.surface.notifications.title"),
      description: t("patient.surface.notifications.description"),
      badges: [
        t("patient.surface.notifications.badge_unread", {
          count: unreadPatientNotifications,
        }),
        t("patient.surface.notifications.badge_inbox"),
        t("patient.surface.notifications.badge_updates"),
      ],
    },
    chat: {
      eyebrow: t("patient.surface.chat.eyebrow"),
      title: t("patient.surface.chat.title"),
      description: t("patient.surface.chat.description"),
      badges: [
        t("patient.surface.chat.badge1"),
        t("patient.surface.chat.badge2"),
        t("patient.surface.chat.badge3"),
      ],
    },
    game: {
      eyebrow: t("patient.surface.game.eyebrow"),
      title: t("patient.surface.game.title"),
      description: t("patient.surface.game.description"),
      badges: [
        t("patient.surface.game.badge1"),
        t("patient.surface.game.badge2"),
        t("patient.surface.game.badge3"),
      ],
    },
    settings: {
      eyebrow: t("patient.surface.settings.eyebrow"),
      title: t("patient.surface.settings.title"),
      description: t("patient.surface.settings.description"),
      badges: [
        t("patient.surface.settings.badge1"),
        t("patient.surface.settings.badge2"),
        t("patient.surface.settings.badge3"),
        t("patient.surface.settings.badge4"),
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
            topbarEyebrow={t("patient.common.patient")}
            notificationCount={unreadPatientNotifications}
            onNotificationsClick={() => setActiveSurface("notifications")}
            onProfileClick={() => setActiveSurface("profile")}
            sideRail={
              <PatientSideRail
                userName={user.name || t("patient.common.patient")}
                activeView={activeSurface}
                unreadNotifications={unreadPatientNotifications}
                chatUnreadCount={chatUnreadCount}
                onOverview={() => setActiveSurface("overview")}
                onProfile={() => setActiveSurface("profile")}
                onNotifications={() => setActiveSurface("notifications")}
                onChat={() => setActiveSurface("chat")}
                onGame={() => setActiveSurface("game")}
                onSettings={() => setActiveSurface("settings")}
                onComingSoon={setComingSoon}
              />
            }
          >
          <section className="min-w-0 space-y-4 lg:space-y-5">
            <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(249,252,255,0.78),rgba(222,233,241,0.34))] px-5 py-6 shadow-[0_28px_72px_rgba(7,18,34,0.16)] backdrop-blur-[24px] sm:px-7 sm:py-7 md:px-9 md:py-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <BrandMark className="h-12 w-12 frozen-float sm:h-14 sm:w-14" />
                    <span className="rounded-full border border-white/20 bg-white/26 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(10,22,40,0.64)]">
                      {t("patient.common.workspace")}
                    </span>
                  </div>

                  <div>
                    <p className="denty-kicker">{currentSurfaceMeta.eyebrow}</p>
                    <h1 className="mt-3 max-w-4xl text-2xl font-semibold text-[var(--foreground)] sm:text-3xl md:text-4xl xl:text-5xl">
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

            <div className={activeSurface === "overview" ? "denty-enter" : "hidden"}>
              <PatientCareDeskView
                uniqueUpcoming={uniqueUpcoming}
                availableSlots={availableSlots}
                history={history}
                unreadNotifications={unreadPatientNotifications}
                selectedType={selectedType}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedDay={selectedDay}
                filteredDays={filteredDays}
                clinicOptions={clinicOptions}
                caseOptions={caseOptions}
                selectedClinicId={selectedClinicId}
                selectedClinicCaseId={selectedClinicCaseId}
                bookingForm={bookingForm}
                error={error}
                message={message}
                reservationRef={reservationRef}
                onReserveClick={() =>
                  reservationRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                onSelectedTypeChange={setSelectedType}
                onSelectedMonthChange={setSelectedMonth}
                onSelectedYearChange={setSelectedYear}
                onSelectedDayChange={setSelectedDay}
                onSelectedClinicChange={(value) => {
                  setSelectedClinicId(value);
                  setSelectedClinicCaseId("all");
                }}
                onSelectedClinicCaseChange={setSelectedClinicCaseId}
                onSelectSlot={(slot) => {
                  const matchingCase =
                    selectedClinicCaseId !== "all"
                      ? (slot.caseOptions || []).find(
                          (item: any) => item.id === selectedClinicCaseId,
                        )
                      : (slot.caseOptions || [])[0] || null;
                  setBookingForm((form) => ({
                    ...form,
                    slotId: slot.id,
                    clinicCaseId: matchingCase?.id || "",
                    clinicName: slot.clinic?.name || "",
                    caseTitle: matchingCase?.title || "",
                    doctor: slot.doctor?.name || "",
                  }));
                  setSelectedSlot(slot);
                }}
                onSelectAppointment={setSelectedAppointment}
              />
            </div>

            <div className={activeSurface === "profile" ? "denty-enter" : "hidden"}>
              <PatientProfilePanel
                user={user}
                avatarData={avatarData}
                editName={editName}
                editPhone={editPhone}
                editEmail={editEmail}
                oldPassword={oldPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showOldPwd={showOldPwd}
                showNewPwd={showNewPwd}
                nameEditable={nameEditable}
                phoneEditable={phoneEditable}
                emailEditable={emailEditable}
                bioEditable={bioEditable}
                pwdEditable={pwdEditable}
                history={history}
                publicProfile={publicProfile}
                publicProfileLoading={publicProfileLoading}
                editBio={editBio}
                showSave={showSave}
                onAvatarPick={handleAvatarPick}
                onNameEditOpen={() => setNameEditable(true)}
                onEmailEditableToggle={() => setEmailEditable((value) => !value)}
                onPhoneEditableToggle={() => setPhoneEditable((value) => !value)}
                onBioEditableToggle={() => setBioEditable((value) => !value)}
                onPasswordEditableToggle={() => setPwdEditable((value) => !value)}
                onEmailChange={setEditEmail}
                onPhoneChange={setEditPhone}
                onBioChange={setEditBio}
                onOldPasswordChange={setOldPassword}
                onNewPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowOldPasswordToggle={() => setShowOldPwd((value) => !value)}
                onShowNewPasswordToggle={() => setShowNewPwd((value) => !value)}
                onBack={() => setActiveSurface("overview")}
                onSave={async () => {
                  await saveProfile();
                  await refreshPublicProfile();
                }}
              />
            </div>

            <div className={activeSurface === "notifications" ? "denty-enter" : "hidden"}>
              <PatientNotificationsView
                notifications={patientNotifications}
                unreadNotifications={unreadPatientNotifications}
                prettifyBody={prettifyBody}
                onMarkAllRead={markAllPatientNotificationsRead}
                onDeleteAll={deleteAllPatientNotifications}
                onNotificationClick={(notification) =>
                  notification.id &&
                  handlePatientNotificationAction(notification.id, "read")
                }
                onDeleteNotification={(notificationId) =>
                  handlePatientNotificationAction(notificationId, "delete")
                }
                onGoToCareDesk={() => setActiveSurface("overview")}
              />
            </div>

            <div className={activeSurface === "chat" ? "denty-enter" : "hidden"}>
              <PatientChatWorkspace
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

            <div className={activeSurface === "game" ? "denty-enter" : "hidden"}>
              <div className="denty-panel p-6 md:p-7">
                <SmileStreakSurface />
              </div>
            </div>

            <div className={activeSurface === "settings" ? "denty-enter" : "hidden"}>
              <SettingsPanel
                role="patient"
                onEditProfile={() => setActiveSurface("profile")}
              />
            </div>
          </section>
          </RoleShellLayout>
        </div>
      </main>

      <PatientSlotModal
        slot={selectedSlot}
        selectedCaseId={bookingForm.clinicCaseId}
        loading={loading}
        pendingSlotId={pendingSlotId}
        onClose={() => setSelectedSlot(null)}
        onCancel={() => {
          setSelectedSlot(null);
          setBookingForm((form) => ({ ...form, slotId: "" }));
        }}
        onReserve={handleBook}
      />

      <PatientAppointmentModal
        appointment={selectedAppointment}
        cancellingId={cancellingId}
        onClose={() => setSelectedAppointment(null)}
        onCancelReservation={() =>
          selectedAppointment && handleCancel(selectedAppointment.id)
        }
        onRateDoctor={(stars, comment) =>
          selectedAppointment &&
          handleRateDoctor(selectedAppointment.id, stars, comment)
        }
      />

      {comingSoon ? (
        <ComingSoonModal
          title={comingSoon.title}
          description={comingSoon.description}
          bullets={comingSoon.bullets}
          onClose={() => setComingSoon(null)}
        />
      ) : null}
    </>
  );
}
