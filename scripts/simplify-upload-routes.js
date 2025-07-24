#!/usr/bin/env node

/**
 * Simplify Upload Routes for Public Bucket
 * 
 * Since the bucket is now public, we can remove the complex NextAuth context stuff
 */

const fs = require('fs');
const path = require('path');

const uploadRoute1 = path.join(__dirname, '../app/api/vendor/upload-image/route.ts');
const uploadRoute2 = path.join(__dirname, '../app/api/vendors/gallery/upload/route.ts');

function simplifyRoute(filePath, routeName) {
  try {
    console.log(`📝 Simplifying ${routeName}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the service role client creation and use regular client
    content = content.replace(
      /\/\/ Create service role client for storage operations[\s\S]*?process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\)/g,
      '// Use regular client since bucket is now public'
    );
    
    // Replace serviceSupabase with supabase
    content = content.replace(/serviceSupabase/g, 'supabase');
    
    // Remove the import for createClient from supabase-js if it exists
    content = content.replace(/import { createClient } from '@supabase\/supabase-js'\n/, '');
    
    // Remove any context setting imports
    content = content.replace(/import { setUserContext, clearUserContext } from '@\/lib\/nextauth-context'\n/, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Simplified ${routeName}`);
    
  } catch (error) {
    console.error(`❌ Error simplifying ${routeName}:`, error.message);
  }
}

console.log('🔧 Simplifying upload routes for public bucket...\n');

// Check if files exist
if (fs.existsSync(uploadRoute1)) {
  simplifyRoute(uploadRoute1, 'vendor upload-image route');
} else {
  console.log('❌ Upload route 1 not found');
}

if (fs.existsSync(uploadRoute2)) {
  simplifyRoute(uploadRoute2, 'gallery upload route');
} else {
  console.log('❌ Upload route 2 not found');
}

console.log('\n✅ Routes simplified for public bucket!');
console.log('\n📋 What this does:');
console.log('- Removes complex service role setup');
console.log('- Uses regular Supabase client (works with public bucket)');
console.log('- Keeps security through vendor ownership checks');
console.log('\n🧪 Test your uploads now!');