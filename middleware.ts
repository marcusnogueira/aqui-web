import NextAuth from 'next-auth';
import { authConfig } from './app/api/auth/[...nextauth]/auth-config';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const { auth } = NextAuth(authConfig);

// Helper function to verify admin token in middleware (Edge Runtime compatible)
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return false;

    const token = request.cookies.get('admin-token')?.value;
    if (!token) return false;

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);

    return payload && payload.type === 'admin';
  } catch (error) {
    return false;
  }
}

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const { auth } = req;

  // Protect admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Allow requests to the login page and its API route
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    // Check for admin authentication using separate admin token system
    const hasValidAdminToken = await verifyAdminToken(req);
    
    // Also check if user has admin role in the regular auth system (future flexibility)
    const isRegularUserAdmin = auth?.user?.active_role === 'admin';

    if (!hasValidAdminToken && !isRegularUserAdmin) {
      // For API routes, return a JSON error
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For web routes, redirect to the admin login page
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For all other routes, just continue
  return NextResponse.next();
});

// This config matches all routes except for static assets.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
