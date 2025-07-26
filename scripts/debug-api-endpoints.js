#!/usr/bin/env node

/**
 * Debug script to test API endpoints directly
 * This simulates the API calls to understand what's happening
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMapDataLogic() {
  console.log('\n🧪 Testing Map Data Logic Directly...')
  
  try {
    // Test 1: Get vendors with live sessions (map view logic)
    console.log('\n1. Testing map view logic (vendors with active live sessions):')
    const { data: liveVendors, error: liveError } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_live_sessions!inner(
          id,
          vendor_id,
          latitude,
          longitude,
          start_time,
          end_time,
          auto_end_time,
          is_active,
          created_at,
          address,
          ended_by,
          estimated_customers,
          was_scheduled_duration
        )
      `)
      .eq('vendor_live_sessions.is_active', true)
    
    if (liveError) {
      console.error('   ❌ Error:', liveError.message)
    } else {
      console.log(`   ✅ Found ${liveVendors?.length || 0} vendors with active live sessions`)
      liveVendors?.forEach(vendor => {
        const session = Array.isArray(vendor.vendor_live_sessions) ? vendor.vendor_live_sessions[0] : vendor.vendor_live_sessions
        console.log(`      - ${vendor.business_name}: ${session?.is_active ? 'ACTIVE' : 'INACTIVE'}`)
        if (session) {
          console.log(`        Coordinates: ${session.latitude}, ${session.longitude}`)
        }
      })
    }
    
    // Test 2: Get all active/approved vendors (list view logic)
    console.log('\n2. Testing list view logic (all active/approved vendors):')
    const { data: allVendors, error: allError } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_live_sessions(
          id,
          vendor_id,
          latitude,
          longitude,
          start_time,
          end_time,
          auto_end_time,
          is_active,
          created_at
        )
      `)
      .in('status', ['active', 'approved'])
    
    if (allError) {
      console.error('   ❌ Error:', allError.message)
    } else {
      console.log(`   ✅ Found ${allVendors?.length || 0} active/approved vendors`)
      allVendors?.forEach(vendor => {
        const sessions = Array.isArray(vendor.vendor_live_sessions) ? vendor.vendor_live_sessions : (vendor.vendor_live_sessions ? [vendor.vendor_live_sessions] : [])
        const activeSession = sessions.find(s => s.is_active)
        const hasLiveSession = !!activeSession
        const hasStaticLocation = vendor.latitude && vendor.longitude
        console.log(`      - ${vendor.business_name}:`)
        console.log(`        Status: ${vendor.status}`)
        console.log(`        Live Session: ${hasLiveSession ? 'YES' : 'NO'}`)
        console.log(`        Static Location: ${hasStaticLocation ? 'YES' : 'NO'}`)
        if (hasLiveSession && activeSession) {
          console.log(`        Live Coordinates: ${activeSession.latitude}, ${activeSession.longitude}`)
        }
        if (hasStaticLocation) {
          console.log(`        Static Coordinates: ${vendor.latitude}, ${vendor.longitude}`)
        }
      })
    }
    
    // Test 3: Check coordinate availability
    console.log('\n3. Coordinate availability analysis:')
    const vendorsWithCoords = allVendors?.filter(vendor => {
      const sessions = Array.isArray(vendor.vendor_live_sessions) ? vendor.vendor_live_sessions : (vendor.vendor_live_sessions ? [vendor.vendor_live_sessions] : [])
      const activeSession = sessions.find(s => s.is_active)
      const hasLiveCoords = activeSession && activeSession.latitude && activeSession.longitude
      const hasStaticCoords = vendor.latitude && vendor.longitude
      return hasLiveCoords || hasStaticCoords
    })
    
    console.log(`   ✅ ${vendorsWithCoords?.length || 0} vendors have usable coordinates`)
    console.log(`   ⚠️  ${(allVendors?.length || 0) - (vendorsWithCoords?.length || 0)} vendors have no coordinates`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function testGoLiveSessionLogic() {
  console.log('\n🧪 Testing Go-Live Session Logic...')
  
  try {
    // Check active sessions
    const { data: activeSessions, error } = await supabase
      .from('vendor_live_sessions')
      .select(`
        id,
        vendor_id,
        is_active,
        start_time,
        end_time,
        latitude,
        longitude,
        vendors(business_name, user_id)
      `)
      .eq('is_active', true)
    
    if (error) {
      console.error('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Found ${activeSessions?.length || 0} active sessions`)
      activeSessions?.forEach(session => {
        console.log(`      - Session ${session.id}:`)
        console.log(`        Vendor: ${session.vendors?.business_name}`)
        console.log(`        Started: ${new Date(session.start_time).toLocaleString()}`)
        console.log(`        Coordinates: ${session.latitude}, ${session.longitude}`)
      })
    }
    
    // Test ending a non-existent session (simulate the fix)
    console.log('\n   Testing session ending logic:')
    const fakeVendorId = '00000000-0000-0000-0000-000000000000'
    
    const { data: updateResult, error: updateError } = await supabase
      .from('vendor_live_sessions')
      .update({
        end_time: new Date().toISOString(),
        is_active: false,
        ended_by: 'vendor'
      })
      .eq('vendor_id', fakeVendorId)
      .eq('is_active', true)
      .select()
    
    if (updateError) {
      console.error('   ❌ Update error:', updateError.message)
    } else {
      console.log(`   ✅ Update completed, affected rows: ${updateResult?.length || 0}`)
      if (!updateResult || updateResult.length === 0) {
        console.log('   ✅ This would correctly return 404 - no active session found')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting API Endpoint Debug')
  console.log('===============================')
  
  await testMapDataLogic()
  await testGoLiveSessionLogic()
  
  console.log('\n✅ Debug completed!')
  console.log('\nKey findings:')
  console.log('- Check if vendors have coordinates (live session or static)')
  console.log('- Verify that list view shows all vendors with any coordinates')
  console.log('- Verify that map view shows only vendors with active live sessions')
  console.log('- Confirm that ending non-existent sessions returns proper error')
}

if (require.main === module) {
  main().catch(console.error)
}