#!/usr/bin/env node

/**
 * Script to create admin_users and favorites tables using direct SQL
 * Run with: node scripts/create-admin-direct.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTablesDirectly() {
  try {
    console.log('🔧 Creating admin_users and favorites tables directly...');
    
    // First, let's check what tables actually exist
    console.log('📋 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📋 Existing tables:', tables);
    }
    
    // Create favorites table
    console.log('📝 Creating favorites table...');
    const { data: favoritesResult, error: favoritesError } = await supabase
      .rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS favorites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, vendor_id)
          );
        `
      });
    
    if (favoritesError) {
      console.error('❌ Error creating favorites table:', favoritesError);
    } else {
      console.log('✅ Favorites table creation executed:', favoritesResult);
    }
    
    // Create admin_users table
    console.log('📝 Creating admin_users table...');
    const { data: adminResult, error: adminError } = await supabase
      .rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
        `
      });
    
    if (adminError) {
      console.error('❌ Error creating admin_users table:', adminError);
    } else {
      console.log('✅ Admin_users table creation executed:', adminResult);
    }
    
    // Create indexes
    console.log('📝 Creating indexes...');
    const { data: indexResult, error: indexError } = await supabase
      .rpc('exec', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON favorites(vendor_id);
        `
      });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes creation executed:', indexResult);
    }
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const { data: verifyTables, error: verifyError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('favorites', 'admin_users')
          ORDER BY table_name;
        `
      });
    
    if (verifyError) {
      console.error('❌ Error verifying tables:', verifyError);
    } else {
      console.log('📋 Created tables:', verifyTables);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTablesDirectly();