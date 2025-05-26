/**
 * Utility functions for asymmetric cryptography operations using Web Crypto API
 */

// Generate a new RSA key pair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048, // 2048 bits - standard secure length
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // usage
    );
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw new Error(`Failed to generate key pair: ${error.message}`);
  }
}

// Export public key to base64 string
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  try {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error("Error exporting public key:", error);
    throw new Error(`Failed to export public key: ${error.message}`);
  }
}

// Export private key to base64 string
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  try {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error("Error exporting private key:", error);
    throw new Error(`Failed to export private key: ${error.message}`);
  }
}

// Import public key from base64 string
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  try {
    const binaryKey = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      "spki",
      binaryKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Error importing public key:", error);
    throw new Error(`Failed to import public key: ${error.message}`);
  }
}

// Import private key from base64 string
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  try {
    const binaryKey = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Error importing private key:", error);
    throw new Error(`Failed to import private key: ${error.message}`);
  }
}

// Encrypt a message using a public key
export async function asymEncrypt(
  publicKey: CryptoKey,
  plaintext: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data
    );
    
    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

// Decrypt a message using a private key
export async function asymDecrypt(
  privateKey: CryptoKey,
  ciphertext: string
): Promise<string> {
  try {
    const binaryCiphertext = base64ToArrayBuffer(ciphertext);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      binaryCiphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

// Helper: Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
