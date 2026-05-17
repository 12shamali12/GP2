export type ChatUser = {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: string;
  doctorIdNumber?: string | null;
};

export type ConversationItem = {
  id: string;
  kind?: "DIRECT" | "ROOM";
  title?: string | null;
  description?: string | null;
  roomAudience?:
    | "ALL_USERS"
    | "STUDENTS_SUPERVISORS"
    | "SUPERVISORS_ONLY"
    | "GROUP"
    | null;
  group?: {
    id: string;
    name: string;
    semesterLabel?: string;
  } | null;
  unread: number;
  otherUser?: ChatUser | null;
  lastMessage?: {
    text?: string | null;
    imageUrl?: string | null;
    createdAt: string;
  } | null;
};

export type MessageItem = {
  id: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  senderId?: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    role?: string;
  };
};
