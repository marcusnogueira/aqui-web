import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
}

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_REQUEST: 'Invalid request parameters',
  INTERNAL_ERROR: 'Internal server error'
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const supabase = createSupabaseServerClient(cookies())
    
    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)
    
    const { searchParams } = new URL(request.url)
    
    // Parse date range parameter (7d, 30d, 90d)
    const dateRange = searchParams.get('dateRange') || '7d'
    const days = parseInt(dateRange.replace('d', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    try {
      // Get user growth data
      const { data: userGrowthData, error: userGrowthError } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true })

      if (userGrowthError) {
        console.error('Error fetching user growth:', userGrowthError)
      }

      // Get vendor growth data
      const { data: vendorGrowthData, error: vendorGrowthError } = await supabase
        .from('vendors')
        .select('created_at')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true })

      if (vendorGrowthError) {
        console.error('Error fetching vendor growth:', vendorGrowthError)
      }

      // Get total counts
      const { count: totalUsers, error: usersCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: totalVendors, error: vendorsCountError } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })

      const { count: activeVendors, error: activeVendorsError } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // Get vendor live sessions data
      const { data: liveSessionsData, error: liveSessionsError } = await supabase
        .from('vendor_live_sessions')
        .select('start_time, end_time, vendor_id')
        .gte('start_time', startDateStr)
        .order('start_time', { ascending: true })

      if (liveSessionsError) {
        console.error('Error fetching live sessions:', liveSessionsError)
      }

      // Get vendor feedback data
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('vendor_feedback')
        .select('created_at, feedback_type, status')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true })

      if (feedbackError) {
        console.error('Error fetching feedback:', feedbackError)
      }

      // Process user growth data
      const userGrowth = processUserGrowthData(userGrowthData || [], days)
      
      // Process vendor growth data
      const vendorGrowth = processVendorGrowthData(vendorGrowthData || [], days)

      // Process live sessions data
      const liveSessionsStats = processLiveSessionsData(liveSessionsData || [], days)

      // Process feedback data
      const feedbackStats = processFeedbackData(feedbackData || [])

      // Calculate revenue (placeholder - would need transaction data)
      const revenueData = generatePlaceholderRevenue(days)

      // Calculate top vendors (based on live sessions)
      const topVendors = await getTopVendors(supabase, startDateStr)

      const analyticsData = {
        userGrowth,
        vendorGrowth,
        liveSessionsStats,
        feedbackStats,
        revenueData,
        topVendors,
        summary: {
          totalUsers: totalUsers || 0,
          totalVendors: totalVendors || 0,
          activeVendors: activeVendors || 0,
          totalLiveSessions: liveSessionsData?.length || 0,
          totalFeedback: feedbackData?.length || 0
        }
      }

      return NextResponse.json({
        success: true,
        data: analyticsData,
        dateRange,
        generatedAt: new Date().toISOString()
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    } finally {
      // Always clear user context when done
      await clearUserContext(supabase)
    }

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Helper function to process user growth data
function processUserGrowthData(data: any[], days: number) {
  const result = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = data.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0]
      return itemDate === dateStr
    }).length
    
    result.push({
      date: dateStr,
      users: count
    })
  }
  
  return result
}

// Helper function to process vendor growth data
function processVendorGrowthData(data: any[], days: number) {
  const result = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = data.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0]
      return itemDate === dateStr
    }).length
    
    result.push({
      date: dateStr,
      vendors: count
    })
  }
  
  return result
}

// Helper function to process live sessions data
function processLiveSessionsData(data: any[], days: number) {
  const result = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const sessionsOnDate = data.filter(session => {
      const sessionDate = new Date(session.start_time).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
    
    const totalDuration = sessionsOnDate.reduce((sum, session) => {
      if (session.end_time) {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime()
        return sum + (duration / (1000 * 60)) // Convert to minutes
      }
      return sum
    }, 0)
    
    result.push({
      date: dateStr,
      sessions: sessionsOnDate.length,
      totalDuration: Math.round(totalDuration),
      averageDuration: sessionsOnDate.length > 0 ? Math.round(totalDuration / sessionsOnDate.length) : 0
    })
  }
  
  return result
}

// Helper function to process feedback data
function processFeedbackData(data: any[]) {
  const byType = {
    GENERAL: data.filter(f => f.feedback_type === 'GENERAL').length,
    FEATURE: data.filter(f => f.feedback_type === 'FEATURE').length,
    BUG: data.filter(f => f.feedback_type === 'BUG').length
  }
  
  const byStatus = {
    pending: data.filter(f => f.status === 'pending').length,
    reviewed: data.filter(f => f.status === 'reviewed').length,
    resolved: data.filter(f => f.status === 'resolved').length,
    dismissed: data.filter(f => f.status === 'dismissed').length
  }
  
  return {
    total: data.length,
    byType,
    byStatus
  }
}

// Helper function to generate placeholder revenue data
function generatePlaceholderRevenue(days: number) {
  const result = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Generate realistic-looking revenue data
    const baseRevenue = 1000 + Math.random() * 2000
    const weekendMultiplier = [0, 6].includes(date.getDay()) ? 1.3 : 1.0
    const revenue = Math.round(baseRevenue * weekendMultiplier)
    
    result.push({
      date: dateStr,
      revenue,
      transactions: Math.round(revenue / 25) // Assuming avg transaction of $25
    })
  }
  
  return result
}

// Helper function to get top vendors
async function getTopVendors(supabase: any, startDate: string) {
  try {
    const { data: vendorSessions, error } = await supabase
      .from('vendor_live_sessions')
      .select(`
        vendor_id,
        vendors!inner(
          id,
          business_name,
          business_type
        )
      `)
      .gte('start_time', startDate)
    
    if (error) {
      console.error('Error fetching top vendors:', error)
      return []
    }
    
    // Count sessions per vendor
    const vendorCounts = vendorSessions.reduce((acc: any, session: any) => {
      const vendorId = session.vendor_id
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: session.vendors,
          sessions: 0
        }
      }
      acc[vendorId].sessions++
      return acc
    }, {})
    
    // Sort by session count and take top 5
    return Object.values(vendorCounts)
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 5)
      .map((item: any) => ({
        id: item.vendor.id,
        name: item.vendor.business_name,
        type: item.vendor.business_type,
        sessions: item.sessions,
        revenue: item.sessions * 150 // Placeholder calculation
      }))
    
  } catch (error) {
    console.error('Error in getTopVendors:', error)
    return []
  }
}