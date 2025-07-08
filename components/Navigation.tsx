'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, createClient } from '@/lib/supabase'
import { clientAuth } from '@/lib/auth-helpers'

export function Navigation() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const userProfile = await clientAuth.getUserProfile(authUser.id)
        setUser(userProfile)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBecomeVendor = async () => {
    if (!user) return
    
    setIsUpdatingRole(true)
    try {
      // Create vendor profile using API
      const response = await fetch('/api/user/create-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vendor profile')
      }
      
      // Navigate to vendor dashboard after creation
      router.push('/vendor/dashboard')
      setIsOpen(false)
      
      // Refresh user data
      await checkAuth()
    } catch (error) {
      console.error('Error becoming vendor:', error)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleSwitchToVendor = async () => {
    if (!user) return
    
    setIsUpdatingRole(true)
    try {
      await clientAuth.switchRole('vendor')
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
      await clientAuth.switchRole('customer')
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
              Current Role: {user.active_role || 'Customer'}
            </div>
          </div>
          
          {/* Role-based menu options */}
          {user.active_role === 'customer' && (
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
                  disabled={isUpdatingRole}
                  className="block w-full text-left px-4 py-2 text-sm text-mission-teal hover:bg-gray-100 font-medium disabled:opacity-50"
                >
                  {isUpdatingRole ? 'Processing...' : 'Become a Vendor'}
                </button>
              )}
            </>
          )}
          
          {user.active_role === 'vendor' && (
            <>
              <button
                onClick={handleSwitchToCustomer}
                disabled={isUpdatingRole}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Use AQUI as Customer
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