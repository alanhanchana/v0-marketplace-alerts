import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client with the cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Server logout error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Server logout successful")

    // Return success
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Unexpected error during server logout:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
