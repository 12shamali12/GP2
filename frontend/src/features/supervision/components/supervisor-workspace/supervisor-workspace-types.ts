export type SupervisorWorkspaceViewKey = "live" | "reviews" | "students";

export const supervisorWorkspaceViewLabels: Record<SupervisorWorkspaceViewKey, string> = {
  live: "Live clinic",
  reviews: "Reviews",
  students: "Students & groups",
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
