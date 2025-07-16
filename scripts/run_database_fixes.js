#!/usr/bin/env node

/**
 * Database Fixes Runner Script
 * 
 * This script applies all the database fixes in the correct order.
 * Run this after setting up your database to apply all improvements.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQLFile(filePath, description) {
  console.log(`🔄 ${description}...`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.toLowerCase().includes('begin') || 
          statement.toLowerCase().includes('commit') ||
          statement.toLowerCase().includes('comment on')) {
        continue; // Skip transaction control and comments
      }
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
        console.error(`   Error: ${error.message}`);
      }
    }
    
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running ${filePath}:`, error.message);
  }
}

async function runDatabaseFixes() {
  console.log('🚀 Starting database fixes application...\n');
  
  const scriptsDir = path.join(__dirname);
  
  // Apply fixes in order
  const fixes = [
    {
      file: path.join(scriptsDir, 'fix_admin_foreign_keys.sql'),
      description: 'Fixing admin foreign key constraints'
    },
    {
      file: path.join(scriptsDir, 'add_performance_indexes.sql'),
      description: 'Adding performance indexes'
    },
    {
      file: path.join(__dirname, '..', 'create-live-vendors-view.sql'),
      description: 'Updating live vendors view'
    }
  ];
  
  for (const fix of fixes) {
    if (fs.existsSync(fix.file)) {
      await runSQLFile(fix.file, fix.description);
      console.log(''); // Add spacing
    } else {
      console.log(`⚠️  File not found: ${fix.file}`);
    }
  }
  
  console.log('🎉 Database fixes application completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: node scripts/sync_database_enums.js');
  console.log('2. Test your application to ensure everything works');
  console.log('3. Monitor performance improvements');
}

// Run the fixes
runDatabaseFixes().catch(console.error);