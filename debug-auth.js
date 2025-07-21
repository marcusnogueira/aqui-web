// Debug script to check what auth system is running
// Run this in your browser console on localhost:3000

console.log('=== AUTH DEBUG ===');

// Check NextAuth session
fetch('/api/auth/session')
  .then(res => res.json())
  .then(session => {
    console.log('NextAuth Session:', session);
  })
  .catch(err => console.log('NextAuth Error:', err));

// Check for any Supabase auth cookies/storage
console.log('LocalStorage keys:', Object.keys(localStorage));
console.log('SessionStorage keys:', Object.keys(sessionStorage));

// Check for Supabase auth specifically
const supabaseKeys = Object.keys(localStorage).filter(key => 
  key.includes('supabase') || key.includes('auth')
);
console.log('Supabase/Auth keys:', supabaseKeys);

supabaseKeys.forEach(key => {
  console.log(`${key}:`, localStorage.getItem(key));
});

// Check cookies
console.log('Cookies:', document.cookie);