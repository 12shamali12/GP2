import { authHeaders } from "@/lib/api/auth";
import { httpJson } from "@/lib/api/http";
import type {
  AdminDoctorProgressResponse,
  CaseProgressStatus,
  DoctorMyCasesResponse,
  SemesterClinicCaseRow,
} from "../types";

export const getMyCases = (identifier: string) =>
  httpJson<DoctorMyCasesResponse>(`/doctor/case-progress`, {
    headers: authHeaders(),
    query: { identifier },
  });

export const listClinicCases = (filters: {
  semesterId?: string;
  clinicId?: string;
  activeOnly?: boolean;
}) =>
  httpJson<SemesterClinicCaseRow[]>(`/admin/clinic-cases`, {
    headers: authHeaders(),
    query: {
      semesterId: filters.semesterId,
      clinicId: filters.clinicId,
      activeOnly: filters.activeOnly ? "true" : undefined,
    },
  });

export const softDeleteClinicCase = (id: string) =>
  httpJson<SemesterClinicCaseRow>(`/admin/clinic-cases/${id}/soft-delete`, {
    method: "PATCH",
    headers: authHeaders(),
  });

export const restoreClinicCase = (id: string) =>
  httpJson<SemesterClinicCaseRow>(`/admin/clinic-cases/${id}/restore`, {
    method: "PATCH",
    headers: authHeaders(),
  });

export const getAdminDoctorProgress = (doctorId: string) =>
  httpJson<AdminDoctorProgressResponse>(`/admin/doctor-case-progress`, {
    headers: authHeaders(),
    query: { doctorId },
  });

export const setDoctorProgressStatus = (
  progressId: string,
  status: CaseProgressStatus,
) =>
  httpJson(`/admin/doctor-case-progress/${progressId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: { status },
  });

export const deleteDoctorProgress = (progressId: string) =>
  httpJson(`/admin/doctor-case-progress/${progressId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
