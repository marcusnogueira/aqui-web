#!/usr/bin/env node

/**
 * Test Storage Fix
 * 
 * This script tests if the storage fix is working properly
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageFix() {
  try {
    console.log('🧪 Testing Storage Fix...\n');

    // Test user from the debug output
    const testUserId = '76d54bd8-5a4f-4b53-afd0-cf3b243f9802';
    const testVendorId = 'a9b4a478-0562-4874-8858-63987fef9d8f';

    console.log(`🔧 Testing with User ID: ${testUserId}`);
    console.log(`🏪 Testing with Vendor ID: ${testVendorId}\n`);

    // 1. Test setting user context
    console.log('📋 1. Testing set_auth_user_id function...');
    const { error: setError } = await supabase.rpc('set_auth_user_id', {
      user_id: testUserId
    });

    if (setError) {
      console.log('❌ set_auth_user_id failed:', setError);
      return;
    } else {
      console.log('✅ set_auth_user_id succeeded');
    }

    // 2. Test getting user context
    console.log('📋 2. Testing get_current_user_id function...');
    const { data: currentUserId, error: getError } = await supabase.rpc('get_current_user_id');

    if (getError) {
      console.log('❌ get_current_user_id failed:', getError);
      return;
    } else {
      console.log(`✅ get_current_user_id returned: ${currentUserId}`);
      
      if (currentUserId === testUserId) {
        console.log('✅ User context is working correctly');
      } else {
        console.log('❌ User context mismatch!');
        return;
      }
    }

    // 3. Test vendor lookup
    console.log('📋 3. Testing vendor ownership...');
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id')
      .eq('id', testVendorId)
      .single();

    if (vendorError) {
      console.log('❌ Vendor lookup failed:', vendorError);
      return;
    } else {
      console.log(`✅ Found vendor: ${vendor.id} → User: ${vendor.user_id}`);
      
      if (vendor.user_id === testUserId) {
        console.log('✅ Vendor ownership is correct');
      } else {
        console.log('❌ Vendor ownership mismatch!');
        return;
      }
    }

    // 4. Test storage policy simulation
    console.log('📋 4. Testing storage policy logic...');
    const testPath = `${testVendorId}/test-image.png`;
    
    // Simulate the policy check
    const { data: policyTest, error: policyError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', testVendorId)
      .eq('user_id', currentUserId)
      .single();

    if (policyError) {
      console.log('❌ Policy simulation failed:', policyError);
      return;
    } else {
      console.log('✅ Storage policy logic should work');
    }

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The storage fix should be working now.');
    console.log('\n📝 Next steps:');
    console.log('1. Try uploading an image in your app');
    console.log('2. Check that uploads succeed without 403 errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorageFix();