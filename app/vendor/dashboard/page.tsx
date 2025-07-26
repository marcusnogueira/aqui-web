'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { Database } from '@/lib/database.types'
import { getBusinessTypeKeys } from '@/lib/business-types'
import { USER_ROLES } from '@/lib/constants'
import { DashboardLayout } from '@/components/VendorDashboard/DashboardLayout'
import { OverviewSection } from '@/components/VendorDashboard/sections/OverviewSection'
import { ProfileSection } from '@/components/VendorDashboard/sections/ProfileSection'
import { GallerySection } from '@/components/VendorDashboard/sections/GallerySection'
import { LocationsSection } from '@/components/VendorDashboard/sections/LocationsSection'
import { AnnouncementsSection } from '@/components/VendorDashboard/sections/AnnouncementsSection'
import { LiveSessionSection } from '@/components/VendorDashboard/sections/LiveSessionSection'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row']

type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

export default function VendorDashboardPage() {
  const { t } = useTranslation('dashboard')
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [liveSession, setLiveSession] = useState<VendorLiveSession | null>(null)
  const [announcements, setAnnouncements] = useState<VendorAnnouncement[]>([])

  const [staticLocations, setStaticLocations] = useState<VendorStaticLocation[]>([])
  const [businessTypeKeys, setBusinessTypeKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'profile' | 'gallery' | 'locations' | 'announcements' | 'live'>('overview')

  // Form states
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    checkAuth()
    loadBusinessTypes()
  }, [session, status])

  // Listen for section changes from sidebar navigation
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      try {
        setActiveSection(event.detail as typeof activeSection)
      } catch (error) {
        console.warn('Error handling section change:', error)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('dashboard-tab-change', handleSectionChange as EventListener)
      return () => window.removeEventListener('dashboard-tab-change', handleSectionChange as EventListener)
    }
  }, [])

  // Set initial section from URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash.replace('#', '')
        if (hash && ['overview', 'profile', 'gallery', 'locations', 'announcements', 'live'].includes(hash)) {
          setActiveSection(hash as typeof activeSection)
        }
      } catch (error) {
        console.warn('Error reading URL hash:', error)
      }
    }
  }, [])

  const loadBusinessTypes = async () => {
    try {
      const keys = await getBusinessTypeKeys()
      setBusinessTypeKeys(keys)
    } catch (error) {
      console.error('Error loading business types:', error)
    }
  }



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

  const switchToCustomerMode = async () => {
    try {
      // Check if vendor has an active live session
      if (liveSession && liveSession.is_active) {
        // Show warning message and prevent role switching
        alert(t('alerts.cannotSwitchRoleWhileLive') || 'Please end your live session before switching to customer mode.')
        return
      }
      
      // Proceed with role switching if no active session
      await clientAuth.switchRole(USER_ROLES.CUSTOMER)
      router.push('/')
    } catch (error) {
      console.error('Error switching to customer mode:', error)
      alert('Failed to switch to customer mode. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
      // Check if vendor has an active live session
      if (liveSession && liveSession.is_active) {
        // Show warning message and prevent sign-out
        alert(t('alerts.cannotSignOutWhileLive') || 'Please end your live session before signing out.')
        return
      }
      
      // Proceed with sign-out if no active session
      await nextAuthSignOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
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

        // Fetch all vendor-related data in parallel for better performance
        // Use API endpoint for announcements, direct Supabase for other data
        const [sessionResult, announcementsResponse, locationsResult] = await Promise.all([
          supabase
             .from('vendor_live_sessions')
             .select('*')
             .eq('vendor_id', vendorData.id)
             .is('end_time', null)
             .single(),
          fetch(`/api/vendor/announcements?vendorId=${vendorData.id}`),
          supabase
            .from('vendor_static_locations')
            .select('*')
            .eq('vendor_id', vendorData.id)
            .order('created_at', { ascending: false })
        ])

        // Process announcements from API response
        let announcements = [];
        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          announcements = announcementsData.announcements || [];
        } else {
          console.error('Error fetching announcements from API');
        }

        setLiveSession(sessionResult.data)
        setAnnouncements(announcements)
        setStaticLocations(locationsResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startLiveSession = async (duration?: number | null) => {
    console.log('🔍 Starting go-live debug:', { vendor, supabase, loading })
    console.log('🔍 Duration parameter:', { duration, type: typeof duration, isNumber: typeof duration === 'number' })
    
    // Deep inspection of the duration parameter to catch any hidden objects
    if (duration !== null && duration !== undefined) {
      console.log('🔍 Duration deep inspection:', {
        value: duration,
        type: typeof duration,
        constructor: duration.constructor?.name,
        isObject: typeof duration === 'object',
        keys: typeof duration === 'object' ? Object.keys(duration) : 'N/A'
      })
    }
    
    if (!vendor) {
      console.error('❌ No vendor found:', { vendor, user })
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
    setIsStartingSession(true)
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
      
      // Get address from coordinates using reverse geocoding
      let address = 'Location not specified'
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (mapboxToken && mapboxToken !== 'pk.eyJ1IjoiYXF1aWFwcCIsImEiOiJjbTVqZGNqZGcwMGNzMmxzZGNqZGNqZGNqIn0.placeholder_token_replace_with_real_one') {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${mapboxToken}`
          )
          if (response.ok) {
            const data = await response.json()
            if (data.features && data.features.length > 0) {
              address = data.features[0].place_name
            }
          } else {
            console.warn('Mapbox geocoding failed:', response.status, response.statusText)
          }
        } else {
          console.warn('Mapbox token not configured, using default address')
        }
      } catch (geocodeError) {
        console.warn('Failed to get address from coordinates:', geocodeError)
      }
      
      // API will handle validation and duration
      
      // Extract only the needed coordinate values to avoid circular references
      // Ensure duration is a clean number or null
      const cleanDuration = duration && typeof duration === 'number' ? duration : null
      
      const requestData = {
        latitude: Number(position.coords.latitude),
        longitude: Number(position.coords.longitude),
        address: String(address || 'Location not specified'),
        duration: cleanDuration
      }
      
      console.log('📤 Sending go-live request:', requestData)
      
      // Test JSON serialization before sending to catch any circular reference issues
      try {
        JSON.stringify(requestData)
        console.log('✅ Request data serialization test passed')
      } catch (serializationError) {
        console.error('❌ Request data serialization failed:', serializationError)
        console.error('❌ Problematic data:', requestData)
        throw new Error('Failed to prepare request data: ' + (serializationError instanceof Error ? serializationError.message : String(serializationError)))
      }

      // Use API endpoint for go-live
      const response = await fetch('/api/vendor/go-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start live session');
      }

      const result = await response.json();
      console.log('✅ Go-live successful:', result)
      setLiveSession(result.session)
      alert(t('alerts.startSessionSuccess'))
    } catch (error) {
      console.error('❌ Error starting live session:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error
      })
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert(t('alerts.locationDenied'))
            break
          case error.POSITION_UNAVAILABLE:
            alert(t('alerts.locationUnavailable'))
            break
          case error.TIMEOUT:
            alert(t('alerts.locationTimeout'))
            break
          default:
            alert(t('alerts.unknownLocationError'))
            break
        }
      } else {
        // Show the actual error message for debugging
        alert(`Error: ${error instanceof Error ? error.message : String(error) || t('alerts.startSessionError')}`)
      }
    } finally {
      setIsStartingSession(false)
    }
  }

  const endLiveSession = async () => {
    try {
      console.log('🔄 Starting end live session request...')
      setLoading(true)
      
      if (!vendor) {
        throw new Error('Vendor not found')
      }
      
      console.log('📤 Sending DELETE request to /api/vendor/go-live')
      const response = await fetch('/api/vendor/go-live', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include' // Ensure cookies are sent
      });

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData)
        
        // Show more specific error messages
        const errorMessage = errorData.message || errorData.error || 'Failed to end live session'
        const debugInfo = errorData.debug ? ` (Debug: ${JSON.stringify(errorData.debug)})` : ''
        
        throw new Error(`${errorMessage}${debugInfo}`)
      }

      const result = await response.json()
      console.log('✅ End session successful:', result)
      
      setLiveSession(null)
      
      // Show success message
      const successMessage = result.message || t('alerts.endSessionSuccess') || 'Live session ended successfully!'
      alert(successMessage)
      
      // Refresh vendor data to ensure UI is in sync
      await fetchVendorData()
      
    } catch (error) {
      console.error('❌ Error ending live session:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Show detailed error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to end live session: ${errorMessage}`)
      
    } finally {
      setLoading(false)
    }
  }

  const addAnnouncement = async (announcement: { message: string }) => {
    if (!vendor || !announcement.message) return

    try {
      // Use the new API endpoint instead of direct Supabase access
      const response = await fetch('/api/vendor/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          message: announcement.message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add announcement');
      }

      // Refresh vendor data to show the new announcement
      await fetchVendorData();
      
      // Show success message
      alert(t('alerts.announcementSuccess') || 'Announcement posted successfully!')
      
    } catch (error) {
      console.error('Error adding announcement:', error)
      alert(t('alerts.announcementError') || 'Failed to post announcement. Please try again.')
    }
  }



  const addLocation = async (location: { address: string; latitude: number; longitude: number }) => {
    if (!vendor || !location.address || !supabase) return

    try {
      const { error } = await supabase
        .from('vendor_static_locations')
        .insert({
          vendor_id: vendor.id,
          address: location.address,
          latitude: location.latitude || null,
          longitude: location.longitude || null
        })

      if (error) throw error

      await fetchVendorData()
    } catch (error) {
      console.error('Error adding location:', error)
    }
  }

  const saveProfile = async (profileData: any, profileImageFile: File | null, bannerImageFile: File | null) => {
    if (!vendor) {
      console.error('❌ saveProfile: Missing vendor')
      return
    }

    console.log('🔄 Starting profile save...', {
      vendorId: vendor.id,
      hasProfileImage: !!profileImageFile,
      hasBannerImage: !!bannerImageFile,
      profileData
    })

    setIsSavingProfile(true)
    try {
      // Prepare form data for API call
      const formData = new FormData()
      formData.append('profileData', JSON.stringify(profileData))
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile)
      }
      
      if (bannerImageFile) {
        formData.append('bannerImage', bannerImageFile)
      }

      console.log('📤 Calling profile update API...')
      
      // Call the API route that handles service role authentication
      const response = await fetch('/api/vendor/update-profile', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ API call failed:', result)
        throw new Error(result.error || 'Failed to update profile')
      }

      console.log('✅ Profile updated via API:', result)

      console.log('🔄 Refreshing vendor data...')
      await fetchVendorData()
      console.log('✅ Profile save completed successfully!')

    } catch (error) {
      console.error('❌ Error saving profile:', error)
      alert(t('alerts.profileSaveError') + ': ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-teal mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('notFound.title')}</h1>
          <p className="text-gray-600 mb-4">{t('notFound.description')}</p>
          <button
            onClick={() => router.push('/vendor/onboarding')}
            className="bg-mission-teal text-white px-6 py-2 rounded-md hover:bg-mission-teal/90"
          >
            {t('notFound.button')}
          </button>
        </div>
      </div>
    )
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            vendor={vendor}
            liveSession={liveSession}
            staticLocations={staticLocations}
          />
        )
      case 'profile':
        return (
          <ProfileSection
            vendor={vendor}
            businessTypeKeys={businessTypeKeys}
            onSaveProfile={saveProfile}
            onSwitchToCustomerMode={switchToCustomerMode}
            isSavingProfile={isSavingProfile}
          />
        )
      case 'gallery':
        return <GallerySection vendor={vendor} onVendorUpdate={setVendor} />
      case 'locations':
        return (
          <LocationsSection
            staticLocations={staticLocations}
            onAddLocation={addLocation}
          />
        )
      case 'announcements':
        return (
          <AnnouncementsSection
            announcements={announcements}
            onAddAnnouncement={addAnnouncement}
          />
        )
      case 'live':
        return (
          <LiveSessionSection
            liveSession={liveSession}
            onStartLiveSession={startLiveSession}
            onEndLiveSession={endLiveSession}
            isStartingSession={isStartingSession}
          />
        )
      default:
        return (
          <OverviewSection
            vendor={vendor}
            liveSession={liveSession}
            staticLocations={staticLocations}
          />
        )
    }
  }

  return (
    <DashboardLayout
      vendor={vendor}
      user={user}
      liveSession={liveSession}
      onSignOut={handleSignOut}
      onSwitchToCustomerMode={switchToCustomerMode}
      onStartLiveSession={startLiveSession}
      onEndLiveSession={endLiveSession}
      isStartingSession={isStartingSession}
    >
      {renderActiveSection()}
    </DashboardLayout>
  )
}