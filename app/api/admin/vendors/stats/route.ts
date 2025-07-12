import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { STATS_TIME_RANGES, ERROR_MESSAGES, HTTP_STATUS, getTimeAgoISO } from '@/lib/constants'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'



export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED })
    }

    const supabase = createSupabaseServerClient(cookies())

    // Get vendor counts by status
    const { data: vendorStats, error: vendorError } = await supabase
      .from('vendors')
      .select('status')

    if (vendorError) {
      console.error('Error fetching vendor stats:', vendorError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    // Calculate statistics
    const stats = {
      total: vendorStats.length,
      approved: vendorStats.filter(v => v.status === 'approved').length,
      pending: vendorStats.filter(v => v.status === 'pending').length,
      rejected: vendorStats.filter(v => v.status === 'rejected').length
    }

    // Get live session statistics
    const { data: liveSessions, error: sessionError } = await supabase
      .from('vendor_live_sessions')
      .select('is_active, start_time, end_time, latitude, longitude')
      .gte('start_time', getTimeAgoISO(1)) // Last 24 hours
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (sessionError) {
      console.error('Error fetching live session stats:', sessionError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    const sessionStats = {
      currentlyLive: liveSessions.filter(s => s.is_active).length,
      totalSessions24h: liveSessions.length,
      averageSessionDuration: calculateAverageSessionDuration(liveSessions)
    }

    // Get recent vendor registrations (last 7 days)
    const sevenDaysAgo = getTimeAgoISO(7)
    const { data: recentVendors, error: recentError } = await supabase
      .from('vendors')
      .select('created_at')
      .gte('created_at', sevenDaysAgo)

    if (recentError) {
      console.error('Error fetching recent vendors:', recentError)
      return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }

    const recentStats = {
      newVendorsLast7Days: recentVendors.length,
      dailyRegistrations: calculateDailyRegistrations(recentVendors)
    }

    return NextResponse.json({
      vendors: stats,
      sessions: sessionStats,
      recent: recentStats
    })
  } catch (error) {
    console.error('Error in vendor stats API:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}

function calculateAverageSessionDuration(sessions: any[]): number {
  const completedSessions = sessions.filter(s => !s.is_active && s.end_time)
  
  if (completedSessions.length === 0) return 0
  
  const totalDuration = completedSessions.reduce((sum, session) => {
    const start = new Date(session.start_time).getTime()
    const end = new Date(session.end_time).getTime()
    return sum + (end - start)
  }, 0)
  
  return Math.round(totalDuration / completedSessions.length / (1000 * 60)) // Return in minutes
}

function calculateDailyRegistrations(vendors: any[]): { date: string; count: number }[] {
  const dailyCounts: { [key: string]: number } = {}
  
  vendors.forEach(vendor => {
    const date = new Date(vendor.created_at).toISOString().split('T')[0]
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })
  
  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}