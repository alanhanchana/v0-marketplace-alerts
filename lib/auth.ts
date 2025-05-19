import { supabase } from "./supabaseClient"

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Error signing in:", error)
    return {
      success: false,
      error: error.message || "Failed to sign in",
    }
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
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
    const { error } = await supabase.auth.signOut()

    if (error) {
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
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return data.session?.user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
