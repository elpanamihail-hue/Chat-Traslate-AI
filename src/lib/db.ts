import Dexie, { Table } from 'dexie';
import { Message, UserProfile, Chat } from '../types';

export class LocalDatabase extends Dexie {
  messages!: Table<Message>;
  chats!: Table<Chat>;
  profiles!: Table<UserProfile>;

  constructor() {
    super('ChatAppLocalDB');
    this.version(1).stores({
      messages: 'id, group_id, created_at, user_id',
      chats: 'id, updated_at',
      profiles: 'uid, username'
    });
  }
}

export const localDb = new LocalDatabase();
