#!/usr/bin/env node

/**
 * Deploy Storage RLS Policy Fix
 * 
 * This script fixes the Supabase Storage RLS policies to work with NextAuth
 * by replacing auth.uid() with public.get_current_user_id()
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployStorageFix() {
  try {
    console.log('🔧 Deploying Storage RLS Policy Fix for NextAuth...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-storage-rls-policy.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing SQL commands...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }

    console.log('✅ Successfully updated Storage RLS policies!');
    console.log('\n📋 Changes made:');
    console.log('   - Dropped old policies using auth.uid()');
    console.log('   - Created new policies using public.get_current_user_id()');
    console.log('   - Added comprehensive INSERT/SELECT/UPDATE/DELETE policies');
    
    console.log('\n🎉 Storage uploads should now work with NextAuth!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Test image uploads in your app');
    console.log('   2. Check the upload routes have been updated');
    console.log('   3. Monitor for any remaining RLS errors');
    
  } catch (error) {
    console.error('❌ Error deploying storage fix:', error);
    process.exit(1);
  }
}

// Check if the required SQL file exists
const sqlPath = path.join(__dirname, 'fix-storage-rls-policy.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('❌ SQL file not found:', sqlPath);
  console.error('Please make sure fix-storage-rls-policy.sql exists in the scripts directory.');
  process.exit(1);
}

deployStorageFix();