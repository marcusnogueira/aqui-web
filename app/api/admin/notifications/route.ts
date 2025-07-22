import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const supabase = createSupabaseServerClient(await cookies())
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for all notifications (admin can see all)
    let query = supabase
      .from('notifications')
      .select(`
        *,
        users:recipient_id (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply type filter if specified
    if (type && type !== 'all') {
      if (type === 'unread') {
        query = query.eq('is_read', false)
      } else {
        query = query.eq('type', type as any)
      }
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        limit,
        offset,
        total: notifications?.length || 0
      }
    })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const supabase = createSupabaseServerClient(await cookies())
    const body = await request.json()
    const { notificationId, action } = body

    if (!action) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    let result
    let message

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json(
            { error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS },
            { status: HTTP_STATUS.BAD_REQUEST }
          )
        }
        
        result = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .select()
          .single()
        
        if (result.error) {
          return NextResponse.json(
            { error: 'Notification not found' },
            { status: HTTP_STATUS.NOT_FOUND }
          )
        }
        
        message = 'Notification marked as read'
        break

      case 'mark_all_read':
        result = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false)
        
        if (result.error) {
          console.error('Error marking all notifications as read:', result.error)
          return NextResponse.json(
            { error: ERROR_MESSAGES.INTERNAL_ERROR },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
          )
        }
        
        message = 'All notifications marked as read'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
    }

    return NextResponse.json({
      message,
      data: result?.data
    })
  } catch (error) {
    console.error('Error in admin notifications PATCH:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
