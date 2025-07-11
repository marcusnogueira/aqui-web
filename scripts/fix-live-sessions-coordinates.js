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

async function fixLiveSessionCoordinates() {
  console.log('🔧 Fixing live session coordinates...\n')
  
  try {
    // Get all active live sessions with null coordinates
    const { data: sessionsWithoutCoords, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('id, vendor_id, latitude, longitude')
      .eq('is_active', true)
      .or('latitude.is.null,longitude.is.null')
    
    if (sessionsError) {
      console.error('❌ Error fetching live sessions:', sessionsError.message)
      return
    }
    
    console.log(`📊 Found ${sessionsWithoutCoords?.length || 0} live sessions with missing coordinates`)
    
    if (!sessionsWithoutCoords || sessionsWithoutCoords.length === 0) {
      console.log('✅ All live sessions already have coordinates!')
      return
    }
    
    let successCount = 0
    let errorCount = 0
    
    // Process each session
    for (const session of sessionsWithoutCoords) {
      try {
        // Get vendor coordinates
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id, business_name, latitude, longitude')
          .eq('id', session.vendor_id)
          .single()
        
        if (vendorError || !vendor) {
          console.error(`❌ Could not find vendor for session ${session.id}:`, vendorError?.message)
          errorCount++
          continue
        }
        
        if (!vendor.latitude || !vendor.longitude) {
          console.log(`⚠️  Vendor ${vendor.business_name} has no coordinates, skipping...`)
          continue
        }
        
        // Update live session with vendor coordinates
        const { error: updateError } = await supabase
          .from('vendor_live_sessions')
          .update({
            latitude: vendor.latitude,
            longitude: vendor.longitude
          })
          .eq('id', session.id)
        
        if (updateError) {
          console.error(`❌ Failed to update session for ${vendor.business_name}:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ Updated coordinates for ${vendor.business_name} (${vendor.latitude}, ${vendor.longitude})`)
          successCount++
        }
        
      } catch (error) {
        console.error(`❌ Unexpected error processing session ${session.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📈 Summary:')
    console.log(`✅ Successfully updated: ${successCount} live sessions`)
    console.log(`❌ Errors: ${errorCount}`)
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const { data: verifyActiveSessions, error: verifyError } = await supabase
      .from('vendor_live_sessions')
      .select('vendor_id, latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    
    if (!verifyError) {
      console.log(`🎉 ${verifyActiveSessions?.length || 0} active live sessions now have valid coordinates!`)
    }
    
  } catch (error) {
    console.error('❌ Fix operation failed:', error)
  }
}

// Run the fix
fixLiveSessionCoordinates()
  .then(() => {
    console.log('\n✅ Live session coordinate fix completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  })