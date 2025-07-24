import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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

    // Create Supabase client and set user context for RLS
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Set user context for RLS policies
    await supabase.rpc('set_current_user_context' as any, {
      user_id: session.user.id
    })

    console.log('✅ User context set for RLS')

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
    if (vendor.status !== 'active') {
      console.error('❌ Vendor not approved:', vendor.status)
      return NextResponse.json({ 
        error: `Cannot go live. Vendor status is "${vendor.status}". Please wait for approval.` 
      }, { status: 400 })
    }

    // Check for existing active session
    console.log('🔍 Checking for existing active session...')
    const { data: existingSession, error: checkError } = await supabase
      .from('vendor_live_sessions')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
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

    // Insert new live session
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

    // Clear user context
    await supabase.rpc('clear_current_user_context' as any)

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

// POST: End live session
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 Starting end-live API...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    // Create Supabase client and set user context for RLS
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Set user context for RLS policies
    await supabase.rpc('set_current_user_context' as any, {
      user_id: session.user.id
    })

    console.log('✅ User context set for RLS')

    // Find the vendor for this user
    console.log('🔍 Finding vendor for user...')
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError || !vendor) {
      console.error('❌ Failed to find vendor:', vendorError)
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    // End the active session
    console.log('🛑 Ending active live session...')
    const { data: updatedSession, error: updateError } = await supabase
      .from('vendor_live_sessions')
      .update({
        end_time: new Date().toISOString(),
        is_active: false,
        ended_by: 'vendor'
      })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to end live session:', updateError)
      return NextResponse.json({ 
        error: 'Failed to end live session', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Live session ended successfully')

    // Clear user context
    await supabase.rpc('clear_current_user_context' as any)

    return NextResponse.json({ 
      success: true,
      session: updatedSession,
      message: 'Live session ended successfully!'
    })

  } catch (error) {
    console.error('❌ End-live error:', error)
    return NextResponse.json(
      { error: `Failed to end live session: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}