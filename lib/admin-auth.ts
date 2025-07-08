import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

export interface AdminUser {
  adminId: string
  username: string
  email: string
  type: 'admin'
}

/**
 * Verify admin token from request cookies
 */
export function verifyAdminToken(request: NextRequest): AdminUser | null {
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
 * Check if request is from authenticated admin
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  return verifyAdminToken(request) !== null
}

/**
 * Get admin user from request
 */
export function getAdminUser(request: NextRequest): AdminUser | null {
  return verifyAdminToken(request)
}

/**
 * Client-side admin authentication helpers
 */
export const adminAuth = {
  /**
   * Login admin user
   */
  async login(username: string, password: string) {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }
    
    return data.admin
  },
  
  /**
   * Logout admin user
   */
  async logout() {
    const response = await fetch('/api/admin/login', {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Logout failed')
    }
    
    return true
  },
  
  /**
   * Check if admin is authenticated (client-side)
   */
  async checkAuth() {
    try {
      const response = await fetch('/api/admin/me')
      
      if (response.ok) {
        const data = await response.json()
        return data.admin
      }
      
      return null
    } catch (error) {
      return null
    }
  }
}