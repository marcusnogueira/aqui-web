import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { Database } from '@/types/database'
import { ADMIN_SESSION, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'
import { adminLoginRateLimiter, getClientIP } from '@/lib/rate-limiter'

// Force dynamic rendering for cookie usage
export const dynamic = 'force-dynamic'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is required but not set.')
    return NextResponse.json(
      { error: 'Internal server error: JWT secret not configured.' },
      { status: 500 }
    )
  }

  // Rate limiting check
  const clientIP = getClientIP(request)
  if (adminLoginRateLimiter.isRateLimited(clientIP)) {
    const remainingTime = adminLoginRateLimiter.getRemainingTime(clientIP)
    const minutes = Math.ceil(remainingTime / (60 * 1000))
    return NextResponse.json(
      { 
        error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        rateLimited: true,
        remainingTime
      },
      { status: HTTP_STATUS.TOO_MANY_REQUESTS }
    )
  }

  try {
    console.log('[ADMIN LOGIN] Received request.');
    const { username, password } = await request.json()
    console.log(`[ADMIN LOGIN] Attempting login for username: ${username}`);
    
    if (!username || !password) {
      console.log('[ADMIN LOGIN] Error: Missing username or password.');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    // Get admin user from database
    console.log('[ADMIN LOGIN] Fetching user from database...');
    const { data: adminUser, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, username, password_hash')
      .eq('username', username)
      .single()
    
    if (fetchError || !adminUser) {
      console.error('[ADMIN LOGIN] Error fetching user or user not found:', fetchError);
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }
    console.log(`[ADMIN LOGIN] Found user: ${adminUser.username}`);
    
    // Verify password
    console.log('[ADMIN LOGIN] Comparing password...');
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)
    console.log(`[ADMIN LOGIN] Password is valid: ${isValidPassword}`);
    
    if (!isValidPassword) {
      // Record failed attempt for rate limiting
      adminLoginRateLimiter.recordAttempt(clientIP)
      console.log('[ADMIN LOGIN] Error: Invalid password.');
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Reset rate limit on successful login
    adminLoginRateLimiter.reset(clientIP)
    console.log('[ADMIN LOGIN] Password verified. Creating JWT...');
    
    // Create JWT token
    const secretKey = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
        adminId: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        type: 'admin'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ADMIN_SESSION.EXPIRATION_TIME)
      .sign(secretKey)
    console.log('[ADMIN LOGIN] JWT created. Setting cookie...');
    
    // Create response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        admin: {
          adminId: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          type: 'admin' as const
        }
      },
      { status: 200 }
    )
    
    // Set secure HTTP-only cookie scoped to /admin path
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: !!process.env.VERCEL_URL, // Only secure in production environments
      sameSite: 'lax',
      maxAge: ADMIN_SESSION.MAX_AGE_SECONDS,
      path: '/admin'
    })
    console.log('[ADMIN LOGIN] Cookie set. Sending response.');
    
    return response
    
  } catch (error) {
    // Record failed attempt for rate limiting on any error
    adminLoginRateLimiter.recordAttempt(clientIP)
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  )
  
  // Clear the admin token cookie
  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: !!process.env.VERCEL_URL, // Match secure flag for proper deletion
    sameSite: 'lax',
    maxAge: 0,
    path: '/admin'
  })
  
  return response
}