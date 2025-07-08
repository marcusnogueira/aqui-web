#!/usr/bin/env node

/**
 * Script to insert vendor data using correct schema
 * Run with: node scripts/correct-vendors.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertCorrectVendors() {
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
    
    // Step 2: Insert vendors using correct schema
    console.log('\n🏪 Inserting vendors...');
    const vendorsData = [
      {
        id: uuidv4(),
        user_id: authUsers[0]?.id,
        business_name: 'Taco Truck Paradise',
        description: 'Authentic Mexican street tacos with fresh ingredients',
        cuisine_type: 'Mexican',
        phone: '+1-555-0101',
        email: 'tacos@paradise.com',
        total_reviews: 0,
        is_approved: true,
        is_active: true
      },
      {
        id: uuidv4(),
        user_id: authUsers[1]?.id,
        business_name: 'Burger Bliss Mobile',
        description: 'Gourmet burgers made with locally sourced beef',
        cuisine_type: 'American',
        phone: '+1-555-0102',
        email: 'orders@burgerbliss.com',
        total_reviews: 0,
        is_approved: true,
        is_active: true
      },
      {
        id: uuidv4(),
        user_id: authUsers[2]?.id,
        business_name: 'Pizza on Wheels',
        description: 'Wood-fired pizza made fresh to order',
        cuisine_type: 'Italian',
        phone: '+1-555-0103',
        email: 'hello@pizzawheels.com',
        total_reviews: 0,
        is_approved: true,
        is_active: true
      },
      {
        id: uuidv4(),
        user_id: authUsers[3]?.id,
        business_name: 'Asian Fusion Express',
        description: 'Modern Asian cuisine with a creative twist',
        cuisine_type: 'Asian',
        phone: '+1-555-0104',
        email: 'info@asianfusion.com',
        total_reviews: 0,
        is_approved: true,
        is_active: true
      },
      {
        id: uuidv4(),
        user_id: authUsers[4]?.id,
        business_name: 'Sweet Treats Truck',
        description: 'Artisanal desserts and specialty coffee',
        cuisine_type: 'Desserts',
        phone: '+1-555-0105',
        email: 'sweet@treats.com',
        total_reviews: 0,
        is_approved: true,
        is_active: true
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
      
      // Step 3: Insert vendor live sessions with correct schema
      console.log('\n📡 Inserting vendor live sessions...');
      const now = new Date();
      const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
      
      const liveSessionsData = vendorData.map((vendor, index) => ({
        id: uuidv4(),
        vendor_id: vendor.id,
        latitude: 37.7749 + (index * 0.01), // San Francisco area
        longitude: -122.4194 + (index * 0.01),
        address: `Location ${index + 1}, San Francisco, CA`,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
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
      
      // Step 4: Insert reviews with correct schema
      console.log('\n⭐ Inserting reviews...');
      const reviewsData = [];
      const reviewTexts = [
        'Amazing food! Will definitely come back.',
        'Great service and delicious meals.',
        'Good value for money, fresh ingredients.',
        'Quick service, tasty food.',
        'Excellent quality, highly recommended!'
      ];
      
      vendorData.forEach((vendor, vendorIndex) => {
        // Add 2 reviews per vendor
        for (let i = 0; i < 2; i++) {
          const reviewerIndex = (vendorIndex + i + 1) % authUsers.length;
          reviewsData.push({
            id: uuidv4(),
            vendor_id: vendor.id,
            customer_id: authUsers[reviewerIndex]?.id,
            rating: 4 + Math.floor(Math.random() * 2), // Rating 4-5
            review_text: reviewTexts[i % reviewTexts.length]
          });
        }
      });
      
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert(reviewsData)
        .select();
      
      if (reviewError) {
        console.log('❌ Reviews insert error:', reviewError.message);
      } else {
        console.log(`✅ Inserted ${reviewData.length} reviews`);
      }
      
      // Step 5: Insert favorites with correct schema
      console.log('\n❤️ Inserting favorites...');
      const favoritesData = [];
      authUsers.forEach((user, userIndex) => {
        // Each user favorites 1 vendor
        const vendorIndex = userIndex % vendorData.length;
        favoritesData.push({
          id: uuidv4(),
          customer_id: user.id,
          vendor_id: vendorData[vendorIndex].id
        });
      });
      
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('favorites')
        .insert(favoritesData)
        .select();
      
      if (favoriteError) {
        console.log('❌ Favorites insert error:', favoriteError.message);
      } else {
        console.log(`✅ Inserted ${favoriteData.length} favorites`);
      }
      
    } catch (err) {
      console.log('❌ Vendor insertion exception:', err.message);
    }
    
    console.log('\n🎉 Vendor data insertion completed!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Auth users: ${authUsers.length}`);
    console.log(`   🏪 Vendors: ${vendorsData.length}`);
    console.log(`   📡 Live sessions: ${vendorsData.length}`);
    console.log(`   ⭐ Reviews: ${vendorsData.length * 2}`);
    console.log(`   ❤️ Favorites: ${Math.min(authUsers.length, vendorsData.length)}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertCorrectVendors();