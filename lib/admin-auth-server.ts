import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set. Please configure JWT_SECRET in your environment variables.')
}

const secretKey = new TextEncoder().encode(JWT_SECRET)

export interface AdminUser {
  adminId: string
  username: string
  email: string
  type: 'admin'
}

/**
 * Server-side admin token verification for Node.js runtime
 * This is separate from the Edge Runtime compatible middleware
 */
export async function verifyAdminTokenServer(request: NextRequest): Promise<AdminUser | null> {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return null
    }
    
    const { payload } = await jwtVerify(token, secretKey)

    if (payload && payload.type === 'admin') {
        return payload as unknown as AdminUser;
    }
    
    return null
  } catch (error) {
    console.error('Error verifying admin token:', error)
    return null
  }
}

/**
 * Check if request has valid admin authentication (server-side)
 */
export async function isAdminAuthenticatedServer(request: NextRequest): Promise<boolean> {
  return (await verifyAdminTokenServer(request)) !== null
}

/**
 * Get admin user from request (server-side)
 */
export async function getAdminUserServer(request: NextRequest): Promise<AdminUser | null> {
  return verifyAdminTokenServer(request)
}