import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testLoginAPIRequest() {
  console.log('🔍 Testing actual HTTP request to login API...')
  
  const baseUrl = 'http://localhost:3000' // Assuming dev server is running
  const loginUrl = `${baseUrl}/api/admin/login`
  
  try {
    console.log('\n📡 Making POST request to:', loginUrl)
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'mrn',
        password: 'mrn'
      })
    })
    
    console.log('\n📊 Response Details:')
    console.log('- Status:', response.status)
    console.log('- Status Text:', response.statusText)
    console.log('- Headers:')
    
    // Log all response headers
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    
    // Get response body
    const responseText = await response.text()
    console.log('\n📄 Response Body:')
    console.log(responseText)
    
    // Try to parse as JSON
    try {
      const responseJson = JSON.parse(responseText)
      console.log('\n📋 Parsed JSON:')
      console.log(JSON.stringify(responseJson, null, 2))
    } catch (parseError) {
      console.log('\n⚠️  Response is not valid JSON')
    }
    
    // Check for Set-Cookie header specifically
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      console.log('\n🍪 Set-Cookie Header Found:')
      console.log(setCookieHeader)
    } else {
      console.log('\n❌ No Set-Cookie header found!')
    }
    
    if (response.ok) {
      console.log('\n✅ API request successful!')
    } else {
      console.log('\n❌ API request failed!')
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 The development server is not running.')
        console.log('💡 Please start it with: npm run dev')
      }
    }
  }
}

// Run the test
testLoginAPIRequest().then(() => {
  console.log('\n🏁 API test complete')
  process.exit(0)
}).catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})