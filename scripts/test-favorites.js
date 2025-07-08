const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFavorites() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🧪 Testing favorites functionality...');
    
    // Get a user ID
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    const userId = users[0].id;
    console.log('📝 Testing with user ID:', userId);
    
    // Get a vendor ID
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id')
      .limit(1);
    
    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }
    
    if (!vendors || vendors.length === 0) {
      console.log('❌ No vendors found');
      return;
    }
    
    const vendorId = vendors[0].id;
    console.log('📝 Testing with vendor ID:', vendorId);
    
    // Try to insert a test favorite using service role (should bypass RLS)
    console.log('📝 Inserting test favorite...');
    const { data: insertData, error: insertError } = await supabase
      .from('favorites')
      .insert({ customer_id: userId, vendor_id: vendorId })
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('Full error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Try to read it back
      const { data: readData, error: readError } = await supabase
        .from('favorites')
        .select('*')
        .eq('customer_id', userId)
        .eq('vendor_id', vendorId);
      
      if (readError) {
        console.log('❌ Read failed:', readError.message);
      } else {
        console.log('✅ Read successful:', readData);
      }
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', userId)
        .eq('vendor_id', vendorId);
      
      if (deleteError) {
        console.log('❌ Delete failed:', deleteError.message);
      } else {
        console.log('🧹 Cleaned up test data');
      }
    }
    
    // Check current favorites count
    const { data: allFavorites, error: countError } = await supabase
      .from('favorites')
      .select('*');
    
    if (countError) {
      console.log('❌ Count check failed:', countError.message);
    } else {
      console.log('📊 Total favorites in database:', allFavorites.length);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testFavorites();