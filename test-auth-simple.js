// Simple test script - run this in your browser console at localhost:3000

console.log('=== TESTING NEXTAUTH ===');

// Test 1: Check if NextAuth session endpoint works
fetch('/api/auth/session')
  .then(res => res.json())
  .then(data => {
    console.log('✅ NextAuth session endpoint works:', data);
  })
  .catch(err => {
    console.log('❌ NextAuth session endpoint failed:', err);
  });

// Test 2: Check if NextAuth providers endpoint works
fetch('/api/auth/providers')
  .then(res => res.json())
  .then(data => {
    console.log('✅ NextAuth providers:', Object.keys(data));
  })
  .catch(err => {
    console.log('❌ NextAuth providers failed:', err);
  });

// Test 3: Check for any Supabase auth remnants
const supabaseKeys = Object.keys(localStorage).filter(key => 
  key.includes('supabase') || key.includes('auth')
);
console.log('🔍 Browser storage auth keys:', supabaseKeys);

// Test 4: Try registration
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpass123'
  })
})
.then(res => res.json())
.then(data => {
  console.log('📝 Registration test:', data);
})
.catch(err => {
  console.log('❌ Registration failed:', err);
});