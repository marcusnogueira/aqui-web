import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { USER_ROLES } from '@/lib/constants'
import type { Database } from '@/types/database'
import { errorHandler, createAuthError, createNetworkError, ErrorSeverity, Result, createResult } from '@/lib/error-handler'

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
type DatabaseUser = Database['public']['Tables']['users']['Row']

/**
 * Client-side authentication helpers
 */
export const clientAuth = {
  /**
   * Get current authenticated user from client
   */
  async getCurrentUser(): Promise<User | null> {
    return errorHandler.wrapAsync(async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw createAuthError('Failed to get current user', 'AUTH_GET_USER_FAILED', error)
      }
      
      return user
    }, 'clientAuth.getCurrentUser', null)
  },
  
  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<Result<DatabaseUser>> {
    try {
      const supabase = createClient()
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        const standardError = errorHandler.create(
          errorHandler['inferErrorType'](error),
          `Failed to get user profile: ${error.message}`,
          ErrorSeverity.MEDIUM,
          'USER_PROFILE_FETCH_FAILED',
          error,
          'clientAuth.getUserProfile'
        )
        return createResult.error(standardError)
      }
      
      if (!userProfile) {
        const notFoundError = createAuthError(
          'User profile not found',
          'USER_PROFILE_NOT_FOUND',
          { userId }
        )
        return createResult.error(notFoundError)
      }
      
      return createResult.success(userProfile)
    } catch (error) {
      const standardError = errorHandler.handle(error as Error, 'clientAuth.getUserProfile')
      return createResult.error(standardError)
    }
  },
  
  /**
   * Switch user role
   */
  async switchRole(role: UserRole): Promise<Result<any>> {
    try {
      const response = await fetch('/api/user/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const error = createNetworkError(
          data.error || 'Failed to switch role',
          'ROLE_SWITCH_FAILED',
          { role, status: response.status, data }
        )
        return createResult.error(error)
      }
      
      return createResult.success(data)
    } catch (error) {
      const standardError = errorHandler.handle(error as Error, 'clientAuth.switchRole')
      return createResult.error(standardError)
    }
  },
  
  /**
   * Become a vendor (onboarding)
   */
  async becomeVendor(vendorData: {
    business_name: string
    business_type: string
    description?: string
    phone?: string
    address?: string
    place_id?: string
    latitude?: number
    longitude?: number
    address_components?: any
  }): Promise<Result<any>> {
    try {
      const response = await fetch('/api/user/become-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const error = createNetworkError(
          data.error || 'Failed to create vendor profile',
          'VENDOR_CREATION_FAILED',
          { vendorData, status: response.status, data }
        )
        return createResult.error(error)
      }
      
      return createResult.success(data)
    } catch (error) {
      const standardError = errorHandler.handle(error as Error, 'clientAuth.becomeVendor')
      return createResult.error(standardError)
    }
  },
  
  /**
   * Check if user has vendor profile
   */
  async hasVendorProfile(userId: string): Promise<boolean> {
    const result = await errorHandler.wrapAsync(async () => {
      const supabase = createClient()
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw errorHandler.create(
          errorHandler['inferErrorType'](error),
          `Failed to check vendor profile: ${error.message}`,
          ErrorSeverity.MEDIUM,
          'VENDOR_CHECK_FAILED',
          error
        )
      }
      
      return !!vendor
    }, 'clientAuth.hasVendorProfile', false)
    
    return result ?? false
  }
}

// All deprecated functions have been removed.
// Use clientAuth methods for authentication checks.