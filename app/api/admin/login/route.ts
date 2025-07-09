import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { Database } from '@/types/database'
import { ADMIN_SESSION, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

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

  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    // Get admin user from database
    const { data: adminUser, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, username, password_hash')
      .eq('username', username)
      .single()
    
    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }
    
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
    
    // Create response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email
        }
      },
      { status: 200 }
    )
    
    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_SESSION.MAX_AGE_SECONDS,
      path: '/'
    })
    
    return response
    
  } catch (error) {
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
  
  return response
}