#!/usr/bin/env node

/**
 * Test the new coordinate extraction function
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simulate the new extractAnyCoordinatesFromVendor function
function extractAnyCoordinatesFromVendor(vendor) {
  try {
    // First try live session coordinates
    if (vendor.live_session && 
        vendor.live_session.is_active &&
        typeof vendor.live_session.latitude === 'number' && 
        typeof vendor.live_session.longitude === 'number') {
      return { 
        lat: vendor.live_session.latitude, 
        lng: vendor.live_session.longitude 
      }
    }
    
    // Then try static location coordinates
    if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
      return { 
        lat: vendor.latitude, 
        lng: vendor.longitude 
      }
    }
    
    // No coordinates available
    return null
  } catch (error) {
    console.warn('Error extracting coordinates from vendor:', error)
    return null
  }
}

async function testCoordinateExtraction() {
  console.log('🧪 Testing Coordinate Extraction...')
  
  try {
    // Get all vendors with their live sessions
    const { data: vendors, error } = await supabase
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
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }
    
    console.log(`\nTesting coordinate extraction for ${vendors?.length || 0} vendors:`)
    
    vendors?.forEach(vendor => {
      const sessions = Array.isArray(vendor.vendor_live_sessions) 
        ? vendor.vendor_live_sessions 
        : (vendor.vendor_live_sessions ? [vendor.vendor_live_sessions] : [])
      
      const activeSession = sessions.find(s => s.is_active)
      
      // Create vendor object for testing
      const testVendor = {
        ...vendor,
        live_session: activeSession || null
      }
      
      const coordinates = extractAnyCoordinatesFromVendor(testVendor)
      
      console.log(`\n  ${vendor.business_name}:`)
      console.log(`    Live Session: ${activeSession ? 'YES' : 'NO'}`)
      console.log(`    Static Location: ${vendor.latitude && vendor.longitude ? 'YES' : 'NO'}`)
      console.log(`    Extracted Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'NONE'}`)
      
      if (activeSession) {
        console.log(`    Live Coords: ${activeSession.latitude}, ${activeSession.longitude}`)
      }
      if (vendor.latitude && vendor.longitude) {
        console.log(`    Static Coords: ${vendor.latitude}, ${vendor.longitude}`)
      }
    })
    
    const vendorsWithCoords = vendors?.filter(vendor => {
      const sessions = Array.isArray(vendor.vendor_live_sessions) 
        ? vendor.vendor_live_sessions 
        : (vendor.vendor_live_sessions ? [vendor.vendor_live_sessions] : [])
      
      const activeSession = sessions.find(s => s.is_active)
      const testVendor = { ...vendor, live_session: activeSession || null }
      return extractAnyCoordinatesFromVendor(testVendor) !== null
    })
    
    console.log(`\n✅ Summary:`)
    console.log(`   Total vendors: ${vendors?.length || 0}`)
    console.log(`   With extractable coordinates: ${vendorsWithCoords?.length || 0}`)
    console.log(`   Without coordinates: ${(vendors?.length || 0) - (vendorsWithCoords?.length || 0)}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Testing Coordinate Extraction Fix')
  console.log('====================================')
  
  await testCoordinateExtraction()
  
  console.log('\n✅ Test completed!')
}

if (require.main === module) {
  main().catch(console.error)
}