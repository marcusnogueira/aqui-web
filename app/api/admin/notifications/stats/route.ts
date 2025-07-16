import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient(cookies())
  
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)

    // Get total notifications count
    const { count: total, error: totalError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total notifications:', totalError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Get unread notifications count
    const { count: unread, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (unreadError) {
      console.error('Error fetching unread notifications:', unreadError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Get vendor application notifications count
    const { count: vendor_applications, error: vendorAppError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vendor_application' as any)

    if (vendorAppError) {
      console.error('Error fetching vendor application notifications:', vendorAppError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Get vendor approved notifications count
    const { count: vendor_approved, error: vendorApprovedError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vendor_approved' as any)

    if (vendorApprovedError) {
      console.error('Error fetching vendor approved notifications:', vendorApprovedError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Get vendor rejected notifications count
    const { count: vendor_rejected, error: vendorRejectedError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vendor_rejected' as any)

    if (vendorRejectedError) {
      console.error('Error fetching vendor rejected notifications:', vendorRejectedError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({
      total: total || 0,
      unread: unread || 0,
      vendor_applications: vendor_applications || 0,
      vendor_approved: vendor_approved || 0,
      vendor_rejected: vendor_rejected || 0
    })

  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  } finally {
    // Always clear user context when done
    await clearUserContext(supabase)
  }
}