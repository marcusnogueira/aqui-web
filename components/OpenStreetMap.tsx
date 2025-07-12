'use client'

import { useEffect, useRef, useState } from 'react'
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GetDirectionsButtonCompact } from './GetDirectionsButton'
import { formatTimeRemaining, calculateTimeRemaining, extractCoordinatesFromVendor } from '@/lib/vendor-utils'

interface MarkerData {
  id: string
  position: { lat: number; lng: number }
  title: string
  description?: string
  isLive?: boolean
  isHighlighted?: boolean
  vendor?: any
  status?: string
  categoryIcon?: string
  timeRemaining?: number
  hasTimer?: boolean
}

interface OpenStreetMapProps {
  markers?: MarkerData[]
  center?: { lat: number; lng: number }
  zoom?: number
  onMarkerClick?: (markerId: string) => void
  onBoundsChange?: (bounds: any) => void
  userLocation?: { lat: number; lng: number }
  className?: string
  enableGeolocation?: boolean
  showAttribution?: boolean
  onLocationRequest?: () => void
  isLocating?: boolean
}



export default function OpenStreetMap({
  markers = [],
  center = { lat: 37.7749, lng: -122.4194 }, // San Francisco
  zoom = 13,
  onMarkerClick,
  onBoundsChange,
  userLocation,
  className = '',
  enableGeolocation = false,
  showAttribution = true,
  onLocationRequest,
  isLocating = false
}: OpenStreetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!mapContainer.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(mapContainer.current)

    return () => observer.disconnect()
  }, [])

  // Initialize map when it comes into view
  useEffect(() => {
    if (!isIntersecting || !mapContainer.current || map.current) return

    try {
      const mapInstance = new Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: showAttribution ? '© OpenStreetMap contributors' : ''
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles'
            }
          ]
        },
        center: [center.lng, center.lat],
        zoom: zoom,
        attributionControl: showAttribution ? undefined : false
      })

      // Add navigation controls
      mapInstance.addControl(new NavigationControl(), 'top-right')

      // Handle bounds change
      if (onBoundsChange) {
        mapInstance.on('moveend', () => {
          const bounds = mapInstance.getBounds()
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          })
        })
      }

      map.current = mapInstance
      setIsLoaded(true)

      // Handle geolocation if enabled
      if (enableGeolocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            
            // Smoothly recenter to user location
            mapInstance.flyTo({
              center: [userPos.lng, userPos.lat],
              zoom: 15,
              duration: 2000
            })
          },
          (error) => {
            console.log('Geolocation denied or failed:', error.message)
          }
        )
      }

    } catch (err) {
      console.error('Failed to initialize map:', err)
      setError('Failed to load map')
    }
  }, [isIntersecting, center, zoom, enableGeolocation, showAttribution, onBoundsChange])

  // Add user location marker and handle location updates
  useEffect(() => {
    if (!map.current || !userLocation) return

    const userMarker = new Marker({
      color: '#3B82F6',
      scale: 0.8
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current)

    // If this is a location update (not initial load), smoothly fly to the new location
    if (isLoaded && map.current) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 2000
      })
    }

    return () => {
      userMarker.remove()
    }
  }, [userLocation, isLoaded])

  // Optimized marker management with memoization
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Batch marker creation for better performance
    const newMarkers: Marker[] = []

    markers.forEach((markerData) => {
      // Create marker element
      const el = document.createElement('div')
      el.className = 'vendor-marker'
      el.style.cssText = `
        background: ${markerData.isHighlighted ? '#FF385C' : 'white'};
        color: ${markerData.isHighlighted ? 'white' : '#222'};
        border: 2px solid ${markerData.isLive ? '#10B981' : markerData.isHighlighted ? '#FF385C' : '#6B7280'};
        border-radius: 15px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        transform: scale(${markerData.isHighlighted ? '1.1' : '1'});
        transition: all 0.2s ease;
      `
      
      const displayName = markerData.title.length > 10 ? 
        markerData.title.substring(0, 10) + '...' : markerData.title
      
      el.innerHTML = `${markerData.categoryIcon || '🛒'} ${displayName}`

      // Create popup content
      const popupContent = document.createElement('div')
      popupContent.style.cssText = 'padding: 12px; min-width: 200px;'
      
      const statusColor = markerData.hasTimer ? 'orange' :
                         markerData.isLive ? 'green' :
                         markerData.status === 'closing' ? 'yellow' : 'gray'
      
      const statusText = markerData.hasTimer ? `⏳ ${formatTimeRemaining(markerData.timeRemaining || 0)}` :
                        markerData.timeRemaining === 0 ? '🔴 Ending Soon' :
                        markerData.isLive ? '🟢 Live Now' :
                        markerData.status === 'closing' ? '🟡 Closing Soon' : '🔴 Offline'
      
      popupContent.innerHTML = `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 18px;">${markerData.categoryIcon || '🛒'}</span>
            <h3 style="margin: 0; font-weight: 600; color: #111;">${markerData.title}</h3>
          </div>
          <p style="margin: 0; font-size: 14px; color: #666;">${markerData.description || 'Food Vendor'}</p>
          <div style="margin-top: 8px;">
            <span style="
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              background: ${statusColor === 'green' ? '#dcfce7' : 
                          statusColor === 'orange' ? '#fed7aa' :
                          statusColor === 'yellow' ? '#fef3c7' : '#f3f4f6'};
              color: ${statusColor === 'green' ? '#166534' :
                       statusColor === 'orange' ? '#9a3412' :
                       statusColor === 'yellow' ? '#92400e' : '#374151'};
            ">${statusText}</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button 
            onclick="window.handleVendorClick && window.handleVendorClick('${markerData.id}')"
            style="
              flex: 1;
              background: #0D9488;
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              border: none;
              cursor: pointer;
              transition: background-color 0.2s;
            "
          >
            View Details
          </button>
          <button 
            onclick="window.handleGetDirections && window.handleGetDirections('${markerData.id}', ${markerData.position.lat}, ${markerData.position.lng}, '${markerData.title}')"
            style="
              background: #3B82F6;
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              border: none;
              cursor: pointer;
              transition: background-color 0.2s;
            "
          >
            📍 Directions
          </button>
        </div>
      `

      // Create popup
      const popup = new Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setDOMContent(popupContent)

      // Create marker
      const marker = new Marker({ element: el })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .setPopup(popup)
      
      if (map.current) {
        marker.addTo(map.current)
      }

      // Add click handler
      el.addEventListener('click', () => {
        onMarkerClick?.(markerData.id)
      })

      newMarkers.push(marker)
    })

    // Add all markers to the map in batch
    markersRef.current = newMarkers

    // Add global handlers for popup buttons
    ;(window as any).handleVendorClick = (vendorId: string) => {
      onMarkerClick?.(vendorId)
    }

    ;(window as any).handleGetDirections = async (vendorId: string, lat: number, lng: number, name: string) => {
      try {
        const { getDirections } = await import('@/lib/directions')
        await getDirections(
          { lat, lng },
          {
            useCurrentLocation: true,
            openInNewTab: true
          }
        )
      } catch (error) {
        console.error('Error getting directions:', error)
      }
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [markers, isLoaded, onMarkerClick])

  if (error) {
    return (
      <div className={`bg-muted rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px] rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Location Button - Floating Action Button */}
      {onLocationRequest && isLoaded && (
        <button
          onClick={onLocationRequest}
          disabled={isLocating}
          className={`absolute bottom-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10 ${
            isLocating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50 active:bg-gray-100 hover:shadow-xl'
          } border border-gray-200`}
          title={isLocating ? 'Getting your location...' : 'Get my location'}
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : (
            <svg 
              className="w-5 h-5 text-gray-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" strokeWidth="2"/>
            </svg>
          )}
        </button>
      )}
      
      {!isIntersecting && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2"></div>
            <p>Map will load when visible</p>
          </div>
        </div>
      )}
      
      {isIntersecting && !isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}