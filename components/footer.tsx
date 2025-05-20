"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bell } from "lucide-react"

export default function Footer() {
  const pathname = usePathname()

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-around py-3">
          <Link
            href="/"
            className={`flex flex-col items-center p-2 ${pathname === "/" ? "text-primary" : "text-gray-500"}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/alerts"
            className={`flex flex-col items-center p-2 ${pathname === "/alerts" ? "text-primary" : "text-gray-500"}`}
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs mt-1">Watchlist</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
