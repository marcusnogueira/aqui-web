import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET endpoint to fetch current platform settings
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const supabase = createSupabaseServerClient(cookies())

    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', true)
      .single()

    if (error) {
      console.error('Error fetching platform settings:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('Fetch platform settings error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT endpoint to update platform settings
export async function PUT(request: NextRequest) {
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await request.json()
    const { allow_auto_vendor_approval, maintenance_mode } = body

    // Validate input
    const updates: any = {}
    if (allow_auto_vendor_approval !== undefined) {
      if (typeof allow_auto_vendor_approval !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid value for allow_auto_vendor_approval' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
      updates.allow_auto_vendor_approval = allow_auto_vendor_approval
    }

    if (maintenance_mode !== undefined) {
      if (typeof maintenance_mode !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid value for maintenance_mode' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
      updates.maintenance_mode = maintenance_mode
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    updates.updated_at = new Date().toISOString()

    const supabase = createSupabaseServerClient(cookies())

    const { data, error } = await supabase
      .from('platform_settings')
      .update(updates)
      .eq('id', true)
      .select()
      .single()

    if (error) {
      console.error('Error updating platform settings:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('Update platform settings error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
