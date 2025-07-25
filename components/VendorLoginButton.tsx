'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'
import AuthModal from '@/components/AuthModal'

interface VendorLoginButtonProps {
  className?: string
  children: React.ReactNode
}

export function VendorLoginButton({ className, children }: VendorLoginButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkUserProfile(session.user.id)
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status])

  const checkUserProfile = async (userId: string) => {
    try {
      const result = await clientAuth.getUserProfile(userId)
      if (result.success && result.data) {
        setUser(result.data)
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  const handleClick = async () => {
    if (status === 'loading') return

    // If not authenticated, show auth modal
    if (status === 'unauthenticated') {
      setShowAuthModal(true)
      return
    }

    // If authenticated, check user role and vendor status
    if (user) {
      setLoading(true)
      try {
        // If user is already a vendor and in vendor mode, go to dashboard
        if (user.active_role === USER_ROLES.VENDOR && user.is_vendor) {
          router.push('/vendor/dashboard')
        }
        // If user is a vendor but in customer mode, switch to vendor mode
        else if (user.is_vendor && user.active_role === USER_ROLES.CUSTOMER) {
          await clientAuth.switchRole(USER_ROLES.VENDOR)
          router.push('/vendor/dashboard')
        }
        // If user is not a vendor, go to onboarding
        else {
          router.push('/vendor/onboarding')
        }
      } catch (error) {
        console.error('Error handling vendor login:', error)
        // Fallback to onboarding
        router.push('/vendor/onboarding')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
      
      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
}