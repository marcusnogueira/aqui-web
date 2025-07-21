// scripts/auth-diagnostic.ts

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// ESM-safe __dirname workaround
const __dirname = dirname(fileURLToPath(import.meta.url))

// Explicitly load .env from secrets/
dotenv.config({ path: resolve(__dirname, '../secrets/.env') })

console.log('🔎 Loaded SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const errors: string[] = []
  const requiredEnv = [
    'AUTH_SECRET',
    'SUPABASE_DB_CONNECTION_URI',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]

  console.log('🔍 Checking environment variables...\n')
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      errors.push(`❌ Missing ENV: ${key}`)
    } else {
      console.log(`✅ ${key}`)
    }
  }

  console.log('\n🔗 Testing Supabase DB connection (as service role)...\n')

  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)

  if (error) {
    errors.push(`❌ Supabase query failed: ${error.message}`)
  } else {
    console.log(`✅ Supabase responded — found ${data.length} user(s)`)
  }

  console.log('\n✅ Environment and DB connectivity test complete.')

  if (errors.length > 0) {
    console.log('\n❗ Issues found:')
    for (const err of errors) {
      console.log(err)
    }
    process.exit(1)
  } else {
    console.log('\n🎉 All checks passed.')
    process.exit(0)
  }
}

run()
