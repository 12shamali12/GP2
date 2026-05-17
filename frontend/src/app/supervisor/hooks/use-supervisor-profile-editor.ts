"use client";

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

type UseSupervisorProfileEditorParams = {
  apiUrl: string;
  identifier: string;
  user: SupervisorUser;
  editName: string;
  editPhone: string;
  editBio: string;
  avatarData: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  nameEditable: boolean;
  phoneEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  setUser: Dispatch<SetStateAction<SupervisorUser>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setOldPassword: Dispatch<SetStateAction<string>>;
  setNewPassword: Dispatch<SetStateAction<string>>;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  setNameEditable: Dispatch<SetStateAction<boolean>>;
  setPhoneEditable: Dispatch<SetStateAction<boolean>>;
  setBioEditable: Dispatch<SetStateAction<boolean>>;
  setPwdEditable: Dispatch<SetStateAction<boolean>>;
  maxAvatarBase64Len: number;
  maxAvatarBytes: number;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
};

export function useSupervisorProfileEditor({
  apiUrl,
  identifier,
  user,
  editName,
  editPhone,
  editBio,
  avatarData,
  oldPassword,
  newPassword,
  confirmPassword,
  nameEditable,
  phoneEditable,
  bioEditable,
  pwdEditable,
  setUser,
  setAvatarData,
  setEditBio,
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  setNameEditable,
  setPhoneEditable,
  setBioEditable,
  setPwdEditable,
  maxAvatarBase64Len,
  maxAvatarBytes,
  setError,
  setMessage,
}: UseSupervisorProfileEditorParams) {
  const showSave =
    nameEditable ||
    phoneEditable ||
    bioEditable ||
    pwdEditable ||
    editName !== (user.name || "") ||
    editPhone !== (user.phone || "") ||
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

    try {
      if (pwdEditable || oldPassword || newPassword || confirmPassword) {
        const passwordResponse = await fetch(`${apiUrl}/auth/change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      const profileResponse = await fetch(`${apiUrl}/auth/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          name: editName || user.name,
          phone: editPhone || user.phone,
          bio: editBio || null,
          avatar: avatarData || undefined,
        }),
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
