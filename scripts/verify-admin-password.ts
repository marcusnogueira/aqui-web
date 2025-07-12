import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAdminPassword() {
  console.log('🔍 Starting admin password verification...')
  
  try {
    // Fetch the admin user from database
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'mrn')
      .single()
    
    if (error) {
      console.error('❌ Database error:', error.message)
      return
    }
    
    if (!adminUser) {
      console.error('❌ Admin user "mrn" not found in database')
      return
    }
    
    console.log('✅ Admin user found:')
    console.log('- ID:', adminUser.id)
    console.log('- Username:', adminUser.username)
    console.log('- Created:', adminUser.created_at)
    console.log('- Password hash length:', adminUser.password_hash?.length || 0)
    console.log('- Password hash starts with:', adminUser.password_hash?.substring(0, 10) + '...')
    
    // Test password verification
    const testPassword = 'mrn'
    console.log('\n🔐 Testing password verification...')
    console.log('- Testing password:', testPassword)
    console.log('- Against hash:', adminUser.password_hash?.substring(0, 20) + '...')
    
    if (!adminUser.password_hash) {
      console.error('❌ No password hash found for user')
      return
    }
    
    const isValid = await bcrypt.compare(testPassword, adminUser.password_hash)
    
    if (isValid) {
      console.log('✅ PASSWORD VERIFICATION SUCCESSFUL!')
      console.log('✅ The password "mrn" correctly matches the stored hash')
      console.log('✅ The issue is NOT with password verification')
    } else {
      console.log('❌ PASSWORD VERIFICATION FAILED!')
      console.log('❌ The password "mrn" does NOT match the stored hash')
      console.log('❌ This is the root cause of the login issue')
      
      // Let's also test what the hash should be
      console.log('\n🔧 Generating correct hash for comparison...')
      const correctHash = await bcrypt.hash(testPassword, 12)
      console.log('- New hash for "mrn":', correctHash)
      
      const testNewHash = await bcrypt.compare(testPassword, correctHash)
      console.log('- New hash verification:', testNewHash ? '✅ WORKS' : '❌ FAILED')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

// Run the verification
verifyAdminPassword().then(() => {
  console.log('\n🏁 Verification complete')
  process.exit(0)
}).catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})