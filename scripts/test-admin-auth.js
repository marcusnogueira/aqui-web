const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Simple password hashing function (in production, use bcrypt or similar)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testAdminAuth() {
  try {
    console.log('🚀 Testing Admin Authentication System...');
    
    // Use environment variables or default to local development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test data
    const testAdmin = {
      email: 'admin@test.com',
      username: 'testadmin',
      password: 'testpassword123'
    };
    
    const passwordHash = hashPassword(testAdmin.password);
    
    console.log('📝 Creating test admin user...');
    
    // Insert test admin user
    const { data: insertData, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: testAdmin.email,
        username: testAdmin.username,
        password_hash: passwordHash
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error creating test admin:', insertError.message);
      return false;
    }
    
    console.log('✅ Test admin user created:', insertData[0].id);
    
    // Test credential verification
    console.log('🔐 Testing credential verification...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_admin_credentials', {
        input_username: testAdmin.username,
        input_password_hash: passwordHash
      });
    
    if (verifyError) {
      console.error('❌ Error verifying credentials:', verifyError.message);
      return false;
    }
    
    if (verifyData && verifyData.length > 0) {
      console.log('✅ Credentials verified successfully!');
      console.log('   Admin ID:', verifyData[0].admin_id);
      console.log('   Email:', verifyData[0].admin_email);
      console.log('   Username:', verifyData[0].admin_username);
    } else {
      console.log('❌ Credential verification failed - no matching user found');
      return false;
    }
    
    // Test with wrong credentials
    console.log('🔒 Testing with wrong credentials...');
    
    const { data: wrongData, error: wrongError } = await supabase
      .rpc('verify_admin_credentials', {
        input_username: testAdmin.username,
        input_password_hash: 'wrong_hash'
      });
    
    if (wrongError) {
      console.error('❌ Error testing wrong credentials:', wrongError.message);
      return false;
    }
    
    if (!wrongData || wrongData.length === 0) {
      console.log('✅ Wrong credentials correctly rejected');
    } else {
      console.log('❌ Security issue: wrong credentials were accepted!');
      return false;
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('username', testAdmin.username);
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 All admin authentication tests passed!');
    return true;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return false;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testAdminAuth()
    .then(success => {
      if (success) {
        console.log('\n🎊 Admin authentication system is working correctly!');
        process.exit(0);
      } else {
        console.log('\n💔 Admin authentication system test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test script error:', error);
      process.exit(1);
    });
}

module.exports = { testAdminAuth };