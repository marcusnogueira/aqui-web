import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient(await cookies())
  
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', adminUser.adminId) // Can only mark own notifications as read
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json(
        { error: 'Notification not found or not authorized' },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  } finally {
    // Always clear user context when done
    await clearUserContext(supabase)
  }
}
