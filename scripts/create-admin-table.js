#!/usr/bin/env node

/**
 * Script to create admin_users and favorites tables
 * Run with: node scripts/create-admin-table.js
 */

// ⚠️  DEPRECATED: This script is DEPRECATED and should NOT be used.
// Use scripts/database-setup.sql instead for all table creation.
// This file is kept for reference only.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminTable() {
  try {
    console.log('🔧 Creating admin_users and favorites tables...');
    
    // Create favorites table
    console.log('📝 Creating favorites table...');
    const { error: favoritesError } = await supabase
      .from('favorites')
      .select('id')
      .limit(1);
    
    if (favoritesError && favoritesError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createFavoritesError } = await supabase.rpc('exec', {
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
      
      if (createFavoritesError) {
        console.error('❌ Error creating favorites table:', createFavoritesError);
      } else {
        console.log('✅ Favorites table created successfully');
      }
    } else {
      console.log('✅ Favorites table already exists');
    }
    
    // Create admin_users table
    console.log('📝 Creating admin_users table...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (adminError && adminError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createAdminError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
        `
      });
      
      if (createAdminError) {
        console.error('❌ Error creating admin_users table:', createAdminError);
      } else {
        console.log('✅ Admin_users table created successfully');
      }
    } else {
      console.log('✅ Admin_users table already exists');
    }
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON favorites(vendor_id);
      `
    });
    
    console.log('✅ Tables and indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminTable();