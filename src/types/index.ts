export interface Entry {
  id: string;
  content: string;
  timestamp: Date;
}

export interface Journal {
  id: string;           // Public key (SHA1 hash)
  privateKey: string;   // UUID v4
  title: string;
  entries: Entry[];
  createdAt: Date;
  modifiedAt: Date;
}

export interface ExportedJournal {
  id: string;
  title: string;
  entries: Entry[];
  createdAt: Date;
  modifiedAt: Date;
}
