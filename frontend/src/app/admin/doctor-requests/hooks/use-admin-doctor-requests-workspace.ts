"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decideDoctorRequest,
  getDoctorRequests,
  getUsers,
  reapproveDoctor as reapproveDoctorAccount,
  setUserBlocked,
} from "@/features/admin/services/admin-api";
import type {
  DoctorRequestItem,
  ManagedUser,
} from "@/features/admin/types/admin";
import { sectionByLetter } from "@/features/admin/utils/collection";

export function useAdminDoctorRequestsWorkspace() {
  const [doctorRequests, setDoctorRequests] = useState<DoctorRequestItem[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestQuery, setRequestQuery] = useState("");
  const [doctorQuery, setDoctorQuery] = useState("");

  const loadDoctorRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctorRequests();
      setDoctorRequests(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await getUsers();
      setDoctors(
        (data || []).filter((user: ManagedUser) => user.role === "DOCTOR"),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load doctors.");
    }
  };

  useEffect(() => {
    void loadDoctorRequests();
    void loadDoctors();
  }, []);

  const decide = async (id: string, approve: boolean) => {
    if (!approve && !window.confirm("Reject this doctor request?")) return;
    try {
      await decideDoctorRequest(id, approve);
      setDoctorRequests((prev) => prev.filter((request) => request.id !== id));
      void loadDoctors();
    } catch (e: any) {
      setError(e?.message || "Failed to update request.");
    }
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await setUserBlocked(id, blocked);
      setDoctors((prev) =>
        prev.map((doctor) => (doctor.id === id ? { ...doctor, blocked } : doctor)),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update user.");
    }
  };

  const reapproveDoctor = async (id: string) => {
    try {
      await reapproveDoctorAccount(id);
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === id ? { ...doctor, doctorStatus: "APPROVED" } : doctor,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to re-approve doctor.");
    }
  };

  const filteredRequests = useMemo(() => {
    const query = requestQuery.trim().toLowerCase();
    return doctorRequests.filter((request) => {
      if (!query) return true;
      const text = [
        request.applicant.name,
        request.applicant.username,
        request.applicant.email || "",
        request.applicant.phone || "",
        request.note || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [doctorRequests, requestQuery]);

  const filteredDoctors = useMemo(() => {
    const query = doctorQuery.trim().toLowerCase();
    return doctors.filter((doctor) => {
      if (!query) return true;
      const text = [
        doctor.name,
        doctor.username,
        doctor.email || "",
        doctor.phone || "",
        doctor.doctorIdNumber || "",
        doctor.groupMembership?.group.name || "",
        doctor.groupMembership?.group.semesterLabel || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [doctors, doctorQuery]);

  const requestSections = useMemo(
    () => sectionByLetter(filteredRequests, (request) => request.applicant.name),
    [filteredRequests],
  );
  const doctorSections = useMemo(
    () => sectionByLetter(filteredDoctors, (doctor) => doctor.name),
    [filteredDoctors],
  );

  return {
    error,
    loading,
    requestQuery,
    setRequestQuery,
    doctorQuery,
    setDoctorQuery,
    filteredRequests,
    filteredDoctors,
    requestSections,
    doctorSections,
    decide,
    toggleBlock,
    reapproveDoctor,
  };
}
