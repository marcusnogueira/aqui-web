'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { createClient, signOut } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import type { Database } from '@/types/database'
import { USER_ROLES } from '@/lib/constants'

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
type User = Database['public']['Tables']['users']['Row']

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void
}

export default function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const { data: session } = useSession()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasVendorProfile, setHasVendorProfile] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [session])

  const loadUserData = async () => {
    try {
      if (!session?.user) return

      const userProfileResult = await clientAuth.getUserProfile(session.user.id!)
      if (userProfileResult.success && userProfileResult.data) {
        setCurrentUser(userProfileResult.data)
        
        // Check if user has vendor profile
        const hasVendor = await clientAuth.hasVendorProfile(session.user.id!)
        setHasVendorProfile(hasVendor)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!currentUser || loading) return
    
    // If switching to vendor but no vendor profile exists, redirect to onboarding
    if (newRole === USER_ROLES.VENDOR && !hasVendorProfile) {
      window.location.href = '/vendor/onboarding'
      return
    }

    setLoading(true)
    try {
      await clientAuth.switchRole(newRole)
      
      // Update local state
      setCurrentUser(prev => prev ? { ...prev, active_role: newRole } : null)
      
      // Notify parent component
      onRoleChange?.(newRole)
      
      // Redirect to appropriate page based on role
      if (newRole === USER_ROLES.VENDOR) {
        window.location.href = '/vendor/dashboard'
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error switching role:', error)
      alert('Failed to switch role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' })
      // Clear user state
      setCurrentUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!currentUser) {
    return null
  }

  const currentRole = currentUser.active_role as UserRole || USER_ROLES.CUSTOMER

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Current Role Indicator */}
        <span className="text-sm text-muted-foreground">
          {currentRole === USER_ROLES.VENDOR ? 'Store' : 'User'}
        </span>
        
        {/* Role Switch Buttons */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => handleRoleSwitch(USER_ROLES.CUSTOMER)}
            disabled={loading}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentRole === USER_ROLES.CUSTOMER
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
          >
            Customer
          </button>
          
          <button
            onClick={() => handleRoleSwitch(USER_ROLES.VENDOR)}
            disabled={loading}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentRole === USER_ROLES.VENDOR
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
          >
            {hasVendorProfile ? 'Vendor' : 'Become Vendor'}
          </button>
        </div>
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
        >
          Sign Out
        </button>
        
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        )}
      </div>
      
      {/* Role Description */}
      <div className="mt-1">
        <p className="text-xs text-muted-foreground">
          {currentRole === USER_ROLES.VENDOR 
            ? 'Managing your business' 
            : hasVendorProfile 
              ? 'Shopping mode' 
              : 'Shopping mode'
          }
        </p>
      </div>
    </div>
  )
}