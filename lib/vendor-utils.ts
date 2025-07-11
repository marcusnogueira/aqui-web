import { Database } from '@/types/database'

// Base types from Supabase schema
export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
export type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row']
export type VendorSpecial = Database['public']['Tables']['vendor_specials']['Row']

// Enhanced vendor types for different contexts
export interface VendorWithLiveSession extends Vendor {
  live_session?: VendorLiveSession | null
}

export interface VendorWithDetails extends VendorWithLiveSession {
  static_locations?: VendorStaticLocation[]
  user?: User
  reviews?: Review[]
}

export interface EnrichedVendor extends VendorWithDetails {
  location?: VendorStaticLocation
  announcements: VendorAnnouncement[]
  specials: VendorSpecial[]
  reviews: (Review & { user: Pick<User, 'full_name' | 'avatar_url'> })[]
  averageRating: number
  totalReviews: number
  isLive: boolean
  status: 'live' | 'closing_soon' | 'offline'
}

// Map-specific vendor type
export interface VendorForMap extends VendorWithLiveSession {
  coordinates?: { lat: number; lng: number }
  timeRemaining?: number
  hasTimer?: boolean
}

// Coordinate extraction utility
export const extractCoordinatesFromVendor = (vendor: VendorWithLiveSession): { lat: number; lng: number } | null => {
  if (!vendor.live_session || 
      typeof vendor.live_session.latitude !== 'number' || 
      typeof vendor.live_session.longitude !== 'number') {
    return null
  }
  
  return { 
    lat: vendor.live_session.latitude, 
    lng: vendor.live_session.longitude 
  }
}

// Status calculation utility
export const getVendorStatus = (vendor: VendorWithLiveSession): 'open' | 'closing' | 'offline' => {
  if (!vendor.live_session || !vendor.live_session.is_active) return 'offline'
  
  const startTime = new Date(vendor.live_session.start_time)
  const now = new Date()
  const hoursActive = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  
  // If end_time exists and we're past it, show as offline
  if (vendor.live_session.end_time && now > new Date(vendor.live_session.end_time)) {
    return 'offline'
  }
  
  // If we've been active for more than 7 hours, show as closing
  if (hoursActive >= 7) {
    return 'closing'
  }
  
  return 'open'
}

// Time remaining calculation utility
export const calculateTimeRemaining = (vendor: VendorWithLiveSession): number => {
  if (!vendor.live_session?.auto_end_time) return 0
  
  const now = new Date()
  const endTime = new Date(vendor.live_session.auto_end_time)
  const timeRemaining = Math.max(0, endTime.getTime() - now.getTime())
  
  return Math.floor(timeRemaining / (1000 * 60)) // Return minutes
}

// Format time remaining utility
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

// Session duration calculation utility
export const calculateSessionDuration = (vendor: VendorWithLiveSession): string => {
  if (!vendor.live_session?.start_time) return '0m'
  
  const startTime = new Date(vendor.live_session.start_time)
  const now = new Date()
  const durationMs = now.getTime() - startTime.getTime()
  const durationMinutes = Math.floor(durationMs / (1000 * 60))
  
  return formatTimeRemaining(durationMinutes)
}

// Distance calculation utility (Haversine formula)
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Format distance utility
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Get vendor distance from user location
export const getVendorDistance = (
  vendor: VendorWithLiveSession,
  userLocation: { lat: number; lng: number } | null
): string | null => {
  if (!userLocation) return null
  
  const coordinates = extractCoordinatesFromVendor(vendor)
  if (!coordinates) return null
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    coordinates.lat,
    coordinates.lng
  )
  
  return formatDistance(distance)
}

// Vendor status for profile pages
export const getDetailedVendorStatus = (vendor: VendorWithLiveSession): 'live' | 'closing_soon' | 'offline' => {
  if (!vendor.live_session?.is_active || !vendor.live_session.start_time) return 'offline'
  
  const now = new Date()
  const sessionStart = new Date(vendor.live_session.start_time)
  
  // If there's an end_time and we're past it
  if (vendor.live_session.end_time && now > new Date(vendor.live_session.end_time)) {
    return 'offline'
  }
  
  // If there's an auto_end_time, use it for closing_soon logic
  if (vendor.live_session.auto_end_time) {
    const autoEndTime = new Date(vendor.live_session.auto_end_time)
    const timeUntilEnd = autoEndTime.getTime() - now.getTime()
    
    if (timeUntilEnd <= 30 * 60000) { // 30 minutes or less
      return 'closing_soon'
    }
  } else {
    // Fallback to duration-based logic
    const estimatedEnd = new Date(sessionStart.getTime() + (vendor.live_session.was_scheduled_duration || 120) * 60000)
    const timeUntilEnd = estimatedEnd.getTime() - now.getTime()
    
    if (timeUntilEnd <= 30 * 60000) {
      return 'closing_soon'
    }
  }
  
  return 'live'
}