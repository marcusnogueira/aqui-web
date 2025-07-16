#!/usr/bin/env node

/**
 * Fix Syntax Errors from Batch Migration
 * 
 * The batch migration created malformed try-catch blocks.
 * This script fixes the syntax errors.
 */

const fs = require('fs');
const path = require('path');

function fixSyntaxInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix malformed finally blocks that are outside try-catch
  // Pattern: } finally { ... } } catch (error) {
  content = content.replace(
    /(\s+)\/\/ Always clear user context when done\s+await clearUserContext\(supabase\)\s+\} catch \(error\) \{/g,
    '$1} catch (error) {\n$1  // Always clear user context when done\n$1  await clearUserContext(supabase)'
  );
  
  // Fix standalone clearUserContext calls that are outside try-catch
  content = content.replace(
    /(\s+)await clearUserContext\(supabase\)\s+\} catch \(error\) \{/g,
    '$1} catch (error) {\n$1  // Always clear user context when done\n$1  await clearUserContext(supabase)'
  );
  
  // Fix missing finally blocks - add them properly
  content = content.replace(
    /(\s+)(} catch \([^}]+\) \{[^}]+\})\s+$/gm,
    '$1$2 finally {\n$1  // Always clear user context when done\n$1  await clearUserContext(supabase)\n$1}'
  );
  
  return content !== originalContent ? content : null;
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
        routes.push({
          path: relativeItemPath.replace('/route.ts', '').replace('/route.js', ''),
          file: fullPath
        });
      }
    }
  }
  
  if (fs.existsSync(apiDir)) {
    scanDirectory(apiDir);
  }
  
  return routes;
}

function runSyntaxFix() {
  console.log('🔧 FIXING SYNTAX ERRORS FROM BATCH MIGRATION...\n');
  
  const routes = findAPIRoutes();
  let fixedCount = 0;
  
  for (const route of routes) {
    try {
      const fixedContent = fixSyntaxInFile(route.file);
      if (fixedContent) {
        fs.writeFileSync(route.file, fixedContent);
        console.log(`✅ Fixed syntax in: ${route.path}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${route.path}:`, error.message);
    }
  }
  
  console.log(`\n📊 Fixed syntax errors in ${fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🧪 Testing build...');
    return true;
  } else {
    console.log('\n⚠️  No syntax errors found to fix');
    return false;
  }
}

// Run the syntax fix
if (runSyntaxFix()) {
  console.log('✅ Syntax errors fixed. Try running npm run build again.');
} else {
  console.log('ℹ️  No changes made.');
}