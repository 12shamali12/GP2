"use client";

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
};

type UseDoctorProfileEditorParams = {
  apiUrl: string;
  identifier: string;
  user: User;
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
  maxAvatarBase64Len: number;
  maxAvatarBytes: number;
  setUser: Dispatch<SetStateAction<User>>;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditPhone: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setAvatarData: Dispatch<SetStateAction<string>>;
  setOldPassword: Dispatch<SetStateAction<string>>;
  setNewPassword: Dispatch<SetStateAction<string>>;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  setNameEditable: Dispatch<SetStateAction<boolean>>;
  setPhoneEditable: Dispatch<SetStateAction<boolean>>;
  setBioEditable: Dispatch<SetStateAction<boolean>>;
  setPwdEditable: Dispatch<SetStateAction<boolean>>;
  setHeaderEditing: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
};

export function useDoctorProfileEditor({
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
  maxAvatarBase64Len,
  maxAvatarBytes,
  setUser,
  setEditName,
  setEditPhone,
  setEditBio,
  setAvatarData,
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  setNameEditable,
  setPhoneEditable,
  setBioEditable,
  setPwdEditable,
  setHeaderEditing,
  setError,
  setMessage,
}: UseDoctorProfileEditorParams) {
  const resetEdits = () => {
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditBio(user.bio || "");
    setAvatarData(user.avatar || "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNameEditable(false);
    setPhoneEditable(false);
    setBioEditable(false);
    setPwdEditable(false);
    setHeaderEditing(false);
  };

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
          avatar: avatarData || null,
        }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        setError(profileData?.message || "Failed to update profile.");
        return;
      }

      const updated = profileData.user || user;
      const merged = { ...updated, gender: updated.gender || user.gender };

      setUser(merged);
      setAvatarData(merged.avatar || avatarData);

      try {
        sessionStorage.setItem("currentUser", JSON.stringify(merged));
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

  const handleAvatarPick = () => {
    setError(null);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event: any) => {
      const file = event?.target?.files?.[0];

      if (!file) return;

      if (file.size > maxAvatarBytes) {
        setError(
          "Please choose a smaller photo (max ~1.5MB) to avoid request too large."
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAvatarData(dataUrl);
        setMessage("New photo loaded. Click Save changes to apply.");
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };

  return {
    resetEdits,
    showSave,
    saveProfile,
    handleAvatarPick,
  };
}
