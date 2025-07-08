import { createClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UserRole = 'customer' | 'vendor'
type User = Database['public']['Tables']['users']['Row']

/**
 * Client-side authentication helpers
 */
export const clientAuth = {
  /**
   * Get current authenticated user from client
   */
  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  },
  
  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<User | null> {
    const supabase = createClient()
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error || !userProfile) {
      return null
    }
    
    return userProfile
  },
  
  /**
   * Switch user role
   */
  async switchRole(role: UserRole) {
    const response = await fetch('/api/user/switch-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to switch role')
    }
    
    return data
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
  }) {
    const response = await fetch('/api/user/become-vendor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vendorData),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create vendor profile')
    }
    
    return data
  },
  
  /**
   * Check if user has vendor profile
   */
  async hasVendorProfile(userId: string): Promise<boolean> {
    const supabase = createClient()
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    return !error && !!vendor
  }
}

/**
 * Legacy compatibility functions
 * These maintain compatibility with existing code
 */

/**
 * @deprecated Use clientAuth.getUserProfile() instead
 * Check if user is admin (always returns false since admins are separate)
 */
export async function isUserAdminServer(userId: string): Promise<boolean> {
  // Admins are now completely separate from regular users
  // This function is kept for compatibility but always returns false
  return false
}

/**
 * @deprecated Use clientAuth.getUserProfile() instead
 * Check if user is admin (always returns false since admins are separate)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  // Admins are now completely separate from regular users
  // This function is kept for compatibility but always returns false
  return false
}