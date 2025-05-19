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
          <span className="text-xl font-bold">Deal Finder</span>
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
