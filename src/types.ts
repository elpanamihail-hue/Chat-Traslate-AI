export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string;
  nativeLanguage: string;
  email: string;
  updatedAt: any;
  fcmToken?: string;
  theme?: 'light' | 'dark';
  setupComplete?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageSenderId?: string;
  updatedAt: any;
  participantProfiles?: { [uid: string]: UserProfile };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  originalLanguage?: string;
  translations?: { [lang: string]: string };
  fileUrl?: string;
  fileName?: string;
  createdAt: any;
}
