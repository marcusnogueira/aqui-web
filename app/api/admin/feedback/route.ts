import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { cookies } from 'next/headers'

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
    const { searchParams } = new URL(request.url)
    
    // Check if this is a stats-only request
    const statsOnly = searchParams.get('stats') === 'true'
    
    if (statsOnly) {
      // Get all feedback for stats calculation
      const { data: allFeedback, error: statsError } = await supabase
        .from('vendor_feedback')
        .select('status, feedback_type')
      
      if (statsError) {
        console.error('Error fetching feedback stats:', statsError)
        return NextResponse.json(
          { error: ERROR_MESSAGES.INTERNAL_ERROR },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        )
      }

      const stats = {
        total: allFeedback.length,
        pending: allFeedback.filter(f => f.status === 'pending').length,
        reviewed: allFeedback.filter(f => f.status === 'reviewed').length,
        resolved: allFeedback.filter(f => f.status === 'resolved').length,
        dismissed: allFeedback.filter(f => f.status === 'dismissed').length,
        by_type: {
          GENERAL: allFeedback.filter(f => f.feedback_type === 'GENERAL').length,
          FEATURE: allFeedback.filter(f => f.feedback_type === 'FEATURE').length,
          BUG: allFeedback.filter(f => f.feedback_type === 'BUG').length
        },
        avg_rating: null // Not available in current schema
      }

      return NextResponse.json({
        success: true,
        stats
      })
    }
    
    // Parse query parameters for regular requests
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const feedbackType = searchParams.get('type')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('vendor_feedback')
      .select(`
        *,
        vendors!inner(
          id,
          business_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (feedbackType && feedbackType !== 'all') {
      query = query.eq('feedback_type', feedbackType)
    }
    
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    
    if (search) {
      query = query.or(`message.ilike.%${search}%,vendors.business_name.ilike.%${search}%`)
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('vendor_feedback')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error getting feedback count:', countError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Get paginated results
    const { data: feedback, error: feedbackError } = await query
      .range(offset, offset + limit - 1)
    
    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Transform data to match frontend expectations
    const transformedFeedback = feedback.map(item => ({
      id: item.id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendors?.business_name || 'Unknown Vendor',
      customer_id: null, // Not available in current schema
      customer_name: 'Anonymous', // Not available in current schema
      feedback_type: item.feedback_type || 'GENERAL',
      subject: item.feedback_type || 'General Feedback', // Using feedback_type as subject
      message: item.message || '',
      rating: null, // Not available in current schema
      status: item.status || 'pending',
      priority: item.priority || 'medium',
      created_at: item.created_at,
      updated_at: item.created_at, // Using created_at as fallback
      admin_notes: null, // Not available in current schema
      resolved_by: null, // Not available in current schema
      resolved_at: null // Not available in current schema
    }))

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      feedback: transformedFeedback,
      totalPages,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const supabase = createSupabaseServerClient(cookies())

    // Update feedback status
    const { data, error } = await supabase
      .from('vendor_feedback')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating feedback:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({
      success: true,
      feedback: data[0]
    })

  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}