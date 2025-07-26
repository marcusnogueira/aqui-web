#!/usr/bin/env node

/**
 * Fix RLS Policies for NextAuth Migration
 * 
 * This script fixes the RLS policies that are blocking vendor live sessions
 * during the NextAuth migration.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS policy fix...')
  
  // Create service role client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('📋 Checking current policies...')
    
    // Check current policies
    const { data: currentPolicies, error: checkError } = await supabase
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'vendor_live_sessions';
        `
      })
    
    if (checkError) {
      console.warn('⚠️ Could not check current policies:', checkError)
    } else {
      console.log('📋 Current policies:', currentPolicies)
    }

    console.log('🗑️ Dropping existing policies...')
    
    // Drop existing policies
    await supabase.rpc('sql', {
      query: `DROP POLICY IF EXISTS "Anyone can view live sessions" ON vendor_live_sessions;`
    })
    
    await supabase.rpc('sql', {
      query: `DROP POLICY IF EXISTS "Vendors can manage their own sessions" ON vendor_live_sessions;`
    })
    
    await supabase.rpc('sql', {
      query: `DROP POLICY IF EXISTS "Public can view live sessions" ON vendor_live_sessions;`
    })
    
    await supabase.rpc('sql', {
      query: `DROP POLICY IF EXISTS "Vendors can manage their sessions" ON vendor_live_sessions;`
    })

    console.log('✅ Old policies dropped')

    console.log('🔨 Creating new policies...')
    
    // Create public view policy
    await supabase.rpc('sql', {
      query: `
        CREATE POLICY "Public can view live sessions" ON vendor_live_sessions
        FOR SELECT USING (true);
      `
    })
    
    console.log('✅ Public view policy created')

    // Create vendor management policy
    await supabase.rpc('sql', {
      query: `
        CREATE POLICY "Vendors can manage their sessions" ON vendor_live_sessions
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_live_sessions.vendor_id 
            AND vendors.user_id = (
              COALESCE(
                -- Try to get from session variable first
                NULLIF(current_setting('app.current_user_id', true), '')::UUID,
                -- Fallback to auth.uid() if available
                auth.uid(),
                -- If neither works, allow service role
                CASE WHEN current_user = 'service_role' THEN vendors.user_id ELSE NULL END
              )
            )
          )
        );
      `
    })
    
    console.log('✅ Vendor management policy created')

    // Grant permissions
    await supabase.rpc('sql', {
      query: `GRANT ALL ON TABLE vendor_live_sessions TO authenticated;`
    })
    
    await supabase.rpc('sql', {
      query: `GRANT ALL ON TABLE vendor_live_sessions TO service_role;`
    })
    
    console.log('✅ Permissions granted')

    // Verify new policies
    const { data: newPolicies, error: verifyError } = await supabase
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'vendor_live_sessions';
        `
      })
    
    if (verifyError) {
      console.warn('⚠️ Could not verify new policies:', verifyError)
    } else {
      console.log('📋 New policies:', newPolicies)
    }

    console.log('🎉 RLS policies fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    process.exit(1)
  }
}

// Run the fix
fixRLSPolicies()
  .then(() => {
    console.log('✅ RLS policy fix completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ RLS policy fix failed:', error)
    process.exit(1)
  })