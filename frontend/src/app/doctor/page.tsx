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
import { DoctorDashboardSummary } from "@/app/doctor/ui/doctor-dashboard-summary";
import { useDoctorLegacyWorkspace } from "@/app/doctor/hooks/use-doctor-legacy-workspace";
import { DoctorNotificationsView } from "@/app/doctor/ui/doctor-notifications-view";
import { useDoctorNotifications } from "@/app/doctor/hooks/use-doctor-notifications";
import { useDoctorProfileEditor } from "@/app/doctor/hooks/use-doctor-profile-editor";
import { DoctorLegacyOperations } from "@/app/doctor/ui/doctor-legacy-operations";
import { DoctorProfilePanel } from "@/app/doctor/ui/doctor-profile-panel";
import { DoctorReportWorkspace } from "@/app/doctor/ui/doctor-report-workspace";
import { DoctorSideRail } from "@/app/doctor/ui/doctor-side-rail";
import { usePublicProfile } from "@/features/profiles/hooks/use-public-profile";
import { ComingSoonModal } from "@/features/ui/components/coming-soon-modal";
import { BrandMark } from "@/features/ui/components/brand-mark";
import { DoctorWorkspacePanel } from "@/features/supervision/components/doctor-workspace-panel";
import type { DoctorWorkspaceData } from "@/features/supervision/types";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";
import { useToast } from "@/features/ui/components/toast-provider";

// Week range helper lives outside the component to avoid any TDZ issues

const getWeekRangeHelper = () => {
  const nowDate = new Date();

  const day = nowDate.getDay(); // 0 Sun ... 6 Sat

  const diffToFriday = (day + 1) % 7; // days since Friday

  const friday = new Date(nowDate);

  friday.setDate(nowDate.getDate() - diffToFriday);

  friday.setHours(0, 0, 0, 0);

  const nextFriday = new Date(friday);

  nextFriday.setDate(friday.getDate() + 7);

  return { start: friday, end: nextFriday };
};

const createEmptyReportFormData = () => ({
  chiefComplaint: "",
  medicalHistory: "",
  dentalHistory: "",
  socialHistory: "",
  extraOralFindings: "",
  intraOralFindings: "",
  radiographicViews: [] as string[],
  radiographicFindings: "",
  diagnosisLines: ["", "", ""],
  treatmentVisits: Array.from({ length: 8 }, (_, index) => ({
    visitLabel: `Visit ${index + 1}`,
    tooth: "",
    procedure: "",
  })),
  facultyNotes: "",
});

const hydrateReportFormData = (raw: any) => {
  const empty = createEmptyReportFormData();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return empty;
  }

  const source = raw as Record<string, any>;
  const diagnosisLines = Array.isArray(source.diagnosisLines)
    ? source.diagnosisLines
    : [];
  const treatmentVisits = Array.isArray(source.treatmentVisits)
    ? source.treatmentVisits
    : [];

  return {
    chiefComplaint:
      typeof source.chiefComplaint === "string" ? source.chiefComplaint : "",
    medicalHistory:
      typeof source.medicalHistory === "string" ? source.medicalHistory : "",
    dentalHistory:
      typeof source.dentalHistory === "string" ? source.dentalHistory : "",
    socialHistory:
      typeof source.socialHistory === "string" ? source.socialHistory : "",
    extraOralFindings:
      typeof source.extraOralFindings === "string"
        ? source.extraOralFindings
        : "",
    intraOralFindings:
      typeof source.intraOralFindings === "string"
        ? source.intraOralFindings
        : "",
    radiographicViews: Array.isArray(source.radiographicViews)
      ? source.radiographicViews.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    radiographicFindings:
      typeof source.radiographicFindings === "string"
        ? source.radiographicFindings
        : "",
    diagnosisLines: empty.diagnosisLines.map((fallback, index) =>
      typeof diagnosisLines[index] === "string"
        ? diagnosisLines[index]
        : fallback,
    ),
    treatmentVisits: empty.treatmentVisits.map((fallback, index) => {
      const visit = treatmentVisits[index];
      return {
        visitLabel:
          typeof visit?.visitLabel === "string"
            ? visit.visitLabel
            : fallback.visitLabel,
        tooth: typeof visit?.tooth === "string" ? visit.tooth : "",
        procedure:
          typeof visit?.procedure === "string" ? visit.procedure : "",
      };
    }),
    facultyNotes:
      typeof source.facultyNotes === "string" ? source.facultyNotes : "",
  };
};

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

type DoctorSurface =
  | "overview"
  | "profile"
  | "notifications"
  | "approvals"
  | "report"
  | "chat";

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
  const showProfile = activeSurface === "profile";
  const approvalsOpen = activeSurface === "approvals";
  const reportOpen = activeSurface === "report";
  const [doctorWorkspace, setDoctorWorkspace] =
    useState<DoctorWorkspaceData | null>(null);
  const [selectedReportTaskIds, setSelectedReportTaskIds] = useState<string[]>(
    []
  );

  const [notifications, setNotifications] = useState<any[]>([]);

  const doctorEmoji = useMemo(() => {
    const g = (user.gender || "").toLowerCase();

    if (g.startsWith("f")) return "\u{1F469}\u200D\u2695\uFE0F"; // woman health worker

    if (g.startsWith("m")) return "\u{1F468}\u200D\u2695\uFE0F"; // man health worker

    return "\u{1F468}\u200D\u2695\uFE0F";
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

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Doctor profile",
    errorTitle: "Doctor profile",
  });

  useFeedbackToast({
    message: slotMessage,
    error: slotError,
    clearMessage: () => setSlotMessage(null),
    clearError: () => setSlotError(null),
    messageTitle: "Availability planner",
    errorTitle: "Availability planner",
  });

  useEffect(() => {
    if (!reportMessage || reportMessage === "Submitting report...") return;
    pushToast({
      kind: reportMessage.toLowerCase().includes("fail") ? "error" : "success",
      title: "Case report",
      description: reportMessage,
    });
    setReportMessage(null);
  }, [pushToast, reportMessage]);

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

  const isPastAppointment = (appt: any) => {
    const start = appt?.slot?.startTime ? new Date(appt.slot.startTime) : null;

    if (!start) return false;

    return start.getTime() <= Date.now();
  };

  const sampleChats = [
    { id: "c1", name: "Team: Supervisors", type: "group" },

    { id: "c2", name: "Patient B", type: "direct" },

    { id: "c3", name: "Dr. Room 3", type: "group" },
  ];
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

  const handleSelectReportAppointment = useCallback(
    (appointment: any) => {
      const existingReport = appointment.report || null;
      const defaultSupervisor =
        existingReport?.reviewer?.id ||
        doctorWorkspace?.reportSupervisors?.[0]?.id ||
        "";
      const doctorToPatientRating =
        appointment.ratings?.find(
          (rating: any) => rating.kind === "DOCTOR_TO_PATIENT" && rating.active !== false,
        ) || null;
      setSelectedReport({
        ...appointment,
        patientName:
          existingReport?.patientName || appointment.patientName || appointment.patient?.name || "",
        patientPhone:
          existingReport?.patientPhone ||
          appointment.patientPhone ||
          appointment.patient?.phone ||
          "",
      });
      setReportForm({
        title:
          existingReport?.title ||
          appointment.clinicCase?.title ||
          appointment.slot?.purpose ||
          "Clinical case report",
        description: existingReport?.description || "",
        supervisor: defaultSupervisor,
      });
      setReportFormData(hydrateReportFormData(existingReport?.formData));
      setCompletionNotes(appointment.doctorCompletionNotes || "");
      setPatientFeedbackForm({
        stars: String(doctorToPatientRating?.stars ?? "5"),
        comment: doctorToPatientRating?.comment || "",
      });
      setSelectedReportTaskIds(
        Array.isArray(existingReport?.taskLinks)
          ? existingReport.taskLinks.map((link: any) => link.clinicTaskId)
          : [],
      );
      setReportMessage(null);
    },
    [doctorWorkspace?.reportSupervisors],
  );

  const clearReportSelection = useCallback(() => {
    setSelectedReport(null);
    setReportForm({ title: "", description: "", supervisor: "" });
    setReportFormData(createEmptyReportFormData());
    setCompletionNotes("");
    setPatientFeedbackForm({ stars: "5", comment: "" });
    setSelectedReportTaskIds([]);
    setReportMessage(null);
  }, []);

  const handleSubmitReport = useCallback(() => {
    if (!selectedReport) return;

    if (!reportForm.title || !reportForm.description) {
      setReportMessage("Title and description are required.");
      return;
    }

    if (selectedReport.status !== "COMPLETED") {
      setReportMessage("Mark the visit as completed before sending the report.");
      return;
    }

    setReportMessage("Submitting report...");

    const activeIdentifier =
      user.email || user.phone || user.username || user.name || "";
    const chosenSupervisor = doctorWorkspace?.reportSupervisors?.find(
      (supervisor) => supervisor.id === reportForm.supervisor,
    );

    fetch(`${API_URL}/appointments/${selectedReport.id}/report-submitted`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorIdentifier: activeIdentifier,
        patientName: selectedReport.patientName || selectedReport.patient?.name || undefined,
        patientPhone: selectedReport.patientPhone || selectedReport.patient?.phone || undefined,
        title: reportForm.title,
        description: reportForm.description,
        supervisorName:
          chosenSupervisor?.name ||
          (doctorWorkspace?.reportSupervisors?.length ? undefined : reportForm.supervisor || undefined),
        supervisorIdentifier:
          chosenSupervisor?.id ||
          (!doctorWorkspace?.reportSupervisors?.length ? reportForm.supervisor || undefined : undefined),
        partnerDoctorId: doctorWorkspace?.partnerPair
          ? doctorWorkspace.partnerPair.doctorOne.id === doctorWorkspace.doctor.id
            ? doctorWorkspace.partnerPair.doctorTwo.id
            : doctorWorkspace.partnerPair.doctorOne.id
          : undefined,
        taskIds: selectedReportTaskIds.length > 0 ? selectedReportTaskIds : undefined,
        formData: reportFormData,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setReportMessage("Report submitted.");
        fetchPerformance();
      })
      .catch(() => setReportMessage("Failed to submit report."));

    clearReportSelection();
  }, [
    API_URL,
    clearReportSelection,
    doctorWorkspace?.doctor.id,
    doctorWorkspace,
    fetchPerformance,
    reportFormData,
    reportForm.description,
    reportForm.supervisor,
    reportForm.title,
    selectedReport,
    selectedReportTaskIds,
    user.email,
    user.name,
    user.phone,
    user.username,
  ]);

  const handleCompleteAppointment = useCallback(async () => {
    if (!selectedReport) return;

    const activeIdentifier =
      user.id || user.email || user.phone || user.username || user.name || "";
    if (!activeIdentifier) {
      setReportMessage("Missing doctor identifier.");
      return;
    }

    try {
      setReportMessage("Saving completion...");
      const response = await fetch(
        `${API_URL}/appointments/${selectedReport.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorIdentifier: activeIdentifier,
            completionNotes: completionNotes || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to complete the appointment.");
      }
      setReportMessage("Appointment completed.");
      await loadData();
      setSelectedReport((prev: any) =>
        prev ? { ...prev, status: "COMPLETED", doctorCompletionNotes: completionNotes } : prev,
      );
    } catch (err: any) {
      setReportMessage(err?.message || "Failed to complete the appointment.");
    }
  }, [API_URL, completionNotes, loadData, selectedReport, user.email, user.id, user.name, user.phone, user.username]);

  const handleRatePatient = useCallback(async () => {
    if (!selectedReport) return;
    const activeIdentifier =
      user.id || user.email || user.phone || user.username || user.name || "";
    if (!activeIdentifier) {
      setReportMessage("Missing doctor identifier.");
      return;
    }

    try {
      setReportMessage("Saving patient feedback...");
      const response = await fetch(
        `${API_URL}/appointments/${selectedReport.id}/doctor-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: activeIdentifier,
            stars: Number(patientFeedbackForm.stars),
            comment: patientFeedbackForm.comment || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save patient feedback.");
      }
      setReportMessage("Patient feedback saved.");
      await loadData();
    } catch (err: any) {
      setReportMessage(err?.message || "Failed to save patient feedback.");
    }
  }, [
    API_URL,
    loadData,
    patientFeedbackForm.comment,
    patientFeedbackForm.stars,
    selectedReport,
    user.email,
    user.id,
    user.name,
    user.phone,
    user.username,
  ]);

  const surfaceMeta: Record<
    DoctorSurface,
    { eyebrow: string; title: string; description: string; badges: string[] }
  > = {
    overview: {
      eyebrow: "Student workspace",
      title: "Doctor clinical desk",
      description:
        "Your academic clinic workspace, planning surface, approvals, and reporting tools in one wider desk.",
      badges: ["Clinical desk", "Planning", "Review actions"],
    },
    profile: {
      eyebrow: "Profile",
      title: "Doctor identity and account",
      description:
        "Keep your personal details, profile image, and password settings inside the same doctor suite.",
      badges: ["Identity", "Account", "Profile"],
    },
    notifications: {
      eyebrow: "Alerts",
      title: "Doctor notifications center",
      description:
        "Read request updates, scheduling alerts, and workflow messages without leaving the page.",
      badges: ["Alerts", "Unread tracking", "Actionable"],
    },
    approvals: {
      eyebrow: "Review",
      title: "Reservation approval desk",
      description:
        "Handle pending appointment decisions from a full-width workspace instead of a popup drawer.",
      badges: ["Pending requests", "Approve", "Reject"],
    },
    report: {
      eyebrow: "Reports",
      title: "Case report studio",
      description:
        "Review booked appointments, mark no-shows, and complete reports in a stable inline workspace.",
      badges: ["Booked cases", "No-show", "Submission"],
    },
    chat: {
      eyebrow: "Communication",
      title: "Chat and room workspace",
      description:
        "Search, open, and continue direct conversations and shared rooms from one always-visible communication desk.",
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
          <DoctorSideRail
            userName={user.name || "Doctor"}
            activeView={activeSurface}
            unreadNotifications={unreadNotifications}
            chatUnreadCount={chatUnreadCount}
            onOverview={() => setActiveSurface("overview")}
            onProfile={() => setActiveSurface("profile")}
            onNotifications={() => setActiveSurface("notifications")}
            onApprovals={() => setActiveSurface("approvals")}
            onReport={() => setActiveSurface("report")}
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
                      Doctor workspace
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

            <div className={activeSurface === "overview" ? "space-y-6" : "hidden"}>
                {identifier ? (
                  <DoctorWorkspacePanel
                    apiUrl={API_URL}
                    identifier={identifier}
                    onWorkspaceChange={setDoctorWorkspace}
                  />
                ) : null}

                <DoctorDashboardSummary
                  userName={user.name || "Doctor"}
                  todayAppointments={todayAppointments.length}
                  pendingAppointments={pendingAppointments.length}
                  unreadNotifications={unreadNotifications}
                  showLegacyOps={showLegacyOps}
                  onToggleLegacy={() => setShowLegacyOps((value) => !value)}
                />

                {showLegacyOps ? (
                  <DoctorLegacyOperations
                    todayAppointments={todayAppointments}
                    appointments={appointments}
                    notifications={notifications}
                    unreadNotifications={unreadNotifications}
                    groupedSlots={groupedSlots}
                    loadingAction={loadingAction}
                    weeklyPerformance={weeklyPerformance}
                    getWeekRange={getWeekRange}
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
                ) : null}
              </div>

            <div className={activeSurface === "profile" ? "" : "hidden"}>
              <DoctorProfilePanel
                user={user}
                doctorIdNumber={(user as any).doctorIdNumber}
                avatarData={avatarData}
                editName={editName}
                editPhone={editPhone}
                oldPassword={oldPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showOldPwd={showOldPwd}
                showNewPwd={showNewPwd}
                nameEditable={nameEditable}
                phoneEditable={phoneEditable}
                pwdEditable={pwdEditable}
                headerEditing={headerEditing}
                headerNameInput={headerNameInput}
                doctorEmoji={doctorEmoji}
                showSave={showSave}
                onAvatarPick={handleAvatarPick}
                onHeaderEditOpen={() => {
                  setHeaderNameInput(editName || user.name || "");
                  setHeaderEditing(true);
                }}
                onHeaderEditingChange={setHeaderEditing}
                onHeaderNameInputChange={setHeaderNameInput}
                onHeaderNameSave={() => {
                  setEditName(headerNameInput);
                  setNameEditable(true);
                  setHeaderEditing(false);
                }}
                onPhoneEditableToggle={() => setPhoneEditable((value) => !value)}
                onPhoneChange={setEditPhone}
                onBioEditableToggle={() => setBioEditable((value) => !value)}
                onBioChange={setEditBio}
                onPasswordEditableToggle={() => setPwdEditable((value) => !value)}
                onOldPasswordChange={setOldPassword}
                onNewPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowOldPasswordToggle={() => setShowOldPwd((value) => !value)}
                onShowNewPasswordToggle={() => setShowNewPwd((value) => !value)}
                onBack={() => {
                  if (showSave) {
                    setConfirmExit(true);
                  } else {
                    setActiveSurface("overview");
                  }
                }}
                publicProfile={publicProfile}
                publicProfileLoading={publicProfileLoading}
                editBio={editBio}
                bioEditable={bioEditable}
                onSave={async () => {
                  await saveProfile();
                  await refreshPublicProfile();
                }}
              />
            </div>

            <div className={activeSurface === "approvals" ? "" : "hidden"}>
              <DoctorApprovalsView
                pendingAppointments={pendingAppointments}
                loadingAction={loadingAction}
                onApprove={(appointmentId) => handleDecision(appointmentId, true)}
                onReject={(appointmentId, note) => handleDecision(appointmentId, false, note)}
              />
            </div>

            <div className={activeSurface === "notifications" ? "" : "hidden"}>
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

            <div className={activeSurface === "chat" ? "" : "hidden"}>
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

            <div className={activeSurface === "report" ? "" : "hidden"}>
              <DoctorReportWorkspace
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
                onNoShow={handleNoShow}
                onSelectReport={handleSelectReportAppointment}
                onCloseReportForm={clearReportSelection}
                onPatientNameChange={(value) =>
                  setSelectedReport((prev: any) => ({ ...prev, patientName: value }))
                }
                onPatientPhoneChange={(value) =>
                  setSelectedReport((prev: any) => ({ ...prev, patientPhone: value }))
                }
                onSupervisorChange={(value) =>
                  setReportForm((prev) => ({ ...prev, supervisor: value }))
                }
                onTitleChange={(value) =>
                  setReportForm((prev) => ({ ...prev, title: value }))
                }
                onDescriptionChange={(value) =>
                  setReportForm((prev) => ({ ...prev, description: value }))
                }
                onToggleTask={(taskId, checked) =>
                  setSelectedReportTaskIds((prev) =>
                    checked ? [...prev, taskId] : prev.filter((id) => id !== taskId),
                  )
                }
                onReportFieldChange={(field, value) =>
                  setReportFormData((prev) => ({ ...prev, [field]: value }))
                }
                onToggleRadiographicView={(value, checked) =>
                  setReportFormData((prev) => ({
                    ...prev,
                    radiographicViews: checked
                      ? Array.from(new Set([...prev.radiographicViews, value]))
                      : prev.radiographicViews.filter((item) => item !== value),
                  }))
                }
                onDiagnosisLineChange={(index, value) =>
                  setReportFormData((prev) => ({
                    ...prev,
                    diagnosisLines: prev.diagnosisLines.map((line, lineIndex) =>
                      lineIndex === index ? value : line,
                    ),
                  }))
                }
                onTreatmentVisitChange={(index, field, value) =>
                  setReportFormData((prev) => ({
                    ...prev,
                    treatmentVisits: prev.treatmentVisits.map((visit, visitIndex) =>
                      visitIndex === index ? { ...visit, [field]: value } : visit,
                    ),
                  }))
                }
                onCompletionNotesChange={setCompletionNotes}
                onCompleteAppointment={() => void handleCompleteAppointment()}
                onPatientRatingChange={(value) =>
                  setPatientFeedbackForm((prev) => ({ ...prev, stars: value }))
                }
                onPatientCommentChange={(value) =>
                  setPatientFeedbackForm((prev) => ({ ...prev, comment: value }))
                }
                onSubmitPatientFeedback={() => void handleRatePatient()}
                onSubmit={handleSubmitReport}
              />
            </div>
          </section>
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




