/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { 
    auth, 
    firestore, 
    collection, 
    query, 
    orderBy, 
    limit,
    addDoc,
    serverTimestamp
} from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useState, useRef, useEffect } from 'react';
import SignIn from './SignIn';
import SignOut from './SignOut';

const ChatRoom = () => {
    const [user, loading] = useAuthState(auth);
    const messagesRef = collection(firestore, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt'), limit(25));
    const [messages, messagesLoading] = useCollectionData(messagesQuery, { idField: 'id' } as any);
    const [formValue, setFormValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Scroll to bottom when messages change or user signs in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, user]);
    
    // Force refresh messages when user signs in
    useEffect(() => {
        // When user auth state changes and is not loading anymore, messages will be refetched
        if (!loading && user) {
            // The useCollectionData hook will automatically refetch when query dependencies change
            // This empty block is just to document the dependency on user
        }
    }, [user, loading]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formValue.trim() || !user) return;
        
        try {
            await addDoc(messagesRef, {
                text: formValue,
                createdAt: serverTimestamp(),
                uid: user.uid,
                userName: user.displayName || 'Anonymous',
                photoURL: user.photoURL
            });
            
            setFormValue('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    
  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-100 min-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 p-2 bg-white rounded shadow">
            <h1 className="text-xl font-bold">Chat Room</h1>
            
        </div>
        
        <div 
            className="flex-1 overflow-y-auto mb-4 p-4 bg-white rounded shadow"
            style={{ maxHeight: '60vh', minHeight: '400px' }}
            ref={scrollRef}
        >
            {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                    <p>Loading messages...</p>
                </div>
            ) : (
                messages && messages.map(msg => {
                    const isCurrentUser = user?.uid === msg.uid;
                    
                    return (
                        <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className={`p-2 rounded-lg max-w-[70%] break-words whitespace-normal ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                <p className="text-xs font-semibold">{msg.userName}</p>
                                <p className="break-words">{msg.text}</p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
        
        {user && (
            <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded"
                />
                <button 
                    type="submit" 
                    disabled={!formValue.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        )}
    </div>
  )
}

export default ChatRoom