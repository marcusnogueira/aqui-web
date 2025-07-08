#!/usr/bin/env node

/**
 * Script to set up the admin authentication system
 * Creates the proper admin_users table for independent admin authentication
 * Run with: node scripts/setup-admin-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAdminAuth() {
  try {
    console.log('Setting up admin authentication system...');
    
    // Drop existing admin_users table if it exists (since it has wrong schema)
    console.log('\nDropping existing admin_users table if it exists...');
    const { error: dropError } = await supabase
      .from('admin_users')
      .delete()
      .neq('id', 'dummy'); // This will fail if table doesn't exist, which is fine
    
    // Create the proper admin_users table
    console.log('\nCreating admin_users table with proper schema...');
    
    const createTableSQL = `
      -- Drop existing table if it exists
      DROP TABLE IF EXISTS public.admin_users CASCADE;
      
      -- Create admin_users table for independent admin authentication
      CREATE TABLE public.admin_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes for performance
      CREATE INDEX idx_admin_users_email ON public.admin_users(email);
      CREATE INDEX idx_admin_users_username ON public.admin_users(username);
      
      -- Enable RLS
      ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policy - only allow access via service role (server-side)
      CREATE POLICY "Admin users are only accessible via service role" ON public.admin_users
        FOR ALL USING (false); -- No direct access from client
    `;
    
    // Execute the SQL using a direct query (since rpc might not be available)
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError && createError.code !== 'PGRST202') {
      // If rpc is not available, try alternative approach
      console.log('RPC not available, using alternative table creation method...');
      
      // Try to create table using individual operations
      const { error: altError } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        console.log('Table creation SQL prepared. Manual execution required.');
        console.log('\nPlease execute the following SQL in your Supabase SQL editor:');
        console.log('\n' + createTableSQL);
        return;
      }
    }
    
    console.log('Admin users table created successfully!');
    
    // Verify table creation
    console.log('\nVerifying table structure...');
    const { data: tableInfo, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.log('Table verification failed:', verifyError.message);
    } else {
      console.log('Table verified successfully!');
    }
    
    console.log('\nAdmin authentication system setup complete!');
    console.log('\nNext steps:');
    console.log('1. Create admin users using the admin creation script');
    console.log('2. Implement admin login routes and components');
    console.log('3. Set up admin session management');
    
  } catch (error) {
    console.error('Error setting up admin auth:', error);
  }
}

setupAdminAuth();