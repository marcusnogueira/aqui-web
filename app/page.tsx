'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { MapPin, Search, Star, Clock, Users } from 'lucide-react'
import VendorMap from '@/components/VendorMap'
import { VendorCard } from '@/components/VendorCard'
import { SearchBar } from '@/components/SearchBar'
import { Navigation } from '@/components/Navigation'
import { AuthModal } from '@/components/AuthModal'
import { createClient } from '@/lib/supabase'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'
import toast from 'react-hot-toast'

import { VendorWithLiveSession } from '@/types/vendor'
import { getVendorStatus, extractCoordinatesFromVendor } from '@/lib/vendor-utils'

type Vendor = VendorWithLiveSession

export default function HomePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [mapBounds, setMapBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null)
  const [displayedVendors, setDisplayedVendors] = useState<Vendor[]>([])

  const supabase = createClient()

  // Check authentication and handle role-based routing
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const userProfile = await clientAuth.getUserProfile(authUser.id)
        setUser(userProfile)
        
        // If user is a vendor, redirect to vendor dashboard
        if (userProfile?.active_role === USER_ROLES.VENDOR) {
          router.push('/vendor/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to San Francisco if location access denied
          setUserLocation({ lat: 37.7749, lng: -122.4194 })
        }
      )
    } else {
      // Default location if geolocation not supported
      setUserLocation({ lat: 37.7749, lng: -122.4194 })
    }
  }, [])

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // First, get active live sessions
        const { data: liveSessionsData, error: sessionsError } = await supabase
          .from('vendor_live_sessions')
          .select('*')
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        if (sessionsError) {
          console.error('Error fetching live sessions:', sessionsError)
          toast.error('Failed to load live sessions')
          return
        }

        if (!liveSessionsData || liveSessionsData.length === 0) {
          setVendors([])
          setFilteredVendors([])
          setLoadingVendors(false)
          return
        }

        // Get vendor IDs from live sessions (filter out null values)
        const vendorIds = liveSessionsData
          .map(session => session.vendor_id)
          .filter((id): id is string => id !== null)

        // Then get vendors for those IDs (only approved and active vendors)
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('*')
          .in('id', vendorIds)
          .eq('is_approved', true)
          .eq('is_active', true)

        if (vendorsError) {
          console.error('Error fetching vendors:', vendorsError)
          toast.error('Failed to load vendors')
          return
        }

        // Combine vendors with their live sessions
        const formattedVendors = vendorsData?.map(vendor => {
          const liveSession = liveSessionsData.find(session => session.vendor_id === vendor.id)
          return {
            ...vendor,
            live_session: liveSession || null
          }
        }) || []

        setVendors(formattedVendors)
        setFilteredVendors(formattedVendors)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Failed to load vendors')
      } finally {
        setLoadingVendors(false)
      }
    }

    fetchVendors()

    // Set up real-time subscription for vendor updates
    const handleRealtimeUpdate = async (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT') {
        const { data: vendorData, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', newRecord.vendor_id)
          .eq('is_approved', true)
          .eq('is_active', true)
          .single()

        if (error) {
          console.error('Error fetching new vendor:', error)
          return
        }

        if (vendorData) {
          const newVendor = { ...vendorData, live_session: newRecord }
          setVendors(currentVendors => [...currentVendors, newVendor])
        }
      } else if (eventType === 'UPDATE') {
        if (!newRecord.is_active) {
          // If session becomes inactive, remove the vendor
          setVendors(currentVendors => currentVendors.filter(v => v.id !== newRecord.vendor_id))
        } else {
          // If session is updated (e.g., location change), update the vendor's session
          setVendors(currentVendors =>
            currentVendors.map(v =>
              v.id === newRecord.vendor_id ? { ...v, live_session: newRecord } : v
            )
          )
        }
      } else if (eventType === 'DELETE') {
        setVendors(currentVendors => currentVendors.filter(v => v.id !== oldRecord.vendor_id))
      }
    }

    const channel = supabase
      .channel('vendor-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_live_sessions',
        },
        handleRealtimeUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter vendors based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors)
      return
    }

    const filtered = vendors.filter(vendor =>
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setFilteredVendors(filtered)

    // Log search
    if (user && searchQuery.trim()) {
      supabase
        .from('search_logs')
        .insert({
          user_id: user.id,
          query: searchQuery,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        })
        .then(({ error }) => {
          if (error) console.error('Error logging search:', error)
        })
    }
  }, [searchQuery, vendors, user, userLocation])

  // Filter vendors based on map bounds
  useEffect(() => {
    if (!mapBounds) {
      setDisplayedVendors(filteredVendors)
      return
    }

    const boundsFiltered = filteredVendors.filter(vendor => {
      if (!vendor.live_session || 
          typeof vendor.live_session.latitude !== 'number' || 
          typeof vendor.live_session.longitude !== 'number') {
        return false
      }

      const lat = vendor.live_session.latitude
      const lng = vendor.live_session.longitude
      
      return lat >= mapBounds.south && lat <= mapBounds.north &&
             lng >= mapBounds.west && lng <= mapBounds.east
    })

    setDisplayedVendors(boundsFiltered)
  }, [filteredVendors, mapBounds])

  // Handle map bounds change
  const handleMapBoundsChange = (bounds: {north: number, south: number, east: number, west: number}) => {
    setMapBounds(bounds)
  }

  const handleVendorClick = (vendorId: string) => {
    // Log vendor click
    if (user && searchQuery.trim()) {
      supabase
        .from('search_logs')
        .update({ vendor_clicked: vendorId })
        .eq('user_id', user.id)
        .eq('query', searchQuery)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ error }) => {
          if (error) console.error('Error updating search log:', error)
        })
    }
    
    // Navigate to vendor profile
    router.push(`/vendor/${vendorId}`)
  }



  if (loading || loadingVendors) {
    return (
      <div className="min-h-screen bg-market-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-teal mx-auto mb-4"></div>
          <p className="text-bay-cypress font-medium">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mission-teal rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-chili-orange">AQUI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-mission-teal text-white px-4 py-2 rounded-lg font-medium hover:bg-bay-cypress transition-colors"
                >
                  {t('auth.signIn')}
                </button>
              ) : (
                <Navigation />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('search.placeholder')}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{displayedVendors.filter(v => getVendorStatus(v) === 'open').length} {t('vendor.status.open')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>{displayedVendors.filter(v => getVendorStatus(v) === 'closing').length} {t('vendor.status.closing')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{displayedVendors.length} vendors found</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Airbnb-style dual pane layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Vendor List */}
        <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col bg-white border-r border-gray-200">
          {/* Results Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {displayedVendors.length} vendors found
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors lg:hidden ${
                    viewMode === 'list'
                      ? 'bg-white text-mission-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors lg:hidden ${
                    viewMode === 'map'
                      ? 'bg-white text-mission-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>
          </div>

          {/* Vendor Cards List */}
          <div className="flex-1 overflow-y-auto">
            {displayedVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Search className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.noResults')}</h3>
                <p className="text-gray-600 text-center px-6">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {displayedVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => handleVendorClick(vendor.id)}
                    onMouseEnter={() => {
                      // Highlight marker on map when hovering card
                      const event = new CustomEvent('highlightVendor', { detail: { vendorId: vendor.id } })
                      window.dispatchEvent(event)
                    }}
                    onMouseLeave={() => {
                      // Remove highlight when leaving card
                      const event = new CustomEvent('unhighlightVendor', { detail: { vendorId: vendor.id } })
                      window.dispatchEvent(event)
                    }}
                  >
                    <div className="flex">
                      {/* Image */}
                      <div className="relative w-24 h-24 bg-gray-200 flex-shrink-0">
                        {vendor.profile_image_url ? (
                          <img
                            src={vendor.profile_image_url}
                            alt={vendor.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-2xl">🍽️</div>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-1 left-1">
                          <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-white text-xs font-medium ${
                            getVendorStatus(vendor) === 'open' ? 'bg-green-500' :
                            getVendorStatus(vendor) === 'closing' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            <span className="text-xs">
                              {getVendorStatus(vendor) === 'open' ? 'Open' :
                               getVendorStatus(vendor) === 'closing' ? 'Closing' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{vendor.business_name}</h3>
                          {vendor.average_rating && vendor.total_reviews && vendor.total_reviews > 0 && (
                            <div className="flex items-center space-x-1 ml-2">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs font-medium text-gray-900">
                                {vendor.average_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {vendor.subcategory && (
                          <p className="text-xs text-gray-600 mb-1">{vendor.subcategory}</p>
                        )}
                        
                        {vendor.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{vendor.description}</p>
                        )}
                        
                        {vendor.live_session && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Live session active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map (hidden on mobile when list view is selected) */}
        <div className={`flex-1 relative ${
          viewMode === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="h-full">
            <VendorMap
              vendors={filteredVendors}
              userLocation={userLocation || undefined}
              onVendorClick={handleVendorClick}
              onMapBoundsChange={handleMapBoundsChange}
            />
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}