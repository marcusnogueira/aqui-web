import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticatedServer } from '@/lib/admin-auth-server'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticatedServer(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get vendor counts by status
    const { data: vendorStats, error: vendorError } = await supabase
      .from('vendors')
      .select('is_approved, is_active')

    if (vendorError) {
      console.error('Error fetching vendor stats:', vendorError)
      return NextResponse.json({ error: 'Failed to fetch vendor statistics' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      total: vendorStats.length,
      approved: vendorStats.filter(v => v.is_approved).length,
      pending: vendorStats.filter(v => !v.is_approved).length,
      active: vendorStats.filter(v => v.is_active).length,
      inactive: vendorStats.filter(v => !v.is_active).length
    }

    // Get live session statistics
    const { data: liveSessions, error: sessionError } = await supabase
      .from('vendor_live_sessions')
      .select('is_active, start_time, end_time, latitude, longitude')
      .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (sessionError) {
      console.error('Error fetching live session stats:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch session statistics' }, { status: 500 })
    }

    const sessionStats = {
      currentlyLive: liveSessions.filter(s => s.is_active).length,
      totalSessions24h: liveSessions.length,
      averageSessionDuration: calculateAverageSessionDuration(liveSessions)
    }

    // Get recent vendor registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentVendors, error: recentError } = await supabase
      .from('vendors')
      .select('created_at')
      .gte('created_at', sevenDaysAgo)

    if (recentError) {
      console.error('Error fetching recent vendors:', recentError)
      return NextResponse.json({ error: 'Failed to fetch recent vendor data' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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