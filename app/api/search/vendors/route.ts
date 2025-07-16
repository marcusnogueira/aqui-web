import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { auth } from '@/app/api/auth/[...nextauth]/auth'

interface SearchParams {
  q?: string // search query
  lat?: string // user latitude
  lng?: string // user longitude
  bounds?: string // map bounds as "north,south,east,west"
  limit?: string // number of results to return
  offset?: string // pagination offset
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const bounds = searchParams.get('bounds')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createSupabaseServerClient(cookies())

    // Start with the optimized view for live vendors
    let queryBuilder = supabase
      .from('live_vendors_with_sessions')
      .select('*')
      .range(offset, offset + limit - 1)

    // Apply search filter if query provided
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      
      queryBuilder = queryBuilder.or(`
        business_name.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%,
        subcategory.ilike.%${searchTerm}%,
        business_type.ilike.%${searchTerm}%,
        address.ilike.%${searchTerm}%,
        city.ilike.%${searchTerm}%,
        contact_email.ilike.%${searchTerm}%,
        tags.cs.{"${searchTerm}"}
      `)
    }

    // Apply map bounds filter if provided
    if (bounds) {
      const [north, south, east, west] = bounds.split(',').map(Number)
      if (!isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west)) {
        queryBuilder = queryBuilder
          .gte('session_latitude', south)
          .lte('session_latitude', north)
          .gte('session_longitude', west)
          .lte('session_longitude', east)
      }
    }

    const { data: vendors, error, count } = await queryBuilder

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Failed to search vendors' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected VendorWithLiveSession format
    const transformedVendors = vendors?.map((vendor: any) => ({
      id: vendor.id,
      user_id: vendor.user_id,
      business_name: vendor.business_name,
      description: vendor.description,
      business_type: vendor.business_type,
      subcategory: vendor.subcategory,
      tags: vendor.tags,
      profile_image_url: vendor.profile_image_url,
      banner_image_url: vendor.banner_image_url,
      contact_email: vendor.contact_email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      latitude: vendor.live_latitude,
      longitude: vendor.live_longitude,
      status: vendor.status,
      approved_by: vendor.approved_by,
      approved_at: vendor.approved_at,
      average_rating: vendor.average_rating,
      total_reviews: vendor.total_reviews,
      admin_notes: vendor.admin_notes,
      created_at: vendor.created_at,
      updated_at: vendor.updated_at,
      live_session: {
        id: vendor.session_id,
        vendor_id: vendor.id,
        start_time: vendor.start_time,
        end_time: vendor.end_time,
        was_scheduled_duration: vendor.was_scheduled_duration,
        estimated_customers: vendor.estimated_customers,
        latitude: vendor.session_latitude,
        longitude: vendor.session_longitude,
        address: vendor.session_address,
        is_active: vendor.is_active,
        created_at: vendor.session_created_at,
        auto_end_time: vendor.auto_end_time,
        ended_by: vendor.ended_by
      }
    })) || []

    // Log search query if user is authenticated and query is provided
    if (query.trim()) {
      const session = await auth()
      const user = session?.user
      if (user && lat && lng) {
        await supabase
          .from('search_logs')
          .insert({
            user_id: user.id,
            query: query.trim(),
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          })
      }
    }

    return NextResponse.json({
      vendors: transformedVendors,
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle POST for logging vendor clicks
export async function POST(request: NextRequest) {
  try {
    const { vendorId, query } = await request.json()
    
    if (!vendorId || !query) {
      return NextResponse.json(
        { error: 'Missing vendorId or query' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient(cookies())
    const session = await auth()
    const user = session?.user
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update the most recent search log with the clicked vendor
    const { error } = await supabase
      .from('search_logs')
      .update({ vendor_clicked: vendorId })
      .eq('user_id', user.id)
      .eq('query', query)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error updating search log:', error)
      return NextResponse.json(
        { error: 'Failed to log vendor click' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Search click logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}