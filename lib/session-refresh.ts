/**
 * Session Refresh Utilities
 * 
 * This module provides utilities for refreshing NextAuth sessions
 * after user role or vendor status changes.
 */

import { createClient } from '@/lib/supabase-server'

/**
 * Refreshes user data in the database to trigger session updates
 * This works by updating the user's updated_at timestamp, which can
 * be used by the JWT callback to refresh session data
 */
export async function refreshUserSession(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get the latest user data including vendor status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, active_role, is_vendor')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user data for session refresh:', userError)
      return { success: false, error: userError.message }
    }

    // Update the user's updated_at timestamp to trigger session refresh
    const { error: updateError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user timestamp for session refresh:', updateError)
      return { success: false, error: updateError.message }
    }

    return { 
      success: true, 
      userData: {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        active_role: userData.active_role,
        is_vendor: userData.is_vendor
      }
    }
  } catch (error) {
    console.error('Session refresh error:', error)
    return { success: false, error: 'Failed to refresh session' }
  }
}

/**
 * Client-side session refresh trigger
 * Returns instructions for the client to refresh their session
 */
export function getSessionRefreshInstructions() {
  return {
    refreshRequired: true,
    message: 'Your profile has been updated. Please refresh to see changes.',
    instructions: 'The client should call router.refresh() or signIn() to update the session'
  }
}

/**
 * Enhanced session refresh that also fetches vendor data if applicable
 */
export async function refreshUserSessionWithVendorData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get user data with vendor information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        full_name, 
        active_role, 
        is_vendor,
        vendors (
          id,
          business_name,
          status
        )
      `)
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user data with vendor info:', userError)
      return { success: false, error: userError.message }
    }

    // Update timestamp to trigger session refresh
    const { error: updateError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user timestamp:', updateError)
      return { success: false, error: updateError.message }
    }

    return { 
      success: true, 
      userData: {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        active_role: userData.active_role,
        is_vendor: userData.is_vendor,
        vendor: userData.vendors?.[0] || null
      }
    }
  } catch (error) {
    console.error('Enhanced session refresh error:', error)
    return { success: false, error: 'Failed to refresh session with vendor data' }
  }
}