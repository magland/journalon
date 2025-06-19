import Dexie, { type Table } from 'dexie';
import type { Journal } from '../types';

export class JournalDatabase extends Dexie {
  journals!: Table<Journal>;

  constructor() {
    super('JournalDatabase');
    this.version(1).stores({
      journals: 'id, title, createdAt, modifiedAt'
    });
  }
}

export const db = new JournalDatabase();
