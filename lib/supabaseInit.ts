import { supabase } from "./supabaseClient"

export async function initSupabase() {
  try {
    // Try a simple query to check if the table exists
    const { error } = await supabase.from("watchlist").select("id").limit(1)

    // If we get a "relation does not exist" error, create the table
    if (error && error.message.includes("does not exist")) {
      console.log("Watchlist table doesn't exist. Creating it now...")

      // Use the REST API to execute SQL directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
        },
        body: JSON.stringify({
          sql: `
            CREATE TABLE IF NOT EXISTS watchlist (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              keyword TEXT NOT NULL,
              zip TEXT NOT NULL,
              max_price INTEGER NOT NULL,
              min_price INTEGER DEFAULT 0,
              radius INTEGER DEFAULT 1,
              marketplace TEXT DEFAULT 'craigslist',
              category TEXT DEFAULT 'all',
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error creating watchlist table:", errorData)
        throw new Error(`Failed to create table: ${JSON.stringify(errorData)}`)
      }

      console.log("Watchlist table created successfully")
    } else if (error) {
      console.error("Error checking watchlist table:", error)
      // Don't throw here, as the table might still exist
    }
  } catch (err) {
    console.error("Error in initSupabase:", err)
    // We'll continue even if there's an error, as the form submission might still work
    // if the table already exists
  }
}
