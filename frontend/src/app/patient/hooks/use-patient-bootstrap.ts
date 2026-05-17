"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type PatientUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
  username?: string | null;
  bio?: string | null;
};

type UsePatientBootstrapParams = {
  apiUrl: string;
  user: PatientUser;
  identifier: string;
  fetchConversations: () => Promise<void> | void;
  setUser: Dispatch<SetStateAction<PatientUser>>;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditPhone: Dispatch<SetStateAction<string>>;
  setEditEmail: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
  setAvailableSlots: Dispatch<SetStateAction<any[]>>;
  setUpcoming: Dispatch<SetStateAction<any[]>>;
  setHistory: Dispatch<SetStateAction<any[]>>;
  setPatientNotifications: Dispatch<SetStateAction<any[]>>;
};

export function usePatientBootstrap({
  apiUrl,
  user,
  identifier,
  fetchConversations,
  setUser,
  setEditName,
  setEditPhone,
  setEditEmail,
  setEditBio,
  setAvatarData,
  setAvailableSlots,
  setUpcoming,
  setHistory,
  setPatientNotifications,
}: UsePatientBootstrapParams) {
  const activeIdentifier =
    user.id || user.email || user.phone || user.username || "";

  const loadSlots = useCallback(async () => {
    try {
      const query = identifier
        ? `?patientIdentifier=${encodeURIComponent(identifier)}`
        : "";
      const response = await fetch(`${apiUrl}/appointments/slots${query}`);
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data || []);
      }
    } catch {
      /* ignore */
    }
  }, [apiUrl, identifier, setAvailableSlots]);

  const loadData = useCallback(async () => {
    const tasks: Promise<void>[] = [loadSlots()];

    if (activeIdentifier || user.name) {
      tasks.push(
        fetch(
          `${apiUrl}/appointments/mine?role=patient&identifier=${encodeURIComponent(activeIdentifier)}`,
        )
          .then(async (response) => {
            const data = await response.json();
            if (response.ok) {
              setUpcoming(data || []);
              setHistory(data || []);
            }
          })
          .catch(() => {
            /* ignore */
          }),
      );
    }

    if (activeIdentifier) {
      tasks.push(
        fetch(`${apiUrl}/notifications?identifier=${encodeURIComponent(activeIdentifier)}`)
          .then(async (response) => {
            const data = await response.json();
            if (response.ok) {
              setPatientNotifications(data || []);
            }
          })
          .catch(() => {
            /* ignore */
          }),
      );
    }

    await Promise.all(tasks);
  }, [
    activeIdentifier,
    apiUrl,
    loadSlots,
    setHistory,
    setPatientNotifications,
    setUpcoming,
    user.name,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = sessionStorage.getItem("currentUser");

      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    }
  }, [setUser]);

  useEffect(() => {
    if (user.id || !identifier) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/auth/profile?identifier=${encodeURIComponent(identifier)}`
        );
        const data = await response.json();
        const profile = data?.user || data;

        if (response.ok && profile) {
          setUser(profile);

          try {
            sessionStorage.setItem("currentUser", JSON.stringify(profile));
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    };

    fetchProfile();
  }, [apiUrl, identifier, setUser, user.id]);

  useEffect(() => {
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditEmail(user.email || "");
    setEditBio(user.bio || "");
    setAvatarData(user.avatar || "");
  }, [setAvatarData, setEditBio, setEditEmail, setEditName, setEditPhone, user]);

  useEffect(() => {
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  useEffect(() => {
    if (!identifier) return;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  return {
    loadSlots,
    loadData,
  };
}
