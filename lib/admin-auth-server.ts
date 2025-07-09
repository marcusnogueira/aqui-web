import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set. Please configure JWT_SECRET in your environment variables.')
}

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
export function verifyAdminTokenServer(request: NextRequest): AdminUser | null {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return null
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser
    
    if (decoded.type !== 'admin') {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('Error verifying admin token:', error)
    return null
  }
}

/**
 * Check if request has valid admin authentication (server-side)
 */
export function isAdminAuthenticatedServer(request: NextRequest): boolean {
  return verifyAdminTokenServer(request) !== null
}

/**
 * Get admin user from request (server-side)
 */
export function getAdminUserServer(request: NextRequest): AdminUser | null {
  return verifyAdminTokenServer(request)
}