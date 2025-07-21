import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

dotenv.config({ path: './secrets/.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
}

async function simulateJwtCallback() {
  const fakeGoogleUser = {
    name: 'Marcus',
    email: 'marcus.nogueira1@gmail.com',
  }

  console.log('🔍 Checking if user already exists...')
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id, email, active_role')
    .eq('email', fakeGoogleUser.email)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Query error:', error.message)
    return
  }

  if (existingUser) {
    console.log('✅ User already exists:', existingUser)
    return
  }

  console.log('🆕 No user found — inserting new user...')

  const userId = randomUUID()
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: fakeGoogleUser.email,
      full_name: fakeGoogleUser.name,
      active_role: USER_ROLES.CUSTOMER,
    })
    .select('id, email, active_role')
    .single()

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message)
    return
  }

  console.log('✅ Inserted user:', newUser)
}

simulateJwtCallback()

