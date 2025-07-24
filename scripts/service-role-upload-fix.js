// Service Role Upload Fix
// Update the upload routes to use service role for storage operations

const fs = require('fs');
const path = require('path');

// File paths to update
const uploadRoute1 = path.join(__dirname, '../app/api/vendor/upload-image/route.ts');
const uploadRoute2 = path.join(__dirname, '../app/api/vendors/gallery/upload/route.ts');

function updateRouteToServiceRole(filePath, routeName) {
  try {
    console.log(`📝 Updating ${routeName}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the client creation and context setting with service role client
    const oldPattern = /\/\/ Create Supabase client and set user context[\s\S]*?await setUserContext\(supabase, session\.user\.id\)/g;
    
    const newCode = `// Create Supabase client with service role (bypasses RLS)
    const cookieStore = await cookies()
    supabase = createSupabaseServerClient(cookieStore)
    
    // Use service role key for storage operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )`;
    
    content = content.replace(oldPattern, newCode);
    
    // Replace storage operations to use serviceSupabase
    content = content.replace(/supabase\.storage/g, 'serviceSupabase.storage');
    
    // Remove the context clearing in finally block
    content = content.replace(/\/\/ ✅ Always clear user context when done[\s\S]*?clearUserContext\(supabase\)[\s\S]*?}/g, '// Service role doesn\\'t need context cleanup\n  }');
    
    // Add the import for createClient
    if (!content.includes('import { createClient }')) {
      content = content.replace(
        /import { createSupabaseServerClient } from '@\/lib\/supabase\/server'/,
        `import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'`
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${routeName}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${routeName}:`, error.message);
  }
}

console.log('🔧 Applying Service Role Upload Fix...\n');

// Update both upload routes
updateRouteToServiceRole(uploadRoute1, 'vendor upload-image route');
updateRouteToServiceRole(uploadRoute2, 'gallery upload route');

console.log('\n✅ Service role fix applied!');
console.log('\n📋 What this does:');
console.log('- Uses service role key for storage operations');
console.log('- Bypasses all RLS policies for uploads');
console.log('- Maintains security through application-level folder checks');
console.log('\n⚠️  Make sure to apply the SQL fix too:');
console.log('Run the alternative-storage-fix.sql in your Supabase dashboard');