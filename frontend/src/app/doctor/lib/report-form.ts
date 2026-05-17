export type DoctorReportTreatmentVisit = {
  visitLabel: string;
  tooth: string;
  procedure: string;
};

export type DoctorReportFormData = {
  chiefComplaint: string;
  medicalHistory: string;
  dentalHistory: string;
  socialHistory: string;
  extraOralFindings: string;
  intraOralFindings: string;
  radiographicViews: string[];
  radiographicFindings: string;
  diagnosisLines: string[];
  treatmentVisits: DoctorReportTreatmentVisit[];
  facultyNotes: string;
};

// Week range helper lives outside the React tree to avoid any TDZ issues.
export const getWeekRangeHelper = (): { start: Date; end: Date } => {
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

export const createEmptyReportFormData = (): DoctorReportFormData => ({
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

export const hydrateReportFormData = (raw: unknown): DoctorReportFormData => {
  const empty = createEmptyReportFormData();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return empty;
  }

  const source = raw as Record<string, unknown>;
  const diagnosisLines = Array.isArray(source.diagnosisLines)
    ? (source.diagnosisLines as unknown[])
    : [];
  const treatmentVisits = Array.isArray(source.treatmentVisits)
    ? (source.treatmentVisits as Array<Record<string, unknown>>)
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
      ? (source.radiographicViews as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    radiographicFindings:
      typeof source.radiographicFindings === "string"
        ? source.radiographicFindings
        : "",
    diagnosisLines: empty.diagnosisLines.map((fallback, index) => {
      const value = diagnosisLines[index];
      return typeof value === "string" ? value : fallback;
    }),
    treatmentVisits: empty.treatmentVisits.map((fallback, index) => {
      const visit = treatmentVisits[index];
      return {
        visitLabel:
          typeof visit?.visitLabel === "string"
            ? (visit.visitLabel as string)
            : fallback.visitLabel,
        tooth: typeof visit?.tooth === "string" ? (visit.tooth as string) : "",
        procedure:
          typeof visit?.procedure === "string"
            ? (visit.procedure as string)
            : "",
      };
    }),
    facultyNotes:
      typeof source.facultyNotes === "string" ? source.facultyNotes : "",
  };
};
