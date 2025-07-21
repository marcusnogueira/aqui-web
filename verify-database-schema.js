#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * 
 * This script connects to the database and verifies the current schema,
 * specifically checking what columns exist in the users table.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabaseSchema() {
  console.log('🔍 Verifying database schema...');
  console.log(`📡 Connecting to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  try {
    // Check users table columns by testing each possible column
    console.log('\n📋 Checking users table columns...');
    
    const possibleColumns = [
      'id', 'email', 'password', 'name', 'full_name', 'image', 'avatar_url',
      'phone', 'is_vendor', 'is_admin', 'active_role', 'preferred_language',
      'email_verified', 'created_at', 'updated_at', 'external_id'
    ];
    
    const existingColumns = [];
    
    for (const column of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(column)
          .limit(1);
        
        if (!error) {
          existingColumns.push(column);
        }
      } catch (err) {
        // Column doesn't exist
      }
    }
    
    console.log('✅ Users table columns found:');
    existingColumns.forEach(col => {
      console.log(`   - ${col}`);
    });
    
    // Try to get a sample record to see actual structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('\n📊 Sample record structure:');
      Object.keys(sampleData[0]).forEach(key => {
        const value = sampleData[0][key];
        const type = value === null ? 'null' : typeof value;
        console.log(`   - ${key}: ${type} (${value === null ? 'NULL' : 'has value'})`);
      });
    } else if (!sampleError) {
      console.log('\n📊 Users table is empty, but accessible');
    }

    // Check for NextAuth-specific columns
    console.log('\n🔐 Checking for NextAuth-required columns...');
    const requiredColumns = ['password', 'name', 'image', 'email_verified'];
    
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    // Check NextAuth tables
    console.log('\n🔗 Checking NextAuth tables...');
    const nextAuthTables = ['accounts', 'sessions', 'verification_tokens'];
    
    for (const tableName of nextAuthTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: MISSING (${error.message})`);
        } else {
          console.log(`   ✅ ${tableName}: EXISTS`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ERROR (${err.message})`);
      }
    }

    // Test NextAuth-style queries
    console.log('\n🧪 Testing NextAuth-style queries...');
    
    // Test credentials query
    try {
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .select('id, email, password, active_role, name')
        .eq('email', 'nonexistent@example.com')
        .maybeSingle();
      
      if (testError) {
        console.log(`   ❌ Credentials query failed: ${testError.message}`);
      } else {
        console.log('   ✅ Credentials query structure is valid');
      }
    } catch (err) {
      console.log(`   ❌ Credentials query error: ${err.message}`);
    }

    // Test registration query structure
    console.log('\n🔧 Testing registration query structure...');
    try {
      // Test if we can construct the insert query (don't execute)
      const testColumns = ['email', 'password', 'name', 'active_role'];
      const missingColumns = testColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`   ❌ Registration missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('   ✅ Registration query structure is valid');
      }
    } catch (err) {
      console.log(`   ❌ Registration query error: ${err.message}`);
    }

    // Check all tables in the database
    console.log('\n📋 Checking all tables in database...');
    const allTables = [
      'users', 'vendors', 'admin_users', 'favorites', 'reviews',
      'vendor_static_locations', 'vendor_announcements', 'vendor_specials',
      'vendor_live_sessions', 'vendor_reports', 'accounts', 'sessions',
      'verification_tokens'
    ];
    
    const existingTables = [];
    for (const tableName of allTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
        }
      } catch (err) {
        // Table doesn't exist
      }
    }
    
    console.log('✅ Existing tables:');
    existingTables.forEach(table => {
      console.log(`   - ${table}`);
    });

    console.log('\n🎉 Schema verification complete!');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Tables found: ${existingTables.length}`);
    console.log(`   Users table columns: ${existingColumns.length}`);
    console.log(`   NextAuth ready: ${requiredColumns.every(col => existingColumns.includes(col)) ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyDatabaseSchema();