import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function getPlatformSettings(supabase: any) {
  // Get platform settings to check auto-approval
  const { data: settings } = await supabase
    .from('platform_settings_broken')
    .select('allow_auto_vendor_approval, require_vendor_approval')
    .eq('id', true)
    .single()
  
  return settings || { allow_auto_vendor_approval: false, require_vendor_approval: true }
}

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

    // Get platform settings
    const platformSettings = await getPlatformSettings(supabase)
    console.log('📋 Platform settings:', platformSettings)

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

    // Check vendor approval status with platform settings logic
    const canGoLive = checkVendorCanGoLive(vendor.status, platformSettings)
    if (!canGoLive.allowed) {
      console.error('❌ Vendor cannot go live:', canGoLive.reason)
      return NextResponse.json({ 
        error: canGoLive.reason 
      }, { status: 400 })
    }

    console.log('✅ Vendor can go live:', canGoLive.reason)

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

// Helper function to determine if vendor can go live based on status and platform settings
function checkVendorCanGoLive(vendorStatus: string, platformSettings: any) {
  // Clean and normalize the vendor status to handle potential whitespace issues
  const cleanStatus = vendorStatus?.trim()?.toLowerCase()
  
  console.log('🔍 Vendor status check:', {
    original: vendorStatus,
    cleaned: cleanStatus,
    originalLength: vendorStatus?.length,
    cleanedLength: cleanStatus?.length,
    platformSettings
  })
  
  // If vendor approval is not required, allow any vendor to go live
  if (!platformSettings.require_vendor_approval) {
    console.log('✅ Vendor approval not required - allowing go live')
    return {
      allowed: true,
      reason: 'Vendor approval not required'
    }
  }
  
  // If auto-approval is enabled, allow pending vendors to go live
  if (platformSettings.allow_auto_vendor_approval && cleanStatus === 'pending') {
    console.log('✅ Auto-approval enabled for pending vendor')
    return {
      allowed: true,
      reason: 'Auto-approval enabled: pending vendors can go live'
    }
  }
  
  // Standard approval check - both 'approved' and 'active' vendors can go live
  if (cleanStatus === 'approved' || cleanStatus === 'active') {
    console.log('✅ Vendor has approved/active status')
    return {
      allowed: true,
      reason: 'Vendor is approved and can go live'
    }
  }
  
  // Additional debugging for edge cases
  console.log('❌ Vendor cannot go live:', {
    cleanStatus,
    isApproved: cleanStatus === 'approved',
    isActive: cleanStatus === 'active',
    requireApproval: platformSettings.require_vendor_approval,
    allowAutoApproval: platformSettings.allow_auto_vendor_approval
  })
  
  // Block inactive vendors
  return {
    allowed: false,
    reason: `Cannot go live. Your vendor status is "${vendorStatus}". ${
      platformSettings.require_vendor_approval 
        ? 'Please wait for admin approval or contact support.' 
        : 'Please complete your vendor profile.'
    }`
  }
}

// DELETE: End live session
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