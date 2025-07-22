#!/usr/bin/env node

/**
 * Fix vendors table RLS policy for NextAuth compatibility
 * This script updates the vendors table RLS policy to use get_current_user_id() instead of auth.uid()
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixVendorsRLSPolicy() {
  try {
    console.log('🔧 Fixing vendors table RLS policy for NextAuth...');
    
    // Drop the old policy
    console.log('Dropping old policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Vendors: owner can manage" ON public.vendors;'
    });
    
    if (dropError) {
      console.error('Error dropping old policy:', dropError);
      // Continue anyway, policy might not exist
    }
    
    // Create new policy
    console.log('Creating new policy...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Vendors can manage their own profile" ON public.vendors
             FOR ALL USING (public.get_current_user_id() = user_id)
             WITH CHECK (public.get_current_user_id() = user_id);`
    });
    
    if (createError) {
      console.error('Error creating new policy:', createError);
      process.exit(1);
    }
    
    console.log('✅ Successfully updated vendors table RLS policy!');
    console.log('The vendors table now uses get_current_user_id() for NextAuth compatibility.');
    
  } catch (error) {
    console.error('❌ Error fixing vendors RLS policy:', error);
    process.exit(1);
  }
}

fixVendorsRLSPolicy();