'use client'

import { useRef, useState, useEffect } from 'react'
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { formatTimeRemaining } from '@/lib/vendor-utils'

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
  center = { lat: 37.7749, lng: -122.4194 },
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
  const userMarkerRef = useRef<Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // FIXED: Map initialization with proper dependencies
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      const mapInstance = new Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: showAttribution ? '© OpenStreetMap contributors' : ''
            }
          },
          layers: [{
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles'
          }]
        },
        center: [center.lng, center.lat],
        zoom: zoom,
        attributionControl: showAttribution ? undefined : false
      })

      mapInstance.addControl(new NavigationControl(), 'top-right')
      
      // CRITICAL: NO bounds change listener - this prevents refresh loops
      
      map.current = mapInstance
      setIsLoaded(true)

    } catch (err) {
      console.error('Map initialization failed:', err)
      setError('Failed to load map')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [center.lat, center.lng, zoom, showAttribution]) // FIXED: Proper dependencies

  // Update user location
  useEffect(() => {
    if (!map.current || !userLocation) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    const userMarker = new Marker({ color: '#3B82F6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current)

    userMarkerRef.current = userMarker

    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      duration: 1000
    })
  }, [userLocation])

  // Update markers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    markers.forEach((markerData) => {
      const el = document.createElement('div')
      el.className = 'vendor-marker'
      el.style.cssText = `
        background: white;
        border: 2px solid ${markerData.isLive ? '#10B981' : '#6B7280'};
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `
      
      el.textContent = `${markerData.categoryIcon || '🛒'} ${markerData.title.substring(0, 10)}`

      const marker = new Marker({ element: el })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map.current!)

      el.addEventListener('click', () => {
        onMarkerClick?.(markerData.id)
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(marker => marker.remove())
    }
  }, [markers, isLoaded, onMarkerClick])

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px] rounded-lg"
      />
      
      {onLocationRequest && isLoaded && (
        <button
          onClick={onLocationRequest}
          disabled={isLocating}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border"
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" strokeWidth="2"/>
            </svg>
          )}
        </button>
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}