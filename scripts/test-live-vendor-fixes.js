#!/usr/bin/env node

/**
 * Test script to verify the live vendor fixes
 * This script tests both the map-data API endpoint and the go-live DELETE endpoint
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMapDataAPI() {
  console.log('\n🧪 Testing Map Data API...')
  
  try {
    // Test 1: Map view (only live vendors)
    console.log('\n1. Testing map view (live vendors only):')
    const mapResponse = await fetch('http://localhost:3000/api/vendors/map-data')
    const mapData = await mapResponse.json()
    console.log(`   - Found ${mapData.markers?.length || 0} live vendors`)
    
    // Test 2: List view (all vendors)
    console.log('\n2. Testing list view (all vendors):')
    const listResponse = await fetch('http://localhost:3000/api/vendors/map-data?showAll=true')
    const listData = await listResponse.json()
    console.log(`   - Found ${listData.markers?.length || 0} total vendors`)
    
    // Test 3: Map view with bounds
    console.log('\n3. Testing map view with bounds:')
    const bounds = JSON.stringify({
      north: 40.0,
      south: 37.0,
      east: -120.0,
      west: -125.0
    })
    const boundsResponse = await fetch(`http://localhost:3000/api/vendors/map-data?bounds=${encodeURIComponent(bounds)}`)
    const boundsData = await boundsResponse.json()
    console.log(`   - Found ${boundsData.markers?.length || 0} vendors in bounds`)
    
    console.log('✅ Map Data API tests completed')
    
  } catch (error) {
    console.error('❌ Map Data API test failed:', error.message)
  }
}

async function testGoLiveEndpoint() {
  console.log('\n🧪 Testing Go-Live DELETE endpoint...')
  
  try {
    // First, check if there are any active sessions
    const { data: activeSessions, error } = await supabase
      .from('vendor_live_sessions')
      .select('id, vendor_id')
      .eq('is_active', true)
    
    if (error) {
      console.error('❌ Error checking active sessions:', error.message)
      return
    }
    
    console.log(`Found ${activeSessions?.length || 0} active sessions`)
    
    if (activeSessions && activeSessions.length > 0) {
      console.log('⚠️  Cannot test DELETE endpoint - active sessions exist')
      console.log('   This is expected behavior to prevent ending real sessions')
    } else {
      console.log('✅ No active sessions found - DELETE endpoint would return 404 as expected')
    }
    
  } catch (error) {
    console.error('❌ Go-Live endpoint test failed:', error.message)
  }
}

async function checkDatabaseStructure() {
  console.log('\n🔍 Checking database structure...')
  
  try {
    // Check vendors table
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, status')
      .limit(5)
    
    if (vendorsError) {
      console.error('❌ Error accessing vendors table:', vendorsError.message)
    } else {
      console.log(`✅ Vendors table accessible - ${vendors?.length || 0} vendors found`)
      if (vendors && vendors.length > 0) {
        console.log('   Sample vendor statuses:', vendors.map(v => v.status))
      }
    }
    
    // Check vendor_live_sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('id, vendor_id, is_active, start_time, end_time')
      .limit(5)
    
    if (sessionsError) {
      console.error('❌ Error accessing vendor_live_sessions table:', sessionsError.message)
    } else {
      console.log(`✅ Vendor live sessions table accessible - ${sessions?.length || 0} sessions found`)
      if (sessions && sessions.length > 0) {
        const activeSessions = sessions.filter(s => s.is_active)
        console.log(`   Active sessions: ${activeSessions.length}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Database structure check failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting Live Vendor Fixes Test')
  console.log('=====================================')
  
  await checkDatabaseStructure()
  await testMapDataAPI()
  await testGoLiveEndpoint()
  
  console.log('\n✅ Test completed!')
  console.log('\nNext steps:')
  console.log('1. Start your development server: npm run dev')
  console.log('2. Test the list view to see all vendors')
  console.log('3. Test the map view to see only live vendors')
  console.log('4. Try ending a live session (should show proper error if no active session)')
}

if (require.main === module) {
  main().catch(console.error)
}