#!/usr/bin/env node

/**
 * Debug script to test the end live session functionality
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkActiveSessions() {
  console.log('🔍 Checking for active live sessions...')
  
  try {
    const { data: activeSessions, error } = await supabase
      .from('vendor_live_sessions')
      .select(`
        id,
        vendor_id,
        is_active,
        start_time,
        end_time,
        latitude,
        longitude,
        vendors(id, business_name, user_id)
      `)
      .eq('is_active', true)
    
    if (error) {
      console.error('❌ Error fetching active sessions:', error.message)
      return []
    }
    
    console.log(`✅ Found ${activeSessions?.length || 0} active sessions:`)
    
    activeSessions?.forEach((session, index) => {
      console.log(`\n   ${index + 1}. Session ID: ${session.id}`)
      console.log(`      Vendor: ${session.vendors?.business_name || 'Unknown'}`)
      console.log(`      User ID: ${session.vendors?.user_id || 'Unknown'}`)
      console.log(`      Started: ${new Date(session.start_time).toLocaleString()}`)
      console.log(`      Location: ${session.latitude}, ${session.longitude}`)
      console.log(`      Is Active: ${session.is_active}`)
    })
    
    return activeSessions || []
    
  } catch (error) {
    console.error('❌ Error checking active sessions:', error.message)
    return []
  }
}

async function testEndSessionLogic(vendorId, userId) {
  console.log(`\n🧪 Testing end session logic for vendor ${vendorId}...`)
  
  try {
    // Simulate the exact logic from the API
    console.log('   1. Finding vendor for user...')
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (vendorError || !vendor) {
      console.error('   ❌ Failed to find vendor:', vendorError?.message)
      return false
    }
    
    console.log(`   ✅ Vendor found: ${vendor.id}`)
    
    // Check if there's an active session to end
    console.log('   2. Checking for active session...')
    const { data: activeSession, error: checkError } = await supabase
      .from('vendor_live_sessions')
      .select('id, is_active')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('   ❌ Error checking active session:', checkError.message)
      return false
    }
    
    if (!activeSession) {
      console.log('   ⚠️  No active session found to end')
      return false
    }
    
    console.log(`   ✅ Active session found: ${activeSession.id}`)
    
    // Simulate the update operation
    console.log('   3. Simulating session end update...')
    const { data: updatedSessions, error: updateError } = await supabase
      .from('vendor_live_sessions')
      .update({
        end_time: new Date().toISOString(),
        is_active: false,
        ended_by: 'vendor'
      })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .select()
    
    if (updateError) {
      console.error('   ❌ Failed to end live session:', updateError.message)
      return false
    }
    
    if (!updatedSessions || updatedSessions.length === 0) {
      console.log('   ⚠️  No sessions were updated (this would return 404)')
      return false
    }
    
    console.log(`   ✅ Successfully ended ${updatedSessions.length} session(s)`)
    
    // Revert the change for testing purposes
    console.log('   4. Reverting change for testing...')
    await supabase
      .from('vendor_live_sessions')
      .update({
        end_time: null,
        is_active: true,
        ended_by: null
      })
      .eq('id', updatedSessions[0].id)
    
    console.log('   ✅ Change reverted')
    
    return true
    
  } catch (error) {
    console.error('   ❌ Test failed:', error.message)
    return false
  }
}

async function testAPIEndpoint() {
  console.log('\n🌐 Testing API endpoint directly...')
  
  try {
    // This would normally require authentication, so we'll just test the structure
    console.log('   ⚠️  Cannot test API endpoint directly without authentication')
    console.log('   💡 To test the API endpoint:')
    console.log('      1. Start the development server: npm run dev')
    console.log('      2. Sign in as a vendor with an active session')
    console.log('      3. Try to end the session from the dashboard')
    console.log('      4. Check the browser console and network tab for errors')
    
  } catch (error) {
    console.error('   ❌ API test failed:', error.message)
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS policies for vendor_live_sessions...')
  
  try {
    // Check if RLS is enabled
    const { data: tableInfo, error } = await supabase
      .rpc('pg_get_tabledef', { table_name: 'vendor_live_sessions' })
    
    if (error) {
      console.log('   ⚠️  Cannot check RLS policies directly')
    }
    
    // Try to query with service role (should work)
    const { data: serviceRoleTest, error: serviceError } = await supabase
      .from('vendor_live_sessions')
      .select('id')
      .limit(1)
    
    if (serviceError) {
      console.error('   ❌ Service role query failed:', serviceError.message)
    } else {
      console.log('   ✅ Service role can access vendor_live_sessions')
    }
    
  } catch (error) {
    console.error('   ❌ RLS check failed:', error.message)
  }
}

async function suggestFixes() {
  console.log('\n🔧 Suggested fixes for end session issues:')
  console.log('=====================================')
  
  console.log('\n1. Authentication Issues:')
  console.log('   - Check if NextAuth session is valid')
  console.log('   - Verify user ID is being passed correctly')
  console.log('   - Ensure cookies are being sent with the request')
  
  console.log('\n2. Database Issues:')
  console.log('   - Verify vendor exists for the user')
  console.log('   - Check if there\'s actually an active session to end')
  console.log('   - Ensure RLS policies allow the operation')
  
  console.log('\n3. API Issues:')
  console.log('   - Check if the DELETE request is reaching the API')
  console.log('   - Verify the API is using the correct Supabase client')
  console.log('   - Ensure error handling is working properly')
  
  console.log('\n4. Frontend Issues:')
  console.log('   - Check if the fetch request is being made correctly')
  console.log('   - Verify error handling in the frontend')
  console.log('   - Ensure the UI is updated after successful end')
  
  console.log('\n5. Quick Debug Steps:')
  console.log('   - Check browser console for JavaScript errors')
  console.log('   - Check network tab for failed API requests')
  console.log('   - Check server logs for API errors')
  console.log('   - Verify the session state in the database')
}

async function main() {
  console.log('🚀 Debugging End Live Session Issue')
  console.log('====================================')
  
  const activeSessions = await checkActiveSessions()
  
  if (activeSessions.length > 0) {
    console.log('\n🧪 Testing end session logic with active sessions...')
    
    for (const session of activeSessions) {
      if (session.vendors?.user_id) {
        const success = await testEndSessionLogic(session.vendor_id, session.vendors.user_id)
        if (success) {
          console.log(`   ✅ End session logic works for vendor ${session.vendors.business_name}`)
        } else {
          console.log(`   ❌ End session logic failed for vendor ${session.vendors.business_name}`)
        }
      }
    }
  } else {
    console.log('\n⚠️  No active sessions found to test with')
  }
  
  await testAPIEndpoint()
  await checkRLSPolicies()
  await suggestFixes()
  
  console.log('\n✅ Debug completed!')
  console.log('\nNext steps:')
  console.log('1. Check the specific error message in browser console')
  console.log('2. Verify authentication is working')
  console.log('3. Check if there\'s actually an active session to end')
  console.log('4. Test the API endpoint manually')
}

if (require.main === module) {
  main().catch(console.error)
}