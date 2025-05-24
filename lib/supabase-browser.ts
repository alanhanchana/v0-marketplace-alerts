import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./database.types"

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseBrowser() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Use path-based cookies that don't depend on domain
          cookieOptions: {
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          },
          // Use localStorage as a fallback for cookies
          storageKey: "supabase-auth-token",
        },
        global: {
          // Disable automatic retries on network errors
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: "include", // Always include credentials
            })
          },
        },
      },
    })
  }
  return supabaseClient
}
