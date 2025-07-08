import { Database } from './database'

// Base types from Supabase schema
export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
export type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

// Extended types for frontend components with joined data
export interface VendorWithLiveSession extends Vendor {
  live_session?: VendorLiveSession | null
}

export interface VendorWithDetails extends Vendor {
  live_session?: VendorLiveSession | null
  static_locations?: VendorStaticLocation[]
  user?: User
  reviews?: Review[]
}

// Admin-specific vendor type with user details
export interface AdminVendorView extends Vendor {
  users: User
  vendor_live_sessions: VendorLiveSession[]
  category?: string // Legacy field for admin compatibility
  admin_notes?: string | null // Admin-specific notes
}

// Props interfaces for components
export interface VendorCardProps {
  vendor: VendorWithLiveSession
  status: 'open' | 'closing' | 'offline'
  onClick: () => void
  userLocation: { lat: number; lng: number } | null
}

export interface VendorMapProps {
  vendors: VendorWithLiveSession[]
  userLocation: { lat: number; lng: number } | null
  onVendorClick: (vendorId: string) => void
  getVendorStatus: (vendor: VendorWithLiveSession) => 'open' | 'closing' | 'offline'
}

// Utility types for vendor operations
export interface VendorRegistrationData {
  business_name: string
  business_type: string | null
  description?: string | null
  phone?: string | null
  address?: string | null
  place_id?: string | null
  latitude?: number | null
  longitude?: number | null
}

// Legacy compatibility - to be removed after migration
/** @deprecated Use VendorWithLiveSession instead */
export interface LegacyVendor {
  id: string
  business_name: string
  description: string | null
  subcategory: string | null
  profile_image_url: string | null
  average_rating: number | null
  total_reviews: number
  live_session?: {
    id: string
    started_at: string
    ended_at: string | null
    location: any // This should be migrated to latitude/longitude
    was_scheduled_duration: number | null
    estimated_customers: number
  } | null
}