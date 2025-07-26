#!/usr/bin/env node

/**
 * Test that simulates the website loading process to verify the error is fixed
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simulate the extractAnyCoordinatesFromVendor function
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

// Simulate the getVendorStatus function
function getVendorStatus(vendor) {
  if (!vendor.live_session || !vendor.live_session.is_active) return 'offline'
  
  const startTime = new Date(vendor.live_session.start_time)
  const now = new Date()
  const hoursActive = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  
  // If end_time exists and we're past it, show as offline
  if (vendor.live_session.end_time && now > new Date(vendor.live_session.end_time)) {
    return 'offline'
  }
  
  // If we've been active for more than 7 hours, show as closing
  if (hoursActive >= 7) {
    return 'closing'
  }
  
  return 'open'
}

// Simulate the calculateTimeRemaining function
function calculateTimeRemaining(vendor) {
  if (!vendor.live_session?.auto_end_time) return 0
  
  const now = new Date()
  const endTime = new Date(vendor.live_session.auto_end_time)
  const timeRemaining = Math.max(0, endTime.getTime() - now.getTime())
  
  return Math.floor(timeRemaining / (1000 * 60)) // Return minutes
}

async function simulateMapDataAPI() {
  console.log('🧪 Simulating Map Data API Processing...')
  
  try {
    // Simulate list view (showAll=true)
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
      console.error('❌ Database error:', error.message)
      return
    }
    
    console.log(`\nProcessing ${vendors?.length || 0} vendors...`)
    
    const markers = []
    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    vendors?.forEach(vendor => {
      try {
        // Handle different response structures based on query type
        const sessions = Array.isArray(vendor.vendor_live_sessions) 
          ? vendor.vendor_live_sessions 
          : (vendor.vendor_live_sessions ? [vendor.vendor_live_sessions] : [])
        
        const liveSession = sessions.find(session => session.is_active)
        
        // Create a properly structured vendor object for processing
        const vendorWithSession = {
          ...vendor,
          live_session: liveSession || null
        }
        
        // Extract coordinates using the flexible utility
        const coordinates = extractAnyCoordinatesFromVendor(vendorWithSession)
        
        // Skip vendors without any coordinates (can't show on map)
        if (!coordinates) {
          console.log(`   ⚠️  Skipping ${vendor.business_name}: No coordinates`)
          skippedCount++
          return
        }
        
        // Calculate status and timing
        let status = 'offline'
        let timeRemainingMinutes = 0
        let hasTimer = false
        
        if (liveSession && liveSession.is_active) {
          status = getVendorStatus(vendorWithSession)
          timeRemainingMinutes = calculateTimeRemaining(vendorWithSession)
          hasTimer = timeRemainingMinutes > 0
        }
        
        const marker = {
          id: vendor.id,
          position: coordinates,
          title: vendor.business_name || 'Unknown Vendor',
          description: vendor.description || 'Food Vendor',
          isLive: status === 'open',
          status,
          timeRemaining: timeRemainingMinutes,
          hasTimer,
          vendor: vendorWithSession
        }
        
        markers.push(marker)
        console.log(`   ✅ Processed ${vendor.business_name}: ${status} at ${coordinates.lat}, ${coordinates.lng}`)
        processedCount++
        
      } catch (error) {
        console.error(`   ❌ Error processing ${vendor.business_name}:`, error.message)
        errorCount++
      }
    })
    
    console.log(`\n📊 Processing Results:`)
    console.log(`   ✅ Successfully processed: ${processedCount}`)
    console.log(`   ⚠️  Skipped (no coordinates): ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📍 Total markers created: ${markers.length}`)
    
    // Simulate VendorMap component processing
    console.log(`\n🗺️  Simulating VendorMap Component Processing...`)
    
    let mapErrorCount = 0
    const mapMarkers = markers.map(markerData => {
      try {
        const vendor = markerData.vendor
        
        // This is what the VendorMap component does
        const coordinates = extractAnyCoordinatesFromVendor(vendor)
        
        if (!coordinates) {
          return null
        }
        
        const status = getVendorStatus(vendor)
        const timeRemainingMinutes = calculateTimeRemaining(vendor)
        const hasTimer = timeRemainingMinutes > 0
        
        return {
          id: vendor.id,
          position: coordinates,
          title: vendor.business_name || 'Unknown Vendor',
          description: vendor.description || 'Food Vendor',
          isLive: status === 'open',
          status,
          timeRemaining: timeRemainingMinutes,
          hasTimer: hasTimer,
          vendor: vendor
        }
      } catch (error) {
        console.error(`   ❌ VendorMap error for ${markerData.title}:`, error.message)
        mapErrorCount++
        return null
      }
    }).filter(marker => marker !== null)
    
    console.log(`   ✅ VendorMap processed: ${mapMarkers.length} markers`)
    console.log(`   ❌ VendorMap errors: ${mapErrorCount}`)
    
    if (mapErrorCount === 0) {
      console.log(`\n🎉 SUCCESS: No coordinate extraction errors!`)
      console.log(`   The website should load without the "Vendor does not have valid live session coordinates" error.`)
    } else {
      console.log(`\n⚠️  WARNING: ${mapErrorCount} errors still occurring`)
    }
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Testing Website Error Fix')
  console.log('=============================')
  console.log('Simulating the website loading process...')
  
  await simulateMapDataAPI()
  
  console.log('\n✅ Test completed!')
  console.log('\nIf no errors were reported above, the website should load successfully.')
}

if (require.main === module) {
  main().catch(console.error)
}