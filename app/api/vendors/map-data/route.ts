import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { 
  extractCoordinatesFromVendor, 
  calculateTimeRemaining, 
  getVendorStatus,
  VendorWithLiveSession
} from '@/lib/vendor-utils'
import { getCategoryIcon } from '@/lib/category-config'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface MapMarkerData {
  id: string
  position: { lat: number; lng: number }
  title: string
  description?: string
  isLive: boolean
  status: string
  categoryIcon: string
  timeRemaining: number
  hasTimer: boolean
  vendor: VendorWithLiveSession
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {
            // Cookie setting handled by middleware
          },
          remove() {
            // Cookie removal handled by middleware
          },
        },
      }
    )

    // Get search parameters for potential filtering
    const { searchParams } = new URL(request.url)
    const bounds = searchParams.get('bounds')
    
    // Fetch vendors with live sessions
    let query = supabase
      .from('vendors')
      .select(`
        *,
        live_session:vendor_live_sessions(
          id,
          vendor_id,
          latitude,
          longitude,
          start_time,
          end_time,
          auto_end_time,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('vendor_live_sessions.is_active', true)
      .not('vendor_live_sessions', 'is', null)

    // Apply bounds filtering if provided
    if (bounds) {
      try {
        const boundsObj = JSON.parse(bounds)
        query = query
          .gte('vendor_live_sessions.latitude', boundsObj.south)
          .lte('vendor_live_sessions.latitude', boundsObj.north)
          .gte('vendor_live_sessions.longitude', boundsObj.west)
          .lte('vendor_live_sessions.longitude', boundsObj.east)
      } catch (e) {
        console.warn('Invalid bounds parameter:', bounds)
      }
    }

    const { data: vendors, error } = await query

    if (error) {
      throw errorHandler.create(
        ErrorType.DATABASE,
        `Failed to fetch vendors: ${error.message}`,
        ErrorSeverity.HIGH,
        'VENDOR_FETCH_ERROR'
      )
    }

    // Transform vendors to map markers on server-side
    const markers: MapMarkerData[] = (vendors || [])
      .map(vendor => {
        try {
          // Extract coordinates
          const coordinates = extractCoordinatesFromVendor(vendor as unknown as VendorWithLiveSession)
          if (!coordinates) return null
          
          // Calculate status and timing
          const status = getVendorStatus(vendor as unknown as VendorWithLiveSession)
          const timeRemainingMinutes = calculateTimeRemaining(vendor as unknown as VendorWithLiveSession)
          const hasTimer = timeRemainingMinutes > 0
          
          // Get category icon
          const categoryIcon = getCategoryIcon(vendor.subcategory)
          
          return {
            id: vendor.id,
            position: coordinates,
            title: vendor.business_name || 'Unknown Vendor',
            description: vendor.description || 'Food Vendor',
            isLive: status === 'open',
            status,
            categoryIcon,
            timeRemaining: timeRemainingMinutes,
            hasTimer,
            vendor: vendor as unknown as VendorWithLiveSession
          } as MapMarkerData
        } catch (error) {
          console.warn(`Failed to process vendor ${vendor.id}:`, error)
          return null
        }
      })
      .filter((marker): marker is MapMarkerData => marker !== null)

    // Set cache headers for performance
    const response = NextResponse.json({ markers })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    console.error('Map data API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch map data',
        markers: [] 
      },
      { status: 500 }
    )
  }
}