'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, signOut } from '@/lib/supabase'
import { clientAuth } from '@/lib/auth-helpers'
import { Database } from '@/types/database'
import { SubcategoryInput } from '@/components/SubcategoryInput'
import { getBusinessTypeKeys } from '@/lib/business-types'
import { USER_ROLES } from '@/lib/constants'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row']

type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

export default function VendorDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [liveSession, setLiveSession] = useState<VendorLiveSession | null>(null)
  const [announcements, setAnnouncements] = useState<VendorAnnouncement[]>([])

  const [staticLocations, setStaticLocations] = useState<VendorStaticLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'locations' | 'announcements' | 'live'>('overview')

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ message: '' })
  const [newLocation, setNewLocation] = useState({ address: '', latitude: 0, longitude: 0 })
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [sessionDuration, setSessionDuration] = useState<number | null>(null) // Duration in minutes
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null) // Time remaining in seconds
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    description: '',
    business_type: '',
    subcategory: '',
    contact_email: '',
    phone: ''
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (liveSession?.auto_end_time && liveSession.is_active) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const endTime = new Date(liveSession.auto_end_time!).getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          // Session should have ended, refresh data
          fetchVendorData()
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    } else {
      setTimeRemaining(null)
    }
  }, [liveSession?.auto_end_time, liveSession?.is_active])

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      // Get user profile
      const userProfile = await clientAuth.getUserProfile(authUser.id)
      if (!userProfile) {
        router.push('/')
        return
      }

      if (userProfile.active_role !== USER_ROLES.VENDOR) {
        router.push('/')
        return
      }

      setUser(userProfile)
      fetchVendorData(authUser.id)
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
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  const fetchVendorData = async (userId?: string) => {
    const currentUserId = userId || user?.id
    if (!currentUserId) return

    try {
      // Fetch vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUserId)
        .single()

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError)
        // If no vendor profile exists, redirect to onboarding
        if (vendorError.code === 'PGRST116') {
          router.push('/vendor/onboarding')
          return
        }
      } else {
        setVendor(vendorData)
        
        // Initialize profile form with vendor data
         setProfileForm({
           business_name: vendorData.business_name || '',
           description: vendorData.description || '',
           business_type: vendorData.business_type || '',
           subcategory: vendorData.subcategory || '',
           contact_email: vendorData.contact_email || '',
           phone: vendorData.phone || ''
         })

        // Fetch active live session
        const { data: sessionData } = await supabase
          .from('vendor_live_sessions')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .eq('is_active', true)
          .single()

        setLiveSession(sessionData)

        // Fetch announcements
        const { data: announcementsData } = await supabase
          .from('vendor_announcements')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false })

        setAnnouncements(announcementsData || [])

        // Fetch static locations
        const { data: locationsData } = await supabase
          .from('vendor_static_locations')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false })

        setStaticLocations(locationsData || [])
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startLiveSession = async () => {
    if (!vendor) return
    
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
      const { data: vendorCheck, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (vendorError || !vendorCheck) {
        console.error('[Live Session] Vendor not found:', vendorError)
        throw new Error('Vendor profile not found. Please complete your vendor onboarding.')
      }
      
      // Check for existing active session to prevent duplicates
      const { data: existingSession } = await supabase
        .from('vendor_live_sessions')
        .select('id')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .single()
      
      if (existingSession) {
        throw new Error('You already have an active live session. Please end it before starting a new one.')
      }
      
      const autoEndTime = sessionDuration ? 
        new Date(Date.now() + sessionDuration * 60 * 1000).toISOString() : null

      const { data, error } = await supabase
        .from('vendor_live_sessions')
        .insert({
          vendor_id: vendor.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: address,
          start_time: new Date().toISOString(),
          end_time: null, // Set to null for active sessions
          is_active: true,
          auto_end_time: autoEndTime
        })
        .select()
        .single()
      
      if (error) {
        console.log('[Live Session Insert Error]', error?.message, error?.details, error)
        throw error
      }
      
      setLiveSession(data)
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
    } finally {
      setIsStartingSession(false)
    }
  }

  const endLiveSession = async () => {
    try {
      setLoading(true)
      
      if (!vendor) {
        throw new Error('Vendor not found')
      }
      
      const { error } = await supabase
        .from('vendor_live_sessions')
        .update({ 
          is_active: false,
          end_time: new Date().toISOString(),
          ended_by: USER_ROLES.VENDOR
        })
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
      
      if (error) throw error
      
      setLiveSession(null)
      alert('Live session ended successfully!')
    } catch (error) {
      console.error('Error ending live session:', error)
      alert('Failed to end live session. Please try again.')
    }
  }

  const addAnnouncement = async () => {
    if (!vendor || !newAnnouncement.message) return

    try {
      const { error } = await supabase
        .from('vendor_announcements')
        .insert({
          vendor_id: vendor.id,
          message: newAnnouncement.message
        })

      if (error) throw error

      setNewAnnouncement({ message: '' })
      await fetchVendorData()
    } catch (error) {
      console.error('Error adding announcement:', error)
    }
  }



  const addLocation = async () => {
    if (!vendor || !newLocation.address) return

    try {
      const { error } = await supabase
        .from('vendor_static_locations')
        .insert({
          vendor_id: vendor.id,
          address: newLocation.address,
          latitude: newLocation.latitude || null,
          longitude: newLocation.longitude || null
        })

      if (error) throw error

      setNewLocation({ address: '', latitude: 0, longitude: 0 })
      await fetchVendorData()
    } catch (error) {
      console.error('Error adding location:', error)
    }
  }

  const saveProfile = async () => {
    if (!vendor) return

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
           business_name: profileForm.business_name,
           description: profileForm.description,
           business_type: profileForm.business_type,
           subcategory: profileForm.subcategory,
           contact_email: profileForm.contact_email,
           phone: profileForm.phone,
           profile_image_url: profileImageUrl,
           banner_image_url: bannerImageUrl ? [bannerImageUrl] : (vendor.banner_image_url || [])
         })
         .eq('id', vendor.id)

      if (error) throw error

      setIsEditingProfile(false)
      setProfileImageFile(null)
      setBannerImageFile(null)
      await fetchVendorData()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Profile Not Found</h1>
          <p className="text-gray-600 mb-4">Please complete your vendor onboarding first.</p>
          <button
            onClick={() => router.push('/vendor/onboarding')}
            className="bg-mission-teal text-white px-6 py-2 rounded-md hover:bg-mission-teal/90"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'locations', label: 'Locations' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'live', label: 'Live Session' }
  ] as const

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF2E3' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="fluid-container">
          <div className="flex justify-between items-center fluid-spacing-sm">
            <div>
              <h1 className="fluid-text-2xl font-semibold" style={{ color: '#222222' }}>{vendor.business_name}</h1>
              <p className="fluid-text-base" style={{ color: '#777777' }}>{vendor.subcategory}</p>
            </div>
            <div className="flex items-center space-x-4">
              {liveSession ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Live Now</span>
                  <button
                    onClick={endLiveSession}
                    className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#DC2626', color: '#FBF2E3' }}
                  >
                    End Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={startLiveSession}
                  disabled={isStartingSession}
                  className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#D85D28', color: '#FBF2E3' }}
                >
                  {isStartingSession ? 'Starting...' : 'Go Live'}
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity border border-gray-300"
                style={{ backgroundColor: '#ffffff', color: '#DC2626' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="fluid-container">
          <nav className="flex fluid-gap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                style={{
                  color: activeTab === tab.id ? '#D85D28' : '#444444',
                  borderBottomColor: activeTab === tab.id ? '#D85D28' : 'transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="fluid-container fluid-spacing-md">
        {activeTab === 'overview' && (
          <div className="fluid-grid">
            {/* Stats Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Rating</h3>
              <div className="fluid-text-2xl font-bold" style={{ color: '#3A938A' }}>
                0.0
              </div>
              <p className="fluid-text-sm" style={{ color: '#777777' }}>No reviews yet</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Status</h3>
              <div className={`fluid-text-2xl font-bold`}
                   style={{ color: liveSession ? '#3A938A' : '#777777' }}>
                {liveSession ? 'Live' : 'Offline'}
              </div>
              <p className="fluid-text-sm" style={{ color: '#777777' }}>
                {liveSession ? 'Currently serving customers' : 'Not currently active'}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Locations</h3>
              <div className="fluid-text-2xl font-bold" style={{ color: '#3A938A' }}>
                {staticLocations.length}
              </div>
              <p className="fluid-text-sm" style={{ color: '#777777' }}>Saved locations</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Business Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#3A938A', color: '#FBF2E3' }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={saveProfile}
                      disabled={isSavingProfile}
                      className="px-4 py-2 rounded-xl font-semibold bg-[#3A938A] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false)
                        setProfileForm({
                           business_name: vendor?.business_name || '',
                           description: vendor?.description || '',
                           business_type: vendor?.business_type || '',
                           subcategory: vendor?.subcategory || '',
                           contact_email: vendor?.contact_email || '',
                           phone: vendor?.phone || ''
                         })
                        setProfileImageFile(null)
                        setBannerImageFile(null)
                      }}
                      className="px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:opacity-80 transition-opacity"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingProfile ? (
                <div className="space-y-4">
                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Profile Image</label>
                    <div className="flex items-center space-x-4">
                      {vendor?.profile_image_url && (
                        <img
                          src={vendor.profile_image_url}
                          alt="Current profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <input
                         type="file"
                         accept="image/*"
                         onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mission-teal file:text-white hover:file:bg-mission-teal/90"
                         aria-label="Upload profile image"
                       />
                    </div>
                  </div>
                  
                  {/* Banner Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Banner Image</label>
                    <div className="space-y-2">
                      {vendor?.banner_image_url && vendor.banner_image_url.length > 0 && (
                       <img
                         src={vendor.banner_image_url[0]}
                         alt="Current banner"
                         className="w-full h-32 rounded-lg object-cover"
                       />
                     )}
                      <input
                         type="file"
                         accept="image/*"
                         onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)}
                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mission-teal file:text-white hover:file:bg-mission-teal/90"
                         aria-label="Upload banner image"
                       />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label htmlFor="business-name" className="block text-sm font-medium text-gray-500 mb-2">Business Name</label>
                       <input
                         id="business-name"
                         type="text"
                         value={profileForm.business_name}
                         onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))}
                         className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                         placeholder="Enter your business name"
                       />
                     </div>
                     <div>
                       <label htmlFor="business-type" className="block text-sm font-medium text-gray-500 mb-2">Business Type</label>
                       <select
                         id="business-type"
                         value={profileForm.business_type}
                         onChange={(e) => setProfileForm(prev => ({ ...prev, business_type: e.target.value, subcategory: '' }))}
                         className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                       >
                         <option value="">Select business type</option>
                         {getBusinessTypeKeys().map(type => (
                           <option key={type} value={type}>{type}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                   
                   <div className="mt-4">
                     <label htmlFor="subcategory" className="block text-sm font-medium text-gray-500 mb-2">Subcategory</label>
                     <SubcategoryInput
                       businessType={profileForm.business_type}
                       value={profileForm.subcategory}
                       onChange={(value) => setProfileForm(prev => ({ ...prev, subcategory: value }))}
                       className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                       placeholder="e.g., Street Tacos, Vintage, Zines"
                     />
                   </div>
                   
                   <div className="mt-4">
                     <label htmlFor="description" className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                     <textarea
                       id="description"
                       rows={3}
                       value={profileForm.description}
                       onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                       className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                       placeholder="Tell customers about your business..."
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <label htmlFor="contact-email" className="block text-sm font-medium text-gray-500 mb-2">Contact Email</label>
                       <input
                         id="contact-email"
                         type="email"
                         value={profileForm.contact_email}
                         onChange={(e) => setProfileForm(prev => ({ ...prev, contact_email: e.target.value }))}
                         className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                         placeholder="your@email.com"
                       />
                     </div>
                     <div>
                       <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-2">Phone</label>
                       <input
                         id="phone"
                         type="tel"
                         value={profileForm.phone}
                         onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                         className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                         placeholder="(555) 123-4567"
                       />
                     </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display Images */}
                  <div className="flex space-x-6">
                    {vendor?.profile_image_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                        <img
                          src={vendor.profile_image_url}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      </div>
                    )}
                    {vendor?.banner_image_url && vendor.banner_image_url.length > 0 && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                        <img
                          src={vendor.banner_image_url[0]}
                          alt="Banner"
                          className="w-full h-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Business Name</label>
                      <p style={{ color: '#222222' }}>{vendor?.business_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Business Type</label>
                      <p style={{ color: '#222222' }}>{vendor?.business_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Subcategory</label>
                      <p style={{ color: '#222222' }}>{vendor?.subcategory || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Description</label>
                      <p style={{ color: '#222222' }}>{vendor?.description || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Contact Email</label>
                      <p style={{ color: '#222222' }}>{vendor?.contact_email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Phone</label>
                      <p style={{ color: '#222222' }}>{vendor?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}            </div>
            
            {/* Role Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Management</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Current Role</label>
                  <p style={{ color: '#222222' }}>Vendor</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Switch to customer mode to browse and discover other vendors in your area.
                  </p>
                  <button
                     onClick={switchToCustomerMode}
                     className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                     style={{ backgroundColor: '#3A938A', color: '#FBF2E3' }}
                   >
                     Switch to Customer Mode
                   </button>
                </div>
              </div>
            </div>          </div>        )}

        {activeTab === 'locations' && (
          <div className="space-y-6">
            {/* Add Location Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="px-3 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal"
                />

              </div>
              <button
                onClick={addLocation}
                className="mt-4 bg-mission-teal text-white px-4 py-2 rounded-md hover:bg-mission-teal/90"
              >
                Add Location
              </button>
            </div>

            {/* Locations List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Your Locations</h2>
              </div>
              <div className="divide-y">
                {staticLocations.map((location) => (
                  <div key={location.id} className="p-6">
                    <p className="text-gray-600">{location.address || 'No address provided'}</p>
                    <p className="text-sm text-gray-500 mt-1">Static location</p>
                  </div>
                ))}
                {staticLocations.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No locations added yet. Add your first location above.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Add Announcement Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Announcement</h2>
              <div className="space-y-4">
                <textarea
                  placeholder="Announcement content"
                  rows={3}
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal"
                />
                <button
                  onClick={addAnnouncement}
                  className="bg-mission-teal text-white px-4 py-2 rounded-md hover:bg-mission-teal/90"
                >
                  Post Announcement
                </button>
              </div>
            </div>

            {/* Announcements List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Your Announcements</h2>
              </div>
              <div className="divide-y">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-6">
                    <p className="text-gray-600 mt-1">{announcement.message || 'No Message'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                          {announcement.created_at && new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No announcements yet. Create your first announcement above.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {activeTab === 'live' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#3A938A' }}>Live Session Management</h2>
            
            {liveSession ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium text-lg">You are currently live!</span>
                  {timeRemaining !== null && (
                    <span className="text-orange-600 font-medium">
                      ⏳ Ending in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
                    <p className="text-gray-600">Started: {new Date(liveSession.start_time).toLocaleString()}</p>
                    <p className="text-gray-600">Location: {liveSession.address || 'Location not specified'}</p>
                    <p className="text-gray-600">Coordinates: {liveSession.latitude?.toFixed(4)}, {liveSession.longitude?.toFixed(4)}</p>
                    {liveSession.auto_end_time && (
                      <p className="text-gray-600">Auto-end: {new Date(liveSession.auto_end_time).toLocaleString()}</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Actions</h3>
                    <button
                      onClick={endLiveSession}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      End Live Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Live Session</h3>
                <p className="text-gray-600 mb-6">
                  Go live to let customers know you're open and ready to serve!
                </p>
                
                <div className="mb-6">
                   <label htmlFor="session-duration" className="block text-sm font-medium text-gray-700 mb-2">
                     Session Duration (Optional)
                   </label>
                   <select
                     id="session-duration"
                     value={sessionDuration || ''}
                     onChange={(e) => setSessionDuration(e.target.value ? parseInt(e.target.value) : null)}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal"
                   >
                    <option value="">No time limit</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                  {sessionDuration && (
                    <p className="text-sm text-gray-500 mt-1">
                      Session will automatically end in {sessionDuration} minutes
                    </p>
                  )}
                </div>
                
                <button
                  onClick={startLiveSession}
                  disabled={isStartingSession}
                  className="px-6 py-3 rounded-xl font-semibold text-sm uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#D85D28', color: '#FBF2E3' }}
                >
                  {isStartingSession ? 'Starting Live Session...' : 'Go Live Now'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}