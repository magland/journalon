import { v4 as uuidv4 } from 'uuid';

export function generatePrivateKey(): string {
  return uuidv4();
}

export async function generatePublicKey(privateKey: string): Promise<string> {
  // Create SHA1 hash of the private key
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function generateEntryId(): string {
  return uuidv4();
}
