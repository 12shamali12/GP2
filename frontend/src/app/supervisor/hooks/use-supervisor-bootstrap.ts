"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type SupervisorUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  username?: string;
  avatar?: string | null;
  bio?: string | null;
};

type UseSupervisorBootstrapParams = {
  apiUrl: string;
  user: SupervisorUser;
  identifier: string;
  fetchConversations: () => Promise<void> | void;
  setUser: Dispatch<SetStateAction<SupervisorUser>>;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditPhone: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
};

export function useSupervisorBootstrap({
  apiUrl,
  user,
  identifier,
  fetchConversations,
  setUser,
  setEditName,
  setEditPhone,
  setEditBio,
  setAvatarData,
}: UseSupervisorBootstrapParams) {
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
          setEditName(profile.name || "");
          setEditPhone(profile.phone || "");
          setEditBio(profile.bio || "");
          setAvatarData(profile.avatar || "");

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
  }, [
    apiUrl,
    identifier,
    setEditName,
    setEditPhone,
    setEditBio,
    setAvatarData,
    setUser,
    user.id,
  ]);

  useEffect(() => {
    if (!identifier) return;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);
}
