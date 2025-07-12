import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticatedServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'
// Force dynamic rendering since we use authentication cookies
export const dynamic = 'force-dynamic'

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

    // Get total vendor count
    const { count: totalVendors, error: totalError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error getting total vendors:', totalError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Get approved vendor count
    const { count: approvedVendors, error: approvedError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)

    if (approvedError) {
      console.error('Error getting approved vendors:', approvedError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Get pending vendor count
    const { count: pendingVendors, error: pendingError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)

    if (pendingError) {
      console.error('Error getting pending vendors:', pendingError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Get active vendor count
    const { count: activeVendors, error: activeError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      console.error('Error getting active vendors:', activeError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Get currently live vendor count (vendors with active live sessions)
    const { data: liveVendors, error: liveError } = await supabase
      .from('vendor_live_sessions')
      .select('vendor_id')
      .eq('is_active', true)

    if (liveError) {
      console.error('Error getting live vendors:', liveError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Count unique vendors with active sessions
    const uniqueLiveVendors = new Set(liveVendors?.map(session => session.vendor_id) || [])
    const liveVendorCount = uniqueLiveVendors.size

    const stats = {
      total: totalVendors || 0,
      approved: approvedVendors || 0,
      pending: pendingVendors || 0,
      active: activeVendors || 0,
      live: liveVendorCount
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in vendor status stats API:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}