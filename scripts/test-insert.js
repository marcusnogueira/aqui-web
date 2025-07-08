#!/usr/bin/env node

/**
 * Script to test inserting a single record to understand the schema
 * Run with: node scripts/test-insert.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  try {
    console.log('🧪 Testing database schema...');
    
    // First, let's try to understand what the auth.users table looks like
    console.log('\n🔍 Checking auth.users table...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log('❌ Cannot access auth.users:', authError.message);
      } else {
        console.log('✅ Auth users found:', authUsers.users.length);
        if (authUsers.users.length > 0) {
          console.log('📝 Auth user structure:', Object.keys(authUsers.users[0]));
        }
      }
    } catch (err) {
      console.log('❌ Auth access error:', err.message);
    }
    
    // Test different field combinations for users table
    console.log('\n🧪 Testing users table with different field combinations...');
    
    const testCases = [
      { id: uuidv4() },
      { id: uuidv4(), name: 'Test User' },
      { id: uuidv4(), full_name: 'Test User' },
      { id: uuidv4(), user_id: uuidv4() },
      { name: 'Test User Without ID' },
      { full_name: 'Test User Without ID' }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testData = testCases[i];
      console.log(`\n📝 Test ${i + 1}: ${JSON.stringify(testData)}`);
      
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([testData])
          .select();
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Success:`, data);
          // Clean up successful insert
          if (data && data[0] && data[0].id) {
            await supabase.from('users').delete().eq('id', data[0].id);
          }
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }
    
    // Test vendors table
    console.log('\n🏪 Testing vendors table...');
    const vendorTest = {
      id: uuidv4(),
      business_name: 'Test Vendor'
    };
    
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([vendorTest])
        .select();
      
      if (error) {
        console.log(`❌ Vendor insert error: ${error.message}`);
      } else {
        console.log(`✅ Vendor insert success:`, data);
        // Clean up
        if (data && data[0] && data[0].id) {
          await supabase.from('vendors').delete().eq('id', data[0].id);
        }
      }
    } catch (err) {
      console.log(`❌ Vendor exception: ${err.message}`);
    }
    
    // Check if we can create a user through auth and see the structure
    console.log('\n👤 Testing auth user creation...');
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'testpassword123',
        email_confirm: true
      });
      
      if (authError) {
        console.log('❌ Auth user creation error:', authError.message);
      } else {
        console.log('✅ Auth user created:', authData.user.id);
        console.log('📝 Auth user structure:', Object.keys(authData.user));
        
        // Check if this creates a record in our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id);
        
        if (userError) {
          console.log('❌ No corresponding users table record:', userError.message);
        } else {
          console.log('✅ Users table record:', userData);
        }
        
        // Clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
      }
    } catch (err) {
      console.log('❌ Auth creation exception:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
testInsert();