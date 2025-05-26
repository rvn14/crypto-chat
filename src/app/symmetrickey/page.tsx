/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useState, useEffect } from "react";
import {
  generateSymKey, exportSymKey, importSymKey, symEncrypt, symDecrypt
} from "@/utils/symCrypto";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownCircle, 
  CheckCircle, Copy, Download, Key, KeyRound, Plane, RefreshCw, 
  Send, SendHorizonal, Shield, ShieldCheck, VenetianMask 
} from "lucide-react";
import { 
    auth, 
    firestore, 
    collection, 
    query, 
    orderBy, 
    limit,
    addDoc,
    serverTimestamp,
    getDoc
} from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { toast, Toaster } from "sonner";

function page() {
  const [user] = useAuthState(auth);
  const payloadRef = collection(firestore, 'symPayloads');
  const payloadQuery = query(payloadRef, orderBy('createdAt','desc' ), limit(25));
  const [payloads, payloadsLoading] = useCollectionData(payloadQuery, { idField: 'id' } as any);
  const symKeyRef = collection(firestore, 'symmetricKey');
  const symmetricKeyQuery = query(symKeyRef, orderBy('createdAt','desc' ), limit(25));
  const [symmetricKey, symmetricKeyLoading] = useCollectionData(symmetricKeyQuery, { idField: 'id' } as any);

  const [encryptKey, setEncryptKey] = useState("")
  const [keyB64, setKeyB64] = useState("");
  const [latestKey, setLatestKey] = useState(""); // Not used in UI but kept for clarity
  const [decryptKey, setDecryptKey] = useState("");
  const [plaintext, setPlain] = useState("");
  const [iv, setIv] = useState(""); // Still needed internally but not shown in UI
  const [ciphertext, setCt] = useState("");
  const [decrypted, setDec] = useState("");
  const [latestPayload, setLatestPayload] = useState("");
  const [copied, setCopied] = useState({
    key: false,
    payload: false,
    latestKey: false
  });
  const [loading, setLoading] = useState({
    generating: false,
    encrypting: false,
    decrypting: false,
    fetchingPayload: false
  });
  const [error, setError] = useState("");

  // Store complete encrypted payload (IV + ciphertext)
  const [encryptedPayload, setEncryptedPayload] = useState("");
  
  // Effect to reset copied state after 2 seconds
  useEffect(() => {
    if (copied.key || copied.payload || copied.latestKey) {
      const timer = setTimeout(() => {
        setCopied({ key: false, payload: false, latestKey: false });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Effect to automatically get latest payload when data changes
  useEffect(() => {
    if (payloads && payloads.length > 0 && payloads[0]?.payload) {
      setLatestPayload(payloads[0].payload);
    }
  }, [payloads]);
  
  const genKey = async () => {
    setError("");
    setLoading(prev => ({ ...prev, generating: true }));
    try {
      const key = await generateSymKey();
      const exportedKey = await exportSymKey(key);
      setKeyB64(exportedKey);
      setEncryptKey(exportedKey); // Store the key for encryption
      setDecryptKey(exportedKey); // Initialize decrypt key with the same value
      toast.success("New encryption key generated successfully");
    } catch (err) {
      setError(`Failed to generate key: ${err.message}`);
      toast.error(`Failed to generate key: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const encrypt = async () => {
    if (!keyB64 && !encryptKey) {
      setError("Please generate a key first");
      toast.error("Please generate or get a key first");
      return;
    }
    
    if (plaintext === "") {
      setError("Please enter text to encrypt");
      toast.error("Please enter text to encrypt");
      return;
    }

    setError("");
    setLoading(prev => ({ ...prev, encrypting: true }));
    try {
      const key = await importSymKey(encryptKey);
      const { iv: newIv, ciphertext: ct } = await symEncrypt(key, plaintext);
      setIv(newIv); 
      setCt(ct);
      
      // Create a simplified payload that combines IV and ciphertext in a single string
      // Format: <base64_iv>::<base64_ciphertext>
      const simplePayload = `${newIv}::${ct}`;
      setEncryptedPayload(simplePayload);
      toast.success("Message encrypted successfully");
    } catch (err) {
      setError(`Encryption failed: ${err.message}`);
      toast.error(`Encryption failed: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, encrypting: false }));
    }
  };

  const decrypt = async () => {
    if (!decryptKey) {
      setError("Encryption key is required for decryption");
      toast.error("Encryption key is required for decryption");
      return;
    }
    
    if (!ciphertext) {
      setError("No encrypted message to decrypt");
      toast.error("No encrypted message to decrypt");
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
          toast.error("Invalid encrypted message format");
          return;
        }
      }
      
      // Decrypt with the extracted IV and ciphertext
      const decryptedText = await symDecrypt(key, ivToUse, ciphertextToUse);
      setDec(decryptedText);
      toast.success("Message decrypted successfully");
    } catch (err) {
      console.error("Decryption error:", err);
      setError(`Decryption failed: ${err.message || "Invalid key or encrypted message format"}`);
      setDec("");
      toast.error(`Decryption failed: ${err.message || "Invalid key or encrypted message format"}`);
    } finally {
      setLoading(prev => ({ ...prev, decrypting: false }));
    }
  };

  const shareTOUsers = async () => {
    if (!keyB64) {
        setError("Please generate a key first");
        toast.error("Please generate a key first");
        return;
    }
    try {
        await addDoc(symKeyRef, {
          key: keyB64,
          createdAt: serverTimestamp(),
          userId: auth.currentUser?.uid || "anonymous"
        });
        toast.success("Key shared successfully");
    } catch (error) {
        console.error("Error sharing key:", error);
        setError(`Failed to share key: ${error.message}`);
        toast.error(`Failed to share key: ${error.message}`);
    }
  }

  const sharePayload = async () => {
    if (!encryptedPayload) {
        setError("No encrypted payload to share");
        toast.error("No encrypted payload to share");
        return;
    }
    try {
        await addDoc(payloadRef, {
            payload: encryptedPayload,
            createdAt: serverTimestamp(),
            userId: auth.currentUser?.uid || "anonymous"
        });
        toast.success("Encrypted message shared successfully");
    } catch (error) {
        console.error("Error sharing encrypted payload:", error);
        setError(`Failed to share payload: ${error.message}`);
        toast.error(`Failed to share payload: ${error.message}`);
    }
  }

  const getLatestSharedKey = async () => {
    try {
        if (!symmetricKey || symmetricKey.length === 0) {
            toast.error("No shared keys available");
            return;
        }
        
        const latestKeyDoc = symmetricKey[0];
        if (latestKeyDoc && latestKeyDoc.key) {
            setLatestKey(latestKeyDoc.key);
            setEncryptKey(latestKeyDoc.key); // Update encryptKey with the latest shared key
            setDecryptKey(latestKeyDoc.key); // Update decryptKey with the latest shared key
            setKeyB64(latestKeyDoc.key); // Also update the keyB64
            toast.success("Latest shared key retrieved successfully");
        } else {
            setError("No shared key found");
            toast.error("No shared key found");
        }
    } catch (error) {
        console.error("Error fetching latest shared key:", error);
        toast.error(`Error fetching latest shared key: ${error.message}`);
    }
  }

  const useLatestPayload = () => {
    if (latestPayload) {
      setCt(latestPayload);
      toast.success("Latest shared message loaded for decryption");
    } else {
      toast.error("No shared messages available");
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [type]: true }));
    toast.success(`${type === 'key' ? 'Key' : 'Message'} copied to clipboard`);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
        <Toaster position="top-center" richColors />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <header className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Symmetric Encryption Demo
              </h1>
              <p className="text-gray-600 mt-2">
                Encrypt and decrypt messages using AES-256 encryption
              </p>
          </header>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="block sm:inline">{error}</span>
                <button className="ml-auto cursor-pointer" onClick={() => setError("")}>
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Key Management */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold flex items-center text-blue-700">
                  <KeyRound className="mr-2 h-6 w-6" /> Key Management
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Generate a new AES-256 encryption key
                </p>
                
                <Button 
                  onClick={genKey} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading.generating}
                >
                  {loading.generating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      <span>Generate New Key</span>
                    </>
                  )}
                </Button>
                
                {keyB64 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Key (AES-256)</label>
                    <div className="relative">
                      <textarea 
                        value={keyB64} 
                        onChange={(e) => setKeyB64(e.target.value)}
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Save this key for later decryption</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        onClick={() => copyToClipboard(keyB64, 'key')} 
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copied.key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span>{copied.key ? "Copied!" : "Copy"}</span>
                      </Button>
                      <Button 
                        onClick={shareTOUsers}
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>Share Key</span>
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold flex items-center text-indigo-700">
                  <RefreshCw className="mr-2 h-6 w-6" /> Shared Resources
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Access the latest shared keys and messages
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center text-indigo-600">
                      <Download className="mr-1 h-4 w-4" /> Get Latest Key
                    </h3>
                    <Button 
                      onClick={getLatestSharedKey}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                      disabled={symmetricKeyLoading}
                    >
                      {symmetricKeyLoading ? "Loading keys..." : "Fetch Shared Key"}
                    </Button>
                    
                    {latestKey && (
                      <div className="mt-2">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg mt-2">
                          <p className="text-xs text-gray-500 truncate">{latestKey.substring(0, 20)}...</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-1 text-indigo-700 text-xs h-7 cursor-pointer"
                            onClick={() => copyToClipboard(latestKey, 'latestKey')}
                          >
                            {copied.latestKey ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copied.latestKey ? "Copied!" : "Copy Key"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-md font-medium mb-2 flex items-center text-indigo-600">
                      <ArrowDownCircle className="mr-1 h-4 w-4" /> Get Latest Message
                    </h3>
                    <Button 
                      onClick={useLatestPayload}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                      disabled={payloadsLoading || !latestPayload}
                    >
                      {payloadsLoading ? "Loading messages..." : "Use Latest Message"}
                    </Button>
                    
                    {latestPayload && (
                      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg mt-2">
                        <p className="text-xs text-gray-500 truncate">{latestPayload.substring(0, 25)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
            
            {/* Right Column - Encryption & Decryption */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold flex items-center text-green-700">
                  <ShieldCheck className="mr-2 h-6 w-6" /> Encryption
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Encrypt your message with AES-256
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message to Encrypt</label>
                  <textarea
                    placeholder="Enter your secret message here..."
                    value={plaintext}
                    onChange={(e) => setPlain(e.target.value)}
                    className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <Button 
                  onClick={encrypt} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading.encrypting || !plaintext || (!keyB64 && !encryptKey)}
                >
                  {loading.encrypting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Encrypt Message</span>
                    </>
                  )}
                </Button>
                
                {encryptedPayload && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Message</label>
                    <div className="relative">
                      <textarea 
                        readOnly 
                        value={encryptedPayload}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Share this encrypted message</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        onClick={() => copyToClipboard(encryptedPayload, 'payload')}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copied.payload ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span>{copied.payload ? "Copied!" : "Copy"}</span>
                      </Button>
                      <Button 
                        onClick={sharePayload}
                        className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>Share Message</span>
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold flex items-center text-purple-700">
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Decryption
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Decrypt encrypted messages with your key
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Message</label>
                  <div className="relative">
                    <textarea 
                      value={ciphertext} 
                      onChange={(e) => setCt(e.target.value)}
                      placeholder="Paste the encrypted message here..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Paste the complete encrypted message
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Decryption Key</label>
                  <div className="relative">
                    <textarea 
                      value={decryptKey}
                      onChange={(e) => setDecryptKey(e.target.value)} 
                      placeholder="Paste the decryption key here..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be the same key used for encryption</p>
                </div>
                
                <Button 
                  onClick={decrypt} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading.decrypting || !ciphertext || !decryptKey}
                >
                  {loading.decrypting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Decrypting...</span>
                    </>
                  ) : "Decrypt Message"}
                </Button>
                
                {decrypted && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-medium text-purple-800 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Decrypted Message
                    </h3>
                    <div className="mt-2 p-3 bg-white border border-purple-100 rounded-md">
                      <p className="text-purple-700 break-words">
                        {decrypted}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
    </div>
  )
}

export default page