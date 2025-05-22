"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bell, Settings, PlusCircle, BookmarkIcon } from "lucide-react"

export default function Footer() {
  const pathname = usePathname()

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-around py-2">
          <Link
            href="/"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/alerts"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              pathname === "/alerts" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Saved</span>
          </Link>

          <Link
            href="/target"
            className="flex flex-col items-center p-2 -mt-5 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="h-8 w-8" />
            <span className="text-[10px] mt-0.5">Add</span>
          </Link>

          <Link
            href="/notifications"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              pathname === "/notifications"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">Notifications</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              pathname === "/settings"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
