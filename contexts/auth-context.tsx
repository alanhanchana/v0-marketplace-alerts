"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextType {
  user: User | null
  session: Session | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const router = useRouter()
  const pathname = usePathname()

  // Create a Supabase client
  const supabase = getSupabaseBrowser()

  // Initialize auth state
  const initAuth = useCallback(async () => {
    try {
      console.log("Initializing auth state...")
      setStatus("loading")

      // Get current session
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
        setStatus("unauthenticated")
        setUser(null)
        setSession(null)
        return
      }

      if (currentSession) {
        console.log("Session found:", currentSession.user.id)
        setUser(currentSession.user)
        setSession(currentSession)
        setStatus("authenticated")
      } else {
        console.log("No session found")
        setUser(null)
        setSession(null)
        setStatus("unauthenticated")
      }
    } catch (error) {
      console.error("Unexpected error during auth initialization:", error)
      setStatus("unauthenticated")
      setUser(null)
      setSession(null)
    }
  }, [supabase.auth])

  // Handle auth state changes
  useEffect(() => {
    initAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id)

      if (event === "SIGNED_IN" && newSession) {
        console.log("User signed in:", newSession.user.id)
        setUser(newSession.user)
        setSession(newSession)
        setStatus("authenticated")

        // Redirect to alerts page if on login/signup page
        if (pathname === "/login" || pathname === "/signup") {
          router.push("/alerts")
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out")
        setUser(null)
        setSession(null)
        setStatus("unauthenticated")

        // Redirect to login page
        router.push("/login")
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        console.log("Token refreshed:", newSession.user.id)
        setUser(newSession.user)
        setSession(newSession)
        setStatus("authenticated")
      } else if (event === "USER_UPDATED" && newSession) {
        console.log("User updated:", newSession.user.id)
        setUser(newSession.user)
        setSession(newSession)
      }
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router, pathname, initAuth])

  // Sign in function using server route
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in via server route...")
      setStatus("loading")

      // Call the server-side login route
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error("Sign in error:", data.error)
        setStatus("unauthenticated")
        return { success: false, error: data.error || "Invalid email or password" }
      }

      console.log("Sign in successful via server route:", data.user?.id)

      // Wait a moment for cookies to be set, then get the session
      await new Promise((resolve) => setTimeout(resolve, 100))

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session after login:", sessionError)
          // Don't fail the login, the auth state change listener will handle it
        } else if (sessionData.session) {
          console.log("Session retrieved after login:", sessionData.session.user.id)
          setUser(sessionData.session.user)
          setSession(sessionData.session)
          setStatus("authenticated")
        } else {
          console.log("No session found after login, waiting for auth state change...")
          // The auth state change listener will handle the session update
        }
      } catch (sessionError) {
        console.error("Unexpected error getting session after login:", sessionError)
        // Don't fail the login, the auth state change listener will handle it
      }

      return { success: true }
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error)
      setStatus("unauthenticated")
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      console.log("Signing up...")
      setStatus("loading")

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        setStatus("unauthenticated")
        return { success: false, error: error.message }
      }

      // If email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        console.log("Sign up successful, email confirmation required")
        setStatus("unauthenticated")
        return { success: true }
      }

      console.log("Sign up and auto-confirm successful:", data.user?.id)
      // Auth state change listener will update the state
      return { success: true }
    } catch (error: any) {
      console.error("Unexpected error during sign up:", error)
      setStatus("unauthenticated")
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    }
  }

  // Sign out function using server route
  const signOut = async () => {
    try {
      console.log("Signing out via server route...")
      setStatus("loading")

      // Clear client state first
      setUser(null)
      setSession(null)

      // Call the server-side logout route
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important for cookies
      })

      if (!response.ok) {
        console.error("Sign out error:", response.statusText)
      }

      setStatus("unauthenticated")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Unexpected error during sign out:", error)
      setStatus("unauthenticated")
      // Force a hard reload to clear any cached state
      window.location.href = "/login"
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        status,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
