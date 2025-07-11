'use client'

import React from 'react'
import OpenStreetMap from './OpenStreetMap'
import { VendorMapProps } from '@/types/vendor'
import { 
  extractCoordinatesFromVendor, 
  calculateTimeRemaining, 
  formatTimeRemaining,
  getVendorStatus,
  VendorWithLiveSession
} from '@/lib/vendor-utils'

export default function VendorMap({ vendors, userLocation, onVendorClick, onMapBoundsChange }: VendorMapProps) {
  // Convert vendors to markers format
  const markers = vendors
    .map(vendor => {
      const coordinates = extractCoordinatesFromVendor(vendor)
      if (!coordinates) return null
      
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

  return (
    <OpenStreetMap 
      markers={markers}
      userLocation={userLocation}
      onMarkerClick={onVendorClick}
      onBoundsChange={onMapBoundsChange}
      enableGeolocation={true}
      showAttribution={true}
      className="w-full h-full"
    />
  )
}