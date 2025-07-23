'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { Database } from '@/types/database'
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
      await clientAuth.switchRole(USER_ROLES.CUSTOMER)
      router.push('/')
    } catch (error) {
      console.error('Error switching to customer mode:', error)
      alert('Failed to switch to customer mode. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
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
        const [sessionResult, announcementsResult, locationsResult] = await Promise.all([
          supabase
             .from('vendor_live_sessions')
             .select('*')
             .eq('vendor_id', vendorData.id)
             .is('end_time', null)
             .single(),
          supabase
            .from('vendor_announcements')
            .select('*')
            .eq('vendor_id', vendorData.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('vendor_static_locations')
            .select('*')
            .eq('vendor_id', vendorData.id)
            .order('created_at', { ascending: false })
        ])

        setLiveSession(sessionResult.data)
        setAnnouncements(announcementsResult.data || [])
        setStaticLocations(locationsResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startLiveSession = async (duration?: number | null) => {
    if (!vendor || !supabase) return
    
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
      
      // Verify vendor exists before inserting
      const vendorCheckResult = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      const { data: vendorCheck, error: vendorError } = vendorCheckResult || { data: null, error: null }
      
      if (vendorError || !vendorCheck) {
        console.error('[Live Session] Vendor not found:', vendorError)
        throw new Error('Vendor profile not found. Please complete your vendor onboarding.')
      }
      
      // Check for existing active session using is_active instead of end_time
      const existingSessionResult = await supabase
        .from('vendor_live_sessions')
        .select('id')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)  // ← CHANGE FROM .is('end_time', null)
        .single()
      
      const { data: existingSession } = existingSessionResult || { data: null }

      if (existingSession) {
        throw new Error('You already have an active live session. Please end it before starting a new one.')
      }
      
      const autoEndTime = duration ? 
        new Date(Date.now() + duration * 60 * 1000).toISOString() : null

      const insertResult = await supabase
        .from('vendor_live_sessions')
        .insert({
          vendor_id: vendor.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: address,
          start_time: new Date().toISOString(),
          end_time: null,
          auto_end_time: autoEndTime,
          is_active: true  // ← ADD THIS LINE for clarity
        })
        .select()
        .single()
      
      const { data, error } = insertResult || { data: null, error: null }
      
      if (error) {
        console.log('[Live Session Insert Error]', error?.message, error?.details, error)
        throw error
      }
      
      setLiveSession(data)
      alert(t('alerts.startSessionSuccess'))
    } catch (error) {
      console.error('Error starting live session:', error)
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
        alert(t('alerts.startSessionError'))
      }
    } finally {
      setIsStartingSession(false)
    }
  }

  const endLiveSession = async () => {
    try {
      setLoading(true)
      
      if (!vendor || !supabase) {
        throw new Error('Vendor not found or Supabase client not available')
      }
      
      const { error } = await supabase
        .from('vendor_live_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          ended_by: USER_ROLES.VENDOR,
          is_active: false  // ← ADD THIS LINE
        })
        .eq('vendor_id', vendor.id)
        .is('end_time', null)
      
      if (error) throw error
      
      setLiveSession(null)
      alert(t('alerts.endSessionSuccess'))
    } catch (error) {
      console.error('Error ending live session:', error)
      alert(t('alerts.endSessionError'))
    }
  }

  const addAnnouncement = async (announcement: { message: string }) => {
    if (!vendor || !announcement.message || !supabase) return

    try {
      const { error } = await supabase
        .from('vendor_announcements')
        .insert({
          vendor_id: vendor.id,
          message: announcement.message
        })

      if (error) throw error

      await fetchVendorData()
    } catch (error) {
      console.error('Error adding announcement:', error)
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
    if (!vendor || !supabase) return

    setIsSavingProfile(true)
    try {
      let profileImageUrl = vendor.profile_image_url
      let bannerImageUrl: string | null = null

      // Upload profile image if selected
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop()
        const fileName = `${vendor.id}/profile.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('vendor-images')
          .upload(fileName, profileImageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(fileName)

        profileImageUrl = publicUrl
      }

      // Upload banner image if selected
      if (bannerImageFile) {
        const fileExt = bannerImageFile.name.split('.').pop()
        const fileName = `${vendor.id}/banner.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('vendor-images')
          .upload(fileName, bannerImageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(fileName)

        bannerImageUrl = publicUrl
      }

      // Update vendor profile
       const { error } = await supabase
         .from('vendors')
         .update({
           business_name: profileData.business_name,
           description: profileData.description,
           business_type: profileData.business_type,
           subcategory: profileData.subcategory,
           contact_email: profileData.contact_email,
           phone: profileData.phone,
           profile_image_url: profileImageUrl,
           banner_image_url: bannerImageUrl ? [bannerImageUrl] : (vendor.banner_image_url || [])
         })
         .eq('id', vendor.id)

      if (error) throw error

      await fetchVendorData()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert(t('alerts.profileSaveError'))
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