import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// Client-side Supabase client (singleton)
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called on the client side")
  }

  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
  }

  return supabaseClient
}

// Server-side Supabase client
export async function getServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// For backward compatibility
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null
