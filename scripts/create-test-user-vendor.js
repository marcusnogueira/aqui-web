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

async function createTestUserVendor() {
  console.log('🚀 Creating test user with vendor profile...')
  
  const testEmail = 'test@example.com'
  const testPassword = 'Test1234!'
  
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message)
      process.exit(1)
    }
    
    console.log('✅ Created auth user:', testEmail)
    
    // Create user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        full_name: 'Test User',
        is_vendor: true,
        is_admin: false,
        active_role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (userError) {
      console.error('❌ Failed to create user profile:', userError.message)
      process.exit(1)
    }
    
    console.log('✅ Created user profile')
    
    // Create vendor profile
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: authUser.user.id,
        business_name: 'Test Vendor Business',
        description: 'A test vendor for testing vendor switching functionality',
        business_type: 'food',
        is_active: true,
        is_approved: true,
        average_rating: 4.5,
        total_reviews: 10,
        latitude: 37.7749,
        longitude: -122.4194,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (vendorError) {
      console.error('❌ Failed to create vendor profile:', vendorError.message)
      process.exit(1)
    }
    
    console.log('✅ Created vendor profile')
    
    // Create live session
    const { error: sessionError } = await supabase
      .from('vendor_live_sessions')
      .insert({
        vendor_id: vendorProfile.id,
        is_active: true,
        latitude: 37.7749,
        longitude: -122.4194,
        start_time: new Date().toISOString()
      })
    
    if (sessionError) {
      console.error('❌ Failed to create live session:', sessionError.message)
    } else {
      console.log('✅ Created live session')
    }
    
    console.log('\n🎉 Test user with vendor profile created successfully!')
    console.log('📧 Email:', testEmail)
    console.log('🔑 Password:', testPassword)
    console.log('🏪 Business:', vendorProfile.business_name)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

createTestUserVendor()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })