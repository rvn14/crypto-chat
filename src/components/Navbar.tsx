"use client";
import { auth } from "@/lib/firebase";
import SignIn from "./SignIn"
import SignOut from "./SignOut"
import { useAuthState } from "react-firebase-hooks/auth";
import { ModeToggle } from "./ModeToggle";
import Link from "next/link";

const Navbar = () => {
  const [user] = useAuthState(auth);

  return (
    <div className='px-4 py-3 w-full text-primary bg-accent flex justify-between items-center mb-2 shadow-sm'>
        <div className="flex items-center gap-6">
          <div className="text-lg font-bold">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              CryptoChat
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/symmetrickey" className="hover:opacity-80 transition-opacity">
              Symmetric Key
            </Link>
            <Link href="/asymmetrickey" className="hover:opacity-80 transition-opacity">
              Asymmetric Key
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {!user ? <SignIn /> : <SignOut />}
          <div className="ml-2">
            <ModeToggle />
          </div>
        </div>
    </div>
  )
}

export default Navbar