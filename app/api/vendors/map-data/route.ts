import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { 
  extractCoordinatesFromVendor, 
  extractAnyCoordinatesFromVendor,
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
    const cookieStore = await cookies()
    
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
    const showAll = searchParams.get('showAll') === 'true' // New parameter for list view
    
    // Build query based on whether we want all vendors or just those with live sessions
    let query = supabase
      .from('vendors')
      .select(`
        *,
        vendor_live_sessions!inner(
          id,
          vendor_id,
          latitude,
          longitude,
          start_time,
          end_time,
          auto_end_time,
          is_active,
          created_at,
          address,
          ended_by,
          estimated_customers,
          was_scheduled_duration
        )
      `)

    // If showAll is true (list view), get all active vendors regardless of live session status
    if (showAll) {
      // For list view: get all active/approved vendors, with optional live session data
      // Use left join to include vendors without live sessions
      query = supabase
        .from('vendors')
        .select(`
          *,
          vendor_live_sessions(
            id,
            vendor_id,
            latitude,
            longitude,
            start_time,
            end_time,
            auto_end_time,
            is_active,
            created_at,
            address,
            ended_by,
            estimated_customers,
            was_scheduled_duration
          )
        `)
        .in('status', ['active', 'approved'])
    } else {
      // For map view: only get vendors with active live sessions
      query = query
        .eq('vendor_live_sessions.is_active', true)
    }

    // Apply bounds filtering if provided (only for map view)
    if (bounds && !showAll) {
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
          // For showAll mode, we need to handle vendors without live sessions
          let coordinates: { lat: number; lng: number } | null = null
          let status = 'offline'
          let timeRemainingMinutes = 0
          let hasTimer = false
          
          // Handle different response structures based on query type
          const liveSession = Array.isArray(vendor.vendor_live_sessions) 
            ? vendor.vendor_live_sessions.find(session => session.is_active)
            : vendor.vendor_live_sessions
          
          // Create a properly structured vendor object for processing
          const vendorWithSession: VendorWithLiveSession = {
            ...vendor,
            live_session: liveSession || null
          }
          
          // Extract coordinates using the flexible utility
          coordinates = extractAnyCoordinatesFromVendor(vendorWithSession)
          
          // Calculate status and timing if we have a live session
          if (liveSession && liveSession.is_active) {
            status = getVendorStatus(vendorWithSession)
            timeRemainingMinutes = calculateTimeRemaining(vendorWithSession)
            hasTimer = timeRemainingMinutes > 0
          }
          
          // Skip vendors without any coordinates (can't show on map)
          if (!coordinates) {
            console.warn(`Vendor ${vendor.id} has no coordinates, skipping`)
            return null
          }
          
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
            vendor: vendorWithSession
          } as MapMarkerData
        } catch (error) {
          console.warn(`Failed to process vendor ${vendor.id}:`, error)
          return null
        }
      })
      .filter((marker): marker is MapMarkerData => marker !== null)

    // Set cache headers for real-time updates
    const response = NextResponse.json({ 
      markers,
      timestamp: new Date().toISOString(), // Add timestamp to force client refresh
      liveCount: markers.filter(m => m.isLive).length
    })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
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