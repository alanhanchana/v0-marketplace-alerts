"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

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
  const supabase = createClientComponentClient<Database>({
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "supabase-auth-token",
      },
    },
  })

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...")
      setIsLoading(true)

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

        // Force a router refresh to update the UI
        router.refresh()
      } else {
        console.log("No session after refresh")
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth, router])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      try {
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
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("User signed in or token refreshed:", newSession?.user?.id)
        setSession(newSession)
        setUser(newSession?.user || null)

        // Force a router refresh to update the UI
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out")
        setSession(null)
        setUser(null)

        // Force a router refresh to update the UI
        router.refresh()
      }
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { success: false, error: error.message }
      }

      // Update state with new session and user
      setSession(data.session)
      setUser(data.user)

      // Force a router refresh to update the UI
      router.refresh()

      return { success: true }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Unexpected error during sign up:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)

      // First clear state
      setUser(null)
      setSession(null)

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
      }

      // Force a hard reload to clear any cached state
      window.location.href = "/login"
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
