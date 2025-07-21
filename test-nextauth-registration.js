#!/usr/bin/env node

/**
 * NextAuth Registration Test Script
 * 
 * This script tests the NextAuth registration endpoint
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const REGISTRATION_ENDPOINT = `${API_URL}/api/auth/register`;

async function checkServerAvailability() {
  try {
    console.log(`🔍 Checking if server is available at ${API_URL}...`);
    const response = await fetch(API_URL, { timeout: 5000 });
    console.log(`✅ Server is available (status: ${response.status})`);
    return true;
  } catch (error) {
    console.error(`❌ Server is not available at ${API_URL}`);
    console.error('   Make sure your Next.js development server is running with:');
    console.error('   npm run dev');
    console.error('');
    console.error('   Or specify a different API URL with:');
    console.error('   API_URL=https://your-api-url node test-nextauth-registration.js');
    return false;
  }
}

async function testRegistration() {
  console.log('🧪 Testing NextAuth Registration API...');
  
  // Check if server is available first
  const isServerAvailable = await checkServerAvailability();
  if (!isServerAvailable) {
    return;
  }
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';
  
  try {
    // Test registration endpoint
    console.log(`📧 Registering user: ${testEmail}`);
    console.log(`   POST ${REGISTRATION_ENDPOINT}`);
    
    const response = await fetch(REGISTRATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User data:', data.user);
    } else {
      console.log(`❌ Registration failed: ${response.status}`);
      console.log('Error:', data.error);
    }
    
    // Test validation
    console.log('\n🧪 Testing validation (short password)...');
    const validationResponse = await fetch(REGISTRATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'another@example.com',
        password: '123',
        name: 'Invalid User'
      })
    });
    
    const validationData = await validationResponse.json();
    
    if (validationResponse.status === 400) {
      console.log('✅ Validation working correctly!');
      console.log('Validation error:', validationData.error);
    } else {
      console.log('❌ Validation failed to catch short password');
    }
    
    // Test duplicate email
    console.log('\n🧪 Testing duplicate email...');
    const duplicateResponse = await fetch(REGISTRATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName
      })
    });
    
    const duplicateData = await duplicateResponse.json();
    
    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate email detection working!');
      console.log('Error:', duplicateData.error);
    } else {
      console.log('❌ Failed to detect duplicate email');
    }
    
    console.log('\n🎉 Tests completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('   Error details:', error.message);
  }
}

testRegistration();