#!/usr/bin/env node

/**
 * Script to insert vendor data using the correct schema from schema.pdf
 * Run with: node scripts/schema-correct-vendors.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertSchemaCorrectVendors() {
  try {
    console.log('🚀 Starting vendor data insertion with correct schema...');
    
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
    
    // Step 2: Update users table to mark some as vendors
    console.log('\n👥 Updating users to mark as vendors...');
    const usersToUpdate = authUsers.slice(0, 5); // First 5 users become vendors
    
    for (const user of usersToUpdate) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vendor User',
          is_vendor: true,
          active_role: 'vendor' // Setting vendor role for existing vendors
        });
      
      if (userUpdateError) {
        console.log(`❌ Error updating user ${user.email}:`, userUpdateError.message);
      } else {
        console.log(`✅ Updated user ${user.email} as vendor`);
      }
    }
    
    // Step 3: Insert vendors using correct schema (user_id as foreign key)
    console.log('\n🏪 Inserting vendors...');
    const vendorsData = [
      {
        user_id: usersToUpdate[0]?.id, // user_id as foreign key
        business_name: 'Taco Truck Paradise',
        description: 'Authentic Mexican street tacos with fresh ingredients',
        business_type: 'Food Truck',
        cuisine_type: 'Mexican',
        tags: ['tacos', 'mexican', 'street food'],
        contact_email: usersToUpdate[0]?.email,
        is_active: true,
        is_approved: true
      },
      {
        user_id: usersToUpdate[1]?.id,
        business_name: 'Burger Bliss Mobile',
        description: 'Gourmet burgers made with locally sourced beef',
        business_type: 'Food Truck',
        cuisine_type: 'American',
        tags: ['burgers', 'american', 'gourmet'],
        contact_email: usersToUpdate[1]?.email,
        is_active: true,
        is_approved: true
      },
      {
        user_id: usersToUpdate[2]?.id,
        business_name: 'Pizza on Wheels',
        description: 'Wood-fired pizza made fresh to order',
        business_type: 'Food Truck',
        cuisine_type: 'Italian',
        tags: ['pizza', 'italian', 'wood-fired'],
        contact_email: usersToUpdate[2]?.email,
        is_active: true,
        is_approved: true
      },
      {
        user_id: usersToUpdate[3]?.id,
        business_name: 'Asian Fusion Express',
        description: 'Modern Asian cuisine with a creative twist',
        business_type: 'Food Truck',
        cuisine_type: 'Asian',
        tags: ['asian', 'fusion', 'modern'],
        contact_email: usersToUpdate[3]?.email,
        is_active: true,
        is_approved: true
      },
      {
        user_id: usersToUpdate[4]?.id,
        business_name: 'Sweet Treats Truck',
        description: 'Artisanal desserts and specialty coffee',
        business_type: 'Food Truck',
        cuisine_type: 'Desserts',
        tags: ['desserts', 'coffee', 'artisanal'],
        contact_email: usersToUpdate[4]?.email,
        is_active: true,
        is_approved: true
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
      
      // Step 4: Insert vendor live sessions
      console.log('\n📡 Inserting vendor live sessions...');
      const now = new Date();
      
      const liveSessionsData = vendorData.map((vendor, index) => {
        const lat = 37.7749 + (index * 0.01); // San Francisco area
        const lng = -122.4194 + (index * 0.01);
        
        return {
          id: uuidv4(),
          vendor_id: vendor.id,
          started_at: now.toISOString(),
          latitude: lat,
          longitude: lng,
          address: `${Math.floor(Math.random() * 9999) + 1} Market St, San Francisco, CA`,
          is_active: true,
          estimated_customers: Math.floor(Math.random() * 20) + 5
        };
      });
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('vendor_live_sessions')
        .insert(liveSessionsData)
        .select();
      
      if (sessionError) {
        console.log('❌ Live sessions insert error:', sessionError.message);
      } else {
        console.log(`✅ Inserted ${sessionData.length} live sessions`);
      }
      
      // Step 5: Insert vendor specials
      console.log('\n🍽️ Inserting vendor specials...');
      const specialsData = [];
      const specialTitles = [
        'Today\'s Special: Fish Tacos',
        'Gourmet Bacon Cheeseburger',
        'Margherita Pizza Special',
        'Kung Pao Chicken Bowl',
        'Chocolate Lava Cake'
      ];
      
      vendorData.forEach((vendor, index) => {
        specialsData.push({
          id: uuidv4(),
          vendor_id: vendor.id,
          title: specialTitles[index],
          description: `Delicious ${specialTitles[index].toLowerCase()} made fresh today!`
        });
      });
      
      const { data: specialData, error: specialError } = await supabase
        .from('vendor_specials')
        .insert(specialsData)
        .select();
      
      if (specialError) {
        console.log('❌ Specials insert error:', specialError.message);
      } else {
        console.log(`✅ Inserted ${specialData.length} specials`);
      }
      
    } catch (err) {
      console.log('❌ Vendor insertion exception:', err.message);
    }
    
    console.log('\n🎉 Schema-correct vendor data insertion completed!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Auth users: ${authUsers.length}`);
    console.log(`   👥 Vendor users: ${usersToUpdate.length}`);
    console.log(`   🏪 Vendors: ${vendorsData.length}`);
    console.log(`   📡 Live sessions: ${vendorsData.length}`);
    console.log(`   🍽️ Specials: ${vendorsData.length}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertSchemaCorrectVendors();