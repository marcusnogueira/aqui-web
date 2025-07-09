const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testManualJoin() {
  try {
    console.log('🔍 Testing manual join between vendors and vendor_live_sessions...');
    
    // Efficient single query with embedded join using Supabase's built-in relationship support
    const { data: vendorsWithSessions, error: vendorsError } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        vendor_live_sessions (
          id,
          latitude,
          longitude,
          address,
          start_time,
          end_time,
          is_active,
          created_at,
          updated_at
        )
      `)
      .limit(5);
    
    if (vendorsError) {
      console.error('❌ Error fetching vendors with sessions:', vendorsError);
      return;
    }
    
    console.log('✅ Found vendors with embedded sessions:', vendorsWithSessions.length);
    
    console.log('🔗 Efficient join result:', JSON.stringify(vendorsWithSessions, null, 2));
    
    // Test if we can create a new live session
    console.log('\n🆕 Testing live session creation...');
    
    if (vendorsWithSessions.length > 0) {
      const testVendor = vendorsWithSessions[0];
      
      const { data: newSession, error: createError } = await supabase
        .from('vendor_live_sessions')
        .insert({
          vendor_id: testVendor.id,
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Test Address, New York, NY',
          start_time: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating live session:', createError);
      } else {
        console.log('✅ Successfully created live session:', newSession);
        
        // Clean up - delete the test session
        await supabase
          .from('vendor_live_sessions')
          .delete()
          .eq('id', newSession.id);
        
        console.log('🧹 Cleaned up test session');
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testManualJoin();