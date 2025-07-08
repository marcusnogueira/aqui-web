// scripts/insert-mock-vendors.js
import dotenv from 'dotenv'
dotenv.config({ path: './secrets/.env' })
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const vendors = [
  // San Francisco (5)
  { name: 'Taco Cart SF', lat: 37.7749, lng: -122.4194 },
  { name: 'Churro Truck', lat: 37.7793, lng: -122.4192 },
  { name: 'Boba Stand SF', lat: 37.7685, lng: -122.4201 },
  { name: 'Hot Dog Guy', lat: 37.7712, lng: -122.4110 },
  { name: 'Arepa Lady SF', lat: 37.7763, lng: -122.4147 },

  // San Jose (2)
  { name: 'Empanada Express', lat: 37.3382, lng: -121.8863 },
  { name: 'Fruit Cart SJ', lat: 37.3348, lng: -121.8881 },

  // San Bruno (1)
  { name: 'Snack Shack', lat: 37.6305, lng: -122.4111 },

  // Austin (1)
  { name: 'Birria Bros', lat: 30.2672, lng: -97.7431 },

  // Lima, Peru (1)
  { name: 'Tamalito Limeño', lat: -12.0464, lng: -77.0428 }
]

async function run() {
  for (const vendor of vendors) {
    const { error } = await supabase.from('vendors').insert({
      user_id: randomUUID(), // Replace with a real user_id if needed
      business_name: vendor.name,
      latitude: vendor.lat,
      longitude: vendor.lng,
      business_type: 'food',
      subcategory: 'street food',
      profile_image_url: null,
      is_approved: true,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error(`❌ Failed to insert ${vendor.name}:`, error.message)
    } else {
      console.log(`✅ Inserted: ${vendor.name}`)
    }
  }
}

run()
