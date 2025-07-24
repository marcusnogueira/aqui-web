'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { Database } from '@/types/database'
import { Store, MapPin, Clock, Users, TrendingUp, Calendar } from 'lucide-react'
import { USER_ROLES } from '@/lib/constants'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

export default function VendorOverviewPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [liveSession, setLiveSession] = useState<VendorLiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalHours: 0,
    avgRating: 0,
    totalReviews: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    checkAuth()
  }, [session, status])

  const checkAuth = async () => {
    try {
      if (!session?.user) {
        router.push('/')
        return
      }

      // Get user profile
      const userProfileResult = await clientAuth.getUserProfile(session.user.id!)
      if (!userProfileResult.success || !userProfileResult.data) {
        router.push('/')
        return
      }

      const userProfile = userProfileResult.data
      if (userProfile.active_role !== USER_ROLES.VENDOR) {
        router.push('/')
        return
      }

      setUser(userProfile)
      fetchVendorData(session.user.id!)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  const fetchVendorData = async (userId?: string) => {
    const currentUserId = userId || user?.id
    if (!currentUserId || !supabase) return

    try {
      // Fetch vendor profile
      const vendorResult = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUserId)
        .single()
      
      const { data: vendorData, error: vendorError } = vendorResult || { data: null, error: null }

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError)
        // If no vendor profile exists, redirect to onboarding
        if (vendorError.code === 'PGRST116') {
          router.push('/vendor/onboarding')
          return
        }
      } else {
        setVendor(vendorData)

        // Fetch active live session
        const sessionResult = await supabase
          .from('vendor_live_sessions')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .is('ended_at', null)
          .single()
        
        const { data: sessionData } = sessionResult || { data: null }

        setLiveSession(sessionData)

        // Fetch vendor stats
        await fetchVendorStats(vendorData.id)
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendorStats = async (vendorId: string) => {
    if (!supabase) return
    
    try {
      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('vendor_live_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)

      // Get reviews stats
      const reviewsResult = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vendorId)
      
      const { data: reviewsData } = reviewsResult || { data: null }

      const totalReviews = reviewsData?.length || 0
      const avgRating = totalReviews > 0 && reviewsData
        ? reviewsData.reduce((sum, review) => sum + (review.rating ?? 0), 0) / totalReviews 
        : 0

      setStats({
        totalSessions: totalSessions || 0,
        totalHours: 0, // Could calculate from session durations
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews
      })
    } catch (error) {
      console.error('Error fetching vendor stats:', error)
    }
  }

  const startLiveSession = async () => {
    console.log('🔍 Starting go-live debug (overview):', { vendor, supabase, loading })
    
    if (!vendor) {
      console.error('❌ No vendor found:', { vendor })
      alert('Vendor profile not found. Please refresh the page and try again.')
      return
    }
    
    if (!supabase) {
      console.error('❌ No supabase client')
      alert('Database connection issue. Please refresh and try again.')
      return
    }
    
    // Clean and normalize vendor status to handle potential whitespace/casing issues
    const cleanStatus = vendor.status?.trim()?.toLowerCase()
    
    console.log('🔍 Frontend vendor status check:', {
      original: vendor.status,
      cleaned: cleanStatus,
      originalLength: vendor.status?.length,
      cleanedLength: cleanStatus?.length
    })
    
    if (cleanStatus !== 'active' && cleanStatus !== 'approved') {
      console.error('❌ Vendor not approved:', {
        originalStatus: vendor.status,
        cleanedStatus: cleanStatus,
        allowedStatuses: ['active', 'approved']
      })
      alert(`Cannot go live. Your vendor status is "${vendor.status}". Please wait for approval.`)
      return
    }
    
    console.log('✅ Vendor validation passed, requesting location...')
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser.'))
          return
        }
        
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })
      
      // Get address from coordinates
      let address = 'Location not specified'
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        )
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          address = data.features[0].place_name
        }
      } catch (geocodeError) {
        console.warn('Failed to get address from coordinates:', geocodeError)
      }
      
      // API will handle validation
      
      // Use API endpoint for go-live
      const response = await fetch('/api/vendor/go-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: address
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start live session');
      }

      const result = await response.json();
      setLiveSession(result.session)
      alert('Live session started successfully!')
    } catch (error) {
      console.error('Error starting live session:', error)
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location permissions and try again.')
            break
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable. Please try again.')
            break
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.')
            break
          default:
            alert('An unknown location error occurred.')
            break
        }
      } else {
        alert('Failed to start live session. Please try again.')
      }
    }
  }

  const endLiveSession = async () => {
    if (!liveSession) return
    
    try {
      const response = await fetch('/api/vendor/go-live', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end live session');
      }

      setLiveSession(null)
      alert('Live session ended successfully!')
    } catch (error) {
      console.error('Error ending live session:', error)
      alert(`Failed to end live session: ${error instanceof Error ? error.message : 'Please try again.'}`)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your vendor overview...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/')
    return null
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Vendor Profile Found</h2>
          <p className="text-gray-600 mb-4">You need to complete your vendor onboarding first.</p>
          <button
            onClick={() => router.push('/vendor/onboarding')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Overview</h1>
              <p className="text-gray-600">Welcome back, {vendor.business_name}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Full Dashboard
              </button>
              {liveSession ? (
                <button
                  onClick={endLiveSession}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>End Live Session</span>
                </button>
              ) : (
                <button
                  onClick={startLiveSession}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Go Live</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Session Status */}
        {liveSession && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">You're currently live!</h3>
                <p className="text-sm text-green-600">
                  Location: {liveSession.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hours Online</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avgRating || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/vendor/dashboard?tab=profile')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Store className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Edit Profile</h3>
              <p className="text-sm text-gray-600">Update your business information</p>
            </button>

            <button
              onClick={() => router.push('/vendor/dashboard?tab=locations')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <MapPin className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Locations</h3>
              <p className="text-sm text-gray-600">Add or edit your service locations</p>
            </button>

            <button
              onClick={() => router.push('/vendor/dashboard?tab=announcements')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Calendar className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Announcements</h3>
              <p className="text-sm text-gray-600">Share updates with customers</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}