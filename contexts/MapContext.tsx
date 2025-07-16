'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface MapContextType {
  // Vendor interaction
  onVendorClick: (vendorId: string) => void
  setOnVendorClick: (handler: (vendorId: string) => void) => void
  
  // Map bounds management
  onMapBoundsChange: (bounds: any) => void
  setOnMapBoundsChange: (handler: (bounds: any) => void) => void
  
  // Location services
  onLocationRequest: () => void
  setOnLocationRequest: (handler: () => void) => void
  isLocating: boolean
  setIsLocating: (locating: boolean) => void
  
  // User location state
  userLocation: { lat: number; lng: number } | undefined
  setUserLocation: (location: { lat: number; lng: number } | undefined) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export const useMapContext = () => {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}

interface MapProviderProps {
  children: React.ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  // State for location services
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>()
  
  // Event handlers - using useState to maintain stable references
  const [onVendorClick, setOnVendorClick] = useState<(vendorId: string) => void>(
    () => (vendorId: string) => {
      console.log('Vendor clicked:', vendorId)
    }
  )
  
  const [onMapBoundsChange, setOnMapBoundsChange] = useState<(bounds: any) => void>(
    () => (bounds: any) => {
      console.log('Map bounds changed:', bounds)
    }
  )
  
  const [onLocationRequest, setOnLocationRequest] = useState<() => void>(
    () => () => {
      console.log('Location requested')
    }
  )
  
  // Stable handler setters using useCallback
  const stableSetOnVendorClick = useCallback((handler: (vendorId: string) => void) => {
    setOnVendorClick(() => handler)
  }, [])
  
  const stableSetOnMapBoundsChange = useCallback((handler: (bounds: any) => void) => {
    setOnMapBoundsChange(() => handler)
  }, [])
  
  const stableSetOnLocationRequest = useCallback((handler: () => void) => {
    setOnLocationRequest(() => handler)
  }, [])

  const value: MapContextType = {
    onVendorClick,
    setOnVendorClick: stableSetOnVendorClick,
    onMapBoundsChange,
    setOnMapBoundsChange: stableSetOnMapBoundsChange,
    onLocationRequest,
    setOnLocationRequest: stableSetOnLocationRequest,
    isLocating,
    setIsLocating,
    userLocation,
    setUserLocation
  }

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}

export default MapContext