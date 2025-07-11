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

async function createAdminVendor() {
  console.log('🚀 Creating vendor profile for admin user...')
  
  // Get admin user
  const { data: adminUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@example.com')
    .single()
  
  if (userError || !adminUser) {
    console.error('❌ Admin user not found:', userError?.message)
    process.exit(1)
  }
  
  console.log('✅ Found admin user:', adminUser.email)
  
  // Check if vendor profile already exists
  const { data: existingVendor, error: checkError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', adminUser.id)
    .single()
  
  if (existingVendor) {
    console.log('✅ Vendor profile already exists for admin user')
    return
  }
  
  // Create vendor profile
  const { data: newVendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      user_id: adminUser.id,
      business_name: 'Admin Test Vendor',
      description: 'Test vendor for admin user',
      business_type: 'food',
      is_active: true,
      is_approved: true,
      average_rating: 4.5,
      total_reviews: 5,
      latitude: 37.7749,
      longitude: -122.4194
    })
    .select('id')
    .single()
  
  if (vendorError) {
    console.error('❌ Failed to create vendor profile:', vendorError.message)
    process.exit(1)
  }
  
  console.log('✅ Created vendor profile for admin user')
  
  // Create live session
  const { error: sessionError } = await supabase
    .from('vendor_live_sessions')
    .insert({
      vendor_id: newVendor.id,
      is_active: true,
      latitude: 37.7749,
      longitude: -122.4194,
      start_time: new Date().toISOString()
    })
  
  if (sessionError) {
    console.error('❌ Failed to create live session:', sessionError.message)
  } else {
    console.log('✅ Created live session for admin vendor')
  }
  
  console.log('🎉 Admin vendor setup completed!')
}

createAdminVendor()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })