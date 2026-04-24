import Dexie, { Table } from 'dexie';
import { Message, UserProfile, Chat } from '../types';

export class LocalDatabase extends Dexie {
  messages!: Table<Message & { chatId: string }>;
  chats!: Table<Chat>;
  profiles!: Table<UserProfile>;

  constructor() {
    super('ChatAppLocalDB');
    this.version(1).stores({
      messages: 'id, chatId, created_at, senderId',
      chats: 'id, updated_at',
      profiles: 'uid, username'
    });
  }
}

export const localDb = new LocalDatabase();
