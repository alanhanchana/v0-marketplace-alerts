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

    if (!keyword || isNaN(maxPrice) || !zip) {
      return {
        success: false,
        error: "All fields are required and max price must be a number",
      }
    }

    // Try to insert the data
    const { error } = await supabase.from("watchlist").insert([
      {
        keyword,
        max_price: maxPrice,
        zip,
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

    // Return success
    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error inserting watchlist item:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}
