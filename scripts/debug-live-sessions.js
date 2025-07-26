#!/usr/bin/env node

/**
 * Debug script to check live session data and identify why vendors aren't showing on map
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugLiveSessions() {
  console.log('🔍 Debugging live sessions data...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check live sessions with the same query as the frontend
    console.log('📍 Step 1: Checking live sessions (frontend query)');
    const { data: liveSessionsData, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('*')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (sessionsError) {
      console.error('❌ Error fetching live sessions:', sessionsError);
      return;
    }

    console.log(`   Found ${liveSessionsData?.length || 0} active sessions with coordinates`);
    
    if (!liveSessionsData || liveSessionsData.length === 0) {
      console.log('❌ NO ACTIVE SESSIONS WITH COORDINATES FOUND!');
      
      // Check all live sessions without coordinate filter
      const { data: allSessions } = await supabase
        .from('vendor_live_sessions')
        .select('*')
        .eq('is_active', true)
      
      console.log(`   Total active sessions (without coordinate filter): ${allSessions?.length || 0}`);
      
      if (allSessions && allSessions.length > 0) {
        console.log('\n🔍 Active sessions missing coordinates:');
        allSessions.forEach(session => {
          const hasCoords = session.latitude !== null && session.longitude !== null;
          console.log(`   Session ${session.id}: vendor_id=${session.vendor_id}, coords=${hasCoords ? `(${session.latitude}, ${session.longitude})` : 'MISSING'}`);
        });
      }
      return;
    }

    // Step 2: Check vendor IDs from live sessions
    console.log('\n📋 Step 2: Checking vendor IDs from live sessions');
    const vendorIds = liveSessionsData
      .map(session => session.vendor_id)
      .filter((id) => id !== null);
    
    console.log(`   Vendor IDs from sessions: ${vendorIds.length}`);
    console.log(`   Unique vendor IDs: ${[...new Set(vendorIds)].length}`);

    // Step 3: Check vendors with the same query as frontend
    console.log('\n🏪 Step 3: Checking vendors (frontend query)');
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .in('id', vendorIds)
      .eq('status', 'approved')

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }

    console.log(`   Found ${vendorsData?.length || 0} approved vendors`);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.log('❌ NO APPROVED VENDORS FOUND!');
      
      // Check vendors without approval/active filter
      const { data: allVendors } = await supabase
        .from('vendors')
        .select('id, business_name, status')
        .in('id', vendorIds)
      
      console.log(`   Total vendors (without approval filter): ${allVendors?.length || 0}`);
      
      if (allVendors && allVendors.length > 0) {
        console.log('\n🔍 Vendors not meeting approval criteria:');
        allVendors.forEach(vendor => {
          const status = `status=${vendor.status}`;
          console.log(`   ${vendor.business_name}: ${status}`);
        });
      }
      return;
    }

    // Step 4: Show final combined data
    console.log('\n✅ Step 4: Final combined vendor data');
    const formattedVendors = vendorsData.map(vendor => {
      const liveSession = liveSessionsData.find(session => session.vendor_id === vendor.id);
      return {
        id: vendor.id,
        business_name: vendor.business_name,
        coordinates: liveSession ? `(${liveSession.latitude}, ${liveSession.longitude})` : 'No session',
        address: liveSession?.address || 'No address'
      };
    });

    console.log(`   Final vendor count: ${formattedVendors.length}`);
    formattedVendors.forEach(vendor => {
      console.log(`   📍 ${vendor.business_name}: ${vendor.coordinates} | ${vendor.address}`);
    });

    // Step 5: Check if coordinates are in a reasonable range (San Francisco area)
    console.log('\n🗺️  Step 5: Coordinate validation');
    const sfBounds = {
      north: 37.8324,
      south: 37.7049,
      east: -122.3482,
      west: -122.5270
    };

    const vendorsInSF = formattedVendors.filter(vendor => {
      if (vendor.coordinates === 'No session') return false;
      
      const session = liveSessionsData.find(s => s.vendor_id === vendor.id);
      if (!session) return false;
      
      const lat = session.latitude;
      const lng = session.longitude;
      
      return lat >= sfBounds.south && lat <= sfBounds.north &&
             lng >= sfBounds.west && lng <= sfBounds.east;
    });

    console.log(`   Vendors within SF bounds: ${vendorsInSF.length}`);
    console.log(`   Vendors outside SF bounds: ${formattedVendors.length - vendorsInSF.length}`);

    if (vendorsInSF.length !== formattedVendors.length) {
      console.log('\n🌍 Vendors outside SF area:');
      formattedVendors.forEach(vendor => {
        const session = liveSessionsData.find(s => s.vendor_id === vendor.id);
        if (session) {
          const lat = session.latitude;
          const lng = session.longitude;
          const inSF = lat >= sfBounds.south && lat <= sfBounds.north &&
                      lng >= sfBounds.west && lng <= sfBounds.east;
          if (!inSF) {
            console.log(`   🌎 ${vendor.business_name}: (${lat}, ${lng}) - Outside SF`);
          }
        }
      });
    }

    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`✅ Active live sessions with coordinates: ${liveSessionsData.length}`);
    console.log(`✅ Approved and active vendors: ${vendorsData.length}`);
    console.log(`✅ Vendors in SF area: ${vendorsInSF.length}`);
    
    if (vendorsInSF.length === 0) {
      console.log('\n❌ ISSUE FOUND: No vendors in SF area!');
      console.log('   This explains why the map shows "No vendors found"');
      console.log('   The map might be centered on SF but vendors are elsewhere.');
    } else {
      console.log('\n✅ Vendors should be visible on the map.');
      console.log('   If they\'re not showing, check:');
      console.log('   1. Map component rendering');
      console.log('   2. Frontend state management');
      console.log('   3. Map bounds calculation');
    }

  } catch (error) {
    console.error('❌ Error debugging live sessions:', error);
  }
}

if (require.main === module) {
  debugLiveSessions();
}

module.exports = { debugLiveSessions };