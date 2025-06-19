import { hashkeepGet, hashkeepStore } from '../hashkeep';
import type { Entry, ExportedJournal, Journal } from '../types';
import {
  addJournalId,
  getJournalIds,
  getPrivateKey,
  removeJournalId,
  removePrivateKey,
  storePrivateKey
} from '../utils/storageUtils';
import { generateEntryId, generatePrivateKey, generatePublicKey } from './cryptoService';

export async function createJournal(title: string): Promise<Journal> {
  const privateKey = generatePrivateKey();
  const id = await generatePublicKey(privateKey);
  const now = new Date();

  const journal: Journal = {
    id,
    privateKey,
    title,
    entries: [],
    createdAt: now,
    modifiedAt: now
  };

  // Store the journal in hashkeep
  await storeJournal(journal);

  // Store the journal ID and private key locally
  addJournalId(id);
  storePrivateKey(id, privateKey);

  return journal;
}

// Store a journal in hashkeep
export async function storeJournal(journal: Journal): Promise<void> {
  const journalJson = JSON.stringify(journal);
  await hashkeepStore(journal.privateKey, journalJson);
}

// Helper function to parse journal JSON and convert date strings to Date objects
function parseJournalJson(journalJson: string): Journal {
  const journal = JSON.parse(journalJson) as Journal;

  // Convert date strings back to Date objects
  journal.createdAt = new Date(journal.createdAt);
  journal.modifiedAt = new Date(journal.modifiedAt);
  journal.entries.forEach(entry => {
    entry.timestamp = new Date(entry.timestamp);
  });

  return journal;
}

// Cache for journals to avoid repeated network requests
const journalCache = new Map<string, Journal>();

export async function getAllJournals(): Promise<Journal[]> {
  // Get all journal IDs from local storage
  const journalIds = getJournalIds();

  // Fetch all journals that aren't already in the cache
  const fetchPromises = journalIds.map(async (id) => {
    if (!journalCache.has(id)) {
      try {
        await getJournal(id);
      } catch (error) {
        console.error(`Failed to fetch journal ${id}:`, error);
      }
    }
    return journalCache.get(id);
  });

  // Wait for all fetches to complete
  const journals = (await Promise.all(fetchPromises)).filter(Boolean) as Journal[];

  // Sort by modified date (newest first)
  return journals.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

export async function getJournal(id: string): Promise<Journal | undefined> {
  // Check cache first
  if (journalCache.has(id)) {
    return journalCache.get(id);
  }

  try {
    // Get the private key from local storage
    const privateKey = getPrivateKey(id);
    if (!privateKey) {
      console.error(`No private key found for journal ${id}`);
      return undefined;
    }

    // Retrieve from hashkeep
    const journalJson = await hashkeepGet(id);
    const journal = parseJournalJson(journalJson);

    // Cache the journal
    journalCache.set(id, journal);

    return journal;
  } catch (error) {
    console.error('Failed to retrieve journal from hashkeep:', error);
    return undefined;
  }
}

export async function updateJournal(journal: Journal): Promise<void> {
  journal.modifiedAt = new Date();

  // Store the updated journal in hashkeep
  await storeJournal(journal);

  // Update cache
  journalCache.set(journal.id, journal);
}

export async function deleteJournal(id: string): Promise<void> {
  // Remove from cache
  journalCache.delete(id);

  // Remove from local storage
  removeJournalId(id);
  removePrivateKey(id);

  // Note: We can't actually delete from hashkeep
  // The data will remain in hashkeep, but we'll no longer have access to it
  // if we remove it from our local storage
}

export async function addEntry(journalId: string, content: string): Promise<void> {
  const journal = await getJournal(journalId);
  if (!journal) throw new Error('Journal not found');

  const entry: Entry = {
    id: generateEntryId(),
    content,
    timestamp: new Date()
  };

  journal.entries.push(entry);
  await updateJournal(journal);
}

export async function updateEntry(journalId: string, entryId: string, content: string): Promise<void> {
  const journal = await getJournal(journalId);
  if (!journal) throw new Error('Journal not found');

  const entryIndex = journal.entries.findIndex(e => e.id === entryId);
  if (entryIndex === -1) throw new Error('Entry not found');

  journal.entries[entryIndex].content = content;
  await updateJournal(journal);
}

export async function deleteEntry(journalId: string, entryId: string): Promise<void> {
  const journal = await getJournal(journalId);
  if (!journal) throw new Error('Journal not found');

  journal.entries = journal.entries.filter(e => e.id !== entryId);
  await updateJournal(journal);
}

export function exportJournal(journal: Journal): ExportedJournal {
  return {
    id: journal.id,
    title: journal.title,
    entries: journal.entries,
    createdAt: journal.createdAt,
    modifiedAt: journal.modifiedAt
  };
}

export async function checkJournalExists(id: string): Promise<Journal | null> {
  try {
    const journal = await getJournal(id);
    return journal || null;
  } catch {
    return null;
  }
}

export async function importJournal(
  exportedJournal: ExportedJournal,
  overwriteExisting: boolean = false
): Promise<Journal> {
  // Check if journal with this ID already exists
  const existingJournal = await getJournal(exportedJournal.id);

  if (existingJournal) {
    if (!overwriteExisting) {
      throw new Error('Journal with this ID already exists');
    }

    // Overwrite existing journal, keeping the private key
    const updatedJournal: Journal = {
      ...exportedJournal,
      privateKey: existingJournal.privateKey,
      modifiedAt: new Date()
    };
    await updateJournal(updatedJournal);
    return updatedJournal;
  } else {
    // Create new journal with new ID since we don't have the private key
    const privateKey = generatePrivateKey();
    const newId = await generatePublicKey(privateKey);
    const now = new Date();

    const newJournal: Journal = {
      ...exportedJournal,
      id: newId,
      privateKey,
      modifiedAt: now
    };

    // Store the new journal in hashkeep
    await storeJournal(newJournal);

    // Update cache and local storage
    journalCache.set(newJournal.id, newJournal);
    addJournalId(newJournal.id);
    storePrivateKey(newJournal.id, newJournal.privateKey);

    return newJournal;
  }
}
