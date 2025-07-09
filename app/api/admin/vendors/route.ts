import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticatedServer } from '@/lib/admin-auth-server'
import { PAGINATION, VENDOR_STATUSES, ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '@/lib/constants'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!(await isAdminAuthenticatedServer(request))) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || PAGINATION.DEFAULT_PAGE.toString())
    const limit = parseInt(searchParams.get('limit') || PAGINATION.DEFAULT_LIMIT.toString())
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'approved', 'pending', 'rejected'
    const active = searchParams.get('active') // 'true', 'false'

    let query = supabase
      .from('vendors')
      .select('*,users(id,email,full_name),vendor_live_sessions(id,is_active,start_time,end_time)', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status === VENDOR_STATUSES.APPROVED) {
        query = query.eq('is_approved', true)
      } else if (status === VENDOR_STATUSES.PENDING) {
      query = query.eq('is_approved', false)
    }

    if (active === 'true') {
      query = query.eq('is_active', true)
    } else if (active === 'false') {
      query = query.eq('is_active', false)
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
    if (!(await isAdminAuthenticatedServer(request))) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const body = await request.json()
    const { vendorId, updates } = body

    if (!vendorId) {
      return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    // Only allow specific fields to be updated
    const allowedUpdates = {
      is_approved: updates.is_approved,
      is_active: updates.is_active,
      admin_notes: updates.admin_notes
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