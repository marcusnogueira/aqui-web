import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticatedServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '@/lib/constants'

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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'live', 'offline', 'approved', 'pending'

    let query = supabase
      .from('vendors')
      .select(`
        *,
        users(id, email, full_name),
        vendor_live_sessions(id, is_active, start_time, end_time, latitude, longitude, address)
      `)

    // Apply search filter
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply status filters
    if (status === 'approved') {
      query = query.eq('is_approved', true)
    } else if (status === 'pending') {
      query = query.eq('is_approved', false)
    }
    // Note: 'live' and 'offline' filters are handled in the frontend since they depend on live sessions

    const { data: vendors, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors for status control:', error)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Error in vendor status API:', error)
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
    const { vendorId, action, value } = body

    if (!vendorId || !action) {
      return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    let result
    let message = 'Vendor status updated successfully'

    switch (action) {
      case 'approve':
        result = await supabase
          .from('vendors')
          .update({
            is_approved: value,
            approved_at: value ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', vendorId)
          .select()
          .single()
        
        message = value ? 'Vendor approved successfully' : 'Vendor approval revoked'
        break

      case 'toggle_active':
        result = await supabase
          .from('vendors')
          .update({
            is_active: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', vendorId)
          .select()
          .single()
        
        message = value ? 'Vendor activated successfully' : 'Vendor deactivated successfully'
        break

      case 'stop_live_session':
        // Stop all active live sessions for this vendor
        result = await supabase
          .from('vendor_live_sessions')
          .update({
            is_active: false,
            end_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .select()
        
        message = 'Live sessions stopped successfully'
        break

      case 'force_start_session':
        // This is for testing - create a new live session
        const { latitude, longitude, address } = value || {}
        
        if (!latitude || !longitude) {
          return NextResponse.json({ error: 'Location coordinates required for live session' }, { status: HTTP_STATUS.BAD_REQUEST })
        }
        
        // First stop any existing active sessions
        await supabase
          .from('vendor_live_sessions')
          .update({
            is_active: false,
            end_time: new Date().toISOString()
          })
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
        
        // Create new live session
        result = await supabase
          .from('vendor_live_sessions')
          .insert({
            vendor_id: vendorId,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address: address || 'Test Location',
            is_active: true,
            start_time: new Date().toISOString(),
            auto_end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            was_scheduled_duration: 120, // 2 hours in minutes
            estimated_customers: 10
          })
          .select()
          .single()
        
        message = 'Live session started successfully'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    if (result?.error) {
      console.error(`Error performing action ${action}:`, result.error)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    return NextResponse.json({ message, data: result?.data })
  } catch (error) {
    console.error('Error in vendor status update API:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}