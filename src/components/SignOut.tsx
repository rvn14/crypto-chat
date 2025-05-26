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
        <button className="p-2 bg-red-400 cursor-pointer" onClick={SignOutFromGoogle} type="button">
            Sign Out
        </button>
    );
}

export default SignOut;
