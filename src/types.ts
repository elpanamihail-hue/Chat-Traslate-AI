export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string;
  nativeLanguage: string;
  email: string;
  updated_at: string;
  fcmToken?: string;
  theme?: 'light' | 'dark' | 'worldcup';
  setupComplete?: boolean;
  status?: 'online' | 'offline';
  lastChanged?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageSenderId?: string;
  updated_at: string;
  participantProfiles?: { [uid: string]: UserProfile };
  isGroup?: boolean;
  groupName?: string;
  groupPhoto?: string;
  createdBy?: string;
}

export interface Member {
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  originalLanguage?: string;
  translations?: { [lang: string]: string };
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
  audioDuration?: number;
  created_at: string;
  readBy?: string[];
}
