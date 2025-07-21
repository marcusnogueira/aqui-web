'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { MapPin, Search, Star, Clock, Users, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-manager'
import VendorMap from '@/components/VendorMap'
import VendorCardOptimized from '@/components/VendorCardOptimized'
import { SearchBar } from '@/components/SearchBar'
import { Navigation } from '@/components/Navigation'
import AuthModal from '@/components/AuthModal'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'
import toast from 'react-hot-toast'
import { useLiveVendors } from '@/lib/hooks/useLiveVendors'
import { useSession } from 'next-auth/react'

import { VendorWithLiveSession } from '@/types/vendor'
import { getVendorStatus, extractCoordinatesFromVendor } from '@/lib/vendor-utils'

type Vendor = VendorWithLiveSession

export default function HomePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { theme, toggleTheme, themeIcon } = useTheme()
  const { data: session } = useSession()
  
  // Simple state - no complex initialization
  const [mounted, setMounted] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({ lat: 37.7749, lng: -122.4194 })
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [highlightedVendor, setHighlightedVendor] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(40)

  // ULTRA-STABLE vendor params - ONLY search query
  const vendorParams = useMemo(() => ({
    searchQuery: searchQuery.trim(),
    enabled: true
  }), [searchQuery.trim()])

  // Use the hook for vendor data - NO real-time updates to prevent refresh loops
  const { vendors, isLoading: loadingVendors, error: vendorsError, mutate: refreshVendors } = useLiveVendors(vendorParams)

  // Update user state whenever session changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (session?.user) {
        try {
          const result = await clientAuth.getUserProfile(session.user.id!)
          if (result.success && result.data) {
            setUser(result.data)
          }
        } catch (error) {
          console.error('Auth check error:', error)
        }
      } else {
        // Reset user state when session is null
        setUser(null)
      }
    }
    loadUserProfile()
  }, [session?.user?.id]) // Only depend on session user ID

  // Handle location request - NO useEffect, just direct handler
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setIsLocating(true)
    
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
        setIsLocating(false)
        let errorMessage = 'Unable to get your location'
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location permissions.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.'
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.'
        }
        toast.error(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    )
  }, [])

  // Handle map bounds change - COMPLETELY DISABLED to prevent refresh loops
  const handleMapBoundsChange = useCallback((bounds: any) => {
    // DO NOTHING - map bounds changes should NOT trigger API calls
    console.log('Map bounds changed (ignored to prevent refresh loops):', bounds)
  }, [])

  // Handle vendor click
  const handleVendorClick = useCallback((vendorId: string) => {
    router.push(`/vendor/${vendorId}`)
  }, [router])

  // FIXED: Handle drag events without closure bug
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('main')
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      const constrainedWidth = Math.max(15, Math.min(85, newWidth))
      setLeftPanelWidth(constrainedWidth)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // Show error if vendors failed to load - NO useEffect
  if (vendorsError) {
    console.error('Vendor fetch error:', vendorsError)
  }

  // Loading state
  if (loadingVendors) {
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

      {/* View Toggle */}
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

      {/* Main Content */}
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
                       // REMOVED: Custom events that could trigger refresh loops
                     }}
                     onMouseLeave={() => {
                       setHighlightedVendor(null)
                       // REMOVED: Custom events that could trigger refresh loops
                     }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div 
          className={`w-2 bg-border hover:bg-primary cursor-col-resize flex-shrink-0 relative group transition-all duration-300 ease-out ${
            viewMode === 'list' ? 'hidden' : 'hidden lg:block'
          } touch-action-none`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
          tabIndex={0}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-primary group-hover:bg-opacity-20 transition-all duration-200"></div>
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