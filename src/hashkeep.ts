const BASE = "https://hashkeep.magland.org";

// Utility: SHA-1 → 40-char hex string
export async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Store a blob and receive its publicKey.
 * `blob` may be a string, ArrayBuffer, File, etc.
 */
export async function hashkeepStore(
  privateKey: string,
  blob: string | Blob
): Promise<string> {
  const publicKey = await sha1Hex(privateKey);

  await fetch(`${BASE}/store?pk=${publicKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ privateKey, blob }),
  });

  return publicKey;
}

/**
 * Retrieve the blob.  Call `res.arrayBuffer()` instead of `.text()` if
 * you expect binary data.
 */
export async function hashkeepGet(publicKey: string): Promise<string> {
  const res = await fetch(`${BASE}/${publicKey}`);
  if (!res.ok) throw new Error(`Hashkeep: ${res.status}`);
  return res.text();
}
