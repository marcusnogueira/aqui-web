import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

// ✅ Load .env.local values
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const mockUsers = [
  { email: 'vendor1@example.com', city: 'San Francisco', lat: 37.7749, lon: -122.4194, name: 'Taco Cart SF' },
  { email: 'vendor2@example.com', city: 'San Francisco', lat: 37.776, lon: -122.423, name: 'Boba Stand SF' },
  { email: 'vendor3@example.com', city: 'San Francisco', lat: 37.773, lon: -122.431, name: 'Hot Dog Guy' },
  { email: 'vendor4@example.com', city: 'San Francisco', lat: 37.775, lon: -122.417, name: 'Arepa Lady SF' },
  { email: 'vendor5@example.com', city: 'San Francisco', lat: 37.778, lon: -122.412, name: 'Churro Truck' },
  { email: 'vendor6@example.com', city: 'San Jose', lat: 37.3382, lon: -121.8863, name: 'Fruit Cart SJ' },
  { email: 'vendor7@example.com', city: 'San Jose', lat: 37.335, lon: -121.89, name: 'Snack Shack' },
  { email: 'vendor8@example.com', city: 'San Bruno', lat: 37.6305, lon: -122.4111, name: 'Empanada Express' },
  { email: 'vendor9@example.com', city: 'Austin', lat: 30.2672, lon: -97.7431, name: 'Birria Bros' },
  { email: 'vendor10@example.com', city: 'Lima', lat: -12.0464, lon: -77.0428, name: 'Tamalito Limeño' },
  { email: 'vendor11@example.com', city: 'Lima', lat: -12.048, lon: -77.040, name: 'Salchipapa Queen' }
]

async function createUsersAndVendors() {
  console.log('🚀 Starting mock users and vendors creation...')
  console.log(`📊 Creating ${mockUsers.length} users and vendors`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const user of mockUsers) {
    const password = 'Test1234!' // simple for dev only
    
    try {
      // 🧑 Create User
      const { data: authUser, error: userError } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true
      })

      if (userError || !authUser?.user?.id) {
        console.error(`❌ Failed to create user ${user.email}:`, userError?.message)
        errorCount++
        continue
      }

      console.log(`✅ Created user ${user.email}`)

      // 🏪 Insert Vendor
      const { error: vendorError } = await supabase.from('vendors').insert({
        user_id: authUser.user.id,
        business_name: user.name,
        description: `Mock vendor in ${user.city}`,
        business_type: 'food',
        is_active: true,
        is_approved: true,
        average_rating: 4.2,
        total_reviews: 10,
        latitude: user.lat,
        longitude: user.lon
      })

      if (vendorError) {
        console.error(`❌ Failed to create vendor for ${user.email}:`, vendorError.message)
        errorCount++
      } else {
        console.log(`✅ Vendor added for ${user.name}`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error)
      errorCount++
    }
  }
  
  console.log('\n📈 Summary:')
  console.log(`✅ Successfully created: ${successCount} users/vendors`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('🎉 Mock data creation completed!')
}

// Run the script
if (require.main === module) {
  createUsersAndVendors()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}
