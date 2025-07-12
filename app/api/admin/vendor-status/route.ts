import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '@/lib/constants'

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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'live', 'offline', 'approved', 'pending'

    let query = supabase
      .from('vendors')
      .select(`
        *,
        users!vendors_user_id_fkey(id, email),
        vendor_live_sessions(id, is_active, start_time, end_time, latitude, longitude, address)
      `)

    // Apply search filter - Enhanced search across all relevant vendor fields
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

    // Apply status filters
    if (status === 'approved') {
      query = query.eq('status', 'approved')
    } else if (status === 'pending') {
      query = query.eq('status', 'pending')
    } else if (status === 'rejected') {
      query = query.eq('status', 'rejected')
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
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const supabase = createSupabaseServerClient(cookies())
    const body = await request.json()
    const { vendorId, action, value, rejectionReason } = body

    if (!vendorId || !action) {
      return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    let result
    let message = 'Vendor status updated successfully'

    switch (action) {
      case 'approve':
        const updateData: any = {
          status: value ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        }
        
        if (value) {
          updateData.approved_by = adminUser.adminId
          updateData.approved_at = new Date().toISOString()
          updateData.rejection_reason = null
        } else {
          updateData.approved_by = null
          updateData.approved_at = null
          updateData.rejection_reason = rejectionReason || null
        }
        
        result = await supabase
          .from('vendors')
          .update(updateData)
          .eq('id', vendorId)
          .select()
          .single()
        
        message = value ? 'Vendor approved successfully' : 'Vendor rejected successfully'
        
        // Create notification for vendor about approval/rejection
        if (result?.data) {
          const notificationType = value ? 'vendor_approved' : 'vendor_rejected'
          const notificationMessage = value 
            ? `Congratulations! Your vendor application for "${result.data.business_name}" has been approved.`
            : `Your vendor application for "${result.data.business_name}" has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
          
          await supabase
            .from('notifications')
            .insert({
              recipient_id: result.data.user_id,
              type: notificationType,
              message: notificationMessage,
              link: value ? '/vendor/dashboard' : '/vendor/onboarding'
            })
        }
        break

      case 'toggle_active':
        // This action is no longer supported with the new status system
        return NextResponse.json({ error: 'Action not supported with new status system' }, { status: HTTP_STATUS.BAD_REQUEST })

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