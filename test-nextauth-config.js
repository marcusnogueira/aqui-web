// Test NextAuth Configuration
// Run this with: node test-nextauth-config.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing NextAuth Configuration...\n');

// Test 1: Check if NextAuth config file exists and can be imported
try {
  console.log('1. Checking NextAuth config file...');
  
  const authConfigPath = path.join(__dirname, 'app/api/auth/[...nextauth]/auth.ts');
  const routePath = path.join(__dirname, 'app/api/auth/[...nextauth]/route.ts');
  
  if (fs.existsSync(authConfigPath)) {
    console.log('   ✅ NextAuth config file exists');
  } else {
    console.log('   ❌ NextAuth config file missing');
  }
  
  if (fs.existsSync(routePath)) {
    console.log('   ✅ NextAuth route file exists');
  } else {
    console.log('   ❌ NextAuth route file missing');
  }
} catch (error) {
  console.log('   ❌ Error checking files:', error.message);
}

// Test 2: Check environment variables
console.log('\n2. Checking environment variables...');
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'APPLE_CLIENT_ID',
  'APPLE_CLIENT_SECRET'
];

let envVarsOk = true;
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar} is set`);
  } else {
    console.log(`   ❌ ${envVar} is missing`);
    envVarsOk = false;
  }
}

// Test 3: Check constants file
console.log('\n3. Checking constants...');
try {
  const constantsPath = path.join(__dirname, 'lib/constants.ts');
  if (fs.existsSync(constantsPath)) {
    console.log('   ✅ Constants file exists');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    if (constantsContent.includes('USER_ROLES')) {
      console.log('   ✅ USER_ROLES constant found');
    } else {
      console.log('   ❌ USER_ROLES constant missing');
    }
  } else {
    console.log('   ❌ Constants file missing');
  }
} catch (error) {
  console.log('   ❌ Error checking constants:', error.message);
}

// Test 4: Check NextAuth context functions
console.log('\n4. Checking NextAuth context...');
try {
  const contextPath = path.join(__dirname, 'lib/nextauth-context.ts');
  if (fs.existsSync(contextPath)) {
    console.log('   ✅ NextAuth context file exists');
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    if (contextContent.includes('set_auth_user_id')) {
      console.log('   ✅ RLS functions are implemented');
    } else {
      console.log('   ❌ RLS functions not implemented');
    }
  } else {
    console.log('   ❌ NextAuth context file missing');
  }
} catch (error) {
  console.log('   ❌ Error checking context:', error.message);
}

console.log('\n🏁 NextAuth Configuration Test Complete');

if (envVarsOk) {
  console.log('\n✅ NextAuth should be ready to test!');
  console.log('Next steps:');
  console.log('1. Run the RLS functions SQL in your Supabase dashboard');
  console.log('2. Start your dev server: npm run dev');
  console.log('3. Test OAuth login at http://localhost:3000');
} else {
  console.log('\n❌ Fix environment variables before testing');
}