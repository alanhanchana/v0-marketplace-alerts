import { createClient } from "@supabase/supabase-js"

// Create a singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  // These environment variables are automatically set by the Supabase integration in Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    },
    // Ensure we're using the browser's native WebSocket
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabaseClient()
