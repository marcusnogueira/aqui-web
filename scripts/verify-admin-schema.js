const { createClient } = require('@supabase/supabase-js');

// This script verifies that the admin authentication schema was successfully applied
async function verifyAdminSchema() {
  try {
    // Use environment variables or default to local development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Verifying admin_users table exists...');
    
    // Try to query the admin_users table structure
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(0); // Just check if table exists, don't return data
    
    if (error) {
      console.error('❌ Error accessing admin_users table:', error.message);
      return false;
    }
    
    console.log('✅ admin_users table exists and is accessible');
    
    // Test the verify_admin_credentials function
    console.log('🔍 Testing verify_admin_credentials function...');
    
    const { data: funcData, error: funcError } = await supabase
      .rpc('verify_admin_credentials', {
        input_username: 'test_user',
        input_password_hash: 'test_hash'
      });
    
    if (funcError) {
      console.error('❌ Error testing verify_admin_credentials function:', funcError.message);
      return false;
    }
    
    console.log('✅ verify_admin_credentials function is working');
    console.log('🎉 Admin authentication schema verification complete!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyAdminSchema()
    .then(success => {
      if (success) {
        console.log('\n✅ Admin authentication schema is properly configured!');
        process.exit(0);
      } else {
        console.log('\n❌ Admin authentication schema verification failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Verification script error:', error);
      process.exit(1);
    });
}

module.exports = { verifyAdminSchema };