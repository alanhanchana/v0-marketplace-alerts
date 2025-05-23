"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { refreshSession, isLoading } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Refresh the session to get the latest user data
        await refreshSession()

        // Redirect to the alerts page
        router.push("/alerts")
      } catch (error) {
        console.error("Error handling auth callback:", error)
        router.push("/login")
      }
    }

    handleCallback()
  }, [refreshSession, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Completing Authentication</h1>
        <p className="text-muted-foreground">Please wait while we finish setting up your account...</p>
      </div>
    </div>
  )
}
