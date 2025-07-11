import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load .env.local values
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function validateDatabase() {
  console.log('🔍 Validating database structure and existing data...\n')
  
  try {
    // Check vendors table structure and data
    console.log('📊 VENDORS TABLE:')
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .limit(5)
    
    if (vendorsError) {
      console.error('❌ Error querying vendors:', vendorsError.message)
    } else {
      console.log(`✅ Found ${vendors?.length || 0} vendors (showing first 5):`)
      vendors?.forEach(vendor => {
        console.log(`  - ID: ${vendor.id}, Name: ${vendor.business_name}, Active: ${vendor.is_active}, Approved: ${vendor.is_approved}`)
      })
    }
    
    // Get total vendor count
    const { count: vendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
    console.log(`📈 Total vendors: ${vendorCount}\n`)
    
    // Check vendor_live_sessions table
    console.log('🔴 VENDOR_LIVE_SESSIONS TABLE:')
    const { data: liveSessions, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('*')
      .limit(5)
    
    if (sessionsError) {
      console.error('❌ Error querying live sessions:', sessionsError.message)
    } else {
      console.log(`✅ Found ${liveSessions?.length || 0} live sessions (showing first 5):`)
      liveSessions?.forEach(session => {
        console.log(`  - Vendor ID: ${session.vendor_id}, Active: ${session.is_active}, Lat: ${session.latitude}, Lng: ${session.longitude}`)
      })
    }
    
    // Get total live sessions count
    const { count: sessionCount } = await supabase
      .from('vendor_live_sessions')
      .select('*', { count: 'exact', head: true })
    console.log(`📈 Total live sessions: ${sessionCount}\n`)
    
    // Check active live sessions
    const { data: activeSessions, error: activeError } = await supabase
      .from('vendor_live_sessions')
      .select('*')
      .eq('is_active', true)
    
    if (!activeError) {
      console.log(`🟢 Active live sessions: ${activeSessions?.length || 0}`)
      activeSessions?.forEach(session => {
        console.log(`  - Vendor ID: ${session.vendor_id}, Started: ${session.start_time}`)
      })
    }
    
    console.log('\n🎯 ANALYSIS:')
    if (vendorCount > 0 && sessionCount === 0) {
      console.log('⚠️  Issue found: Vendors exist but no live sessions - this explains why explore page is empty')
      console.log('💡 Solution: Create live sessions for existing vendors')
    } else if (vendorCount > 0 && sessionCount > 0) {
      console.log('✅ Both vendors and live sessions exist')
      if (activeSessions?.length === 0) {
        console.log('⚠️  Issue: Live sessions exist but none are active')
      }
    } else {
      console.log('⚠️  No vendors found in database')
    }
    
  } catch (error) {
    console.error('❌ Database validation failed:', error)
  }
}

// Run validation
validateDatabase()
  .then(() => {
    console.log('\n✅ Database validation completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  })