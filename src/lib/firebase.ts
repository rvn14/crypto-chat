// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCxUpLBKUo5UEooU0BICjlkvn3fvpjvmlo",
    authDomain: "crypto-chat-4c431.firebaseapp.com",
    projectId: "crypto-chat-4c431",
    storageBucket: "crypto-chat-4c431.firebasestorage.app",
    messagingSenderId: "882331382675",
    appId: "1:882331382675:web:859ed416bda389162c6e66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Export everything needed for Firebase functionality
export { 
    app, 
    auth, 
    firestore, 
    collection, 
    query, 
    orderBy, 
    limit,
    GithubAuthProvider, 
    signInWithPopup,
    signOut,
    addDoc,
    serverTimestamp,
    signInWithRedirect,
    GoogleAuthProvider,
    getDoc
};
