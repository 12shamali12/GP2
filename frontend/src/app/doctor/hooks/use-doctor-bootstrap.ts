"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type User = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  avatar?: string | null;
  username?: string | null;
  gender?: string | null;
  bio?: string | null;
  doctorIdNumber?: string | null;
};

type UseDoctorBootstrapParams = {
  apiUrl: string;
  user: User;
  identifier: string;
  approvalsOpen: boolean;
  getWeekRange: () => { start: Date; end: Date };
  fetchConversations: () => Promise<void> | void;
  setUser: Dispatch<SetStateAction<User>>;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditPhone: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
  setAppointments: Dispatch<SetStateAction<any[]>>;
  setSlots: Dispatch<SetStateAction<any[]>>;
  setNotifications: Dispatch<SetStateAction<any[]>>;
  setPerformanceCounts: Dispatch<
    SetStateAction<{
      done: number;
      rejected: number;
      cancelledByDoctor: number;
      cancelledByPatient: number;
      noShow: number;
    }>
  >;
};

export function useDoctorBootstrap({
  apiUrl,
  user,
  identifier,
  approvalsOpen,
  getWeekRange,
  fetchConversations,
  setUser,
  setEditName,
  setEditPhone,
  setEditBio,
  setAvatarData,
  setAppointments,
  setSlots,
  setNotifications,
  setPerformanceCounts,
}: UseDoctorBootstrapParams) {
  const activeIdentifier =
    user.id || user.email || user.phone || user.username || "";

  const fetchPerformance = useCallback(async () => {
    if (!activeIdentifier) return;

    const range = getWeekRange();
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();

    try {
      const response = await fetch(
        `${apiUrl}/appointments/performance?doctorIdentifier=${encodeURIComponent(
          activeIdentifier
        )}&weekStart=${encodeURIComponent(
          startIso
        )}&weekEnd=${encodeURIComponent(endIso)}`
      );

      const data = await response.json();

      if (response.ok && data) {
        setPerformanceCounts(data);
      }
    } catch {
      /* ignore */
    }
  }, [activeIdentifier, apiUrl, getWeekRange, setPerformanceCounts]);

  const loadData = useCallback(async () => {
    const userId = user.id;
    try {
      const tasks: Promise<void>[] = [];

      if (userId) {
        tasks.push(
          fetch(`${apiUrl}/appointments/slots?doctorId=${encodeURIComponent(userId)}`)
            .then(async (response) => {
              const data = await response.json();
              if (response.ok) {
                setSlots(data || []);
              }
            })
            .catch(() => {
              /* ignore */
            }),
        );
      }

      if (activeIdentifier) {
        tasks.push(
          fetch(
            `${apiUrl}/appointments/mine?role=doctor&identifier=${encodeURIComponent(activeIdentifier)}`,
          )
            .then(async (response) => {
              const data = await response.json();
              if (response.ok) {
                setAppointments(data || []);
              }
            })
            .catch(() => {
              /* ignore */
            }),
        );

        tasks.push(
          fetch(`${apiUrl}/notifications?identifier=${encodeURIComponent(activeIdentifier)}`)
            .then(async (response) => {
              const data = await response.json();
              if (response.ok) {
                setNotifications(data || []);
              }
            })
            .catch(() => {
              /* ignore */
            }),
        );
      }

      if (activeIdentifier && !(user as any).doctorIdNumber) {
        tasks.push(
          fetch(`${apiUrl}/auth/profile?identifier=${encodeURIComponent(activeIdentifier)}`)
            .then(async (response) => {
              const data = await response.json();
              if (response.ok) {
                const profile = data.user || data;
                const merged = { ...user, ...profile };

                setUser(merged);
                setEditBio(merged.bio || "");

                try {
                  sessionStorage.setItem("currentUser", JSON.stringify(merged));
                } catch {
                  /* ignore */
                }
              }
            })
            .catch(() => {
              /* ignore */
            }),
        );
      }

      await Promise.all(tasks);
    } catch {
      /* ignore */
    }

    fetchPerformance();
  }, [
    activeIdentifier,
    apiUrl,
    fetchPerformance,
    setEditBio,
    setAppointments,
    setNotifications,
    setSlots,
    setUser,
    user,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = sessionStorage.getItem("currentUser");

      if (stored) {
        const parsed = JSON.parse(stored);

        setUser(parsed);
        setEditName(parsed.name || "");
        setEditPhone(parsed.phone || "");
        setEditBio(parsed.bio || "");
        setAvatarData(parsed.avatar || "");
      }
    } catch {
      /* ignore */
    }
  }, [setAvatarData, setEditBio, setEditName, setEditPhone, setUser]);

  useEffect(() => {
    loadData();
    fetchPerformance();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    const activeIdentifier =
      user.id || user.email || user.phone || user.username || "";

    if (!activeIdentifier) return;

    fetchPerformance();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getWeekRange, user.email, user.phone, user.username, user.name]);

  useEffect(() => {
    if (!approvalsOpen) return;

    loadData();

    const timer = setInterval(loadData, 8000);

    return () => clearInterval(timer);
  }, [approvalsOpen, loadData]);

  useEffect(() => {
    const fetchGender = async () => {
      if (!identifier || user.gender) return;

      try {
        const response = await fetch(
          `${apiUrl}/auth/profile?identifier=${encodeURIComponent(identifier)}`,
        );
        const data = await response.json();
        const foundGender = data?.gender || data?.user?.gender;

        if (response.ok && foundGender) {
          const merged = { ...user, gender: foundGender };

          setUser(merged);

          try {
            sessionStorage.setItem("currentUser", JSON.stringify(merged));
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    };

    fetchGender();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, user.gender]);

  useEffect(() => {
    if (!identifier) return;

    fetchConversations();
  }, [fetchConversations, identifier]);

  return {
    fetchPerformance,
    loadData,
  };
}
