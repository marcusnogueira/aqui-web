#!/usr/bin/env node

/**
 * Manual Phase 2: Database Schema Migration
 * 
 * Since we can't execute raw SQL through the Supabase JS client,
 * this script provides manual steps and validates the current state.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentState() {
  console.log('🔍 CHECKING CURRENT DATABASE STATE...\n');
  
  try {
    // Check admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('id, username, email');
    
    if (adminError) {
      console.log('❌ Admin users check failed:', adminError.message);
    } else {
      console.log(`✅ Admin users: ${adminUsers.length} found`);
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.email})`);
      });
    }
    
    // Check public users
    const { data: publicUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, active_role', { count: 'exact' });
    
    if (usersError) {
      console.log('❌ Public users check failed:', usersError.message);
    } else {
      console.log(`✅ Public users: ${publicUsers.length} found`);
    }
    
    // Check vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name', { count: 'exact' });
    
    if (vendorsError) {
      console.log('❌ Vendors check failed:', vendorsError.message);
    } else {
      console.log(`✅ Vendors: ${vendors.length} found`);
    }
    
    console.log('\n📋 CURRENT STATE SUMMARY:');
    console.log(`   Admin Users: ${adminUsers?.length || 0}`);
    console.log(`   Public Users: ${publicUsers?.length || 0}`);
    console.log(`   Vendors: ${vendors?.length || 0}`);
    
    return {
      adminUsers: adminUsers?.length || 0,
      publicUsers: publicUsers?.length || 0,
      vendors: vendors?.length || 0
    };
    
  } catch (error) {
    console.error('💥 State check failed:', error.message);
    throw error;
  }
}

async function clearUserData() {
  console.log('\n🧹 CLEARING USER DATA (STARTING FRESH)...');
  console.log('⚠️  This will delete all users and vendors (admin users are backed up)');
  
  try {
    // Delete in correct order to handle foreign key constraints
    
    // 1. Delete vendor-related data
    console.log('🔄 Deleting vendor live sessions...');
    const { error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (sessionsError) console.log('   Warning:', sessionsError.message);
    
    console.log('🔄 Deleting vendor announcements...');
    const { error: announcementsError } = await supabase
      .from('vendor_announcements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (announcementsError) console.log('   Warning:', announcementsError.message);
    
    console.log('🔄 Deleting vendor specials...');
    const { error: specialsError } = await supabase
      .from('vendor_specials')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (specialsError) console.log('   Warning:', specialsError.message);
    
    console.log('🔄 Deleting vendor static locations...');
    const { error: locationsError } = await supabase
      .from('vendor_static_locations')
      .delete()
      .neq('id', 0); // Delete all (this table uses integer IDs)
    
    if (locationsError) console.log('   Warning:', locationsError.message);
    
    console.log('🔄 Deleting vendor hours...');
    const { error: hoursError } = await supabase
      .from('vendor_hours')
      .delete()
      .neq('id', 0);
    
    if (hoursError) console.log('   Warning:', hoursError.message);
    
    console.log('🔄 Deleting vendor feedback...');
    const { error: feedbackError } = await supabase
      .from('vendor_feedback')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (feedbackError) console.log('   Warning:', feedbackError.message);
    
    // 2. Delete user-generated content
    console.log('🔄 Deleting reviews...');
    const { error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (reviewsError) console.log('   Warning:', reviewsError.message);
    
    console.log('🔄 Deleting favorites...');
    const { error: favoritesError } = await supabase
      .from('favorites')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (favoritesError) console.log('   Warning:', favoritesError.message);
    
    console.log('🔄 Deleting customer tracking...');
    const { error: trackingError } = await supabase
      .from('customer_on_the_way')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (trackingError) console.log('   Warning:', trackingError.message);
    
    console.log('🔄 Deleting search logs...');
    const { error: searchError } = await supabase
      .from('search_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (searchError) console.log('   Warning:', searchError.message);
    
    // 3. Delete vendors
    console.log('🔄 Deleting vendors...');
    const { error: vendorsError } = await supabase
      .from('vendors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (vendorsError) console.log('   Warning:', vendorsError.message);
    
    // 4. Delete public users
    console.log('🔄 Deleting public users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (usersError) console.log('   Warning:', usersError.message);
    
    console.log('✅ User data cleanup completed');
    
  } catch (error) {
    console.error('❌ User data cleanup failed:', error.message);
    throw error;
  }
}

async function validateCleanup() {
  console.log('\n🔍 VALIDATING CLEANUP...');
  
  const state = await checkCurrentState();
  
  if (state.publicUsers === 0 && state.vendors === 0) {
    console.log('✅ Cleanup validation passed');
    console.log(`   Admin users preserved: ${state.adminUsers}`);
    return true;
  } else {
    console.log('❌ Cleanup validation failed');
    console.log(`   Public users remaining: ${state.publicUsers}`);
    console.log(`   Vendors remaining: ${state.vendors}`);
    return false;
  }
}

async function runManualMigration() {
  console.log('🚀 MANUAL PHASE 2: DATABASE SCHEMA MIGRATION\n');
  console.log('Since we cannot execute raw SQL through the Supabase JS client,');
  console.log('this script will handle the parts we can do programmatically.\n');
  
  try {
    // Step 1: Check current state
    await checkCurrentState();
    
    // Step 2: Clear user data (we can do this through the client)
    console.log('\n⚠️  STARTING USER DATA CLEANUP IN 5 SECONDS...');
    console.log('   Press Ctrl+C to cancel if needed');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await clearUserData();
    
    // Step 3: Validate cleanup
    const cleanupValid = await validateCleanup();
    
    if (!cleanupValid) {
      throw new Error('Cleanup validation failed');
    }
    
    // Step 4: Update migration status
    const statusFile = path.join(__dirname, '..', 'MIGRATION_STATUS.json');
    if (fs.existsSync(statusFile)) {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      status.phases.phase2_database.status = 'partial_complete';
      status.phases.phase2_database.completed = new Date().toISOString();
      status.phases.phase2_database.notes = 'User data cleared. Manual SQL execution required for RLS functions.';
      
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
      console.log('✅ Migration status updated');
    }
    
    console.log('\n🎉 PARTIAL PHASE 2 MIGRATION COMPLETED!');
    console.log('='.repeat(50));
    console.log('✅ User data cleared (fresh start)');
    console.log('✅ Admin users preserved');
    console.log('✅ Database ready for NextAuth users');
    
    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('Since we cannot execute raw SQL through the JS client, you need to:');
    console.log('');
    console.log('1. Connect to your database with psql or Supabase SQL editor');
    console.log('2. Execute: scripts/nextauth_rls_functions.sql');
    console.log('3. Execute: scripts/update_rls_policies.sql');
    console.log('');
    console.log('Database connection:');
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log('   Use your service role key for authentication');
    
    console.log('\n🚀 AFTER MANUAL SQL EXECUTION:');
    console.log('1. Restore admin users: node backups/restore_admin_users_*.js');
    console.log('2. Begin Phase 3: API Routes Migration');
    console.log('3. Test the application');
    
  } catch (error) {
    console.error('\n💥 MANUAL MIGRATION FAILED:', error.message);
    throw error;
  }
}

// Run manual migration
runManualMigration()
  .then(() => {
    console.log('\n✅ Manual migration steps completed!');
    console.log('Remember to execute the SQL scripts manually.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });