"use client";

import { 
    auth, 
    GoogleAuthProvider, 
    signInWithPopup
} from "../lib/firebase";

const SignIn = () => {
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
