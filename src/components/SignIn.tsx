"use client";

import { User } from "firebase/auth";
import { 
    auth, 
    GoogleAuthProvider, 
    signInWithPopup,
    firestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "../lib/firebase";

const SignIn = () => {
    const saveUserToFirestore = async (user: User) => {
        if (!user) return;
        
        // Reference to the user document in Firestore
        const userRef = doc(firestore, "users", user.uid);
        
        try {
            // Check if the user document already exists
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                // Create new user document
                await setDoc(userRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
                console.log("User added to Firestore");
            } else {
                // Update existing user's last login
                await setDoc(userRef, { 
                    lastLogin: serverTimestamp() 
                }, { merge: true });
                console.log("User login updated in Firestore");
            }
        } catch (error) {
            console.error("Error saving user to Firestore:", error);
        }
    };

    const SignInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                console.log("Google Access Token:", token);
                
                // The signed-in user info.
                const user = result.user;
                console.log("User signed in:", user);
                
                // Save user data to Firestore
                saveUserToFirestore(user);
            })
            .catch((error) => {
                console.error("Error signing in with Google:", error);
            });
    }

    return (
        <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 cursor-pointer text-white rounded-md transition-colors shadow-sm font-medium flex items-center"
            onClick={SignInWithGoogle} 
            type="button"
        >
            <span className="mr-1">Sign In</span>
        </button>
    )
}

export default SignIn;
