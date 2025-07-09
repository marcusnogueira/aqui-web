import { jwtVerify } from 'jose'

export interface AdminUser {
  adminId: string
  username: string
  email: string
  type: 'admin'
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