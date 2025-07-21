#!/usr/bin/env node

/**
 * NextAuth Migration Helper Script
 * 
 * This script helps migrate from Supabase Auth to NextAuth.js by:
 * 1. Scanning files for Supabase Auth usage
 * 2. Suggesting replacements
 * 3. Optionally applying replacements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const ignoreDirs = ['node_modules', '.next', '.git', 'scripts'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to find and replace
const patterns = [
  {
    find: /const\s*{\s*data\s*:\s*{\s*user\s*}\s*(?:,\s*error\s*(?::\s*\w+)?)?\s*}\s*=\s*await\s*supabase\.auth\.getUser\(\)/g,
    replace: 'const session = await auth(); const user = session?.user',
    import: "import { auth } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /const\s*{\s*data\s*:\s*{\s*session\s*}\s*(?:,\s*error\s*(?::\s*\w+)?)?\s*}\s*=\s*await\s*supabase\.auth\.getSession\(\)/g,
    replace: 'const session = await auth()',
    import: "import { auth } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /await\s*supabase\.auth\.signOut\(\)/g,
    replace: 'await signOut()',
    import: "import { signOut } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /await\s*supabase\.auth\.signInWithOAuth\(\s*{\s*provider\s*:\s*['"]google['"]\s*}\s*\)/g,
    replace: "await signIn('google')",
    import: "import { signIn } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /await\s*supabase\.auth\.signInWithOAuth\(\s*{\s*provider\s*:\s*['"]apple['"]\s*}\s*\)/g,
    replace: "await signIn('apple')",
    import: "import { signIn } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /await\s*supabase\.auth\.signInWithPassword\(\s*{\s*email\s*:\s*([^,]+),\s*password\s*:\s*([^}]+)\s*}\s*\)/g,
    replace: "await signIn('credentials', { email: $1, password: $2, redirect: false })",
    import: "import { signIn } from '@/app/api/auth/[...nextauth]/auth';"
  },
  {
    find: /useSupabaseClient\(\)/g,
    replace: 'createClient()',
    import: "import { createClient } from '@/lib/supabase/client';"
  },
  {
    find: /useUser\(\)/g,
    replace: 'useSession()',
    import: "import { useSession } from 'next-auth/react';"
  }
];

// Helper functions
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.find);
    if (regex.test(content)) {
      matches.push({
        pattern,
        count: (content.match(regex) || []).length
      });
    }
  }
  
  return matches.length > 0 ? { filePath, matches } : null;
}

function scanDirectory(dir) {
  const results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !ignoreDirs.includes(file)) {
      results.push(...scanDirectory(fullPath));
    } else if (stat.isFile() && fileExtensions.includes(path.extname(file))) {
      const fileResult = scanFile(fullPath);
      if (fileResult) {
        results.push(fileResult);
      }
    }
  }
  
  return results;
}

function applyChanges(filePath, matches) {
  let content = fs.readFileSync(filePath, 'utf8');
  const importsToAdd = new Set();
  
  for (const { pattern } of matches) {
    content = content.replace(pattern.find, pattern.replace);
    if (pattern.import && !content.includes(pattern.import.split(' ')[1])) {
      importsToAdd.add(pattern.import);
    }
  }
  
  // Add imports at the top of the file
  if (importsToAdd.size > 0) {
    const importLines = Array.from(importsToAdd).join('\n');
    
    // Find a good place to insert imports
    const importRegex = /^import .+ from .+$/m;
    const lastImportMatch = content.match(new RegExp(importRegex, 'gm'));
    
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      content = content.slice(0, lastImportIndex) + '\n' + importLines + content.slice(lastImportIndex);
    } else {
      // No imports found, add at the top
      content = importLines + '\n\n' + content;
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  return importsToAdd.size;
}

// Main execution
console.log('🔍 Scanning for Supabase Auth usage...');
const results = scanDirectory(rootDir);

if (results.length === 0) {
  console.log('✅ No Supabase Auth usage found!');
  process.exit(0);
}

console.log(`\n🔎 Found ${results.length} files with Supabase Auth usage:`);

for (const result of results) {
  console.log(`\n📄 ${path.relative(rootDir, result.filePath)}`);
  for (const match of result.matches) {
    console.log(`  - ${match.count}x ${match.pattern.find}`);
    console.log(`    Replace with: ${match.pattern.replace}`);
  }
}

// Ask for confirmation to apply changes
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('\n⚠️ Do you want to apply these changes? (y/N) ', answer => {
  readline.close();
  
  if (answer.toLowerCase() === 'y') {
    console.log('\n🔄 Applying changes...');
    
    let totalChanges = 0;
    let totalImports = 0;
    
    for (const result of results) {
      const importsAdded = applyChanges(result.filePath, result.matches);
      const changesCount = result.matches.reduce((sum, m) => sum + m.count, 0);
      
      console.log(`✅ Updated ${path.relative(rootDir, result.filePath)} (${changesCount} changes, ${importsAdded} imports added)`);
      
      totalChanges += changesCount;
      totalImports += importsAdded;
    }
    
    console.log(`\n🎉 Migration complete! Applied ${totalChanges} changes and added ${totalImports} imports.`);
    console.log('\n⚠️ Please review the changes and test your application thoroughly.');
  } else {
    console.log('\n❌ No changes applied.');
  }
});