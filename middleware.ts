import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Skip middleware for static files, API routes, and POST requests
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.includes(".") ||
    req.method === "POST"
  ) {
    return response
  }

  try {
    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            })
          },
        },
      },
    )

    // Get the session without refreshing to avoid unnecessary token refreshes
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the user is authenticated
    const isAuthenticated = !!session
    const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup"
    const isPublicPage = req.nextUrl.pathname === "/"
    const isAuthCallbackPage = req.nextUrl.pathname.startsWith("/auth/callback")

    // Log the authentication state for debugging
    console.log(`Middleware: Path=${req.nextUrl.pathname}, Authenticated=${isAuthenticated}`)

    // If the user is not authenticated and trying to access a protected route
    if (!isAuthenticated && !isAuthPage && !isPublicPage && !isAuthCallbackPage) {
      console.log("Redirecting to login - not authenticated", req.nextUrl.pathname)
      const redirectUrl = new URL("/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is authenticated and trying to access an auth page
    if (isAuthenticated && isAuthPage) {
      console.log("Redirecting to alerts - already authenticated", req.nextUrl.pathname)
      const redirectUrl = new URL("/alerts", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow the request to continue
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
