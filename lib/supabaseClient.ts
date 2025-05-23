import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Create a singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClientComponentClient<Database>({
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "supabase-auth-token",
        detectSessionInUrl: true,
      },
    },
  })

  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabaseClient()
