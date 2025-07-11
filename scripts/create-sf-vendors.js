#!/usr/bin/env node

/**
 * Script to create live vendor sessions in San Francisco area
 * This will ensure vendors appear on the map when centered on SF
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// San Francisco locations for live sessions
const sfLocations = [
  {
    name: "Union Square",
    latitude: 37.7880,
    longitude: -122.4074,
    address: "Union Square, San Francisco, CA"
  },
  {
    name: "Fisherman's Wharf",
    latitude: 37.8080,
    longitude: -122.4177,
    address: "Fisherman's Wharf, San Francisco, CA"
  },
  {
    name: "Golden Gate Park",
    latitude: 37.7694,
    longitude: -122.4862,
    address: "Golden Gate Park, San Francisco, CA"
  },
  {
    name: "Mission District",
    latitude: 37.7599,
    longitude: -122.4148,
    address: "Mission District, San Francisco, CA"
  },
  {
    name: "Castro District",
    latitude: 37.7609,
    longitude: -122.4350,
    address: "Castro District, San Francisco, CA"
  },
  {
    name: "Chinatown",
    latitude: 37.7941,
    longitude: -122.4078,
    address: "Chinatown, San Francisco, CA"
  },
  {
    name: "North Beach",
    latitude: 37.8067,
    longitude: -122.4102,
    address: "North Beach, San Francisco, CA"
  },
  {
    name: "SOMA",
    latitude: 37.7749,
    longitude: -122.4194,
    address: "SOMA, San Francisco, CA"
  }
];

async function createSFVendors() {
  console.log('🏙️ Creating live vendor sessions in San Francisco...');
  console.log('=' .repeat(60));

  try {
    // Get eligible vendors without active sessions in SF
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, is_active, is_approved')
      .eq('is_active', true)
      .eq('is_approved', true);

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }

    console.log(`📊 Found ${vendors.length} eligible vendors`);

    // Get current active sessions
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('vendor_id')
      .eq('is_active', true);

    if (sessionsError) {
      console.error('❌ Error fetching active sessions:', sessionsError);
      return;
    }

    const vendorsWithActiveSessions = new Set(
      activeSessions.map(session => session.vendor_id)
    );

    // Find vendors without active sessions
    const vendorsWithoutSessions = vendors.filter(
      vendor => !vendorsWithActiveSessions.has(vendor.id)
    );

    console.log(`📋 Vendors without active sessions: ${vendorsWithoutSessions.length}`);

    if (vendorsWithoutSessions.length === 0) {
      console.log('ℹ️  All eligible vendors already have active sessions.');
      console.log('   Consider ending some sessions first or creating new vendors.');
      return;
    }

    // Create live sessions for vendors in SF locations
    const sessionsToCreate = [];
    const maxSessions = Math.min(vendorsWithoutSessions.length, sfLocations.length);

    for (let i = 0; i < maxSessions; i++) {
      const vendor = vendorsWithoutSessions[i];
      const location = sfLocations[i];
      
      // Create session that will last for 4 hours
      const startTime = new Date();
      const autoEndTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

      sessionsToCreate.push({
        vendor_id: vendor.id,
        start_time: startTime.toISOString(),
        auto_end_time: autoEndTime.toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        is_active: true,
        estimated_customers: Math.floor(Math.random() * 20) + 5, // Random 5-25
        was_scheduled_duration: 240 // 4 hours in minutes
      });
    }

    console.log(`\n🚀 Creating ${sessionsToCreate.length} live sessions in SF...`);

    // Insert the sessions
    const { data: createdSessions, error: insertError } = await supabase
      .from('vendor_live_sessions')
      .insert(sessionsToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating sessions:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${createdSessions.length} live sessions!`);
    console.log('');

    // Show created sessions
    console.log('📍 Created live sessions:');
    createdSessions.forEach((session, index) => {
      const vendor = vendorsWithoutSessions.find(v => v.id === session.vendor_id);
      const location = sfLocations[index];
      console.log(`   🏪 ${vendor.business_name} at ${location.name}`);
      console.log(`      📍 (${session.latitude}, ${session.longitude})`);
      console.log(`      ⏰ Active until ${new Date(session.auto_end_time).toLocaleString()}`);
      console.log('');
    });

    console.log('🎉 DONE! Vendors should now appear on the SF map.');
    console.log('   Refresh the application to see the new live vendors.');

  } catch (error) {
    console.error('❌ Error creating SF vendors:', error);
  }
}

if (require.main === module) {
  createSFVendors();
}

module.exports = { createSFVendors };