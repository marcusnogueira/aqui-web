import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { PAGINATION, VENDOR_STATUSES, ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '@/lib/constants'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'
// Force dynamic rendering since we use authentication cookies
export const dynamic = 'force-dynamic'



export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const supabase = createSupabaseServerClient(cookies())

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || PAGINATION.DEFAULT_PAGE.toString())
    const limit = parseInt(searchParams.get('limit') || PAGINATION.DEFAULT_LIMIT.toString())
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'approved', 'pending', 'rejected'

    let query = supabase
      .from('vendors')
      .select('*,users!vendors_user_id_fkey(id,email),vendor_live_sessions(id,is_active,start_time,end_time)', { count: 'exact' })

    // Apply filters - Enhanced search across all relevant vendor fields
    if (search) {
      query = query.or(`
        business_name.ilike.%${search}%,
        description.ilike.%${search}%,
        business_type.ilike.%${search}%,
        subcategory.ilike.%${search}%,
        address.ilike.%${search}%,
        city.ilike.%${search}%,
        tags.ilike.%${search}%,
        contact_email.ilike.%${search}%
      `)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    // Apply pagination and get both data and count in a single query
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: vendors, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors:', error)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in vendors API:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const supabase = createSupabaseServerClient(cookies())
    const body = await request.json()
    const { vendorId, updates } = body

    if (!vendorId) {
      return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    // Only allow specific fields to be updated
    const allowedUpdates = {
      status: updates.status,
      admin_notes: updates.admin_notes,
      rejection_reason: updates.rejection_reason
    }

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
        delete allowedUpdates[key as keyof typeof allowedUpdates]
      }
    })

    const { data, error } = await supabase
      .from('vendors')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor:', error)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    return NextResponse.json({ vendor: data })
  } catch (error) {
    console.error('Error in vendor update API:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}