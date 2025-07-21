// Constants Usage Analysis Script
// This script analyzes the usage of constants throughout the codebase

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Constants Usage (Issue 4)...\n');

// Read the constants file to see what's available
console.log('1. Analyzing available constants...');
try {
  const constantsContent = fs.readFileSync('lib/constants.ts', 'utf8');
  
  // Extract exported constants
  const exportMatches = constantsContent.match(/export const (\w+)/g) || [];
  const availableConstants = exportMatches.map(match => match.replace('export const ', ''));
  
  console.log('   ✅ Available constants:', availableConstants.length);
  console.log('   📋 Constants defined:', availableConstants.slice(0, 10).join(', '), availableConstants.length > 10 ? '...' : '');
} catch (error) {
  console.log('   ❌ Error reading constants file:', error.message);
}

// Scan for constants usage in the codebase
console.log('\n2. Scanning for constants usage...');
try {
  function scanForConstantsUsage(dir, depth = 0) {
    if (depth > 3) return [];
    
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'scripts', 'tests', 'dist'].includes(file)) {
        results.push(...scanForConstantsUsage(fullPath, depth + 1));
      } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for constants imports
        const constantsImports = [
          /from ['"]@?\/lib\/constants['"]/,
          /import.*constants/,
          /USER_ROLES/,
          /VENDOR_STATUS/,
          /HTTP_STATUS/,
          /ERROR_MESSAGES/,
          /SUCCESS_MESSAGES/
        ];
        
        for (const pattern of constantsImports) {
          if (pattern.test(content)) {
            results.push({ file: fullPath, pattern: pattern.toString() });
            break; // Only report once per file
          }
        }
      }
    }
    
    return results;
  }
  
  const constantsUsage = scanForConstantsUsage('.');
  
  if (constantsUsage.length === 0) {
    console.log('   ⚠️  No constants usage found in main application code');
  } else {
    console.log('   ✅ Found constants usage in:');
    for (const usage of constantsUsage) {
      console.log(`      - ${usage.file}`);
    }
  }
} catch (error) {
  console.log('   ❌ Error scanning for constants usage:', error.message);
}

// Check for hardcoded values that should be constants
console.log('\n3. Scanning for hardcoded values that should be constants...');
try {
  function scanForHardcodedValues(dir, depth = 0) {
    if (depth > 3) return [];
    
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'scripts', 'tests', 'dist'].includes(file)) {
        results.push(...scanForHardcodedValues(fullPath, depth + 1));
      } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for hardcoded values that should be constants
        const hardcodedPatterns = [
          { pattern: /['"]admin['"]/, name: 'admin role' },
          { pattern: /['"]vendor['"]/, name: 'vendor role' },
          { pattern: /['"]customer['"]/, name: 'customer role' },
          { pattern: /['"]pending['"]/, name: 'pending status' },
          { pattern: /['"]approved['"]/, name: 'approved status' },
          { pattern: /['"]active['"]/, name: 'active status' },
          { pattern: /status:\s*200/, name: 'HTTP 200 status' },
          { pattern: /status:\s*400/, name: 'HTTP 400 status' },
          { pattern: /status:\s*401/, name: 'HTTP 401 status' },
          { pattern: /status:\s*500/, name: 'HTTP 500 status' }
        ];
        
        for (const { pattern, name } of hardcodedPatterns) {
          if (pattern.test(content)) {
            results.push({ file: fullPath, issue: name });
          }
        }
      }
    }
    
    return results;
  }
  
  const hardcodedValues = scanForHardcodedValues('.');
  
  if (hardcodedValues.length === 0) {
    console.log('   ✅ No obvious hardcoded values found');
  } else {
    console.log('   ⚠️  Found potential hardcoded values:');
    const grouped = {};
    for (const value of hardcodedValues) {
      if (!grouped[value.issue]) grouped[value.issue] = [];
      grouped[value.issue].push(value.file);
    }
    
    for (const [issue, files] of Object.entries(grouped)) {
      console.log(`      - ${issue}: ${files.length} files`);
    }
  }
} catch (error) {
  console.log('   ❌ Error scanning for hardcoded values:', error.message);
}

// Check for missing constants that are referenced but not defined
console.log('\n4. Checking for missing constant references...');
try {
  // Try to compile and see if there are any missing constant errors
  const { execSync } = require('child_process');
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf8' });
    console.log('   ✅ No TypeScript compilation errors related to constants');
  } catch (error) {
    const output = error.stdout || error.message;
    const constantErrors = output.split('\n').filter(line => 
      line.includes('Cannot find name') || 
      line.includes('is not defined') ||
      line.includes('USER_ROLES') ||
      line.includes('VENDOR_STATUS') ||
      line.includes('HTTP_STATUS')
    );
    
    if (constantErrors.length > 0) {
      console.log('   ❌ Found constant-related compilation errors:');
      for (const error of constantErrors.slice(0, 5)) {
        console.log(`      - ${error.trim()}`);
      }
    } else {
      console.log('   ✅ No constant-related compilation errors');
    }
  }
} catch (error) {
  console.log('   ❌ Error checking compilation:', error.message);
}

console.log('\n🏁 Constants Analysis Complete');
console.log('\n📋 Issue 4 Assessment:');
console.log('□ Constants file exists and is comprehensive');
console.log('□ Constants are being used throughout the codebase');
console.log('□ No hardcoded values that should be constants');
console.log('□ No missing constant references');
console.log('\n✅ If all items above are checked, Issue 4 is resolved!');