import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Simple token check for Edge Runtime compatibility
 * This avoids using jsonwebtoken which requires Node.js crypto
 */
function hasAdminToken(request: NextRequest): boolean {
  const token = request.cookies.get('admin-token')?.value
  return !!token && token.length > 0
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }
    
    // Check for admin token presence (detailed validation happens in API routes)
    if (!hasAdminToken(request)) {
      // Redirect to admin login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Protect API admin routes
  if (pathname.startsWith('/api/admin')) {
    // Allow login endpoint
    if (pathname === '/api/admin/login') {
      return NextResponse.next()
    }
    
    // Check for admin token presence (detailed validation happens in the API route itself)
    if (!hasAdminToken(request)) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}