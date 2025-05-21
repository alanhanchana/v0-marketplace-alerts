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
    const minPrice = formData.get("minPrice") ? Number.parseInt(formData.get("minPrice") as string) : 0
    const zip = formData.get("zip") as string
    const radius = Number.parseInt(formData.get("radius") as string) || 1
    const marketplace = (formData.get("marketplace") as string) || "craigslist"
    const category = (formData.get("category") as string) || "all"

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

    console.log("Creating watchlist item:", { keyword, maxPrice, zip, radius, marketplace })

    // Extract vehicle-specific properties if category is "vehicles"
    const vehicleProps: Record<string, any> = {}
    if (category === "vehicles") {
      const vehicleType = formData.get("vehicleType") as string
      const minYear = formData.get("minYear") ? Number.parseInt(formData.get("minYear") as string) : null
      const maxYear = formData.get("maxYear") ? Number.parseInt(formData.get("maxYear") as string) : null
      const make = formData.get("make") as string
      const model = formData.get("model") as string
      const maxMileage = formData.get("maxMileage")
        ? Number.parseInt((formData.get("maxMileage") as string).replace(/,/g, ""))
        : null

      if (vehicleType) vehicleProps.vehicle_type = vehicleType
      if (minYear) vehicleProps.min_year = minYear
      if (maxYear) vehicleProps.max_year = maxYear
      if (make) vehicleProps.make = make
      if (model) vehicleProps.model = model
      if (maxMileage) vehicleProps.max_mileage = maxMileage
    }

    // Check if a search term with the same keyword and marketplace already exists
    const { data: existingItems, error: checkError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("keyword", keyword)
      .eq("marketplace", marketplace)

    if (checkError) {
      console.error("Error checking for duplicate search terms:", checkError)
      return {
        success: false,
        error: "Failed to check for duplicate search terms",
      }
    }

    if (existingItems && existingItems.length > 0) {
      return {
        success: false,
        error: `A search term for "${keyword}" already exists in ${marketplace}. Please edit the existing term instead.`,
      }
    }

    // Check if we've reached the limit of 5 search terms
    const { count, error: countError } = await supabase
      .from("watchlist")
      .select("*", { count: "exact", head: true })
      .eq("marketplace", marketplace)

    if (countError) {
      console.error("Error checking search term count:", countError)
      return {
        success: false,
        error: "Failed to check search term count",
      }
    }

    if (count && count >= 5) {
      return {
        success: false,
        error: "You can only have 5 saved search terms. Please delete one to add more.",
      }
    }

    // Try to insert the data
    const { error } = await supabase.from("watchlist").insert([
      {
        keyword,
        max_price: maxPrice,
        min_price: minPrice,
        zip,
        radius,
        marketplace,
        category,
        ...vehicleProps, // Spread the vehicle properties
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

export async function deleteAllWatchlistItems() {
  try {
    const { error } = await supabase.from("watchlist").delete().neq("id", "placeholder")

    if (error) {
      console.error("Error deleting all watchlist items:", error)
      return {
        success: false,
        error: error.message || "Failed to delete all watchlist items",
      }
    }

    // Revalidate the alerts page to show the updated data
    revalidatePath("/alerts")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error deleting all watchlist items:", error)
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
    const minPrice = formData.get("minPrice") ? Number.parseInt(formData.get("minPrice") as string) : 0
    const zip = formData.get("zip") as string
    const radius = Number.parseInt(formData.get("radius") as string) || 1
    const marketplace = (formData.get("marketplace") as string) || "craigslist"
    const category = (formData.get("category") as string) || "all"

    console.log("Updating watchlist item:", { id, keyword, maxPrice, zip, radius, marketplace })

    // Extract vehicle-specific properties if category is "vehicles"
    const vehicleProps: Record<string, any> = {}
    if (category === "vehicles") {
      const vehicleType = formData.get("vehicleType") as string
      const minYear = formData.get("minYear") ? Number.parseInt(formData.get("minYear") as string) : null
      const maxYear = formData.get("maxYear") ? Number.parseInt(formData.get("maxYear") as string) : null
      const make = formData.get("make") as string
      const model = formData.get("model") as string
      const maxMileage = formData.get("maxMileage")
        ? Number.parseInt((formData.get("maxMileage") as string).replace(/,/g, ""))
        : null

      if (vehicleType) vehicleProps.vehicle_type = vehicleType
      if (minYear) vehicleProps.min_year = minYear
      if (maxYear) vehicleProps.max_year = maxYear
      if (make) vehicleProps.make = make
      if (model) vehicleProps.model = model
      if (maxMileage) vehicleProps.max_mileage = maxMileage
    }

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

    // Check if a search term with the same keyword and marketplace already exists (excluding this one)
    const { data: existingItems, error: checkError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("keyword", keyword)
      .eq("marketplace", marketplace)
      .neq("id", id)

    if (checkError) {
      console.error("Error checking for duplicate search terms:", checkError)
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

    // Update the watchlist item
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
        ...vehicleProps, // Spread the vehicle properties
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
        marketplace,
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
