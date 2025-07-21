// Runtime Auth Verification Script
// This script tests the actual auth implementation at runtime

const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🔍 Verifying Auth Implementation at Runtime...\n');

// Start the dev server
console.log('1. Starting development server...');
const server = spawn('npm', ['run', 'dev'], { 
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false 
});

let serverReady = false;
let serverOutput = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  if (output.includes('Ready') || output.includes('localhost:3000')) {
    serverReady = true;
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  if (output.includes('Ready') || output.includes('localhost:3000')) {
    serverReady = true;
  }
});

// Wait for server to be ready
const waitForServer = () => {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (serverReady) {
        resolve();
      } else {
        setTimeout(checkReady, 1000);
      }
    };
    checkReady();
  });
};

// Run tests after server is ready
waitForServer().then(async () => {
  console.log('   ✅ Development server started');
  
  // Wait a bit more for full initialization
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Test 1: NextAuth session endpoint
    console.log('\n2. Testing NextAuth session endpoint...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('   ✅ Session endpoint works:', sessionData === null ? 'No session (expected)' : 'Session found');
    } else {
      console.log('   ❌ Session endpoint failed:', sessionResponse.status);
    }
    
    // Test 2: NextAuth providers endpoint
    console.log('\n3. Testing NextAuth providers endpoint...');
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers');
    if (providersResponse.ok) {
      const providersData = await providersResponse.json();
      const providerNames = Object.keys(providersData);
      console.log('   ✅ Providers endpoint works:', providerNames.join(', '));
    } else {
      console.log('   ❌ Providers endpoint failed:', providersResponse.status);
    }
    
    // Test 3: Main page loads without auth errors
    console.log('\n4. Testing main page load...');
    const pageResponse = await fetch('http://localhost:3000/');
    if (pageResponse.ok) {
      const pageContent = await pageResponse.text();
      const hasAuthErrors = pageContent.includes('auth error') || pageContent.includes('Auth Error');
      if (hasAuthErrors) {
        console.log('   ❌ Main page has auth errors');
      } else {
        console.log('   ✅ Main page loads without auth errors');
      }
    } else {
      console.log('   ❌ Main page failed to load:', pageResponse.status);
    }
    
    // Test 4: API route with auth
    console.log('\n5. Testing API route with auth...');
    const apiResponse = await fetch('http://localhost:3000/api/search/vendors');
    if (apiResponse.ok) {
      console.log('   ✅ API route with auth works');
    } else {
      console.log('   ❌ API route with auth failed:', apiResponse.status);
    }
    
    // Test 5: Check for console errors in server output
    console.log('\n6. Checking for server errors...');
    const hasErrors = serverOutput.includes('Error:') || serverOutput.includes('TypeError:') || serverOutput.includes('ReferenceError:');
    if (hasErrors) {
      console.log('   ❌ Server has errors in output');
      console.log('   Server output:', serverOutput.split('\n').filter(line => 
        line.includes('Error:') || line.includes('TypeError:') || line.includes('ReferenceError:')
      ).slice(0, 3));
    } else {
      console.log('   ✅ No errors in server output');
    }
    
  } catch (error) {
    console.log('   ❌ Runtime test failed:', error.message);
  }
  
  console.log('\n🏁 Runtime Auth Verification Complete');
  
  // Kill the server
  process.kill(-server.pid);
  process.exit(0);
}).catch((error) => {
  console.log('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle cleanup
process.on('SIGINT', () => {
  if (server.pid) {
    process.kill(-server.pid);
  }
  process.exit(0);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('❌ Test timed out');
  if (server.pid) {
    process.kill(-server.pid);
  }
  process.exit(1);
}, 30000);