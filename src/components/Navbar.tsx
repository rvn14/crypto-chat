"use client";
import { auth } from "@/lib/firebase";
import SignIn from "./SignIn"
import SignOut from "./SignOut"
import { useAuthState } from "react-firebase-hooks/auth";
import { ModeToggle } from "./ModeToggle";



const Navbar = () => {
  const [user] = useAuthState(auth);

  return (
    <div className='p-2 w-full text-primary bg-accent flex justify-between items-center mb-2'>
        <div></div>
        <div>
          {!user ? <SignIn /> : <SignOut />}
          <ModeToggle />
        </div>
    </div>
  )
}

export default Navbar