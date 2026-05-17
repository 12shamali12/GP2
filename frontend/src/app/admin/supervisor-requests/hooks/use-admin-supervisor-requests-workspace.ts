"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decideSupervisorRequest,
  getSupervisorRequests,
  getUsers,
  reapproveSupervisor as reapproveSupervisorAccount,
  setUserBlocked,
} from "@/features/admin/services/admin-api";
import type {
  ManagedUser,
  SupervisorRequestItem,
} from "@/features/admin/types/admin";
import { sectionByLetter } from "@/features/admin/utils/collection";

export function useAdminSupervisorRequestsWorkspace() {
  const [requests, setRequests] = useState<SupervisorRequestItem[]>([]);
  const [supervisors, setSupervisors] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestQuery, setRequestQuery] = useState("");
  const [supervisorQuery, setSupervisorQuery] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupervisorRequests();
      setRequests(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisors = async () => {
    try {
      const data = await getUsers();
      setSupervisors(
        (data || []).filter((user: ManagedUser) => user.role === "SUPERVISOR"),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load supervisors.");
    }
  };

  useEffect(() => {
    void fetchRequests();
    void loadSupervisors();
  }, []);

  const decide = async (id: string, approve: boolean) => {
    try {
      await decideSupervisorRequest(id, approve);
      setRequests((prev) => prev.filter((request) => request.id !== id));
      void loadSupervisors();
    } catch (e: any) {
      setError(e?.message || "Failed to update request.");
    }
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await setUserBlocked(id, blocked);
      setSupervisors((prev) =>
        prev.map((supervisor) =>
          supervisor.id === id ? { ...supervisor, blocked } : supervisor,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update supervisor.");
    }
  };

  const reapproveSupervisor = async (id: string) => {
    try {
      await reapproveSupervisorAccount(id);
      setSupervisors((prev) =>
        prev.map((supervisor) =>
          supervisor.id === id
            ? { ...supervisor, supervisorStatus: "APPROVED" }
            : supervisor,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to re-approve supervisor.");
    }
  };

  const filteredRequests = useMemo(() => {
    const query = requestQuery.trim().toLowerCase();
    return requests.filter((request) => {
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
  }, [requests, requestQuery]);

  const filteredSupervisors = useMemo(() => {
    const query = supervisorQuery.trim().toLowerCase();
    return supervisors.filter((supervisor) => {
      if (!query) return true;
      const text = [
        supervisor.name,
        supervisor.username,
        supervisor.email || "",
        supervisor.phone || "",
        supervisor.blockReason || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [supervisors, supervisorQuery]);

  const requestSections = useMemo(
    () => sectionByLetter(filteredRequests, (request) => request.applicant.name),
    [filteredRequests],
  );
  const supervisorSections = useMemo(
    () => sectionByLetter(filteredSupervisors, (supervisor) => supervisor.name),
    [filteredSupervisors],
  );

  return {
    error,
    loading,
    requestQuery,
    setRequestQuery,
    supervisorQuery,
    setSupervisorQuery,
    filteredRequests,
    filteredSupervisors,
    requestSections,
    supervisorSections,
    decide,
    toggleBlock,
    reapproveSupervisor,
  };
}
