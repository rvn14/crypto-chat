"use client";

import { 
    auth, 
    signOut, 
    firestore, 
    doc, 
    deleteDoc
} from "../lib/firebase";

const SignOut = () => {
    const removeUserFromFirestore = async (userId: string) => {
        if (!userId) return;
        
        try {
            const userRef = doc(firestore, "users", userId);
            await deleteDoc(userRef);
            console.log("User removed from Firestore");
        } catch (error) {
            console.error("Error removing user from Firestore:", error);
        }
    };

    const SignOutFromGoogle = async () => {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            
            try {
                // Remove user from Firestore first
                await removeUserFromFirestore(userId);
                
                // Then sign out from Firebase Auth
                await signOut(auth);
                console.log("User signed out");
            } catch (error) {
                console.error("Error signing out:", error);
                if (error instanceof Error) {
                    alert("Failed to sign out: " + error.message);
                } else {
                    alert("Failed to sign out: An unknown error occurred");
                }
            }
        } else {
            console.warn("No user is currently signed in");
        }
    }

    return (
        <button 
            className="px-4 py-2 bg-gray-500 cursor-pointer hover:bg-gray-600 text-white rounded-md transition-colors shadow-sm font-medium" 
            onClick={SignOutFromGoogle} 
            type="button"
        >
            Sign Out
        </button>
    );
}

export default SignOut;
