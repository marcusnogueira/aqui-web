import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Helper function to verify admin token in Edge Runtime
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) return false
    
    const secretKey = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secretKey)
    
    return payload && payload.type === 'admin'
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is an admin route
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Skip login page and login API
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next()
    }
    
    // Check for admin authentication
    const adminToken = request.cookies.get('admin-token')?.value
    
    if (!adminToken || !(await verifyAdminToken(adminToken))) {
      // For API routes, return 401 Unauthorized
      if (pathname.startsWith('/api/admin')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }
      
      // For web routes, redirect to admin login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Better Auth handles its own session management
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}