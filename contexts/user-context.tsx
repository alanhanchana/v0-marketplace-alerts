"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, usePathname } from "next/navigation"
import type { Database } from "@/lib/database.types"

type User = {
  id: string
  email?: string
}

type UserContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()

  // Function to refresh user session
  const refreshUser = useCallback(async () => {
    try {
      console.log("Refreshing user session...")
      setLoading(true)

      // Get the current session without refreshing first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError)
        setUser(null)
        setLoading(false)
        return
      }

      if (sessionData.session?.user) {
        console.log("Session found, user ID:", sessionData.session.user.id)
        setUser(sessionData.session.user)
      } else {
        console.log("No session found")
        setUser(null)
      }
    } catch (error) {
      console.error("Error in refreshUser:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error getting initial session:", error)
          setUser(null)
        } else {
          if (data.session?.user) {
            console.log("Initial session found, user ID:", data.session.user.id)
            setUser(data.session.user)
          } else {
            console.log("No initial session found")
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Error getting session:", error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      // Prevent unnecessary state updates
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setLoading(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
        // Clear any cached data
        localStorage.removeItem("supabase.auth.token")
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        setLoading(false)
      } else if (event === "USER_UPDATED" && session?.user) {
        setUser(session.user)
        setLoading(false)
      } else {
        setUser(session?.user || null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Redirect logic - only after initialization
  useEffect(() => {
    if (!isInitialized) return

    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const isPublicPage = pathname === "/"

    if (!loading && !user && !isAuthPage && !isPublicPage) {
      console.log("Redirecting to login - no user found")
      router.push("/login")
    }

    if (!loading && user && isAuthPage) {
      console.log("Redirecting to alerts - user found on auth page")
      router.push("/alerts")
    }
  }, [user, loading, pathname, router, isInitialized])

  const signOut = async () => {
    try {
      console.log("Signing out user...")
      setLoading(true)

      // Clear user state immediately
      setUser(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
      }

      // Clear any local storage
      localStorage.removeItem("supabase.auth.token")

      // Navigate to login
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  return <UserContext.Provider value={{ user, loading, signOut, refreshUser }}>{children}</UserContext.Provider>
}
