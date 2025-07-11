#!/usr/bin/env node

/**
 * Script to insert mock data into all tables
 * Run with: node scripts/insert-mock-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertMockData() {
  try {
    console.log('🚀 Starting mock data insertion...');
    
    // Step 1: Create auth users first (since users table has FK constraint)
    console.log('\n👤 Creating auth users...');
    const authUsers = [];
    const userEmails = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'mike.johnson@example.com',
      'sarah.wilson@example.com',
      'david.brown@example.com'
    ];
    
    for (const email of userEmails) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'password123',
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
        });
        
        if (authError) {
          console.log(`❌ Failed to create auth user ${email}:`, authError.message);
        } else {
          console.log(`✅ Created auth user: ${email}`);
          authUsers.push(authData.user);
        }
      } catch (err) {
        console.log(`❌ Exception creating ${email}:`, err.message);
      }
    }
    
    if (authUsers.length === 0) {
      console.log('❌ No auth users created, cannot proceed with users table');
      return;
    }
    
    // Step 2: Insert users table records (using auth user IDs)
    console.log('\n📝 Inserting users table records...');
    const usersData = authUsers.map(authUser => ({
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(usersData)
        .select();
      
      if (userError) {
        console.log('❌ Users insert error:', userError.message);
      } else {
        console.log(`✅ Inserted ${userData.length} users`);
      }
    } catch (err) {
      console.log('❌ Users insert exception:', err.message);
    }
    
    // Step 3: Insert vendors
    console.log('\n🏪 Inserting vendors...');
    const vendorsData = [
      {
        id: uuidv4(),
        user_id: authUsers[0]?.id,
        business_name: 'Taco Truck Paradise',
        description: 'Authentic Mexican street tacos with fresh ingredients',
        cuisine_type: 'Mexican',
        phone: '+1-555-0101',
        address: '123 Food Street, Downtown',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        user_id: authUsers[1]?.id,
        business_name: 'Burger Bliss Mobile',
        description: 'Gourmet burgers made with locally sourced beef',
        cuisine_type: 'American',
        phone: '+1-555-0102',
        address: '456 Market Avenue, Midtown',
        latitude: 37.7849,
        longitude: -122.4094,
        rating: 4.2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        user_id: authUsers[2]?.id,
        business_name: 'Pizza on Wheels',
        description: 'Wood-fired pizza made fresh to order',
        cuisine_type: 'Italian',
        phone: '+1-555-0103',
        address: '789 Central Park, Uptown',
        latitude: 37.7949,
        longitude: -122.3994,
        rating: 4.7,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        user_id: authUsers[3]?.id,
        business_name: 'Asian Fusion Express',
        description: 'Modern Asian cuisine with a creative twist',
        cuisine_type: 'Asian',
        phone: '+1-555-0104',
        address: '321 Business District, Financial',
        latitude: 37.7649,
        longitude: -122.4294,
        rating: 4.3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        user_id: authUsers[4]?.id,
        business_name: 'Sweet Treats Truck',
        description: 'Artisanal desserts and specialty coffee',
        cuisine_type: 'Desserts',
        phone: '+1-555-0105',
        address: '654 University Row, Campus',
        latitude: 37.7549,
        longitude: -122.4394,
        rating: 4.6,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      const liveSessionsData = vendorData.map(vendor => ({
        id: uuidv4(),
        vendor_id: vendor.id,
        latitude: vendor.latitude + (Math.random() - 0.5) * 0.01, // Slight variation
        longitude: vendor.longitude + (Math.random() - 0.5) * 0.01,
        is_active: true,
        started_at: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Started within last hour
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      
      // Step 5: Insert reviews
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
        // Add 2-3 reviews per vendor
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          const reviewerIndex = (vendorIndex + i + 1) % authUsers.length;
          reviewsData.push({
            id: uuidv4(),
            vendor_id: vendor.id,
            user_id: authUsers[reviewerIndex]?.id,
            rating: 3 + Math.floor(Math.random() * 3), // Rating 3-5
            review: reviewTexts[i % reviewTexts.length],
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(), // Within last week
            updated_at: new Date().toISOString()
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
      
      // Step 6: Insert favorites
      console.log('\n❤️ Inserting favorites...');
      const favoritesData = [];
      authUsers.forEach((user, userIndex) => {
        // Each user favorites 1-2 vendors
        const numFavorites = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numFavorites; i++) {
          const vendorIndex = (userIndex + i) % vendorData.length;
          favoritesData.push({
            id: uuidv4(),
            user_id: user.id,
            vendor_id: vendorData[vendorIndex].id,
            created_at: new Date().toISOString()
          });
        }
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
      
      // Step 7: Create admin user
      console.log('\n👑 Creating admin user...');
      try {
        const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
          email: 'admin@foodtruck.com',
          password: 'admin123',
          email_confirm: true,
          user_metadata: {
            full_name: 'Admin User',
            role: 'admin'
          }
        });
        
        if (adminAuthError) {
          console.log('❌ Admin auth user creation error:', adminAuthError.message);
        } else {
          console.log('✅ Created admin auth user');
          
          // Update user to set admin flag
          const { data: adminData, error: adminError } = await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', adminAuthData.user.id)
            .select();
          
          if (adminError) {
            console.log('❌ Admin user update error:', adminError.message);
          } else {
            console.log('✅ Set admin flag for user');
          }
        }
      } catch (err) {
        console.log('❌ Admin creation exception:', err.message);
      }
      
    } catch (err) {
      console.log('❌ Vendor insertion exception:', err.message);
    }
    
    console.log('\n🎉 Mock data insertion completed!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Auth users: ${authUsers.length}`);
    console.log(`   🏪 Vendors: ${vendorsData.length}`);
    console.log(`   📡 Live sessions: ${vendorsData.length}`);
    console.log(`   ⭐ Reviews: ~${vendorsData.length * 2.5} (estimated)`);
    console.log(`   ❤️ Favorites: ~${authUsers.length * 1.5} (estimated)`);
    console.log(`   👑 Admin users: 1`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertMockData();