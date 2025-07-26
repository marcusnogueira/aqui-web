import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Removed problematic getPlatformSettings function

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting go-live API...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    const { latitude, longitude, address, duration } = await request.json()

    console.log('📋 Go-live data:', { latitude, longitude, address, duration })

    if (!latitude || !longitude) {
      console.error('❌ Missing location data')
      return NextResponse.json({ error: 'Location coordinates are required' }, { status: 400 })
    }

    // Use service role client directly to avoid RLS issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('✅ Using service role client to bypass RLS')

    // First, find the vendor for this user
    console.log('🔍 Finding vendor for user...')
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, status')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError || !vendor) {
      console.error('❌ Failed to find vendor:', vendorError)
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    console.log('✅ Vendor found:', { id: vendor.id, name: vendor.business_name, status: vendor.status })

    // Check if vendor is approved
    if (vendor.status !== 'active' && vendor.status !== 'approved') {
      console.error('❌ Vendor not approved:', vendor.status)
      return NextResponse.json({ 
        error: `Cannot go live. Vendor status is "${vendor.status}". Please wait for approval.` 
      }, { status: 400 })
    }

    console.log('✅ Vendor can go live with status:', vendor.status)

    // Check for existing active session
    console.log('🔍 Checking for existing active session...')
    const { data: existingSession, error: checkError } = await supabase
      .from('vendor_live_sessions')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing session:', checkError)
      return NextResponse.json({ error: 'Failed to check existing session' }, { status: 500 })
    }

    if (existingSession) {
      console.log('❌ Active session already exists')
      return NextResponse.json({ 
        error: 'You already have an active live session. Please end it before starting a new one.' 
      }, { status: 400 })
    }

    // Calculate auto end time if duration provided
    const autoEndTime = duration ? 
      new Date(Date.now() + duration * 60 * 1000).toISOString() : null

    // Insert new live session using service role (bypasses RLS)
    console.log('💾 Creating new live session...')
    const { data: newSession, error: insertError } = await supabase
      .from('vendor_live_sessions')
      .insert({
        vendor_id: vendor.id,
        latitude: latitude,
        longitude: longitude,
        address: address || null,
        start_time: new Date().toISOString(),
        end_time: null,
        auto_end_time: autoEndTime,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to create live session:', insertError)
      return NextResponse.json({ 
        error: 'Failed to start live session', 
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ Live session started successfully:', newSession.id)

    return NextResponse.json({ 
      success: true,
      session: newSession,
      message: 'Live session started successfully!'
    })

  } catch (error) {
    console.error('❌ Go-live error:', error)
    
    return NextResponse.json(
      { error: `Failed to start live session: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// Removed problematic checkVendorCanGoLive helper function

// DELETE: End live session
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 Starting end-live API...')
    console.log('🔄 Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      console.error('❌ Session object:', session)
      return NextResponse.json({ 
        error: 'Not authenticated',
        debug: 'No valid session found'
      }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    // Always use service role client for reliability
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('✅ Using service role client for DELETE operation')

    // Find the vendor for this user
    console.log('🔍 Finding vendor for user:', session.user.id)
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, user_id')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError) {
      console.error('❌ Vendor query error:', vendorError)
      return NextResponse.json({ 
        error: 'Database error finding vendor',
        details: vendorError.message,
        debug: { userId: session.user.id }
      }, { status: 500 })
    }

    if (!vendor) {
      console.error('❌ No vendor found for user:', session.user.id)
      return NextResponse.json({ 
        error: 'Vendor profile not found',
        debug: { userId: session.user.id }
      }, { status: 404 })
    }

    console.log('✅ Vendor found:', { 
      id: vendor.id, 
      name: vendor.business_name,
      userId: vendor.user_id 
    })

    // Check for active session before trying to end it
    console.log('🔍 Checking for active session...')
    const { data: activeSession, error: checkError } = await supabase
      .from('vendor_live_sessions')
      .select('id, is_active, start_time')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking active session:', checkError)
      return NextResponse.json({ 
        error: 'Database error checking active session',
        details: checkError.message 
      }, { status: 500 })
    }

    if (!activeSession) {
      console.log('⚠️ No active session found for vendor:', vendor.id)
      return NextResponse.json({ 
        error: 'No active live session found to end',
        message: 'There is no active live session to end. The session may have already been ended or expired.',
        debug: { vendorId: vendor.id }
      }, { status: 404 })
    }

    console.log('✅ Active session found:', {
      sessionId: activeSession.id,
      startTime: activeSession.start_time
    })

    // End the active session
    console.log('🛑 Ending active live session...')
    const { data: updatedSessions, error: updateError } = await supabase
      .from('vendor_live_sessions')
      .update({
        end_time: new Date().toISOString(),
        is_active: false,
        ended_by: 'vendor'
      })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .select()

    if (updateError) {
      console.error('❌ Failed to end live session:', updateError)
      return NextResponse.json({ 
        error: 'Failed to end live session', 
        details: updateError.message,
        debug: { vendorId: vendor.id }
      }, { status: 500 })
    }

    // Check if any sessions were actually updated
    if (!updatedSessions || updatedSessions.length === 0) {
      console.log('⚠️ No sessions were updated (race condition?)')
      return NextResponse.json({ 
        error: 'No active live session found to end',
        message: 'The session may have been ended by another request or expired.',
        debug: { vendorId: vendor.id, expectedSessionId: activeSession.id }
      }, { status: 404 })
    }

    const updatedSession = updatedSessions[0]
    console.log('✅ Live session ended successfully:', {
      sessionId: updatedSession.id,
      endTime: updatedSession.end_time
    })

    return NextResponse.json({ 
      success: true,
      session: updatedSession,
      message: 'Live session ended successfully!',
      debug: {
        vendorId: vendor.id,
        sessionId: updatedSession.id,
        endedAt: updatedSession.end_time
      }
    })

  } catch (error) {
    console.error('❌ End-live error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: `Failed to end live session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}