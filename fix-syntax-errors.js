#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need fixing based on the error output
const filesToFix = [
  'app/api/admin/vendors/route.ts',
  'app/api/admin/vendors/stats/route.ts', 
  'app/api/search/vendors/click/route.ts',
  'app/api/user/become-vendor/route.ts',
  'app/api/user/switch-role/route.ts'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix malformed finally-catch blocks
    content = content.replace(
      /finally\s*{\s*\/\/[^\}]*await clearUserContext\([^}]*\}\s*} catch/g,
      '} catch'
    );
    
    // Fix missing finally blocks
    content = content.replace(
      /(await clearUserContext\(supabase\))\s*\}\s*catch/g,
      '} catch'
    );
    
    // Add proper finally blocks at the end of functions
    content = content.replace(
      /(\}\s*catch\s*\([^}]+\}\s*)\}/g,
      '$1 finally {\n    await clearUserContext(supabase)\n  }\n}'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('Syntax error fixes completed!');