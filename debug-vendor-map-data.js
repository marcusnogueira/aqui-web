const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simulate the exact same logic as page.tsx
async function debugVendorMapData() {
  console.log('🔍 Debugging vendor map data...')
  
  try {
    // Step 1: Fetch active live sessions (same as page.tsx)
    console.log('\n1. Fetching active live sessions...')
    const { data: liveSessions, error: liveSessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('*')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    
    if (liveSessionsError) {
      console.error('❌ Error fetching live sessions:', liveSessionsError)
      return
    }
    
    console.log(`✅ Found ${liveSessions.length} active live sessions`)
    
    if (liveSessions.length === 0) {
      console.log('❌ No active live sessions found - this is the problem!')
      return
    }
    
    // Step 2: Get vendor IDs from live sessions
    const vendorIds = liveSessions.map(session => session.vendor_id)
    console.log(`\n2. Vendor IDs from live sessions: ${vendorIds.join(', ')}`)
    
    // Step 3: Fetch corresponding vendors (same as page.tsx)
    console.log('\n3. Fetching corresponding vendors...')
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .in('id', vendorIds)
      .eq('is_approved', true)
      .eq('is_active', true)
    
    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError)
      return
    }
    
    console.log(`✅ Found ${vendors.length} approved and active vendors`)
    
    if (vendors.length === 0) {
      console.log('❌ No approved/active vendors found - this could be the problem!')
      return
    }
    
    // Step 4: Combine data (same as page.tsx)
    console.log('\n4. Combining vendor and live session data...')
    const vendorsWithLiveSessions = vendors.map(vendor => {
      const liveSession = liveSessions.find(session => session.vendor_id === vendor.id)
      return {
        ...vendor,
        live_session: liveSession
      }
    })
    
    console.log(`✅ Created ${vendorsWithLiveSessions.length} vendors with live sessions`)
    
    // Step 5: Simulate VendorMap processing
    console.log('\n5. Simulating VendorMap marker creation...')
    
    const markers = vendorsWithLiveSessions
      .map(vendor => {
        // Extract coordinates (same logic as VendorMap)
        if (!vendor.live_session || 
            typeof vendor.live_session.latitude !== 'number' || 
            typeof vendor.live_session.longitude !== 'number') {
          console.log(`⚠️  Vendor ${vendor.name} has no valid coordinates`)
          return null
        }
        
        const coordinates = { 
          lat: vendor.live_session.latitude, 
          lng: vendor.live_session.longitude 
        }
        
        // Calculate status (simplified)
        const status = vendor.live_session.is_active ? 'open' : 'offline'
        
        // Calculate time remaining (simplified)
        const timeRemaining = vendor.live_session.auto_end_time ? 
          Math.max(0, Math.floor((new Date(vendor.live_session.auto_end_time).getTime() - new Date().getTime()) / (1000 * 60))) : 0
        
        const marker = {
          id: vendor.id,
          position: coordinates,
          title: vendor.name,
          description: vendor.description || 'Food Vendor',
          isLive: status === 'open',
          status: status,
          categoryIcon: vendor.category_icon || '🛒',
          timeRemaining: timeRemaining,
          hasTimer: timeRemaining > 0,
          vendor: vendor
        }
        
        console.log(`✅ Created marker for ${vendor.name} at (${coordinates.lat}, ${coordinates.lng}) - Status: ${status}`)
        return marker
      })
      .filter(Boolean) // Remove null entries
    
    console.log(`\n📍 Total markers created: ${markers.length}`)
    
    if (markers.length === 0) {
      console.log('❌ No markers created - this is why vendors don\'t appear on the map!')
      console.log('\n🔍 Checking individual vendor data:')
      
      vendorsWithLiveSessions.forEach(vendor => {
        console.log(`\nVendor: ${vendor.name}`)
        console.log(`  - ID: ${vendor.id}`)
        console.log(`  - Is Active: ${vendor.is_active}`)
        console.log(`  - Is Approved: ${vendor.is_approved}`)
        console.log(`  - Live Session:`, vendor.live_session ? {
          id: vendor.live_session.id,
          is_active: vendor.live_session.is_active,
          latitude: vendor.live_session.latitude,
          longitude: vendor.live_session.longitude,
          start_time: vendor.live_session.start_time,
          auto_end_time: vendor.live_session.auto_end_time
        } : 'None')
      })
    } else {
      console.log('\n✅ Markers should appear on the map!')
      console.log('\n📋 Marker summary:')
      markers.forEach(marker => {
        console.log(`  - ${marker.title}: ${marker.isLive ? '🟢 Live' : '🔴 Offline'} at (${marker.position.lat}, ${marker.position.lng})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error in debug script:', error)
  }
}

debugVendorMapData()