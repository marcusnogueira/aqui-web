'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { signOut, createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'

export function Navigation() {
  const { data: session } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [session])

  const checkAuth = async () => {
    try {
      if (session?.user) {
        const userProfileResult = await clientAuth.getUserProfile(session.user.id!)
        if (userProfileResult.success && userProfileResult.data) {
          setUser(userProfileResult.data)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' })
      setIsOpen(false)
      // Clear user state
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBecomeVendor = async () => {
    if (!user) return
    
    // Navigate directly to onboarding form instead of creating placeholder vendor
    setIsOpen(false)
    router.push('/vendor/onboarding')
  }

  const handleSwitchToVendor = async () => {
    if (!user) return
    
    setIsUpdatingRole(true)
    try {
      await clientAuth.switchRole(USER_ROLES.VENDOR)
      setIsOpen(false)
      router.push('/vendor/dashboard')
      
      // Refresh user data
      await checkAuth()
    } catch (error) {
      console.error('Error switching to vendor:', error)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleSwitchToCustomer = async () => {
    if (!user) return
    
    setIsUpdatingRole(true)
    try {
      await clientAuth.switchRole(USER_ROLES.CUSTOMER)
      setIsOpen(false)
      router.push('/')
      
      // Refresh user data
      await checkAuth()
    } catch (error) {
      console.error('Error switching to customer:', error)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <div className="w-8 h-8 bg-mission-teal rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{user.email}</div>
            <div className="text-xs text-gray-500 capitalize flex items-center">
              Current Role: {user.active_role || USER_ROLES.CUSTOMER}
            </div>
          </div>
          
          {/* Role-based menu options */}
          {user.active_role === USER_ROLES.CUSTOMER && (
            <>
              {user.is_vendor ? (
                <button
                  onClick={handleSwitchToVendor}
                  disabled={isUpdatingRole}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Switch to Vendor Mode
                </button>
              ) : (
                <button
                  onClick={handleBecomeVendor}
                  className="block w-full text-left px-4 py-2 text-sm text-mission-teal hover:bg-gray-100 font-medium"
                >
                  Become a Vendor
                </button>
              )}
            </>
          )}
          
          {user.active_role === USER_ROLES.VENDOR && (
            <>
              <button
                onClick={handleSwitchToCustomer}
                disabled={isUpdatingRole}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Use Aqui as Customer
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/vendor/dashboard')
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Vendor Dashboard
              </button>
            </>
          )}
          
          <div className="border-t">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}