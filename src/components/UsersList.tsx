/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase'; // Updated import statement
import UserCard from './UserCard';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    
    // Initial fetch
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(usersCollection);
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    
    // Real-time updates
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("User snapshot error:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-background rounded-lg border p-4 h-[calc(100vh-120px)] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Online Users</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-2">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No users online</p>
      )}
    </div>
  );
}
