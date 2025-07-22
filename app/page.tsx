'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { MapPin, Search, Star, Clock, Users } from 'lucide-react'
import VendorMap from '@/components/VendorMap'
import VendorCardOptimized from '@/components/VendorCardOptimized'
import { SearchBar } from '@/components/SearchBar'
import { Navigation } from '@/components/Navigation'
import AuthModal from '@/components/AuthModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'
import { showToast } from '@/lib/toast'
import { useLiveVendors } from '@/lib/hooks/useLiveVendors'
import { useSession } from 'next-auth/react'

import { VendorWithLiveSession } from '@/types/vendor'
import { getVendorStatus, extractCoordinatesFromVendor } from '@/lib/vendor-utils'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

type Vendor = VendorWithLiveSession

export default function HomePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [mapBounds, setMapBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null)
  const [highlightedVendor, setHighlightedVendor] = useState<string | null>(null)

  const [isLocating, setIsLocating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(40) // percentage - for manual resize only

  const supabase = createClient()
  
  // Use the custom hook for vendor data fetching and real-time updates
  const vendorData = useLiveVendors({
    searchQuery,
    userLocation,
    mapBounds,
    enabled: !loading // Only fetch vendors after auth check is complete
  })
  
  const { vendors = [], isLoading: loadingVendors = false, error: vendorsError = null, mutate: refreshVendors = () => {} } = vendorData || {}

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
      showToast.error('Geolocation is not supported by this browser')
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
        showToast.success('Location updated successfully')
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
              showToast.success('Location updated successfully (approximate)')
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
              
              showToast.error(errorMessage)
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
          
          showToast.error(errorMessage)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    )
  }

  // Check authentication and handle role-based routing
  useEffect(() => {
    if (status === 'loading') return
    checkAuth()
  }, [session, status])

  const checkAuth = async () => {
    try {
      if (session?.user) {
        const userProfileResult = await clientAuth.getUserProfile(session.user.id!)
        if (userProfileResult.success && userProfileResult.data) {
          setUser(userProfileResult.data)
        }
        
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

  // Handle vendor errors from the custom hook
  useEffect(() => {
    if (vendorsError) {
      console.error('Vendor fetch error:', vendorsError)
      showToast.error('Failed to load vendors')
    }
  }, [vendorsError])



  // Vendors are already filtered server-side, no need for additional client-side filtering

  // Handle map bounds change
  const handleMapBoundsChange = useCallback((bounds: {north: number, south: number, east: number, west: number}) => {
    setMapBounds(bounds)
  }, [])

  const handleVendorClick = useCallback((vendorId: string) => {
    router.push(`/vendor/${vendorId}`)
  }, [router])



  if (status === 'loading' || loading || loadingVendors) {
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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="fluid-text-2xl font-bold text-primary">Aqui</h1>
              <LanguageSwitcher />
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/about" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  About
                </Link>
                <Link 
                  href="/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  FAQ
                </Link>
                <Link 
                  href="/fund" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Fund
                </Link>
              </nav>
              
              {/* Theme Toggle and Auth Section */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />
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
                <span>{(vendors || []).filter(v => getVendorStatus(v) === 'open').length} {t('vendor.status.open')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>{(vendors || []).filter(v => getVendorStatus(v) === 'closing').length} {t('vendor.status.closing')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{(vendors || []).length} vendors found</span>
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
                {(vendors || []).length} vendors found
              </h2>
              <div className="flex items-center space-x-2">
 
              </div>
            </div>
          </div>

          {/* Vendor Cards List */}
          <div className="flex-1 overflow-y-auto">
            {!vendors || vendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t('search.noResults')}</h3>
                <p className="text-muted-foreground text-center px-6">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="fluid-spacing-sm space-y-4">
                {(vendors || []).map((vendor) => (
                  <VendorCardOptimized
                    key={vendor.id}
                    vendor={vendor}
                    onClick={handleVendorClick}
                    onMouseEnter={(vendorId) => {
                       setHighlightedVendor(vendorId)
                       // Highlight marker on map when hovering card
                       const event = new CustomEvent('highlightVendor', { detail: { vendorId } })
                       window.dispatchEvent(event)
                     }}
                     onMouseLeave={() => {
                       setHighlightedVendor(null)
                       // Remove highlight when leaving card
                       const event = new CustomEvent('unhighlightVendor')
                       window.dispatchEvent(event)
                     }}
                  />
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
              vendors={vendors}
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
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}