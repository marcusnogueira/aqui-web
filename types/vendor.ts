import { Database } from './database'
import { 
  Vendor, 
  VendorLiveSession, 
  VendorStaticLocation, 
  User, 
  Review,
  VendorWithLiveSession,
  VendorWithDetails,
  EnrichedVendor,
  VendorForMap
} from '@/lib/vendor-utils'

// Admin-specific vendor view
export interface AdminVendorView extends Vendor {
  users: User
  vendor_live_sessions: VendorLiveSession[]
}

// Re-export commonly used types for backward compatibility
export type { 
  Vendor, 
  VendorLiveSession, 
  VendorStaticLocation, 
  User, 
  Review,
  VendorWithLiveSession,
  VendorWithDetails,
  EnrichedVendor,
  VendorForMap
}

// Props interfaces for components
export interface VendorMapProps {
  vendors: VendorWithLiveSession[]
  userLocation: { lat: number; lng: number } | undefined
  onVendorClick?: (vendorId: string) => void
  onMapBoundsChange?: (bounds: any) => void
  onLocationRequest?: () => void
  isLocating?: boolean
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