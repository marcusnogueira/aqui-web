// scripts/verify-auth-config.ts

import * as dotenv from 'dotenv'

// CHANGE THIS if your file is actually in secrets/
dotenv.config({ path: './.env.local' })

console.log('🔍 Verifying NextAuth environment variables...\n')

const required = [
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'APPLE_CLIENT_ID',
  'APPLE_CLIENT_SECRET',
  'SUPABASE_DB_CONNECTION_URI',
]

const missing: string[] = []

for (const key of required) {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    missing.push(key)
    console.log(`❌ Missing: ${key}`)
  } else {
    console.log(`✅ ${key} = ${value.slice(0, 5)}...`)
  }
}

console.log('\n🔁 Result:')
if (missing.length === 0) {
  console.log('🎉 All required auth environment variables are set.\n')
  process.exit(0)
} else {
  console.log(`🚨 Missing ${missing.length} key(s):`, missing.join(', '))
  console.log('⚠️ NextAuth will fail with ?error=Configuration if any are undefined.\n')
  process.exit(1)
}
