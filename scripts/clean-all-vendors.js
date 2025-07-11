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

async function cleanAllVendors() {
  console.log('🧹 Starting complete vendor cleanup...')
  
  try {
    // First, get counts before deletion
    const { count: vendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
    
    const { count: sessionCount } = await supabase
      .from('vendor_live_sessions')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Found ${vendorCount} vendors and ${sessionCount} live sessions`)
    
    // Delete all vendor live sessions first (due to foreign key constraints)
    console.log('🗑️  Deleting all vendor live sessions...')
    const { error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .delete()
      .not('id', 'is', null) // Delete all records
    
    if (sessionsError) {
      console.error('❌ Error deleting live sessions:', sessionsError.message)
      return
    }
    
    console.log('✅ All vendor live sessions deleted')
    
    // Delete all vendors
    console.log('🗑️  Deleting all vendors...')
    const { error: vendorsError } = await supabase
      .from('vendors')
      .delete()
      .not('id', 'is', null) // Delete all records
    
    if (vendorsError) {
      console.error('❌ Error deleting vendors:', vendorsError.message)
      return
    }
    
    console.log('✅ All vendors deleted')
    
    // Verify cleanup
    const { count: finalVendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalSessionCount } = await supabase
      .from('vendor_live_sessions')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n🎯 CLEANUP RESULTS:`)
    console.log(`📊 Vendors remaining: ${finalVendorCount}`)
    console.log(`📊 Live sessions remaining: ${finalSessionCount}`)
    
    if (finalVendorCount === 0 && finalSessionCount === 0) {
      console.log('✅ Database successfully cleaned - all vendors and live sessions removed')
    } else {
      console.log('⚠️  Some records may still remain')
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

// Run cleanup
cleanAllVendors()
  .then(() => {
    console.log('\n✅ Vendor cleanup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })