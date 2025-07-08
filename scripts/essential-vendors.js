#!/usr/bin/env node

/**
 * Script to insert vendor data using only essential fields
 * Run with: node scripts/essential-vendors.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertEssentialVendors() {
  try {
    console.log('🚀 Starting essential vendor data insertion...');
    
    // Step 1: Get existing auth users
    console.log('\n👤 Getting existing auth users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Failed to get auth users:', authError.message);
      return;
    }
    
    const authUsers = authData.users;
    console.log(`✅ Found ${authUsers.length} existing auth users`);
    
    if (authUsers.length === 0) {
      console.log('❌ No auth users found, cannot proceed');
      return;
    }
    
    // Step 2: Insert vendors using only essential fields
    console.log('\n🏪 Inserting vendors...');
    const vendorsData = [
      {
        user_id: authUsers[0]?.id,
        business_name: 'Taco Truck Paradise'
      },
      {
        user_id: authUsers[1]?.id,
        business_name: 'Burger Bliss Mobile'
      },
      {
        user_id: authUsers[2]?.id,
        business_name: 'Pizza on Wheels'
      },
      {
        user_id: authUsers[3]?.id,
        business_name: 'Asian Fusion Express'
      },
      {
        user_id: authUsers[4]?.id,
        business_name: 'Sweet Treats Truck'
      }
    ];
    
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert(vendorsData)
        .select();
      
      if (vendorError) {
        console.log('❌ Vendors insert error:', vendorError.message);
        return;
      } else {
        console.log(`✅ Inserted ${vendorData.length} vendors`);
      }
      
      // Step 3: Insert vendor live sessions
      console.log('\n📡 Inserting vendor live sessions...');
      const now = new Date();
      const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
      
      const liveSessionsData = vendorData.map((vendor, index) => ({
        vendor_id: vendor.id,
        latitude: 37.7749 + (index * 0.01), // San Francisco area
        longitude: -122.4194 + (index * 0.01),
        start_time: now.toISOString(),
        end_time: endTime.toISOString()
      }));
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('vendor_live_sessions')
        .insert(liveSessionsData)
        .select();
      
      if (sessionError) {
        console.log('❌ Live sessions insert error:', sessionError.message);
      } else {
        console.log(`✅ Inserted ${sessionData.length} live sessions`);
      }
      
    } catch (err) {
      console.log('❌ Vendor insertion exception:', err.message);
    }
    
    console.log('\n🎉 Essential vendor data insertion completed!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Auth users: ${authUsers.length}`);
    console.log(`   🏪 Vendors: ${vendorsData.length}`);
    console.log(`   📡 Live sessions: ${vendorsData.length}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertEssentialVendors();