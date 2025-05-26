/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useState, useEffect } from "react";
import {
  generateKeyPair, exportPublicKey, exportPrivateKey, importPublicKey, importPrivateKey, 
  asymEncrypt, asymDecrypt
} from "@/utils/asymCrypto";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownCircle, 
  CheckCircle, Copy, Download, Key, KeyRound, Plane, RefreshCw, 
  Send, SendHorizonal, Shield, ShieldCheck, VenetianMask, Lock, Unlock 
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
  const payloadRef = collection(firestore, 'asymPayloads');
  const payloadQuery = query(payloadRef, orderBy('createdAt','desc' ), limit(25));
  const [payloads, payloadsLoading] = useCollectionData(payloadQuery, { idField: 'id' } as any);
  const publicKeyRef = collection(firestore, 'publicKeys');
  const publicKeyQuery = query(publicKeyRef, orderBy('createdAt','desc' ), limit(25));
  const [publicKeys, publicKeysLoading] = useCollectionData(publicKeyQuery, { idField: 'id' } as any);

  // Keys
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [encryptWithPublicKey, setEncryptWithPublicKey] = useState("");
  const [decryptWithPrivateKey, setDecryptWithPrivateKey] = useState("");
  const [latestPublicKey, setLatestPublicKey] = useState("");
  
  // Message content
  const [plaintext, setPlain] = useState("");
  const [ciphertext, setCt] = useState("");
  const [decrypted, setDec] = useState("");
  const [latestPayload, setLatestPayload] = useState("");
  
  // UI states
  const [copied, setCopied] = useState({
    publicKey: false,
    privateKey: false,
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

  // Effect to reset copied state after 2 seconds
  useEffect(() => {
    if (copied.publicKey || copied.privateKey || copied.payload || copied.latestKey) {
      const timer = setTimeout(() => {
        setCopied({ publicKey: false, privateKey: false, payload: false, latestKey: false });
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
  
  const genKeyPair = async () => {
    setError("");
    setLoading(prev => ({ ...prev, generating: true }));
    try {
      const keyPair = await generateKeyPair();
      const pubKey = await exportPublicKey(keyPair.publicKey);
      const privKey = await exportPrivateKey(keyPair.privateKey);
      
      setPublicKey(pubKey);
      setPrivateKey(privKey);
      setEncryptWithPublicKey(pubKey);  // Default to your own public key for encryption
      setDecryptWithPrivateKey(privKey); // Default to your own private key for decryption
      
      toast.success("New key pair generated successfully");
    } catch (err) {
      setError(`Failed to generate key pair: ${err.message}`);
      toast.error(`Failed to generate key pair: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const encrypt = async () => {
    if (!encryptWithPublicKey) {
      setError("Please provide a public key for encryption");
      toast.error("Please provide a public key for encryption");
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
      const pubKey = await importPublicKey(encryptWithPublicKey);
      const encrypted = await asymEncrypt(pubKey, plaintext);
      setCt(encrypted);
      toast.success("Message encrypted successfully");
    } catch (err) {
      setError(`Encryption failed: ${err.message}`);
      toast.error(`Encryption failed: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, encrypting: false }));
    }
  };

  const decrypt = async () => {
    if (!decryptWithPrivateKey) {
      setError("Private key is required for decryption");
      toast.error("Private key is required for decryption");
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
      const privKey = await importPrivateKey(decryptWithPrivateKey);
      const decryptedText = await asymDecrypt(privKey, ciphertext);
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

  const sharePublicKey = async () => {
    if (!publicKey) {
        setError("Please generate a key pair first");
        toast.error("Please generate a key pair first");
        return;
    }
    try {
        await addDoc(publicKeyRef, {
          publicKey: publicKey,
          createdAt: serverTimestamp(),
          userId: auth.currentUser?.uid || "anonymous",
          userName: auth.currentUser?.displayName || "Anonymous User"
        });
        toast.success("Public key shared successfully");
    } catch (error) {
        console.error("Error sharing public key:", error);
        setError(`Failed to share public key: ${error.message}`);
        toast.error(`Failed to share public key: ${error.message}`);
    }
  }

  const sharePayload = async () => {
    if (!ciphertext) {
        setError("No encrypted payload to share");
        toast.error("No encrypted payload to share");
        return;
    }
    try {
        await addDoc(payloadRef, {
            payload: ciphertext,
            createdAt: serverTimestamp(),
            userId: auth.currentUser?.uid || "anonymous",
            userName: auth.currentUser?.displayName || "Anonymous User"
        });
        toast.success("Encrypted message shared successfully");
    } catch (error) {
        console.error("Error sharing encrypted payload:", error);
        setError(`Failed to share payload: ${error.message}`);
        toast.error(`Failed to share payload: ${error.message}`);
    }
  }

  const getLatestPublicKey = async () => {
    try {
        if (!publicKeys || publicKeys.length === 0) {
            toast.error("No shared public keys available");
            return;
        }
        
        const latestKeyDoc = publicKeys[0];
        if (latestKeyDoc && latestKeyDoc.publicKey) {
            setLatestPublicKey(latestKeyDoc.publicKey);
            setEncryptWithPublicKey(latestKeyDoc.publicKey); // Update encryption key
            toast.success(`Retrieved public key from ${latestKeyDoc.userName || "Unknown User"}`);
        } else {
            setError("No shared public key found");
            toast.error("No shared public key found");
        }
    } catch (error) {
        console.error("Error fetching latest public key:", error);
        toast.error(`Error fetching latest public key: ${error.message}`);
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
    toast.success(`${type.includes("Key") ? 'Key' : 'Message'} copied to clipboard`);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
        <Toaster position="top-center" richColors />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <header className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Asymmetric Encryption Demo
              </h1>
              <p className="text-gray-600 mt-2">
                Encrypt and decrypt messages using RSA public-key cryptography
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
                <h2 className="text-xl font-semibold flex items-center text-purple-700">
                  <KeyRound className="mr-2 h-6 w-6" /> Key Pair Management
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Generate a new RSA public/private key pair
                </p>
                
                <Button 
                  onClick={genKeyPair} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 cursor-pointer"
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
                      <span>Generate New Key Pair</span>
                    </>
                  )}
                </Button>
                
                {publicKey && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Public Key (Share this)</label>
                    <div className="relative">
                      <textarea 
                        value={publicKey} 
                        onChange={(e) => setPublicKey(e.target.value)}
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Public key can be shared with others</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        onClick={() => copyToClipboard(publicKey, 'publicKey')} 
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copied.publicKey ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span>{copied.publicKey ? "Copied!" : "Copy"}</span>
                      </Button>
                      <Button 
                        onClick={sharePublicKey}
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>Share Key</span>
                      </Button>
                    </div>
                  </div>
                )}
                
                {privateKey && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Unlock className="h-4 w-4 text-red-500 mr-1" />
                      Private Key (Keep Secret!)
                    </label>
                    <div className="relative">
                      <textarea 
                        value={privateKey} 
                        onChange={(e) => setPrivateKey(e.target.value)}
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Never share your private key with anyone!
                    </p>
                    
                    <Button 
                      onClick={() => copyToClipboard(privateKey, 'privateKey')} 
                      variant="outline"
                      className="w-full mt-2 flex items-center justify-center gap-1 cursor-pointer border-red-200"
                    >
                      {copied.privateKey ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span>{copied.privateKey ? "Copied!" : "Copy Private Key"}</span>
                    </Button>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold flex items-center text-indigo-700">
                  <RefreshCw className="mr-2 h-6 w-6" /> Shared Resources
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Access the latest shared public keys and messages
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center text-indigo-600">
                      <Download className="mr-1 h-4 w-4" /> Get Public Key
                    </h3>
                    <Button 
                      onClick={getLatestPublicKey}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                      disabled={publicKeysLoading}
                    >
                      {publicKeysLoading ? "Loading keys..." : "Fetch Public Key"}
                    </Button>
                    
                    {latestPublicKey && (
                      <div className="mt-2">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg mt-2">
                          <p className="text-xs text-gray-500 truncate">{latestPublicKey.substring(0, 20)}...</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-1 text-indigo-700 text-xs h-7 cursor-pointer"
                            onClick={() => copyToClipboard(latestPublicKey, 'latestKey')}
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
                  <Lock className="mr-2 h-6 w-6" /> Encryption
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Encrypt your message with someone's public key
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Public Key for Encryption</label>
                  <div className="relative">
                    <textarea 
                      value={encryptWithPublicKey}
                      onChange={(e) => setEncryptWithPublicKey(e.target.value)}
                      placeholder="Paste recipient's public key here..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Only the owner of the corresponding private key can decrypt</p>
                </div>
                
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
                  disabled={loading.encrypting || !plaintext || !encryptWithPublicKey}
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
                      <Lock className="h-4 w-4" />
                      <span>Encrypt Message</span>
                    </>
                  )}
                </Button>
                
                {ciphertext && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Message</label>
                    <div className="relative">
                      <textarea 
                        readOnly 
                        value={ciphertext}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Share this encrypted message</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        onClick={() => copyToClipboard(ciphertext, 'payload')}
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
                  <Unlock className="h-6 w-6 mr-2" />
                  Decryption
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Decrypt messages with your private key
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
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Key for Decryption</label>
                  <div className="relative">
                    <textarea 
                      value={decryptWithPrivateKey}
                      onChange={(e) => setDecryptWithPrivateKey(e.target.value)}
                      placeholder="Paste your private key here..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be your private key that corresponds to the public key used for encryption</p>
                </div>
                
                <Button 
                  onClick={decrypt} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading.decrypting || !ciphertext || !decryptWithPrivateKey}
                >
                  {loading.decrypting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Decrypting...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" /> 
                      <span>Decrypt Message</span>
                    </>
                  )}
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