// Utility functions for local storage

const JOURNAL_IDS_KEY = 'journalon_journal_ids';

/**
 * Get the list of journal IDs from local storage
 */
export function getJournalIds(): string[] {
  const idsJson = localStorage.getItem(JOURNAL_IDS_KEY);
  if (!idsJson) return [];
  try {
    return JSON.parse(idsJson);
  } catch (error) {
    console.error('Failed to parse journal IDs from localStorage:', error);
    return [];
  }
}

/**
 * Save the list of journal IDs to local storage
 */
export function saveJournalIds(ids: string[]): void {
  localStorage.setItem(JOURNAL_IDS_KEY, JSON.stringify(ids));
}

/**
 * Add a journal ID to the list in local storage
 */
export function addJournalId(id: string): void {
  const ids = getJournalIds();
  if (!ids.includes(id)) {
    ids.push(id);
    saveJournalIds(ids);
  }
}

/**
 * Remove a journal ID from the list in local storage
 */
export function removeJournalId(id: string): void {
  const ids = getJournalIds();
  const newIds = ids.filter(existingId => existingId !== id);
  if (newIds.length !== ids.length) {
    saveJournalIds(newIds);
  }
}

/**
 * Store a key-value pair in local storage
 */
export function storeKeyValue<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieve a value from local storage by key
 */
export function getKeyValue<T>(key: string, defaultValue: T): T {
  const valueJson = localStorage.getItem(key);
  if (!valueJson) return defaultValue;
  try {
    return JSON.parse(valueJson) as T;
  } catch (error) {
    console.error(`Failed to parse value for key ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Store private keys separately for security
const PRIVATE_KEYS_KEY = 'journalon_private_keys';

/**
 * Store a private key for a journal
 */
export function storePrivateKey(journalId: string, privateKey: string): void {
  const privateKeys = getKeyValue<Record<string, string>>(PRIVATE_KEYS_KEY, {});
  privateKeys[journalId] = privateKey;
  storeKeyValue(PRIVATE_KEYS_KEY, privateKeys);
}

/**
 * Get a private key for a journal
 */
export function getPrivateKey(journalId: string): string | null {
  const privateKeys = getKeyValue<Record<string, string>>(PRIVATE_KEYS_KEY, {});
  return privateKeys[journalId] || null;
}

/**
 * Remove a private key for a journal
 */
export function removePrivateKey(journalId: string): void {
  const privateKeys = getKeyValue<Record<string, string>>(PRIVATE_KEYS_KEY, {});
  if (privateKeys[journalId]) {
    delete privateKeys[journalId];
    storeKeyValue(PRIVATE_KEYS_KEY, privateKeys);
  }
}
