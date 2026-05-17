"use client";

import type { Dispatch, SetStateAction } from "react";
import { DoctorProfilePanel } from "@/app/doctor/ui/doctor-profile-panel";
import type { PublicProfileResponse } from "@/features/profiles/types/profile";

type ProfileUser = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
  doctorIdNumber?: string | null;
};

type DoctorProfileSurfaceProps = {
  user: ProfileUser;
  avatarData: string;
  editName: string;
  editPhone: string;
  editBio: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showOldPwd: boolean;
  showNewPwd: boolean;
  nameEditable: boolean;
  phoneEditable: boolean;
  bioEditable: boolean;
  pwdEditable: boolean;
  headerEditing: boolean;
  headerNameInput: string;
  doctorEmoji: string;
  showSave: boolean;
  publicProfile: PublicProfileResponse | null;
  publicProfileLoading: boolean;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditPhone: Dispatch<SetStateAction<string>>;
  setEditBio: Dispatch<SetStateAction<string>>;
  setOldPassword: Dispatch<SetStateAction<string>>;
  setNewPassword: Dispatch<SetStateAction<string>>;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  setShowOldPwd: Dispatch<SetStateAction<boolean>>;
  setShowNewPwd: Dispatch<SetStateAction<boolean>>;
  setNameEditable: Dispatch<SetStateAction<boolean>>;
  setPhoneEditable: Dispatch<SetStateAction<boolean>>;
  setBioEditable: Dispatch<SetStateAction<boolean>>;
  setPwdEditable: Dispatch<SetStateAction<boolean>>;
  setHeaderEditing: Dispatch<SetStateAction<boolean>>;
  setHeaderNameInput: Dispatch<SetStateAction<string>>;
  onAvatarPick: () => void;
  onBack: () => void;
  onSave: () => Promise<void> | void;
};

export function DoctorProfileSurface({
  user,
  avatarData,
  editName,
  editPhone,
  editBio,
  oldPassword,
  newPassword,
  confirmPassword,
  showOldPwd,
  showNewPwd,
  nameEditable,
  phoneEditable,
  bioEditable,
  pwdEditable,
  headerEditing,
  headerNameInput,
  doctorEmoji,
  showSave,
  publicProfile,
  publicProfileLoading,
  setEditName,
  setEditPhone,
  setEditBio,
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  setShowOldPwd,
  setShowNewPwd,
  setNameEditable,
  setPhoneEditable,
  setBioEditable,
  setPwdEditable,
  setHeaderEditing,
  setHeaderNameInput,
  onAvatarPick,
  onBack,
  onSave,
}: DoctorProfileSurfaceProps) {
  return (
    <DoctorProfilePanel
      user={user}
      doctorIdNumber={user.doctorIdNumber}
      avatarData={avatarData}
      editName={editName}
      editPhone={editPhone}
      oldPassword={oldPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      showOldPwd={showOldPwd}
      showNewPwd={showNewPwd}
      nameEditable={nameEditable}
      phoneEditable={phoneEditable}
      pwdEditable={pwdEditable}
      headerEditing={headerEditing}
      headerNameInput={headerNameInput}
      doctorEmoji={doctorEmoji}
      showSave={showSave}
      onAvatarPick={onAvatarPick}
      onHeaderEditOpen={() => {
        setHeaderNameInput(editName || user.name || "");
        setHeaderEditing(true);
      }}
      onHeaderEditingChange={setHeaderEditing}
      onHeaderNameInputChange={setHeaderNameInput}
      onHeaderNameSave={() => {
        setEditName(headerNameInput);
        setNameEditable(true);
        setHeaderEditing(false);
      }}
      onPhoneEditableToggle={() => setPhoneEditable((value) => !value)}
      onPhoneChange={setEditPhone}
      onBioEditableToggle={() => setBioEditable((value) => !value)}
      onBioChange={setEditBio}
      onPasswordEditableToggle={() => setPwdEditable((value) => !value)}
      onOldPasswordChange={setOldPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onShowOldPasswordToggle={() => setShowOldPwd((value) => !value)}
      onShowNewPasswordToggle={() => setShowNewPwd((value) => !value)}
      onBack={onBack}
      publicProfile={publicProfile}
      publicProfileLoading={publicProfileLoading}
      editBio={editBio}
      bioEditable={bioEditable}
      onSave={onSave}
    />
  );
}
