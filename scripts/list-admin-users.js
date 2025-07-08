#!/usr/bin/env node

/**
 * Script to list all admin users
 * Run with: node scripts/list-admin-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAdminUsers() {
  try {
    console.log('🔍 Listing all admin users...');
    
    // Get all admin users from users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, full_name, is_admin, is_vendor, active_role, created_at')
      .eq('is_admin', true);
    
    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    console.log(`✅ Found ${adminUsers.length} admin user(s):`);
    console.log('');
    
    adminUsers.forEach((user, index) => {
      console.log(`👤 Admin User ${index + 1}:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📝 Name: ${user.full_name}`);
      console.log(`   🏪 Is Vendor: ${user.is_vendor}`);
      console.log(`   🎭 Active Role: ${user.active_role}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Also get auth user emails for these admin users
    console.log('📧 Getting email addresses from auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    adminUsers.forEach((user, index) => {
      const authUser = authUsers.users.find(au => au.id === user.id);
      if (authUser) {
        console.log(`👤 Admin User ${index + 1} Email: ${authUser.email}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listAdminUsers();