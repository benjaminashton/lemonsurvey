import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname

  const isAuthPage = path.startsWith('/login')
  const isPublicRoute = path.startsWith('/s/') || path.startsWith('/api/auth') || path.startsWith('/setup')
  const isPublicApiRoute = path.match(/^\/api\/surveys\/[^\/]+\/responses/) || path.startsWith('/api/upload')
  const isApiRoute = path.startsWith('/api/')
  
  if (isAuthPage) {
    if (isLoggedIn) {
      if (req.auth?.user?.role === 'RESPONDENT') {
        // Respondents shouldn't normally hit /login, but if they do, just give them a 403 or redirect somewhere.
        // For now, let's just let it fall through or redirect to a safe page.
      } else {
        return NextResponse.redirect(new URL('/', req.nextUrl))
      }
    }
    return null
  }
  
  if (!isLoggedIn && !isPublicRoute && !isPublicApiRoute) {
    if (!isApiRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Prevent RESPONDENT from accessing dashboard/admin routes
  if (isLoggedIn && req.auth?.user?.role === 'RESPONDENT' && !isPublicRoute && !isPublicApiRoute) {
    if (!isApiRoute) {
      return NextResponse.redirect(new URL('/s/not-found', req.nextUrl))
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  return null
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
