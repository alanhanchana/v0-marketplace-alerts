"use server"

import { supabase } from "@/lib/supabaseClient"
import { initSupabase } from "@/lib/supabaseInit"
import { revalidatePath } from "next/cache"

export async function createWatchlistItem(formData: FormData) {
  try {
    // Try to ensure the table exists
    try {
      await initSupabase()
    } catch (err) {
      console.error("Table initialization error:", err)
      // Continue anyway, as the table might already exist or be created manually
    }

    const keyword = formData.get("keyword") as string
    const maxPrice = Number.parseInt(formData.get("maxPrice") as string)
    const zip = formData.get("zip") as string
    const radius = Number.parseInt(formData.get("radius") as string) || 1

    if (!keyword || isNaN(maxPrice) || !zip) {
      return {
        success: false,
        error: "All fields are required and max price must be a number",
      }
    }

    // Validate zip code format
    if (!/^\d{5}$/.test(zip)) {
      return {
        success: false,
        error: "ZIP code must be 5 digits",
      }
    }

    // Validate max price
    if (maxPrice <= 0) {
      return {
        success: false,
        error: "Maximum price must be greater than zero",
      }
    }

    // Try to insert the data
    const { error } = await supabase.from("watchlist").insert([
      {
        keyword,
        max_price: maxPrice,
        zip,
        radius,
      },
    ])

    if (error) {
      console.error("Supabase insert error:", error)

      // If the error is about the table not existing, we'll inform the user
      if (error.message.includes("does not exist")) {
        return {
          success: false,
          error:
            "The watchlist table doesn't exist. Please create it manually in the Supabase dashboard or contact support.",
        }
      } else {
        return {
          success: false,
          error: error.message || "Failed to create watchlist item",
        }
      }
    }

    // Revalidate the alerts page to show the new data
    revalidatePath("/alerts")

    // Return success with the form data for the toast message
    return {
      success: true,
      data: {
        keyword,
        zip,
      },
    }
  } catch (error: any) {
    console.error("Error inserting watchlist item:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

export async function deleteWatchlistItem(id: string) {
  try {
    const { error } = await supabase.from("watchlist").delete().eq("id", id)

    if (error) {
      console.error("Error deleting watchlist item:", error)
      return {
        success: false,
        error: error.message || "Failed to delete watchlist item",
      }
    }

    // Revalidate the alerts page to show the updated data
    revalidatePath("/alerts")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error deleting watchlist item:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

export async function updateWatchlistItem(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const keyword = formData.get("keyword") as string
    const maxPrice = Number.parseInt(formData.get("maxPrice") as string)
    const zip = formData.get("zip") as string
    const radius = Number.parseInt(formData.get("radius") as string) || 1

    console.log("Updating watchlist item:", { id, keyword, maxPrice, zip, radius })

    if (!id || !keyword || isNaN(maxPrice) || !zip) {
      return {
        success: false,
        error: "All fields are required and max price must be a number",
      }
    }

    // Validate zip code format
    if (!/^\d{5}$/.test(zip)) {
      return {
        success: false,
        error: "ZIP code must be 5 digits",
      }
    }

    // Validate max price
    if (maxPrice <= 0) {
      return {
        success: false,
        error: "Maximum price must be greater than zero",
      }
    }

    // Update the watchlist item
    const { error } = await supabase
      .from("watchlist")
      .update({
        keyword,
        max_price: maxPrice,
        zip,
        radius,
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating watchlist item:", error)
      return {
        success: false,
        error: error.message || "Failed to update watchlist item",
      }
    }

    // Revalidate the alerts page to show the updated data
    revalidatePath("/alerts")

    return {
      success: true,
      data: {
        id,
        keyword,
        max_price: maxPrice,
        zip,
        radius,
      },
    }
  } catch (error: any) {
    console.error("Error updating watchlist item:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}
