export type SupervisorWorkspaceViewKey =
  | "live"
  | "reviews"
  | "exams"
  | "students"
  | "groups";

export const supervisorWorkspaceViewLabels: Record<SupervisorWorkspaceViewKey, string> = {
  live: "Live clinic",
  reviews: "Reviews",
  exams: "Exams",
  students: "Tasks & frozen accs",
  groups: "Groups",
};

export type SearchDoctorItem = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  doctorIdNumber?: string | null;
  groupMembership?: {
    group: {
      id: string;
      name: string;
      semesterLabel: string;
    };
  } | null;
};
