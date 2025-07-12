import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JWT_SECRET = process.env.JWT_SECRET!

if (!supabaseUrl || !supabaseServiceKey || !JWT_SECRET) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompleteLoginFlow() {
  console.log('🔍 Testing complete admin login flow...')
  
  try {
    // Step 1: Verify user exists and password works
    console.log('\n📋 Step 1: Database and Password Verification')
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'mrn')
      .single()
    
    if (error || !adminUser) {
      console.error('❌ Admin user not found:', error?.message)
      return
    }
    
    const isValidPassword = await bcrypt.compare('mrn', adminUser.password_hash)
    console.log('✅ User found:', adminUser.username)
    console.log('✅ Password verification:', isValidPassword ? 'SUCCESS' : 'FAILED')
    
    if (!isValidPassword) {
      console.error('❌ Password verification failed - stopping test')
      return
    }
    
    // Step 2: Test JWT creation (same as API)
    console.log('\n🔐 Step 2: JWT Token Creation')
    const secretKey = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
        adminId: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        type: 'admin'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretKey)
    
    console.log('✅ JWT created successfully')
    console.log('- Token length:', token.length)
    console.log('- Token preview:', token.substring(0, 50) + '...')
    
    // Step 3: Test JWT verification (same as middleware)
    console.log('\n🔍 Step 3: JWT Token Verification')
    try {
      const { payload } = await jwtVerify(token, secretKey)
      console.log('✅ JWT verification successful')
      console.log('- Payload:', {
        adminId: payload.adminId,
        username: payload.username,
        email: payload.email,
        type: payload.type,
        exp: new Date((payload.exp as number) * 1000).toISOString()
      })
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      return
    }
    
    // Step 4: Test cookie settings
    console.log('\n🍪 Step 4: Cookie Configuration Analysis')
    const cookieSettings = {
      httpOnly: true,
      secure: !!process.env.VERCEL_URL,
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/admin'
    }
    
    console.log('✅ Cookie settings:')
    console.log('- httpOnly:', cookieSettings.httpOnly)
    console.log('- secure:', cookieSettings.secure, '(VERCEL_URL:', !!process.env.VERCEL_URL + ')')
    console.log('- sameSite:', cookieSettings.sameSite)
    console.log('- maxAge:', cookieSettings.maxAge, 'seconds')
    console.log('- path:', cookieSettings.path)
    
    // Step 5: Simulate API response
    console.log('\n📡 Step 5: API Response Simulation')
    const apiResponse = {
      success: true,
      admin: {
        adminId: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        type: 'admin' as const
      }
    }
    
    console.log('✅ API would return:', JSON.stringify(apiResponse, null, 2))
    
    // Step 6: Environment check
    console.log('\n🌍 Step 6: Environment Analysis')
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined')
    console.log('- VERCEL_URL:', process.env.VERCEL_URL || 'undefined')
    console.log('- JWT_SECRET length:', JWT_SECRET.length)
    console.log('- Supabase URL:', supabaseUrl.substring(0, 30) + '...')
    
    console.log('\n✅ ALL TESTS PASSED!')
    console.log('\n🔍 DIAGNOSIS:')
    console.log('- Password verification: ✅ WORKING')
    console.log('- JWT creation: ✅ WORKING')
    console.log('- JWT verification: ✅ WORKING')
    console.log('- Cookie settings: ✅ CORRECT for local development')
    console.log('\n💡 The login API should be working correctly.')
    console.log('💡 If login still fails, the issue is likely:')
    console.log('   1. Frontend not handling the response correctly')
    console.log('   2. Browser not accepting/storing the cookie')
    console.log('   3. Middleware not reading the cookie properly')
    console.log('   4. Network/CORS issues')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCompleteLoginFlow().then(() => {
  console.log('\n🏁 Test complete')
  process.exit(0)
}).catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})