'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'

export default function ExplorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [router])

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const userProfile = await clientAuth.getUserProfile(user.id)
        
        // If user is a vendor, redirect to vendor dashboard
        if (userProfile?.active_role === USER_ROLES.VENDOR) {
          router.replace('/vendor/dashboard')
          return
        }
      }
      
      // For customers or unauthenticated users, redirect to home page (main explore interface)
      router.replace('/')
    } catch (error) {
      console.error('Error checking auth for explore page:', error)
      // On error, still redirect to home page
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to explore...</p>
      </div>
    </div>
  )
}