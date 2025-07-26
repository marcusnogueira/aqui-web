// Test script for admin settings API
// Run with: node scripts/test-admin-settings.js

const BASE_URL = 'http://localhost:3000'

async function testAdminSettings() {
  try {
    console.log('🧪 Testing Admin Settings API...')
    
    // Test GET endpoint
    console.log('\n📥 Testing GET /api/admin/settings')
    const getResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: {
        'Authorization': 'Bearer your-admin-token-here', // Replace with actual admin token
        'Content-Type': 'application/json'
      }
    })
    
    console.log('GET Response Status:', getResponse.status)
    const getResult = await getResponse.json()
    console.log('GET Response:', JSON.stringify(getResult, null, 2))
    
    // Test PUT endpoint
    console.log('\n📤 Testing PUT /api/admin/settings')
    const putResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer your-admin-token-here', // Replace with actual admin token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        allow_auto_vendor_approval: true,
        require_vendor_approval: false
      })
    })
    
    console.log('PUT Response Status:', putResponse.status)
    const putResult = await putResponse.json()
    console.log('PUT Response:', JSON.stringify(putResult, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Only run if called directly
if (require.main === module) {
  testAdminSettings()
}

module.exports = { testAdminSettings }