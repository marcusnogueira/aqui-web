#!/usr/bin/env node

/**
 * Script to insert minimal vendor data with only essential fields
 * Run with: node scripts/minimal-vendors.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertMinimalVendors() {
  try {
    console.log('🚀 Starting minimal vendor data insertion...');
    
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
    
    // Step 2: Insert vendors with only essential fields
    console.log('\n🏪 Inserting vendors...');
    const vendorsData = [
      {
        id: uuidv4(),
        user_id: authUsers[0]?.id,
        business_name: 'Taco Truck Paradise',
        description: 'Authentic Mexican street tacos',
        cuisine_type: 'Mexican',
        latitude: 37.7749,
        longitude: -122.4194
      },
      {
        id: uuidv4(),
        user_id: authUsers[1]?.id,
        business_name: 'Burger Bliss Mobile',
        description: 'Gourmet burgers',
        cuisine_type: 'American',
        latitude: 37.7849,
        longitude: -122.4094
      },
      {
        id: uuidv4(),
        user_id: authUsers[2]?.id,
        business_name: 'Pizza on Wheels',
        description: 'Wood-fired pizza',
        cuisine_type: 'Italian',
        latitude: 37.7949,
        longitude: -122.3994
      },
      {
        id: uuidv4(),
        user_id: authUsers[3]?.id,
        business_name: 'Asian Fusion Express',
        description: 'Modern Asian cuisine',
        cuisine_type: 'Asian',
        latitude: 37.7649,
        longitude: -122.4294
      },
      {
        id: uuidv4(),
        user_id: authUsers[4]?.id,
        business_name: 'Sweet Treats Truck',
        description: 'Artisanal desserts',
        cuisine_type: 'Desserts',
        latitude: 37.7549,
        longitude: -122.4394
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
      const liveSessionsData = vendorData.map(vendor => ({
        id: uuidv4(),
        vendor_id: vendor.id,
        latitude: vendor.latitude + (Math.random() - 0.5) * 0.01,
        longitude: vendor.longitude + (Math.random() - 0.5) * 0.01,
        is_active: true
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
    
    console.log('\n🎉 Minimal vendor data insertion completed!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Auth users: ${authUsers.length}`);
    console.log(`   🏪 Vendors: ${vendorsData.length}`);
    console.log(`   📡 Live sessions: ${vendorsData.length}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertMinimalVendors();