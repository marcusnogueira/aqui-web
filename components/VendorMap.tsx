'use client'

import React, { useMemo } from 'react'
import OpenStreetMap from './OpenStreetMap'
import { VendorMapProps } from '@/types/vendor'
import { 
  extractAnyCoordinatesFromVendor, 
  calculateTimeRemaining, 
  formatTimeRemaining,
  getVendorStatus,
  VendorWithLiveSession
} from '@/lib/vendor-utils'

function VendorMap({ vendors, userLocation, onVendorClick, onMapBoundsChange, onLocationRequest, isLocating }: VendorMapProps) {
  // Memoized markers conversion to prevent unnecessary recalculations
  const markers = useMemo(() => {
    return (vendors || [])
      .map(vendor => {
        // Extract coordinates using the flexible utility function
        const coordinates = extractAnyCoordinatesFromVendor(vendor)
        
        // Skip vendors without any coordinates
        if (!coordinates) {
          return null
        }
        
        const status = getVendorStatus(vendor)
        const categoryIcon = vendor.subcategory?.toLowerCase().includes('food') ? '🍽️' : 
                            vendor.subcategory?.toLowerCase().includes('coffee') ? '☕' :
                            vendor.subcategory?.toLowerCase().includes('dessert') ? '🍰' :
                            vendor.subcategory?.toLowerCase().includes('drink') ? '🥤' : '🛒'
        
        // Calculate time remaining using shared utility
        const timeRemainingMinutes = calculateTimeRemaining(vendor)
        const hasTimer = timeRemainingMinutes > 0
        
        return {
          id: vendor.id,
          position: coordinates,
          title: vendor.business_name || 'Unknown Vendor',
          description: vendor.description || 'Food Vendor',
          isLive: status === 'open',
          status,
          categoryIcon: categoryIcon,
          timeRemaining: timeRemainingMinutes,
          hasTimer: hasTimer,
          vendor: vendor
        }
      })
      .filter(marker => marker !== null)
  }, [vendors])

  return (
    <div className="relative w-full h-full">
      <OpenStreetMap 
        markers={markers}
        userLocation={userLocation}
        onMarkerClick={onVendorClick}
        onBoundsChange={onMapBoundsChange}
        onLocationRequest={onLocationRequest}
        isLocating={isLocating}
        enableGeolocation={false}
        showAttribution={true}
        className="w-full h-full"
      />
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders
export default React.memo(VendorMap)