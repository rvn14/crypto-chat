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

    return <button className="p-2 bg-red-400 cursor-pointer" onClick={SignInWithGoogle} type="button">SignIn</button>
}

export default SignIn;
