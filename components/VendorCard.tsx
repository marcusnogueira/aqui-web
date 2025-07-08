'use client'

import { Star, MapPin, Clock, Users } from 'lucide-react'
import Image from 'next/image'
import { VendorWithLiveSession, VendorCardProps } from '@/types/vendor'
import { useState, useEffect } from 'react'
import { useFadeInUp, usePulse } from '@/lib/animations'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Helper function to extract coordinates from live session
const extractCoordinates = (liveSession: any): { lat: number; lng: number } | null => {
  if (!liveSession || typeof liveSession.latitude !== 'number' || typeof liveSession.longitude !== 'number') {
    return null
  }
  
  return { lat: liveSession.latitude, lng: liveSession.longitude }
}

function getSessionDuration(startTime: string): string {
  const start = new Date(startTime)
  const now = new Date()
  const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60)
  
  const hours = Math.floor(elapsed)
  const minutes = Math.floor((elapsed % 1) * 60)
  
  if (hours > 0) {
    return `Active for ${hours}h ${minutes}m`
  }
  return `Active for ${minutes}m`
}

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${remainingSeconds}s`
}

export function VendorCard({ vendor, status, onClick, userLocation }: VendorCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const fadeRef = useFadeInUp()
  const pulseRef = usePulse(status === 'open' || (vendor.live_session?.is_active && status !== 'offline'))

  const statusColors = {
    open: 'bg-green-500',
    closing: 'bg-yellow-500', 
    offline: 'bg-gray-500'
  }

  const statusLabels = {
    open: 'Open',
    closing: 'Closing Soon',
    offline: 'Offline'
  }

  // Timer countdown effect
  useEffect(() => {
    if (vendor.live_session?.auto_end_time && vendor.live_session.is_active) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const endTime = new Date(vendor.live_session!.auto_end_time!).getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        
        setTimeRemaining(remaining)
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    } else {
      setTimeRemaining(null)
    }
  }, [vendor.live_session?.auto_end_time, vendor.live_session?.is_active])

  const coordinates = vendor.live_session ? extractCoordinates(vendor.live_session) : null
  const distance = userLocation && coordinates
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        coordinates.lat,
        coordinates.lng
      )
    : null

  return (
    <div 
      ref={fadeRef}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {vendor.profile_image_url ? (
          <Image
            src={vendor.profile_image_url}
            alt={vendor.business_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-4xl">🍽️</div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-white text-xs font-medium ${
            timeRemaining !== null && timeRemaining > 0 ? 'bg-orange-500' : statusColors[status]
          }`}>
            <div 
              ref={pulseRef}
              className={`w-2 h-2 bg-white rounded-full ${
                status === 'open' || (vendor.live_session?.is_active && status !== 'offline') ? 'animate-pulse' : ''
              }`}
            ></div>
            <span>
              {timeRemaining !== null && timeRemaining > 0 
                ? `⏳ ${formatTimeRemaining(timeRemaining)}`
                : timeRemaining === 0
                ? 'Ending Soon'
                : vendor.live_session?.auto_end_time
                ? '🟢 Live Now'
                : statusLabels[status]
              }
            </span>
          </div>
        </div>

        {/* Distance Badge */}
        {distance && (
          <div className="absolute top-3 right-3">
            <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
              {distance.toFixed(1)} mi
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{vendor.business_name}</h3>
            {vendor.subcategory && (
              <p className="text-sm text-gray-600">{vendor.subcategory}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{vendor.description}</p>
        )}

        {/* Rating */}
        {vendor.average_rating && vendor.total_reviews > 0 ? (
          <div className="flex items-center space-x-1 mb-3">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-900">
              {vendor.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">({vendor.total_reviews} reviews)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 mb-3">
            <Star className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-500">No reviews yet</span>
          </div>
        )}

        {/* Location & Time */}
        <div className="space-y-2">
          {vendor.live_session && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">Live session active</span>
            </div>
          )}
          
          {vendor.live_session && status !== 'offline' && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{getSessionDuration(vendor.live_session.start_time)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button className="w-full bg-mission-teal text-white py-2 px-4 rounded-lg font-medium hover:bg-bay-cypress transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}