"use client"

import Link from "next/link"
import { UserAvatar } from "./user-avatar"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"
import { ModeToggle } from "./mode-toggle"
import { Target, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()
  const isLoggedIn = !pathname.includes("/login") && !pathname.includes("/signup")

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="w-full cursor-pointer">
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/alerts" className="w-full cursor-pointer">
                  Watchlist
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold hidden sm:inline-block">Snipr</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 ml-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-foreground/60 hover:text-foreground hover:bg-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/alerts"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/alerts"
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-foreground/60 hover:text-foreground hover:bg-accent"
              }`}
            >
              Watchlist
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {isLoggedIn ? (
            <UserAvatar />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild className="discord-button">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
