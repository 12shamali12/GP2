export type SupervisorRequestItem = {
  id: string;
  applicant: {
    id: string;
    name: string;
    username: string;
    email: string | null;
    phone: string | null;
  };
  createdAt: string;
  note?: string | null;
};

export type DoctorRequestItem = {
  id: string;
  applicant: {
    id: string;
    name: string;
    username: string;
    email: string | null;
    phone: string | null;
  };
  createdAt: string;
  note?: string | null;
};

export type ManagedUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  doctorIdNumber?: string | null;
  avatar?: string | null;
  bio?: string | null;
  role: "PATIENT" | "DOCTOR" | "SUPERVISOR" | "ADMIN";
  supervisorStatus?: string;
  doctorStatus?: string;
  blocked: boolean;
  blockedUntil?: string | null;
  blockReason?: string | null;
  semester?: {
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  } | null;
  groupMembership?: {
    group: {
      id: string;
      name: string;
      semesterLabel: string;
    };
  } | null;
  createdAt: string;
};

export type SemesterProgressionPreviewItem = {
  id: string;
  name: string;
  username: string;
  doctorIdNumber?: string | null;
  currentSemester: {
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  };
  nextSemester: {
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  };
};

export type SemesterProgressionPreview = {
  semesters: Array<{
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  }>;
  dueStudents: SemesterProgressionPreviewItem[];
};

export type LeaderboardEntry = {
  rank: number;
  points: number;
  completedCount: number;
  assistedCount: number;
  patientRatingPoints: number;
  supervisorRatingPoints: number;
  doctor: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    doctorIdNumber?: string | null;
  };
};

export type LeaderboardBoard = {
  key: string;
  label: string;
  semester: {
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
  } | null;
  entries: LeaderboardEntry[];
};

export type LeaderboardSnapshot = {
  generatedAt: string;
  overall: LeaderboardBoard;
  semesters: LeaderboardBoard[];
};

export type UserProfileReportItem = {
  id: string;
  reason: string;
  note?: string | null;
  status: "PENDING" | "DISMISSED" | "ACTION_TAKEN";
  resolutionNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reporter: {
    id: string;
    name: string;
    username: string;
    role: "PATIENT" | "DOCTOR" | "SUPERVISOR" | "ADMIN";
    avatar?: string | null;
  };
  reportedUser: {
    id: string;
    name: string;
    username: string;
    role: "PATIENT" | "DOCTOR" | "SUPERVISOR" | "ADMIN";
    avatar?: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    username: string;
    role: "PATIENT" | "DOCTOR" | "SUPERVISOR" | "ADMIN";
  } | null;
};
