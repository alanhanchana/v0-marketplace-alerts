"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Get Supabase client
  const supabase = getSupabaseClient()

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...")
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Failed to refresh session:", error)
        setUser(null)
        setSession(null)
        return
      }

      if (data.session) {
        console.log("Session refreshed successfully:", data.session.user.id)
        setSession(data.session)
        setUser(data.session.user)
      } else {
        console.log("No session after refresh")
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      setUser(null)
      setSession(null)
    }
  }, [supabase.auth])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...")
        setIsLoading(true)

        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setUser(null)
          setSession(null)
        } else if (session) {
          console.log("Session found during initialization:", session.user.id)
          setSession(session)
          setUser(session.user)
        } else {
          console.log("No session found during initialization")
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error("Unexpected error during auth initialization:", error)
        setUser(null)
        setSession(null)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id)

      if (event === "SIGNED_IN" && newSession) {
        console.log("User signed in:", newSession.user.id)
        setSession(newSession)
        setUser(newSession.user)
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out")
        setSession(null)
        setUser(null)
        setIsLoading(false)
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        console.log("Token refreshed:", newSession.user.id)
        setSession(newSession)
        setUser(newSession.user)
        setIsLoading(false)
      } else {
        setSession(newSession)
        setUser(newSession?.user || null)
        setIsLoading(false)
      }
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Handle redirects after auth state is initialized
  useEffect(() => {
    if (!isInitialized || isLoading) return

    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const isPublicPage = pathname === "/"

    // Redirect logic
    if (!user && !isAuthPage && !isPublicPage) {
      console.log("Redirecting to login - no user found")
      router.push("/login")
    } else if (user && isAuthPage) {
      console.log("Redirecting to alerts - user found on auth page")
      router.push("/alerts")
    }
  }, [user, isLoading, pathname, router, isInitialized])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log("Attempting to sign in...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      if (data.session && data.user) {
        console.log("Sign in successful:", data.user.id)
        // Don't set loading to false here - let the auth state change handler do it
        return { success: true }
      } else {
        setIsLoading(false)
        return { success: false, error: "No session returned" }
      }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      setIsLoading(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error("Unexpected error during sign up:", error)
      setIsLoading(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)
      console.log("Signing out...")

      // Clear state first
      setUser(null)
      setSession(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
      }

      // Navigate to login
      router.push("/login")
    } catch (error) {
      console.error("Unexpected error during sign out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
