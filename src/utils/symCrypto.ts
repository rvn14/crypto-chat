// utils/symCrypto.ts
export async function generateSymKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
export async function exportSymKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return Buffer.from(raw).toString("base64");
}

export async function importSymKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(Buffer.from(b64, "base64"));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}
export async function symEncrypt(
  key: CryptoKey,
  plaintext: string
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc
  );
  return {
    iv: Buffer.from(iv).toString("base64"),
    ciphertext: Buffer.from(encrypted).toString("base64"),
  };
}

export async function symDecrypt(
  key: CryptoKey,
  ivB64: string,
  ctB64: string
): Promise<string> {
  const iv = Uint8Array.from(Buffer.from(ivB64, "base64"));
  const data = Uint8Array.from(Buffer.from(ctB64, "base64"));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}
