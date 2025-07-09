#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseOperations() {
  console.log('🧪 Testing database operations...');
  
  const tests = [
    {
      name: 'Test users table',
      test: async () => {
        const { data, error } = await supabase.from('users').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test vendors table', 
      test: async () => {
        const { data, error } = await supabase.from('vendors').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test reviews table',
      test: async () => {
        const { data, error } = await supabase.from('reviews').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test favorites table',
      test: async () => {
        const { data, error } = await supabase.from('favorites').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test vendor_live_sessions table',
      test: async () => {
        const { data, error } = await supabase.from('vendor_live_sessions').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test admin_users table',
      test: async () => {
        const { data, error } = await supabase.from('admin_users').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - vendor_feedback',
      test: async () => {
        const { data, error } = await supabase.from('vendor_feedback').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - vendor_hours',
      test: async () => {
        const { data, error } = await supabase.from('vendor_hours').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - moderation_logs',
      test: async () => {
        const { data, error } = await supabase.from('moderation_logs').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - platform_settings',
      test: async () => {
        const { data, error } = await supabase.from('platform_settings').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - review_reports',
      test: async () => {
        const { data, error } = await supabase.from('review_reports').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    },
    {
      name: 'Test new tables - search_logs',
      test: async () => {
        const { data, error } = await supabase.from('search_logs').select('*').limit(5);
        return { data: data?.length || 0, error };
      }
    }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result.error) {
        console.log(`❌ ${test.name}: ${result.error.message}`);
        failedTests++;
      } else {
        console.log(`✅ ${test.name}: ${result.data} rows`);
        passedTests++;
      }
    } catch (err) {
      console.log(`💥 ${test.name}: ${err.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All database operations are working correctly!');
  } else {
    console.log('\n⚠️  Some database operations are failing. Check the errors above.');
  }
}

testDatabaseOperations().catch(console.error);