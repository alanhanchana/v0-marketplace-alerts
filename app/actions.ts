"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Create a server-side Supabase client that can read the auth cookies
async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })
}

// Get the authenticated user from the session
async function getAuthenticatedUser() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("Server action - checking session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError?.message,
    })

    if (sessionError) {
      console.error("Session error in server action:", sessionError)
      throw new Error("Authentication failed. Please log in again.")
    }

    if (!session) {
      console.error("No session found in server action")

      // Try to get the user from the cookies directly as a fallback
      const cookieStore = cookies()
      const authCookies = cookieStore
        .getAll()
        .filter((cookie) => cookie.name.includes("supabase") || cookie.name.includes("auth"))

      console.log(
        "Available auth cookies:",
        authCookies.map((c) => c.name),
      )

      throw new Error("No active session. Please log in.")
    }

    console.log("Server action found session for user:", session.user.id)
    return session.user
  } catch (error) {
    console.error("Error getting authenticated user in server action:", error)
    throw new Error("Authentication error. Please log in again.")
  }
}

export async function createWatchlistItem(formData: FormData) {
  try {
    console.log("=== CREATE WATCHLIST ITEM START ===")

    // Get the authenticated user
    const user = await getAuthenticatedUser()
    if (!user || !user.id) {
      throw new Error("User authentication error: User not found")
    }

    const userId = user.id
    console.log("Authenticated user ID:", userId)

    // Create a Supabase client
    const supabase = await createServerSupabaseClient()

    // Parse form data
    const keyword = formData.get("keyword") as string
    const maxPriceStr = formData.get("maxPrice") as string
    const minPriceStr = (formData.get("minPrice") as string) || "0"
    const zip = formData.get("zip") as string
    const radiusStr = (formData.get("radius") as string) || "1"
    const marketplace = (formData.get("marketplace") as string) || "craigslist"
    const category = (formData.get("category") as string) || "all"

    // Convert to proper types
    const maxPrice = Number.parseInt(maxPriceStr.replace(/,/g, ""), 10)
    const minPrice = Number.parseInt(minPriceStr.replace(/,/g, ""), 10) || 0
    const radius = Number.parseInt(radiusStr, 10) || 1

    console.log("Form data parsed:", {
      keyword,
      maxPrice,
      minPrice,
      zip,
      radius,
      marketplace,
      category,
      userId,
    })

    // Validation
    if (!keyword || isNaN(maxPrice) || !zip) {
      return {
        success: false,
        error: "All fields are required and max price must be a number",
      }
    }

    if (!/^\d{5}$/.test(zip)) {
      return {
        success: false,
        error: "ZIP code must be 5 digits",
      }
    }

    if (maxPrice <= 0) {
      return {
        success: false,
        error: "Maximum price must be greater than zero",
      }
    }

    // Check for duplicates
    const { data: existingItems, error: checkError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("keyword", keyword)
      .eq("marketplace", marketplace)
      .eq("user_id", userId)

    if (checkError) {
      console.error("Error checking for duplicates:", checkError)
      return {
        success: false,
        error: "Failed to check for duplicate search terms: " + checkError.message,
      }
    }

    if (existingItems && existingItems.length > 0) {
      return {
        success: false,
        error: `A search term for "${keyword}" already exists in ${marketplace}. Please edit the existing term instead.`,
      }
    }

    // Check count limit
    const { count, error: countError } = await supabase
      .from("watchlist")
      .select("*", { count: "exact", head: true })
      .eq("marketplace", marketplace)
      .eq("user_id", userId)

    if (countError) {
      console.error("Error checking count:", countError)
      return {
        success: false,
        error: "Failed to check search term count: " + countError.message,
      }
    }

    if (count && count >= 5) {
      return {
        success: false,
        error: "You can only have 5 saved search terms per marketplace. Please delete one to add more.",
      }
    }

    // Insert the new item
    console.log("Inserting watchlist item for user:", userId)
    const { data, error } = await supabase
      .from("watchlist")
      .insert([
        {
          keyword,
          max_price: maxPrice,
          min_price: minPrice,
          zip,
          radius,
          marketplace,
          category,
          user_id: userId,
        },
      ])
      .select()

    if (error) {
      console.error("Insert error:", error)
      return {
        success: false,
        error: "Failed to create watchlist item: " + error.message,
      }
    }

    console.log("Watchlist item created successfully:", data)
    revalidatePath("/alerts")

    return {
      success: true,
      data: {
        keyword,
        zip,
      },
    }
  } catch (error: any) {
    console.error("=== CREATE WATCHLIST ITEM ERROR ===", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

export async function updateWatchlistItem(formData: FormData) {
  try {
    console.log("=== UPDATE WATCHLIST ITEM START ===")

    // Get the authenticated user
    const user = await getAuthenticatedUser()
    if (!user || !user.id) {
      throw new Error("User authentication error: User not found")
    }

    const userId = user.id
    console.log("Authenticated user ID:", userId)

    // Create a Supabase client
    const supabase = await createServerSupabaseClient()

    const id = formData.get("id") as string
    const keyword = formData.get("keyword") as string
    const maxPriceStr = formData.get("maxPrice") as string
    const minPriceStr = (formData.get("minPrice") as string) || "0"
    const zip = formData.get("zip") as string
    const radiusStr = (formData.get("radius") as string) || "1"
    const marketplace = (formData.get("marketplace") as string) || "craigslist"
    const category = (formData.get("category") as string) || "all"

    // Convert to proper types
    const maxPrice = Number.parseInt(maxPriceStr.replace(/,/g, ""), 10)
    const minPrice = Number.parseInt(minPriceStr.replace(/,/g, ""), 10) || 0
    const radius = Number.parseInt(radiusStr, 10) || 1

    console.log("Updating watchlist item:", {
      id,
      keyword,
      maxPrice,
      minPrice,
      zip,
      radius,
      marketplace,
      category,
      userId,
    })

    // Validation
    if (!id || !keyword || isNaN(maxPrice) || !zip) {
      return {
        success: false,
        error: "All fields are required and max price must be a number",
      }
    }

    if (!/^\d{5}$/.test(zip)) {
      return {
        success: false,
        error: "ZIP code must be 5 digits",
      }
    }

    if (maxPrice <= 0) {
      return {
        success: false,
        error: "Maximum price must be greater than zero",
      }
    }

    // Check if item exists and belongs to user
    const { data: itemData, error: itemError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (itemError || !itemData) {
      return {
        success: false,
        error: "You do not have permission to update this item or it doesn't exist",
      }
    }

    // Check for duplicates (excluding current item)
    const { data: existingItems, error: checkError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("keyword", keyword)
      .eq("marketplace", marketplace)
      .eq("user_id", userId)
      .neq("id", id)

    if (checkError) {
      console.error("Error checking for duplicates:", checkError)
      return {
        success: false,
        error: "Failed to check for duplicate search terms",
      }
    }

    if (existingItems && existingItems.length > 0) {
      return {
        success: false,
        error: `A search term for "${keyword}" already exists in ${marketplace}. Please use a different keyword.`,
      }
    }

    // Update the item
    const { error } = await supabase
      .from("watchlist")
      .update({
        keyword,
        max_price: maxPrice,
        min_price: minPrice,
        zip,
        radius,
        marketplace,
        category,
      })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating watchlist item:", error)
      return {
        success: false,
        error: "Failed to update watchlist item: " + error.message,
      }
    }

    revalidatePath("/alerts")
    console.log("=== UPDATE WATCHLIST ITEM SUCCESS ===")

    return {
      success: true,
      data: {
        id,
        keyword,
        max_price: maxPrice,
        min_price: minPrice,
        zip,
        radius,
        marketplace,
        category,
      },
    }
  } catch (error: any) {
    console.error("=== UPDATE WATCHLIST ITEM ERROR ===", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

export async function deleteWatchlistItem(id: string) {
  try {
    console.log("=== DELETE WATCHLIST ITEM START ===", id)

    // Get the authenticated user
    const user = await getAuthenticatedUser()
    if (!user || !user.id) {
      throw new Error("User authentication error: User not found")
    }

    const userId = user.id
    console.log("Authenticated user ID:", userId)

    // Create a Supabase client
    const supabase = await createServerSupabaseClient()

    // Check if item exists and belongs to user
    const { data: itemData, error: itemError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (itemError || !itemData) {
      return {
        success: false,
        error: "You do not have permission to delete this item or it doesn't exist",
      }
    }

    // Delete the item
    const { error } = await supabase.from("watchlist").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("Error deleting watchlist item:", error)
      return {
        success: false,
        error: "Failed to delete watchlist item: " + error.message,
      }
    }

    revalidatePath("/alerts")
    console.log("=== DELETE WATCHLIST ITEM SUCCESS ===")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("=== DELETE WATCHLIST ITEM ERROR ===", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}
