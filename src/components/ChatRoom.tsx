/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="w-full min-w-2xl mx-auto p-3 sm:p-4 md:p-6 rounded-lg shadow-lg bg-card">
        <div className="flex justify-between items-center mb-4 p-3 bg-muted/50 rounded-lg">
            <h1 className="text-xl font-bold text-foreground">Chat Room</h1>
            <div className="flex items-center gap-2">
                {user && <div className="text-sm text-muted-foreground hidden sm:block">Signed in as {user.displayName || 'Anonymous'}</div>}
            </div>
        </div>
        
        <div 
            className="flex-1 overflow-y-auto mb-4 p-2 sm:p-4 bg-background border rounded-lg"
            style={{ height: 'calc(100vh - 240px)', minHeight: '350px', maxHeight: '600px' }}
            ref={scrollRef}
        >
            {messagesLoading ? (
                <div className="flex flex-col justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">Loading messages...</p>
                </div>
            ) : !user ? (
                <div className="flex flex-col justify-center items-center h-full text-center p-4">
                    <p className="text-muted-foreground mb-3">Sign in to join the conversation</p>
                </div>
            ) : messages && messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                <div className="space-y-3 py-2">
                    {messages && messages.map(msg => {
                        const isCurrentUser = user?.uid === msg.uid;
                        const initials = (msg.userName && typeof msg.userName === 'string') 
                            ? msg.userName.split(' ').map(n => n[0]).join('').toUpperCase() 
                            : '?';
                        
                        return (
                            <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end gap-2 group w-full`}>
                                {!isCurrentUser && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={msg.photoURL || ''} alt={msg.userName || 'User'} />
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                
                                <div 
                                    className={`
                                        p-3 rounded-lg max-w-[85%] sm:max-w-[75%] break-words
                                        ${isCurrentUser 
                                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                                            : 'bg-muted text-foreground rounded-bl-none'
                                        }
                                    `}
                                >
                                    {!isCurrentUser && (
                                        <p className="text-xs font-semibold opacity-80 mb-1">{msg.userName || 'Anonymous'}</p>
                                    )}
                                    <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                                    <div className="text-[10px] opacity-70 text-right mt-1">
                                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : ''}
                                    </div>
                                </div>
                                
                                {isCurrentUser && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                            {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        {user ? (
            <form onSubmit={sendMessage} className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <input 
                        type="text"
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                    />
                </div>
                <Button 
                    type="submit" 
                    disabled={!formValue.trim() || messagesLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Send className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Send</span>
                </Button>
            </form>
        ) : (
            <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Please sign in to join the chat</p>
            </div>
        )}
    </div>
  )
}

export default ChatRoom