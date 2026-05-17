export type PublicProfileResponse = {
  profile: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    bio?: string | null;
    role: "PATIENT" | "DOCTOR" | "SUPERVISOR" | "ADMIN";
    doctorIdNumber?: string | null;
    semester?: {
      id: string;
      label: string;
      sortOrder: number;
      endsOn?: string | null;
    } | null;
    groupMembership?: {
      id: string;
      name: string;
      semesterLabel: string;
    } | null;
    clinicsWorked?: Array<{
      id: string;
      name: string;
    }>;
    partner?: {
      id: string;
      name: string;
      username: string;
      avatar?: string | null;
    } | null;
    canReport: boolean;
  };
  stats: {
    patientRatingAverage?: number | null;
    supervisorRatingAverage?: number | null;
    patientCount: number;
    supervisorCount: number;
    completedCases: number;
    assistedCases: number;
    reviewedReports: number;
    doctorRatings?: number | null;
    leaderboard?: {
      rank: number;
      points: number;
      completedCount: number;
      assistedCount: number;
      patientRatingPoints: number;
      supervisorRatingPoints: number;
      semesterRank?: number | null;
      semesterPoints?: number | null;
      semester?: {
        id: string;
        label: string;
      } | null;
    } | null;
  };
  comments: {
    patient: Array<{
      id: string;
      stars: number;
      comment?: string | null;
      createdAt: string;
      rater: {
        id: string;
        name: string;
        username: string;
        role: string;
      };
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
    }>;
    supervisor: Array<{
      id: string;
      stars: number;
      comment?: string | null;
      createdAt: string;
      rater: {
        id: string;
        name: string;
        username: string;
        role: string;
      };
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
    }>;
    staff: Array<{
      id: string;
      stars: number;
      comment?: string | null;
      createdAt: string;
      rater: {
        id: string;
        name: string;
        username: string;
      };
    }>;
  };
  history: {
    completedReports: Array<{
      id: string;
      title?: string | null;
      reviewedAt?: string | null;
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
    }>;
    assistedReports: Array<{
      id: string;
      title?: string | null;
      reviewedAt?: string | null;
      doctor?: {
        id: string;
        name: string;
        username: string;
        avatar?: string | null;
      } | null;
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
    }>;
    patientAppointments: Array<{
      id: string;
      status: string;
      completedAt?: string | null;
      doctor?: {
        id: string;
        name: string;
        username: string;
        avatar?: string | null;
      } | null;
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
      doctorRatings?: Array<{
        stars: number;
        comment?: string | null;
        rater: {
          id: string;
          name: string;
          username: string;
        };
      }>;
    }>;
    recentReviews: Array<{
      id: string;
      title?: string | null;
      status: string;
      reviewedAt?: string | null;
      doctor?: {
        id: string;
        name: string;
        username: string;
        avatar?: string | null;
      } | null;
      clinicCase?: {
        id: string;
        title: string;
        clinic?: { id: string; name: string } | null;
      } | null;
    }>;
  };
};
