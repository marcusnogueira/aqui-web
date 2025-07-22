import { jwtVerify } from 'jose'
import { errorHandler, createAuthError, createNetworkError, Result } from '@/lib/error-handler'

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
  async login(username: string, password: string): Promise<Result<AdminUser>> {
    return errorHandler.wrapAsyncResult(async () => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Required for session cookies
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw createAuthError(
          data.error || 'Login failed',
          'ADMIN_LOGIN_FAILED',
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        )
      }
      
      return data.admin
    }, 'adminAuth.login')
  },
  
  /**
   * Logout admin user
   */
  async logout(): Promise<Result<boolean>> {
    return errorHandler.wrapAsyncResult(async () => {
      const response = await fetch('/api/admin/login', {
        method: 'DELETE',
        credentials: 'include', // Required for session cookies
      })
      
      if (!response.ok) {
        throw createNetworkError(
          'Logout failed',
          'ADMIN_LOGOUT_FAILED',
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        )
      }
      
      return true
    }, 'adminAuth.logout')
  },
  
  /**
   * Check if admin is authenticated (client-side)
   */
  async checkAuth(): Promise<Result<AdminUser | null>> {
    return errorHandler.wrapAsyncResult(async () => {
      const response = await fetch('/api/admin/me', {
        credentials: 'include', // Required for session cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.admin
      }
      
      if (response.status === 401) {
        return null
      }
      
      throw createNetworkError(
        'Failed to check admin authentication',
        'ADMIN_CHECK_AUTH_FAILED',
        new Error(`HTTP ${response.status}: ${response.statusText}`)
      )
    }, 'adminAuth.checkAuth')
  }
}