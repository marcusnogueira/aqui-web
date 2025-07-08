'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { VendorWithLiveSession, VendorMapProps } from '@/types/vendor'

// Helper function to extract coordinates from live session
const extractCoordinates = (liveSession: VendorWithLiveSession['live_session']): { lat: number; lng: number } | null => {
  if (!liveSession || typeof liveSession.latitude !== 'number' || typeof liveSession.longitude !== 'number') {
    return null
  }
  
  return { lat: liveSession.latitude, lng: liveSession.longitude }
}

// Helper function to format time remaining
const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${remainingSeconds}s`
}

interface ExtendedVendorMapProps extends VendorMapProps {
  onMapBoundsChange?: (bounds: google.maps.LatLngBounds) => void
}

export function VendorMap({ vendors, userLocation, onVendorClick, getVendorStatus, onMapBoundsChange }: ExtendedVendorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [highlightedVendorId, setHighlightedVendorId] = useState<string | null>(null)
  const [vendorTimers, setVendorTimers] = useState<Map<string, number>>(new Map())

  // Timer management for vendors
  useEffect(() => {
    const timers = new Map<string, number>()
    
    vendors.forEach(vendor => {
      if (vendor.live_session?.auto_end_time && vendor.live_session.is_active) {
        const now = new Date().getTime()
        const endTime = new Date(vendor.live_session.auto_end_time).getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        timers.set(vendor.id, remaining)
      }
    })
    
    setVendorTimers(timers)
    
    const interval = setInterval(() => {
      setVendorTimers(prev => {
        const updated = new Map(prev)
        let hasChanges = false
        
        vendors.forEach(vendor => {
          if (vendor.live_session?.auto_end_time && vendor.live_session.is_active) {
            const now = new Date().getTime()
            const endTime = new Date(vendor.live_session.auto_end_time).getTime()
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
            
            if (updated.get(vendor.id) !== remaining) {
              updated.set(vendor.id, remaining)
              hasChanges = true
            }
          } else if (updated.has(vendor.id)) {
            updated.delete(vendor.id)
            hasChanges = true
          }
        })
        
        return hasChanges ? updated : prev
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [vendors])

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places']
      })

      try {
        await loader.load()
        setIsLoaded(true)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [])

  // Create map instance
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userLocation) return

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    // Add bounds change listener for filtering vendors
    if (onMapBoundsChange) {
      mapInstance.addListener('bounds_changed', () => {
        const bounds = mapInstance.getBounds()
        if (bounds) {
          onMapBoundsChange(bounds)
        }
      })
    }

    setMap(mapInstance)
  }, [isLoaded, userLocation, onMapBoundsChange])

  // Add user location marker
  useEffect(() => {
    if (!map || !userLocation) return

    new google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      }
    })
  }, [map, userLocation])

  // Create Airbnb-style marker SVG with PopIn animation
  const createAirbnbMarkerSVG = (vendor: any, isHighlighted: boolean = false) => {
    const status = getVendorStatus(vendor)
    const statusColor = status === 'open' ? '#10B981' : status === 'closing' ? '#F59E0B' : '#6B7280'
    const bgColor = isHighlighted ? '#FF385C' : 'white'
    const textColor = isHighlighted ? 'white' : '#222'
    const borderColor = isHighlighted ? '#FF385C' : statusColor
    
    // Get vendor category icon or use default
    const categoryIcon = vendor.subcategory?.toLowerCase().includes('food') ? '🍽️' : 
                        vendor.subcategory?.toLowerCase().includes('coffee') ? '☕' :
                        vendor.subcategory?.toLowerCase().includes('dessert') ? '🍰' :
                        vendor.subcategory?.toLowerCase().includes('drink') ? '🥤' : '🛒'
    
    const displayName = vendor.business_name.length > 10 ? vendor.business_name.substring(0, 10) + '...' : vendor.business_name
    
    return `
      <svg width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
          </filter>
          <style>
            .marker-group {
              animation: popIn 0.6s ease-out;
              transform-origin: center;
            }
            @keyframes popIn {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          </style>
        </defs>
        
        <g class="marker-group">
          <!-- Main bubble -->
          <rect x="5" y="5" width="110" height="30" rx="15" ry="15" 
                fill="${bgColor}" stroke="${borderColor}" stroke-width="2" filter="url(#shadow)"/>
          
          <!-- Pointer -->
          <polygon points="60,35 55,45 65,45" fill="${borderColor}"/>
          
          <!-- Text -->
          <text x="15" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="${textColor}">
            ${categoryIcon} ${displayName}
          </text>
        </g>
      </svg>
    `
  }

  // Add vendor markers
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers = new Map<string, google.maps.Marker>()

    vendors
      .forEach(vendor => {
        const coordinates = vendor.live_session ? extractCoordinates(vendor.live_session) : null
        if (!coordinates) return

        const status = getVendorStatus(vendor)
        const position = coordinates
        const isHighlighted = highlightedVendorId === vendor.id

        const statusColors = {
          open: '#10B981',
          closing: '#F59E0B',
          offline: '#6B7280'
        }

        // Create Airbnb-style price bubble marker
         const markerSVG = createAirbnbMarkerSVG(vendor, isHighlighted)

        const marker = new google.maps.Marker({
           position,
           map,
           title: vendor.business_name,
           icon: {
             url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSVG),
             scaledSize: new google.maps.Size(120, 50),
             anchor: new google.maps.Point(60, 50)
           }
         })

        // Add click listener
        marker.addListener('click', () => {
          // Create info window with enhanced content
          const categoryIcon = vendor.subcategory?.toLowerCase().includes('food') ? '🍽️' : 
                              vendor.subcategory?.toLowerCase().includes('coffee') ? '☕' :
                              vendor.subcategory?.toLowerCase().includes('dessert') ? '🍰' :
                              vendor.subcategory?.toLowerCase().includes('drink') ? '🥤' : '🛒'
          
          const timeRemaining = vendorTimers.get(vendor.id)
          const hasTimer = timeRemaining !== undefined && timeRemaining > 0
          
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3 min-w-[200px]">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-lg">${categoryIcon}</span>
                  <h3 class="font-semibold text-gray-900">${vendor.business_name}</h3>
                </div>
                <p class="text-sm text-gray-600 mb-1">${vendor.subcategory || 'Food Vendor'}</p>
                ${vendor.description ? `<p class="text-xs text-gray-500 mb-2">${vendor.description.substring(0, 80)}${vendor.description.length > 80 ? '...' : ''}</p>` : ''}
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    hasTimer ? 'bg-orange-100 text-orange-800' :
                    status === 'open' ? 'bg-green-100 text-green-800' :
                    status === 'closing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }">
                    ${hasTimer ? `⏳ ${formatTimeRemaining(timeRemaining)}` :
                      timeRemaining === 0 ? '🔴 Ending Soon' :
                      vendor.live_session?.auto_end_time ? '🟢 Live Now' :
                      status === 'open' ? '🟢 Open' :
                      status === 'closing' ? '🟡 Closing Soon' : '🔴 Offline'}
                  </span>
                  ${vendor.average_rating ? `
                    <div class="flex items-center space-x-1">
                      <span class="text-yellow-400">⭐</span>
                      <span class="text-sm font-medium">${vendor.average_rating.toFixed(1)}</span>
                    </div>
                  ` : ''}
                </div>
                <button 
                  onclick="window.handleVendorClick && window.handleVendorClick('${vendor.id}')"
                  class="mt-3 w-full bg-mission-teal text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-bay-cypress transition-colors"
                >
                  View Details
                </button>
              </div>
            `,
            position: position
          })
          
          infoWindow.open(map)
          onVendorClick(vendor.id)
        })

        newMarkers.set(vendor.id, marker)
      })

    setMarkers(newMarkers)

    // Add global click handler for info window buttons
    ;(window as any).handleVendorClick = (vendorId: string) => {
      onVendorClick(vendorId)
    }

    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
    }
  }, [map, vendors, getVendorStatus, onVendorClick, highlightedVendorId, vendorTimers])

  // Add event listeners for vendor highlighting
  useEffect(() => {
    const handleHighlight = (event: CustomEvent) => {
      setHighlightedVendorId(event.detail.vendorId)
    }

    const handleUnhighlight = () => {
      setHighlightedVendorId(null)
    }

    window.addEventListener('highlightVendor', handleHighlight as EventListener)
    window.addEventListener('unhighlightVendor', handleUnhighlight)

    return () => {
      window.removeEventListener('highlightVendor', handleHighlight as EventListener)
      window.removeEventListener('unhighlightVendor', handleUnhighlight)
    }
  }, [])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  )
}