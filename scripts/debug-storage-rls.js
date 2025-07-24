#!/usr/bin/env node

/**
 * Debug Storage RLS Issues
 * 
 * This script helps diagnose why storage uploads are still failing
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

async function debugStorage() {
  try {
    console.log('🔍 Debugging Storage RLS Issues...\n');

    // 1. Check if storage.objects policies exist
    console.log('📋 1. Checking storage.objects policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError);
    } else {
      console.log(`✅ Found ${policies.length} storage policies:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
        console.log(`     ${policy.qual || 'No condition'}`);
      });
    }

    console.log('\n📋 2. Checking vendor-images bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error fetching buckets:', bucketsError);
    } else {
      const vendorBucket = buckets.find(b => b.name === 'vendor-images');
      if (vendorBucket) {
        console.log('✅ vendor-images bucket exists');
        console.log(`   Public: ${vendorBucket.public}`);
      } else {
        console.log('❌ vendor-images bucket NOT found');
        console.log('Available buckets:', buckets.map(b => b.name));
      }
    }

    console.log('\n📋 3. Testing get_current_user_id() function...');
    
    // Test with a known user ID
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError || !users.length) {
      console.log('❌ No users found or error:', usersError);
    } else {
      const testUserId = users[0].id;
      console.log(`🧪 Testing with user ID: ${testUserId}`);

      // Test setting user context
      try {
        const { error: setContextError } = await supabase.rpc('set_auth_user_id', {
          user_id: testUserId
        });

        if (setContextError) {
          console.log('❌ Error setting user context:', setContextError);
        } else {
          console.log('✅ Successfully set user context');

          // Test getting user context
          const { data: currentUserId, error: getUserError } = await supabase.rpc('get_current_user_id');
          
          if (getUserError) {
            console.log('❌ Error getting current user ID:', getUserError);
          } else {
            console.log(`✅ get_current_user_id() returned: ${currentUserId}`);
            
            if (currentUserId === testUserId) {
              console.log('✅ User context is working correctly');
            } else {
              console.log('❌ User context mismatch!');
            }
          }
        }
      } catch (error) {
        console.log('❌ RPC functions not available:', error.message);
      }
    }

    console.log('\n📋 4. Checking vendor data...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, user_id')
      .limit(5);

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
    } else {
      console.log(`✅ Found ${vendors.length} vendors:`);
      vendors.forEach(vendor => {
        console.log(`   - Vendor ID: ${vendor.id} → User ID: ${vendor.user_id}`);
      });
    }

    console.log('\n📋 5. Testing storage folder parsing...');
    try {
      const testPath = 'a9b4a478-0562-4874-8858-63987fef9d8f/test.png';
      console.log(`🧪 Testing path: ${testPath}`);
      
      const { data: folderResult, error: folderError } = await supabase.rpc('exec', {
        query: `SELECT (storage.foldername('${testPath}'))[1]::uuid as vendor_id`
      });

      if (folderError) {
        console.log('❌ Error testing folder parsing:', folderError);
      } else {
        console.log('✅ Folder parsing result:', folderResult);
      }
    } catch (error) {
      console.log('❌ Could not test folder parsing:', error.message);
    }

    console.log('\n🔍 DIAGNOSIS COMPLETE');
    console.log('\nNext steps:');
    console.log('1. Check if all storage policies were created');
    console.log('2. Verify vendor-images bucket exists and is configured');
    console.log('3. Test get_current_user_id() function works');
    console.log('4. Verify vendor ownership relationships');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

debugStorage();