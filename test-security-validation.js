// Security Validation Script for Issue 2
// Run this with: node test-security-validation.js

const fs = require('fs');
const path = require('path');

console.log('🔒 Security Validation for Issue 2...\n');

// Test 1: Check .gitignore for environment files
console.log('1. Checking .gitignore for environment file exclusions...');
try {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  
  const envPatterns = [
    '.env.local',
    '.env',
    'secrets/',
    '*.key',
    '*client_secret*',
    '*private_key*'
  ];
  
  let allPatternsFound = true;
  for (const pattern of envPatterns) {
    if (gitignoreContent.includes(pattern)) {
      console.log(`   ✅ ${pattern} is excluded from git`);
    } else {
      console.log(`   ❌ ${pattern} is NOT excluded from git`);
      allPatternsFound = false;
    }
  }
  
  if (allPatternsFound) {
    console.log('   ✅ All sensitive patterns are properly excluded');
  }
} catch (error) {
  console.log('   ❌ Error checking .gitignore:', error.message);
}

// Test 2: Check if .env.local contains actual secrets (it should, but shouldn't be in git)
console.log('\n2. Checking .env.local security...');
try {
  if (fs.existsSync('.env.local')) {
    console.log('   ✅ .env.local exists (good for local development)');
    
    // Check if it's in gitignore
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    if (gitignoreContent.includes('.env.local')) {
      console.log('   ✅ .env.local is excluded from git');
    } else {
      console.log('   ❌ .env.local is NOT excluded from git - SECURITY RISK!');
    }
  } else {
    console.log('   ⚠️  .env.local does not exist');
  }
} catch (error) {
  console.log('   ❌ Error checking .env.local:', error.message);
}

// Test 3: Check .env.example for placeholder values
console.log('\n3. Checking .env.example for placeholder values...');
try {
  if (fs.existsSync('.env.example')) {
    const envExampleContent = fs.readFileSync('.env.example', 'utf8');
    
    const dangerousPatterns = [
      /supabase\.co\/.*[a-zA-Z0-9]{20,}/,  // Real Supabase URLs
      /eyJ[a-zA-Z0-9]/,  // JWT tokens
      /GOCSPX-/,  // Google client secrets
      /sk_live_/,  // Stripe live keys
      /pk_live_/   // Stripe live keys
    ];
    
    let hasRealSecrets = false;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(envExampleContent)) {
        hasRealSecrets = true;
        break;
      }
    }
    
    if (hasRealSecrets) {
      console.log('   ❌ .env.example contains real secrets - SECURITY RISK!');
    } else {
      console.log('   ✅ .env.example contains only placeholder values');
    }
  } else {
    console.log('   ⚠️  .env.example does not exist');
  }
} catch (error) {
  console.log('   ❌ Error checking .env.example:', error.message);
}

// Test 4: Check secrets directory security
console.log('\n4. Checking secrets directory security...');
try {
  if (fs.existsSync('secrets/')) {
    console.log('   ✅ secrets/ directory exists');
    
    // Check if secrets directory is in gitignore
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    if (gitignoreContent.includes('secrets/')) {
      console.log('   ✅ secrets/ directory is excluded from git');
    } else {
      console.log('   ❌ secrets/ directory is NOT excluded from git - SECURITY RISK!');
    }
    
    // Check if secrets has its own gitignore
    if (fs.existsSync('secrets/.gitignore')) {
      console.log('   ✅ secrets/ has its own .gitignore file');
    } else {
      console.log('   ⚠️  secrets/ does not have its own .gitignore file');
    }
  } else {
    console.log('   ⚠️  secrets/ directory does not exist');
  }
} catch (error) {
  console.log('   ❌ Error checking secrets directory:', error.message);
}

// Test 5: Check for hardcoded secrets in source code
console.log('\n5. Scanning source code for hardcoded secrets...');
try {
  const dangerousPatterns = [
    { pattern: /eyJ[a-zA-Z0-9_-]{10,}/, name: 'JWT tokens' },
    { pattern: /GOCSPX-[a-zA-Z0-9_-]+/, name: 'Google client secrets' },
    { pattern: /sk_live_[a-zA-Z0-9]+/, name: 'Stripe live keys' },
    { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/, name: 'Hardcoded passwords' }
  ];
  
  function scanDirectory(dir, depth = 0) {
    if (depth > 3) return []; // Limit recursion depth
    
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'dist'].includes(file)) {
        results.push(...scanDirectory(fullPath, depth + 1));
      } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        for (const { pattern, name } of dangerousPatterns) {
          if (pattern.test(content)) {
            results.push({ file: fullPath, issue: name });
          }
        }
      }
    }
    
    return results;
  }
  
  const issues = scanDirectory('.');
  
  if (issues.length === 0) {
    console.log('   ✅ No hardcoded secrets found in source code');
  } else {
    console.log('   ❌ Found potential hardcoded secrets:');
    for (const issue of issues) {
      console.log(`      - ${issue.file}: ${issue.issue}`);
    }
  }
} catch (error) {
  console.log('   ❌ Error scanning source code:', error.message);
}

// Test 6: Check environment variable loading
console.log('\n6. Checking environment variable loading...');
try {
  require('dotenv').config({ path: '.env.local' });
  
  const criticalEnvVars = [
    'AUTH_SECRET',
    'GOOGLE_CLIENT_SECRET',
    'APPLE_CLIENT_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allSecretsLoaded = true;
  for (const envVar of criticalEnvVars) {
    if (process.env[envVar] && process.env[envVar].length > 10) {
      console.log(`   ✅ ${envVar} is loaded and appears to be a real secret`);
    } else {
      console.log(`   ❌ ${envVar} is missing or appears to be a placeholder`);
      allSecretsLoaded = false;
    }
  }
  
  if (allSecretsLoaded) {
    console.log('   ✅ All critical environment variables are properly loaded');
  }
} catch (error) {
  console.log('   ❌ Error checking environment variables:', error.message);
}

console.log('\n🏁 Security Validation Complete');
console.log('\n📋 Security Checklist:');
console.log('□ .env.local is excluded from git');
console.log('□ .env.example contains only placeholders');
console.log('□ secrets/ directory is excluded from git');
console.log('□ No hardcoded secrets in source code');
console.log('□ All environment variables are properly loaded');
console.log('\n✅ If all items above are checked, Issue 2 is resolved!');