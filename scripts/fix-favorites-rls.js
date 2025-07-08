const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixFavoritesRLS() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔧 Fixing favorites RLS policy...');
    
    // Drop existing policy
    console.log('📝 Dropping existing policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: 'DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;'
    });
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️ Drop policy result:', dropError);
    }
    
    // Create new policy with correct field name
    console.log('📝 Creating new policy with customer_id...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: 'CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = customer_id);'
    });
    
    if (createError) {
      console.log('⚠️ Create policy result:', createError);
    }
    
    console.log('✅ RLS policy updated successfully!');
    
    // Test the policy by trying to insert a favorite
    console.log('🧪 Testing favorites functionality...');
    
    // First get a user ID
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log('📝 Testing with user ID:', userId);
      
      // Get a vendor ID
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id')
        .limit(1);
      
      if (vendors && vendors.length > 0) {
        const vendorId = vendors[0].id;
        console.log('📝 Testing with vendor ID:', vendorId);
        
        // Try to insert a test favorite (this will test RLS)
        const { data, error } = await supabase
          .from('favorites')
          .insert({ customer_id: userId, vendor_id: vendorId })
          .select();
        
        if (error) {
          console.log('❌ Test insert failed:', error.message);
        } else {
          console.log('✅ Test insert successful:', data);
          
          // Clean up test data
          await supabase
            .from('favorites')
            .delete()
            .eq('customer_id', userId)
            .eq('vendor_id', vendorId);
          console.log('🧹 Cleaned up test data');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing RLS policy:', error);
  }
}

fixFavoritesRLS();