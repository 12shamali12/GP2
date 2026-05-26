export type CaseProgressStatus = "OPEN" | "ASSISTED" | "COMPLETED";

export type SemesterClinicCaseRow = {
  id: string;
  semesterId: string;
  clinicId: string;
  title: string;
  description: string | null;
  requiredCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  semester: { id: string; label: string; sortOrder: number };
  clinic: { id: string; name: string };
  _count: { appointments: number; progress: number };
};

export type DoctorMyCasesEntry = {
  progressId: string;
  status: CaseProgressStatus;
  completedAt: string | null;
  case: {
    id: string;
    title: string;
    description: string | null;
    requiredCount: number;
    semester: { id: string; label: string };
  };
  report: {
    id: string;
    title: string;
    status: string;
    mark: number | null;
    rating: number | null;
    reviewedAt: string | null;
    appointment: {
      id: string;
      patient: {
        id: string;
        name: string;
        username: string;
        phone: string | null;
      } | null;
    } | null;
  } | null;
};

export type DoctorMyCasesResponse = {
  doctor: { id: string; name: string; semesterId: string | null };
  summary: { total: number; completed: number; assisted: number; open: number };
  groups: Array<{
    clinic: { id: string; name: string };
    cases: DoctorMyCasesEntry[];
  }>;
};

export type AdminDoctorProgressEntry = {
  id: string;
  status: CaseProgressStatus;
  completedAt: string | null;
  clinicCaseId: string;
  doctorId: string;
  clinicCase: {
    id: string;
    title: string;
    description: string | null;
    requiredCount: number;
    active: boolean;
    clinic: { id: string; name: string };
    semester: { id: string; label: string };
  };
};

export type AdminDoctorProgressResponse = {
  doctor: {
    id: string;
    name: string;
    username: string;
    doctorIdNumber: string | null;
    semesterId: string | null;
  };
  progress: AdminDoctorProgressEntry[];
};
