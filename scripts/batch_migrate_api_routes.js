#!/usr/bin/env node

/**
 * Batch API Routes Migration Script
 * 
 * This script automatically updates all API routes to use NextAuth context
 * instead of relying on Supabase Auth for RLS policies.
 */

const fs = require('fs');
const path = require('path');

// Routes that need different migration patterns
const MIGRATION_PATTERNS = {
  ADMIN_ROUTES: {
    pattern: /^admin\//,
    imports: `import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'`,
    contextSetup: `    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)`,
    cleanup: `    } finally {
      // Always clear user context when done
      await clearUserContext(supabase)
    }`
  },
  USER_ROUTES: {
    pattern: /^user\//,
    imports: `import { setUserContext, clearUserContext, getCurrentSession } from '@/lib/nextauth-context'`,
    contextSetup: `    // Get current session and set user context
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    await setUserContext(supabase, session.user.id)`,
    cleanup: `    } finally {
      // Always clear user context when done
      await clearUserContext(supabase)
    }`
  },
  SEARCH_ROUTES: {
    pattern: /^search\//,
    imports: `import { setUserContext, clearUserContext, getCurrentSession } from '@/lib/nextauth-context'`,
    contextSetup: `    // Set user context if authenticated (optional for search)
    const session = await getCurrentSession()
    if (session?.user?.id) {
      await setUserContext(supabase, session.user.id)
    }`,
    cleanup: `    } finally {
      // Clear user context if it was set
      if (session?.user?.id) {
        await clearUserContext(supabase)
      }
    }`
  }
};

function getMigrationPattern(routePath) {
  for (const [name, pattern] of Object.entries(MIGRATION_PATTERNS)) {
    if (pattern.pattern.test(routePath)) {
      return pattern;
    }
  }
  return null;
}

function updateRouteFile(filePath, routePath) {
  console.log(`🔄 Migrating ${routePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  const migrationPattern = getMigrationPattern(routePath);
  if (!migrationPattern) {
    console.log(`   ⚠️  No migration pattern found for ${routePath}, skipping`);
    return false;
  }
  
  // Check if already migrated
  if (content.includes('nextauth-context')) {
    console.log(`   ✅ Already migrated: ${routePath}`);
    return false;
  }
  
  // Add import
  const importRegex = /(import.*from ['"]next\/server['"])/;
  if (importRegex.test(content)) {
    content = content.replace(
      importRegex,
      `$1\n${migrationPattern.imports}`
    );
  }
  
  // Add context setup after supabase client creation
  const supabaseRegex = /(const supabase = createSupabaseServerClient\(cookies\(\)\))/;
  if (supabaseRegex.test(content)) {
    content = content.replace(
      supabaseRegex,
      `$1\n\n${migrationPattern.contextSetup}`
    );
  }
  
  // Add cleanup in try-catch blocks
  if (migrationPattern.cleanup) {
    // Find existing try-catch blocks and add finally clause
    const tryRegex = /(\s+)(} catch \([^}]+\) \{[^}]+\})/g;
    content = content.replace(tryRegex, (match, indent, catchBlock) => {
      if (match.includes('finally')) {
        return match; // Already has finally block
      }
      return `${indent}${catchBlock.replace('}', `}\n${indent}finally {\n${indent}  // Always clear user context when done\n${indent}  await clearUserContext(supabase)\n${indent}}`)}`;
    });
  }
  
  // Write the updated content
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Successfully migrated: ${routePath}`);
    return true;
  } else {
    console.log(`   ⚠️  No changes made to: ${routePath}`);
    return false;
  }
}

function findAPIRoutes() {
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  const routes = [];
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, relativeItemPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        const routePath = relativeItemPath.replace('/route.ts', '').replace('/route.js', '');
        routes.push({
          path: routePath,
          file: fullPath,
          relativePath: path.join('app', 'api', relativeItemPath)
        });
      }
    }
  }
  
  if (fs.existsSync(apiDir)) {
    scanDirectory(apiDir);
  }
  
  return routes;
}

function runBatchMigration() {
  console.log('🚀 BATCH API ROUTES MIGRATION STARTING...\n');
  
  const routes = findAPIRoutes();
  const stats = {
    total: routes.length,
    migrated: 0,
    skipped: 0,
    errors: 0
  };
  
  // Skip routes that don't need migration
  const skipRoutes = ['auth/[...nextauth]', 'vendors/map-data'];
  
  for (const route of routes) {
    try {
      if (skipRoutes.includes(route.path)) {
        console.log(`⏭️  Skipping ${route.path} (doesn't need migration)`);
        stats.skipped++;
        continue;
      }
      
      const migrated = updateRouteFile(route.file, route.path);
      if (migrated) {
        stats.migrated++;
      } else {
        stats.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error migrating ${route.path}:`, error.message);
      stats.errors++;
    }
  }
  
  console.log('\n📊 MIGRATION SUMMARY:');
  console.log('='.repeat(40));
  console.log(`Total Routes: ${stats.total}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  
  if (stats.errors === 0) {
    console.log('\n✅ Batch migration completed successfully!');
    
    console.log('\n🧪 NEXT STEPS:');
    console.log('1. Test the application: npm run dev');
    console.log('2. Test admin routes with admin login');
    console.log('3. Test user routes with NextAuth login');
    console.log('4. Verify RLS policies are working');
    console.log('5. Run build to check for TypeScript errors');
    
    // Update migration status
    const statusFile = path.join(__dirname, '..', 'MIGRATION_STATUS.json');
    if (fs.existsSync(statusFile)) {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      status.phases.phase3_api_routes.status = 'completed';
      status.phases.phase3_api_routes.completed = new Date().toISOString();
      status.phases.phase4_frontend.status = 'ready';
      
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
      console.log('✅ Migration status updated');
    }
  } else {
    console.log('\n❌ Migration completed with errors');
    console.log('Please review the errors above and fix them manually');
  }
}

// Run the batch migration
runBatchMigration();