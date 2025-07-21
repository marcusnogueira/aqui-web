// Auth Consistency Test for Issue 3
// Run this with: node test-auth-consistency.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Auth Implementation Consistency (Issue 3)...\n');

// Test 1: Check for NextAuth usage in components
console.log('1. Checking NextAuth usage in components...');
try {
  const componentsToCheck = [
    'app/page.tsx',
    'components/Navigation.tsx',
    'components/AuthModal.tsx',
    'app/providers.tsx'
  ];
  
  let nextAuthUsage = 0;
  let supabaseAuthUsage = 0;
  
  for (const componentPath of componentsToCheck) {
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for NextAuth usage
      if (content.includes('next-auth/react') || content.includes('useSession') || content.includes('SessionProvider')) {
        console.log(`   ✅ ${componentPath} uses NextAuth`);
        nextAuthUsage++;
      }
      
      // Check for Supabase Auth usage
      if (content.includes('supabase.auth.') || content.includes('useSupabaseClient') || content.includes('useUser()')) {
        console.log(`   ❌ ${componentPath} still uses Supabase Auth`);
        supabaseAuthUsage++;
      }
    }
  }
  
  console.log(`   📊 NextAuth usage: ${nextAuthUsage}, Supabase Auth usage: ${supabaseAuthUsage}`);
} catch (error) {
  console.log('   ❌ Error checking components:', error.message);
}

// Test 2: Check API routes for consistent auth usage
console.log('\n2. Checking API routes for auth consistency...');
try {
  const apiRoutes = [
    'app/api/user/switch-role/route.ts',
    'app/api/user/become-vendor/route.ts',
    'app/api/search/vendors/route.ts',
    'app/api/search/vendors/click/route.ts'
  ];
  
  let consistentRoutes = 0;
  let inconsistentRoutes = 0;
  
  for (const routePath of apiRoutes) {
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for NextAuth usage
      const hasNextAuth = content.includes('auth()') && content.includes('@/app/api/auth/[...nextauth]/auth');
      
      // Check for old Supabase Auth usage
      const hasSupabaseAuth = content.includes('supabase.auth.getUser()') || content.includes('supabase.auth.getSession()');
      
      if (hasNextAuth && !hasSupabaseAuth) {
        console.log(`   ✅ ${routePath} uses NextAuth consistently`);
        consistentRoutes++;
      } else if (hasSupabaseAuth) {
        console.log(`   ❌ ${routePath} still uses Supabase Auth`);
        inconsistentRoutes++;
      } else {
        console.log(`   ⚠️  ${routePath} has no auth usage (might be okay)`);
      }
    }
  }
  
  console.log(`   📊 Consistent routes: ${consistentRoutes}, Inconsistent routes: ${inconsistentRoutes}`);
} catch (error) {
  console.log('   ❌ Error checking API routes:', error.message);
}

// Test 3: Check for proper NextAuth provider setup
console.log('\n3. Checking NextAuth provider setup...');
try {
  const providersPath = 'app/providers.tsx';
  if (fs.existsSync(providersPath)) {
    const content = fs.readFileSync(providersPath, 'utf8');
    
    if (content.includes('SessionProvider') && content.includes('next-auth/react')) {
      console.log('   ✅ SessionProvider is properly set up');
    } else {
      console.log('   ❌ SessionProvider is missing or not imported');
    }
  } else {
    console.log('   ❌ Providers file not found');
  }
} catch (error) {
  console.log('   ❌ Error checking providers:', error.message);
}

// Test 4: Check for auth helper consistency
console.log('\n4. Checking auth helpers consistency...');
try {
  const authHelpersPath = 'lib/auth-helpers.ts';
  if (fs.existsSync(authHelpersPath)) {
    const content = fs.readFileSync(authHelpersPath, 'utf8');
    
    // Check if it uses NextAuth patterns
    const usesNextAuth = content.includes('/api/auth/session') || content.includes('next-auth');
    
    // Check if it still has Supabase Auth patterns
    const usesSupabaseAuth = content.includes('supabase.auth.');
    
    if (usesNextAuth && !usesSupabaseAuth) {
      console.log('   ✅ Auth helpers use NextAuth consistently');
    } else if (usesSupabaseAuth) {
      console.log('   ❌ Auth helpers still use Supabase Auth');
    } else {
      console.log('   ⚠️  Auth helpers have unclear auth implementation');
    }
  } else {
    console.log('   ❌ Auth helpers file not found');
  }
} catch (error) {
  console.log('   ❌ Error checking auth helpers:', error.message);
}

// Test 5: Check middleware for NextAuth integration
console.log('\n5. Checking middleware for NextAuth integration...');
try {
  const middlewarePath = 'middleware.ts';
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (content.includes('NextAuth') && content.includes('authConfig')) {
      console.log('   ✅ Middleware uses NextAuth');
    } else {
      console.log('   ❌ Middleware does not use NextAuth');
    }
  } else {
    console.log('   ❌ Middleware file not found');
  }
} catch (error) {
  console.log('   ❌ Error checking middleware:', error.message);
}

// Test 6: Check for any remaining Supabase Auth imports
console.log('\n6. Scanning for remaining Supabase Auth imports...');
try {
  function scanForSupabaseAuth(dir, depth = 0) {
    if (depth > 3) return [];
    
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'scripts', 'tests'].includes(file)) {
        results.push(...scanForSupabaseAuth(fullPath, depth + 1));
      } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for Supabase Auth patterns
        const supabaseAuthPatterns = [
          'supabase.auth.',
          'useSupabaseClient',
          'useUser()',
          'createClientComponentClient',
          'createServerComponentClient'
        ];
        
        for (const pattern of supabaseAuthPatterns) {
          if (content.includes(pattern)) {
            results.push({ file: fullPath, pattern });
            break; // Only report once per file
          }
        }
      }
    }
    
    return results;
  }
  
  const supabaseAuthUsage = scanForSupabaseAuth('.');
  
  if (supabaseAuthUsage.length === 0) {
    console.log('   ✅ No Supabase Auth usage found in main application code');
  } else {
    console.log('   ❌ Found Supabase Auth usage in:');
    for (const usage of supabaseAuthUsage) {
      console.log(`      - ${usage.file}: ${usage.pattern}`);
    }
  }
} catch (error) {
  console.log('   ❌ Error scanning for Supabase Auth:', error.message);
}

console.log('\n🏁 Auth Consistency Test Complete');
console.log('\n📋 Consistency Checklist:');
console.log('□ All components use NextAuth');
console.log('□ All API routes use NextAuth');
console.log('□ SessionProvider is properly set up');
console.log('□ Auth helpers use NextAuth');
console.log('□ Middleware uses NextAuth');
console.log('□ No remaining Supabase Auth usage');
console.log('\n✅ If all items above are checked, Issue 3 is resolved!');