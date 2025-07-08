#!/usr/bin/env node

/**
 * Script to inspect actual database tables and their columns
 * Run with: node scripts/inspect-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTables() {
  try {
    console.log('🔍 Inspecting database tables...');
    
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.log('❌ Error getting tables:', tablesError.message);
      
      // Try alternative approach - just try to select from known tables
      console.log('\n🔄 Trying alternative approach...');
      
      const tablesToCheck = ['users', 'vendors', 'vendor_live_sessions', 'reviews', 'favorites'];
      
      for (const tableName of tablesToCheck) {
        console.log(`\n📋 Checking table: ${tableName}`);
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`   ❌ Error: ${error.message}`);
          } else {
            console.log(`   ✅ Table exists with ${count} rows`);
            
            // Try to get one row to see the structure
            const { data: sampleData, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (sampleError) {
              console.log(`   ❌ Sample data error: ${sampleError.message}`);
            } else if (sampleData && sampleData.length > 0) {
              console.log(`   📝 Sample structure:`, Object.keys(sampleData[0]));
            } else {
              console.log(`   📝 Table is empty`);
            }
          }
        } catch (err) {
          console.log(`   ❌ Exception: ${err.message}`);
        }
      }
      
      return;
    }
    
    console.log('✅ Found tables:', tables);
    
    // For each table, get column information
    for (const table of tables) {
      console.log(`\n📋 Table: ${table.table_name}`);
      
      const { data: columns, error: columnsError } = await supabase
        .rpc('exec', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = '${table.table_name}'
            ORDER BY ordinal_position;
          `
        });
      
      if (columnsError) {
        console.log(`   ❌ Error getting columns: ${columnsError.message}`);
      } else {
        console.log(`   📝 Columns:`);
        columns.forEach(col => {
          console.log(`      ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
inspectTables();