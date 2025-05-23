"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export default function Footer() {
  const { status } = useAuth()
  const isLoggedIn = status === "authenticated"

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FlipSniper. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            {!isLoggedIn && (
              <Button size="sm" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
