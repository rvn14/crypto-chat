/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react";
import {
  generateSymKey, exportSymKey, importSymKey, symEncrypt, symDecrypt
} from "@/utils/symCrypto";

export default function SymmetricDemo() {
  const [keyB64, setKeyB64] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [plaintext, setPlain] = useState("");
  const [iv, setIv] = useState(""); // Still needed internally but not shown in UI
  const [ciphertext, setCt] = useState("");
  const [decrypted, setDec] = useState("");
  const [loading, setLoading] = useState({
    generating: false,
    encrypting: false,
    decrypting: false
  });
  const [error, setError] = useState("");

  // Store complete encrypted payload (IV + ciphertext)
  const [encryptedPayload, setEncryptedPayload] = useState("");
  
  const genKey = async () => {
    setError("");
    setLoading(prev => ({ ...prev, generating: true }));
    try {
      const key = await generateSymKey();
      const exportedKey = await exportSymKey(key);
      setKeyB64(exportedKey);
      setDecryptKey(exportedKey); // Initialize decrypt key with the same value
    } catch (err) {
      setError(`Failed to generate key: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const encrypt = async () => {
    if (!plaintext) {
      setError("Please enter text to encrypt");
      return;
    }
    if (!keyB64) {
      setError("Please generate a key first");
      return;
    }

    setError("");
    setLoading(prev => ({ ...prev, encrypting: true }));
    try {
      const key = await importSymKey(keyB64);
      const { iv: newIv, ciphertext: ct } = await symEncrypt(key, plaintext);
      setIv(newIv); 
      setCt(ct);
      
      // Create a simplified payload that combines IV and ciphertext in a single string
      // Format: <base64_iv>::<base64_ciphertext>
      const simplePayload = `${newIv}::${ct}`;
      setEncryptedPayload(simplePayload);
      
    } catch (err) {
      setError(`Encryption failed: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, encrypting: false }));
    }
  };

  const decrypt = async () => {
    if (!decryptKey) {
      setError("Encryption key is required for decryption");
      return;
    }
    
    if (!ciphertext) {
      setError("No encrypted message to decrypt");
      return;
    }
    
    setError("");
    setLoading(prev => ({ ...prev, decrypting: true }));
    try {
      const key = await importSymKey(decryptKey);
      
      // Handle the simplified format: <iv>::<ciphertext>
      const parts = ciphertext.split("::");
      
      let ivToUse;
      let ciphertextToUse;
      
      if (parts.length === 2) {
        // Using our simplified format with IV included
        [ivToUse, ciphertextToUse] = parts;
      } else {
        // Try parsing as JSON for backward compatibility
        try {
          const payload = JSON.parse(ciphertext);
          if (payload.iv && payload.ciphertext) {
            ivToUse = payload.iv;
            ciphertextToUse = payload.ciphertext;
          } else {
            throw new Error("Invalid format");
          }
        } catch (e) {
          setError("Invalid encrypted message format. Please paste the complete encrypted message.");
          setLoading(prev => ({ ...prev, decrypting: false }));
          return;
        }
      }
      
      // Decrypt with the extracted IV and ciphertext
      const decryptedText = await symDecrypt(key, ivToUse, ciphertextToUse);
      setDec(decryptedText);
      
    } catch (err) {
      console.error("Decryption error:", err);
      setError(`Decryption failed: ${err.message || "Invalid key or encrypted message format"}`);
      setDec("");
    } finally {
      setLoading(prev => ({ ...prev, decrypting: false }));
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Symmetric Encryption Demo
        </h1>
        <p className="text-gray-500 mt-2">
          Encrypt and decrypt messages using AES encryption
        </p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError("")}>
            <svg className="h-6 w-6 text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </div>
      )}
      
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🔑</span> Key Management
        </h2>
        <button 
          onClick={genKey} 
          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${loading.generating ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading.generating}
        >
          {loading.generating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : "Generate New Key"}
        </button>
        
        {keyB64 && (
          <div className="mt-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Key (AES-256)</label>
            <div className="relative">
              <textarea 
                value={keyB64} 
                onChange={(e) => setKeyB64(e.target.value)}
                className="w-full h-20 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                onClick={() => copyToClipboard(keyB64, 'Key')} 
                className="absolute right-2 top-2 p-1 bg-gray-200 rounded-md hover:bg-gray-300"
                title="Copy to clipboard"
              >
                <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Save this key for later decryption</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔒</span> Encryption
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Plain Text Message</label>
            <textarea
              placeholder="Enter message to encrypt..."
              value={plaintext}
              onChange={(e) => setPlain(e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button 
            onClick={encrypt} 
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center ${loading.encrypting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading.encrypting || !keyB64}
          >
            {loading.encrypting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Encrypting...
              </>
            ) : "Encrypt Message"}
          </button>
          
          {encryptedPayload && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Payload</label>
              <div className="relative">
                <textarea 
                  readOnly 
                  value={encryptedPayload} // Fixed: removed the dot after encryptedPayload
                  className="w-full h-24 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                />
                <button 
                  onClick={() => copyToClipboard(encryptedPayload, 'Encrypted Payload')}
                  className="absolute right-2 top-2 p-1 bg-gray-200 rounded-md hover:bg-gray-300"
                  title="Copy to clipboard"
                >
                  <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Share this complete encrypted payload</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔓</span> Decryption
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Message</label>
            <div className="relative">
              <textarea 
                value={ciphertext} 
                onChange={(e) => setCt(e.target.value)}
                placeholder="Paste the complete encrypted message here..."
                className="w-full h-24 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Paste the entire encrypted message from the encryption step
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Decryption Key</label>
            <div className="relative">
              <textarea 
                value={decryptKey}
                onChange={(e) => setDecryptKey(e.target.value)} 
                placeholder="Paste the AES-256 key here for decryption..."
                className="w-full h-20 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be the same key used for encryption</p>
          </div>
          
          <button 
            onClick={decrypt} 
            className={`w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center ${loading.decrypting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading.decrypting}
          >
            {loading.decrypting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Decrypting...
              </>
            ) : "Decrypt Message"}
          </button>
          
          {decrypted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Decrypted Message
              </h3>
              <p className="mt-1 text-green-700 break-words">{decrypted}</p>
            </div>
          )}
        </section>
      </div>

      <div>
        
      </div>
      
      <footer className="text-center text-gray-500 text-sm mt-8">
        <p>All encryption is performed locally in your browser.</p>
        <p>This demo uses the Web Crypto API with AES-GCM.</p>
      </footer>
    </div>
  );
}
