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
    
    // Get vendors first
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name')
      .limit(5);
    
    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }
    
    console.log('✅ Found vendors:', vendors.length);
    
    // Get live sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select('*');
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log('✅ Found live sessions:', sessions.length);
    
    // Manual join
    const vendorsWithSessions = vendors.map(vendor => {
      const vendorSessions = sessions.filter(session => session.vendor_id === vendor.id);
      return {
        ...vendor,
        live_sessions: vendorSessions
      };
    });
    
    console.log('🔗 Manual join result:', JSON.stringify(vendorsWithSessions, null, 2));
    
    // Test if we can create a new live session
    console.log('\n🆕 Testing live session creation...');
    
    if (vendors.length > 0) {
      const testVendor = vendors[0];
      
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