export type ManagedUserSummary = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  doctorIdNumber?: string | null;
  blocked?: boolean;
  blockedUntil?: string | null;
  blockReason?: string | null;
};

export type SupervisorAssignmentItem = {
  id: string;
  semesterLabel: string;
  note?: string | null;
  active: boolean;
  doctor: ManagedUserSummary & {
    groupMembership?: {
      group: {
        id: string;
        name: string;
        semesterLabel: string;
      };
    } | null;
  };
};

export type GroupSupervisorLink = {
  supervisor: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
  };
};

export type GroupMemberItem = {
  doctor: ManagedUserSummary;
};

export type PartnerPairItem = {
  id: string;
  note?: string | null;
  createdAt: string;
  doctorOne: ManagedUserSummary;
  doctorTwo: ManagedUserSummary;
};

export type PartnerRequestIncomingItem = {
  id: string;
  note?: string | null;
  createdAt: string;
  group: {
    id: string;
    name: string;
    semesterLabel: string;
  };
  sender: ManagedUserSummary;
};

export type PartnerRequestOutgoingItem = {
  id: string;
  note?: string | null;
  createdAt: string;
  group: {
    id: string;
    name: string;
    semesterLabel: string;
  };
  receiver: ManagedUserSummary;
};

export type AdminPartnerRequestItem = {
  id: string;
  note?: string | null;
  createdAt: string;
  sender: ManagedUserSummary;
  receiver: ManagedUserSummary;
};

export type GroupPostItem = {
  id: string;
  title?: string | null;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
  };
  group?: {
    id: string;
    name: string;
    semesterLabel: string;
  };
};

export type GroupJoinRequestItem = {
  id: string;
  note?: string | null;
  createdAt: string;
  applicant: {
    id: string;
    name: string;
    username: string;
    role?: string;
    email?: string | null;
    phone?: string | null;
    doctorIdNumber?: string | null;
  };
};

export type SupervisedGroupItem = {
  id?: string;
  group: {
    id: string;
    name: string;
    description?: string | null;
    semesterLabel: string;
    members: GroupMemberItem[];
    supervisors: GroupSupervisorLink[];
    joinRequests: GroupJoinRequestItem[];
    partnerPairs?: PartnerPairItem[];
    posts: GroupPostItem[];
  };
};

export type ShiftTemplateItem = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  appointmentCapacity: number;
  active: boolean;
};

export type ClinicItem = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type ClinicSupervisorLinkItem = {
  id: string;
  notes?: string | null;
  supervisor: ManagedUserSummary;
};

export type ClinicTaskCatalogItem = {
  id: string;
  title: string;
  description?: string | null;
  clinic: ClinicItem;
  progress?: {
    id: string;
    status: "PENDING" | "COMPLETED" | "ASSISTED";
    mark?: number | null;
    notes?: string | null;
    completedAt?: string | null;
  } | null;
};

export type RotationScheduleItem = {
  id: string;
  assignmentDate: string;
  notes?: string | null;
  clinicId: string;
  shiftId: string;
  clinic: ClinicItem;
  shift: ShiftTemplateItem;
  plan?: {
    id: string;
    label: string;
  } | null;
  supervisors: Array<{
    id: string;
    notes?: string | null;
    supervisor: {
      id: string;
      name: string;
      username: string;
      email?: string | null;
    };
    clinic: {
      id: string;
      name: string;
    };
  }>;
};

export type RotationPlanDayItem = {
  id: string;
  assignmentDate: string;
  notes?: string | null;
  isVacation?: boolean;
  vacationReason?: string | null;
  clinic?: {
    id: string;
    name: string;
  } | null;
};

export type ClinicExamItem = {
  id: string;
  title: string;
  scheduledAt: string;
  cases?: string | null;
  notes?: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  mark?: number | null;
  clinic: ClinicItem;
  shift?: ShiftTemplateItem | null;
  plan?: {
    id: string;
    label: string;
  } | null;
  student?: ManagedUserSummary;
  supervisor?: ManagedUserSummary;
};

export type SupervisorClinicDutyItem = {
  id: string;
  assignmentDate: string;
  notes?: string | null;
  clinicId: string;
  shiftId: string;
  clinic: ClinicItem;
  shift: ShiftTemplateItem;
  plan?: {
    id: string;
    label: string;
    startsOn?: string;
    endsOn?: string;
  } | null;
  supervisors: ClinicSupervisorLinkItem[];
  groupAssignments: Array<{
    id: string;
    assignmentDate: string;
    notes?: string | null;
    group: {
      id: string;
      name: string;
      semesterLabel: string;
      members: GroupMemberItem[];
      partnerPairs: PartnerPairItem[];
    };
    slots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      purpose?: string | null;
      doctor: ManagedUserSummary;
      appointment?: {
        id: string;
        status: string;
        patient?: ManagedUserSummary | null;
      } | null;
    }>;
  }>;
};

export type SupervisorTaskItem = {
  id: string;
  title: string;
  description: string;
  dueAt?: string | null;
  createdAt: string;
  doctor?: {
    id: string;
    name: string;
    username: string;
  } | null;
  group?: {
    id: string;
    name: string;
    semesterLabel: string;
  } | null;
  supervisor?: {
    id: string;
    name: string;
    username: string;
  } | null;
};

export type FlexibleCaseReportFormData = {
  chiefComplaint?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  socialHistory?: string;
  extraOralFindings?: string;
  intraOralFindings?: string;
  radiographicViews?: string[];
  radiographicFindings?: string;
  diagnosisLines?: string[];
  treatmentVisits?: Array<{
    visitLabel?: string;
    tooth?: string;
    procedure?: string;
  }>;
  facultyNotes?: string;
};

export type CaseReportItem = {
  id: string;
  title: string;
  description: string;
  status: "SUBMITTED" | "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED";
  mark?: number | null;
  rating?: number | null;
  feedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  supervisorName?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  formData?: FlexibleCaseReportFormData | null;
  doctor?: {
    id: string;
    name: string;
    username: string;
    doctorIdNumber?: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    username: string;
  } | null;
  appointment?: {
    id: string;
    doctorCompletionNotes?: string | null;
    patient?: {
      id: string;
      name: string;
      phone?: string | null;
    } | null;
    clinicCase?: {
      id: string;
      title: string;
      clinic?: {
        id: string;
        name: string;
      } | null;
    } | null;
    slot?: {
      startTime?: string;
      endTime?: string;
      purpose?: string | null;
    } | null;
  } | null;
  taskLinks?: Array<{
    id: string;
    role: "PRIMARY" | "ASSISTANT";
    clinicTaskId: string;
    clinicTask?: {
      id: string;
      title: string;
      clinic?: {
        id: string;
        name: string;
      } | null;
    };
  }>;
};

export type SupervisorWorkspaceData = {
  supervisor: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
  };
  directAssignments: SupervisorAssignmentItem[];
  supervisedGroups: SupervisedGroupItem[];
  groupDirectory: Array<{
    id: string;
    name: string;
    description?: string | null;
    semesterLabel: string;
    members: GroupMemberItem[];
    partnerPairs?: PartnerPairItem[];
    posts: GroupPostItem[];
  }>;
  clinics: ClinicItem[];
  shifts: ShiftTemplateItem[];
  tasks: SupervisorTaskItem[];
  activeFreezes: Array<{
    id: string;
    blockedUntil: string;
    reason?: string | null;
    doctor: ManagedUserSummary;
  }>;
  reports: CaseReportItem[];
  clinicOverview: SupervisorClinicDutyItem[];
  upcomingExams: ClinicExamItem[];
  stats: {
    supervisedDoctors: number;
    groups: number;
    pendingReports: number;
    activeFreezes: number;
  };
};

export type DoctorWorkspaceData = {
  doctor: ManagedUserSummary;
  supervisors: Array<{
    id: string;
    semesterLabel: string;
    supervisor: {
      id: string;
      name: string;
      username: string;
      email?: string | null;
      phone?: string | null;
    };
  }>;
  groupMembership?: {
    id: string;
    groupId: string;
    group: {
      id: string;
      name: string;
      description?: string | null;
      semesterLabel: string;
      supervisors: GroupSupervisorLink[];
      members: GroupMemberItem[];
      partnerPairs: PartnerPairItem[];
      posts: GroupPostItem[];
    };
  } | null;
  partnerPair?: PartnerPairItem | null;
  partnerRequests: {
    incoming: PartnerRequestIncomingItem[];
    outgoing: PartnerRequestOutgoingItem[];
  };
  schedule: RotationScheduleItem[];
  clinicTasks: ClinicTaskCatalogItem[];
  exams: ClinicExamItem[];
  reportSupervisors: ManagedUserSummary[];
  tasks: SupervisorTaskItem[];
  reports: CaseReportItem[];
  feed: GroupPostItem[];
  joinableGroups: Array<{
    id: string;
    name: string;
    description?: string | null;
    semesterLabel: string;
    supervisors: GroupSupervisorLink[];
  }>;
  stats: {
    supervisors: number;
    tasks: number;
    reportsSubmitted: number;
    reportReviews: number;
  };
};

export type AdminGroupItem = {
  id: string;
  name: string;
  description?: string | null;
  semesterLabel: string;
  active: boolean;
  members: GroupMemberItem[];
  supervisors: GroupSupervisorLink[];
  joinRequests: GroupJoinRequestItem[];
  partnerPairs?: PartnerPairItem[];
  partnerRequests?: AdminPartnerRequestItem[];
  posts: GroupPostItem[];
  assignedPlans?: Array<{
    plan: {
      id: string;
      label: string;
      startsOn: string;
      endsOn: string;
      shift?: ShiftTemplateItem | null;
    };
    assignments: Array<{
      id: string;
      assignmentDate: string;
      notes?: string | null;
      clinic: {
        id: string;
        name: string;
      };
      shift: {
        id: string;
        name: string;
        startsAt: string;
        endsAt: string;
      };
    }>;
  }>;
  currentPlan?: {
    plan: {
      id: string;
      label: string;
      startsOn: string;
      endsOn: string;
      shift?: ShiftTemplateItem | null;
    };
    assignments: Array<{
      id: string;
      assignmentDate: string;
      notes?: string | null;
      clinic: {
        id: string;
        name: string;
      };
      shift: {
        id: string;
        name: string;
        startsAt: string;
        endsAt: string;
      };
    }>;
  } | null;
  nextPlans?: Array<{
    plan: {
      id: string;
      label: string;
      startsOn: string;
      endsOn: string;
      shift?: ShiftTemplateItem | null;
    };
    assignments: Array<{
      id: string;
      assignmentDate: string;
      notes?: string | null;
      clinic: {
        id: string;
        name: string;
      };
      shift: {
        id: string;
        name: string;
        startsAt: string;
        endsAt: string;
      };
    }>;
  }>;
};

export type PlanningWorkspaceData = {
  groups: Array<AdminGroupItem>;
  clinics: Array<
    ClinicItem & {
      tasks: Array<{
        id: string;
        title: string;
        description?: string | null;
      }>;
      supervisorLinks: ClinicSupervisorLinkItem[];
    }
  >;
  shifts: ShiftTemplateItem[];
  semesters: Array<{
    id: string;
    label: string;
    sortOrder: number;
    endsOn?: string | null;
    active: boolean;
    clinicCases: Array<{
      id: string;
      title: string;
      description?: string | null;
      requiredCount: number;
      active: boolean;
      clinic: {
        id: string;
        name: string;
      };
    }>;
  }>;
  plans: Array<{
    id: string;
    label: string;
    startsOn: string;
    endsOn: string;
    active: boolean;
    shift?: ShiftTemplateItem | null;
    days: RotationPlanDayItem[];
    assignments: Array<{
      id: string;
      assignmentDate: string;
      notes?: string | null;
      group: {
        id: string;
        name: string;
        semesterLabel: string;
      };
      clinic: {
        id: string;
        name: string;
      };
      shift: {
        id: string;
        name: string;
        startsAt: string;
        endsAt: string;
      };
    }>;
    assignedGroups: Array<{
      group: {
        id: string;
        name: string;
        semesterLabel: string;
      };
      assignments: Array<{
        id: string;
        assignmentDate: string;
        notes?: string | null;
        clinic: {
          id: string;
          name: string;
        };
        shift: {
          id: string;
          name: string;
          startsAt: string;
          endsAt: string;
        };
      }>;
    }>;
    exams: ClinicExamItem[];
  }>;
};
