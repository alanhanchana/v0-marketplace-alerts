import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

// Client-side auth functions
export async function signIn(email: string, password: string) {
  try {
    console.log("Attempting to sign in with:", { email })

    const supabase = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "supabase-auth-token",
        },
      },
    })

    // First clear any existing session
    await supabase.auth.signOut()

    // Then sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase auth error:", error)
      throw error
    }

    if (!data.user) {
      console.error("No user returned from Supabase")
      throw new Error("No user found")
    }

    // Store session in localStorage as a backup
    localStorage.setItem("supabase-auth-user", JSON.stringify(data.user))

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Error signing in:", error)
    return {
      success: false,
      error: error.message || "Invalid login credentials",
    }
  }
}

export async function signUp(email: string, password: string) {
  try {
    console.log("Attempting to sign up with:", { email })

    const supabase = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "supabase-auth-token",
        },
      },
    })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Supabase auth error:", error)
      throw error
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Error signing up:", error)
    return {
      success: false,
      error: error.message || "Failed to sign up",
    }
  }
}

export async function signOut() {
  try {
    const supabase = createClientComponentClient<Database>()

    // Clear any stored user data
    localStorage.removeItem("supabase-auth-user")
    localStorage.removeItem("supabase-auth-token")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Supabase signout error:", error)
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error signing out:", error)
    return {
      success: false,
      error: error.message || "Failed to sign out",
    }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createClientComponentClient<Database>()

    // First try to get from session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Supabase session error:", error)
      throw error
    }

    // If we have a user in the session, return it
    if (data.session?.user) {
      return data.session.user
    }

    // Otherwise, try to get from localStorage backup
    const storedUser = localStorage.getItem("supabase-auth-user")
    if (storedUser) {
      return JSON.parse(storedUser)
    }

    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function refreshSession() {
  try {
    const supabase = createClientComponentClient<Database>()
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return { success: false, error: error.message }
    }

    // Update localStorage backup if we have a user
    if (data.session?.user) {
      localStorage.setItem("supabase-auth-user", JSON.stringify(data.session.user))
    }

    return { success: true, session: data.session }
  } catch (error: any) {
    console.error("Error in refreshSession:", error)
    return { success: false, error: error.message }
  }
}

// Server-side auth helpers
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll()
          } catch (error) {
            console.error("Error getting cookies:", error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch (e) {
                console.error(`Error setting cookie ${name}:`, e)
              }
            })
          } catch (error) {
            console.error("Error setting cookies:", error)
          }
        },
      },
    },
  )
}

export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient()

    // First try to get the session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return null
    }

    if (!sessionData.session) {
      console.log("No session found")
      return null
    }

    // Then get the user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error getting user:", userError)
      return null
    }

    return userData.user
  } catch (error) {
    console.error("Error getting server user:", error)
    return null
  }
}
