"use client";

import type { Dispatch, SetStateAction } from "react";
import { authHeaders } from "@/lib/api/auth";

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

type UsePatientProfileEditorParams = {
  apiUrl: string;
  identifier: string;
  user: PatientUser;
  editName: string;
  editPhone: string;
  editEmail: string;
  editBio: string;
  avatarData: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  nameEditable: boolean;
  phoneEditable: boolean;
  emailEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  maxAvatarBase64Len: number;
  maxAvatarBytes: number;
  setUser: Dispatch<SetStateAction<PatientUser>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setOldPassword: Dispatch<SetStateAction<string>>;
  setNewPassword: Dispatch<SetStateAction<string>>;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  setNameEditable: Dispatch<SetStateAction<boolean>>;
  setPhoneEditable: Dispatch<SetStateAction<boolean>>;
  setEmailEditable: Dispatch<SetStateAction<boolean>>;
  setBioEditable: Dispatch<SetStateAction<boolean>>;
  setPwdEditable: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
};

export function usePatientProfileEditor({
  apiUrl,
  identifier,
  user,
  editName,
  editPhone,
  editEmail,
  editBio,
  avatarData,
  oldPassword,
  newPassword,
  confirmPassword,
  nameEditable,
  phoneEditable,
  emailEditable,
  bioEditable,
  pwdEditable,
  maxAvatarBase64Len,
  maxAvatarBytes,
  setUser,
  setAvatarData,
  setEditBio,
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  setNameEditable,
  setPhoneEditable,
  setEmailEditable,
  setBioEditable,
  setPwdEditable,
  setError,
  setMessage,
}: UsePatientProfileEditorParams) {
  const showSave =
    nameEditable ||
    phoneEditable ||
    emailEditable ||
    bioEditable ||
    pwdEditable ||
    editName !== (user.name || "") ||
    editPhone !== (user.phone || "") ||
    editEmail !== (user.email || "") ||
    editBio !== (user.bio || "") ||
    avatarData !== (user.avatar || "") ||
    !!oldPassword ||
    !!newPassword ||
    !!confirmPassword;

  const handleAvatarPick = () => {
    setError(null);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event: any) => {
      const file = event?.target?.files?.[0];

      if (!file) return;

      if (file.size > maxAvatarBytes) {
        setError("Please pick a photo under ~1.5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        if (dataUrl.length > maxAvatarBase64Len) {
          setError("Please pick a smaller photo (too large).");
          return;
        }

        setAvatarData(dataUrl);
        setMessage("New photo loaded. Save to apply.");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const saveProfile = async () => {
    setError(null);
    setMessage(null);

    if (!identifier) {
      setError("Missing identifier.");
      return;
    }

    if (pwdEditable || oldPassword || newPassword || confirmPassword) {
      if (!oldPassword.trim()) {
        setError("Enter your current password.");
        return;
      }

      if (!newPassword.trim() || !confirmPassword.trim()) {
        setError("Enter and confirm the new password.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
    }

    if (
      avatarData &&
      avatarData.startsWith("data:") &&
      avatarData.length > maxAvatarBase64Len
    ) {
      setError("Photo too large. Please pick an image under ~1.5MB.");
      return;
    }

    try {
      if (pwdEditable || oldPassword || newPassword || confirmPassword) {
        const passwordResponse = await fetch(`${apiUrl}/auth/change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            identifier,
            currentPassword: oldPassword,
            newPassword,
          }),
        });
        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          setError(passwordData?.message || "Failed to change password.");
          return;
        }
      }

      const payload: any = {
        identifier,
        name: editName || user.name,
        phone: editPhone || user.phone,
        bio: editBio || null,
        avatar: avatarData || undefined,
      };

      if (editEmail && editEmail.trim()) {
        payload.email = editEmail.trim();
      }

      const profileResponse = await fetch(`${apiUrl}/auth/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        setError(profileData?.message || "Failed to update profile.");
        return;
      }

      const updated = profileData.user || user;
      setUser(updated);
      setAvatarData(updated.avatar || avatarData);

      try {
        sessionStorage.setItem("currentUser", JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      setMessage("Changes saved.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNameEditable(false);
      setPhoneEditable(false);
      setEmailEditable(false);
      setBioEditable(false);
      setPwdEditable(false);
    } catch (error: any) {
      setError(error?.message || "Save failed.");
    }
  };

  return {
    showSave,
    handleAvatarPick,
    saveProfile,
  };
}
