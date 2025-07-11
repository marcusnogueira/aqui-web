'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { MapPin, Search, Star, Clock, Users, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-manager'
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
  const { theme, toggleTheme, themeIcon } = useTheme()
  const [mounted, setMounted] = useState(false)
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
  const [isLocating, setIsLocating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(40) // percentage - for manual resize only

  const supabase = createClient()

  // Handle mouse and touch events for fluid resizing
  useEffect(() => {
    const getClientX = (e: MouseEvent | TouchEvent) => {
      return 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      
      const container = document.querySelector('main')
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const clientX = getClientX(e)
      const newWidth = ((clientX - rect.left) / rect.width) * 100
      
      // Fluid constraints with smooth transitions
      const constrainedWidth = Math.max(15, Math.min(85, newWidth))
      setLeftPanelWidth(constrainedWidth)
    }
    
    const handleEnd = () => {
      setIsDragging(false)
    }
    
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
      // Touch events
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.body.style.touchAction = 'none'
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging])

  // Function to request user location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setIsLocating(true)
    
    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(newLocation)
        setIsLocating(false)
        toast.success('Location updated successfully')
      },
      (error) => {
        console.error('High accuracy location failed:', error)
        
        // If high accuracy fails due to timeout, try with lower accuracy
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setUserLocation(newLocation)
              setIsLocating(false)
              toast.success('Location updated successfully (approximate)')
            },
            (fallbackError) => {
              console.error('Fallback location failed:', fallbackError)
              setIsLocating(false)
              
              let errorMessage = 'Unable to get your location'
              if (fallbackError.code === fallbackError.PERMISSION_DENIED) {
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
              } else if (fallbackError.code === fallbackError.POSITION_UNAVAILABLE) {
                errorMessage = 'Location information is unavailable. Please check your GPS or network connection.'
              } else if (fallbackError.code === fallbackError.TIMEOUT) {
                errorMessage = 'Location request timed out. Please try again or check your GPS signal.'
              }
              
              toast.error(errorMessage)
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 600000
            }
          )
        } else {
          setIsLocating(false)
          
          let errorMessage = 'Unable to get your location'
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable. Please check your GPS or network connection.'
          }
          
          toast.error(errorMessage)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    )
  }

  // Handle mounting for next-themes
  useEffect(() => {
    setMounted(true)
  }, [])

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
        
        // Note: Removed automatic vendor dashboard redirect
        // Users should manually navigate via profile menu
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Default to San Francisco location
  useEffect(() => {
    // Always start with San Francisco as default
    // Users can manually request their location using the location button
    setUserLocation({ lat: 37.7749, lng: -122.4194 })
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
    const handleRealtimeUpdate = async (payload: any) => {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (mounted) {
                  toggleTheme()
                }
              }}
              title="Toggle theme"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="fluid-text-2xl font-bold text-primary">Aqui</h1>
              {mounted && (
                <span className="text-lg" role="img" aria-label="theme toggle">
                  {themeIcon}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
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
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="fluid-container fluid-spacing-sm">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('search.placeholder')}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="fluid-container py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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

      {/* View Toggle - Prominent above map */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="fluid-container py-3">
          <div className="flex items-center justify-center">
            <div className="flex bg-muted rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'map'
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Map View</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>List View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fluid responsive layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Vendor List */}
        <div 
          className={`flex flex-col bg-background border-r border-border transition-all duration-300 ease-out ${
            viewMode === 'list' ? 'w-full lg:block' : 'hidden lg:flex'
          }`}
          style={{ 
            width: viewMode === 'map' ? `clamp(20%, ${leftPanelWidth}%, 80%)` : '100%',
            minWidth: viewMode === 'map' ? '300px' : 'auto',
            maxWidth: viewMode === 'map' ? '80vw' : '100%'
          }}
        >
          {/* Results Header */}
          <div className="fluid-spacing-sm border-b border-border">
            <div className="flex items-center justify-between fluid-gap">
              <h2 className="fluid-text-lg font-semibold text-foreground">
                {displayedVendors.length} vendors found
              </h2>
              <div className="flex items-center space-x-2">
 
              </div>
            </div>
          </div>

          {/* Vendor Cards List */}
          <div className="flex-1 overflow-y-auto">
            {displayedVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t('search.noResults')}</h3>
                <p className="text-muted-foreground text-center px-6">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="fluid-spacing-sm space-y-4">
                {displayedVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-card rounded-lg border border-border hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden container-responsive"
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
                      <div className="relative w-24 h-24 bg-muted flex-shrink-0">
                        {vendor.profile_image_url ? (
                          <img
                            src={vendor.profile_image_url}
                            alt={vendor.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
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
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{vendor.business_name}</h3>
                          {vendor.average_rating && vendor.total_reviews && vendor.total_reviews > 0 && (
                            <div className="flex items-center space-x-1 ml-2">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs font-medium text-foreground">
                                {vendor.average_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {vendor.subcategory && (
                          <p className="text-xs text-muted-foreground mb-1">{vendor.subcategory}</p>
                        )}
                        
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{vendor.description}</p>
                        )}
                        
                        {vendor.live_session && (
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
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

        {/* Fluid Resizer - enhanced for touch and accessibility */}
        <div 
          className={`w-2 bg-border hover:bg-primary cursor-col-resize flex-shrink-0 relative group transition-all duration-300 ease-out ${
            viewMode === 'list' ? 'hidden' : 'hidden lg:block'
          } touch-action-none`}
          onMouseDown={(e) => {
            setIsDragging(true)
            e.preventDefault()
          }}
          onTouchStart={(e) => {
            setIsDragging(true)
            e.preventDefault()
          }}
          role="separator"
          aria-label="Resize panels"
          tabIndex={0}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-primary group-hover:bg-opacity-20 transition-all duration-200"></div>
          {/* Enhanced drag indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-100 transition-all duration-200">
            <div className="flex flex-col space-y-1">
              <div className="w-1 h-2 bg-muted-foreground group-hover:bg-primary-foreground rounded-full transition-colors"></div>
              <div className="w-1 h-2 bg-muted-foreground group-hover:bg-primary-foreground rounded-full transition-colors"></div>
              <div className="w-1 h-2 bg-muted-foreground group-hover:bg-primary-foreground rounded-full transition-colors"></div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div 
          className={`relative transition-all duration-300 ease-out ${
            viewMode === 'list' ? 'hidden' : 'w-full lg:block'
          }`}
          style={{ 
            width: viewMode === 'map' ? `clamp(20%, ${100 - leftPanelWidth}%, 80%)` : '100%',
            minWidth: viewMode === 'map' ? '300px' : 'auto',
            flex: viewMode === 'map' ? '1 1 auto' : 'none'
          }}
        >
          <div className="h-full">
            <VendorMap
              vendors={filteredVendors}
              userLocation={userLocation || undefined}
              onVendorClick={handleVendorClick}
              onMapBoundsChange={handleMapBoundsChange}
              onLocationRequest={requestUserLocation}
              isLocating={isLocating}
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