"use client"

import Link from "next/link"
import { UserAvatar } from "./user-avatar"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const isLoggedIn = !pathname.includes("/login") && !pathname.includes("/signup")

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            <line x1="7.76" y1="16.24" x2="4.93" y2="19.07" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="7.76" y1="7.76" x2="4.93" y2="4.93" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span className="text-xl font-bold">Snipr</span>
        </Link>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <UserAvatar />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
