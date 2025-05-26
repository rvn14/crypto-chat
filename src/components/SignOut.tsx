"use client";

import { auth, signOut } from "../lib/firebase";

const SignOut = () => {
    const SignOutFromGoogle = () => {
        if (auth.currentUser) {
            signOut(auth)
                .then(() => {
                    console.log("User signed out");
                })
                .catch((error) => {
                    console.error("Error signing out:", error);
                    alert("Failed to sign out: " + error.message);
                });
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
