/**
 * Manual Admin Login Test
 * 
 * This script tests the admin login functionality using Playwright
 * to verify that the 'mrn' user can successfully authenticate.
 */

const { chromium } = require('playwright');

async function testAdminLogin() {
  console.log('🚀 Starting manual admin login test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to admin login page
    console.log('📍 Navigating to admin login page...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/admin-login-page.png' });
    console.log('📸 Screenshot saved: test-results/admin-login-page.png');
    
    // Fill login credentials
    console.log('🔐 Filling login credentials...');
    await page.fill('input[id="username"]', 'mrn');
    await page.fill('input[id="password"]', 'mrn');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'test-results/admin-login-filled.png' });
    console.log('📸 Screenshot saved: test-results/admin-login-filled.png');
    
    // Submit login form
    console.log('📤 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('🌐 Current URL after login attempt:', currentUrl);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/admin-login-result.png' });
    console.log('📸 Screenshot saved: test-results/admin-login-result.png');
    
    // Check if redirected to dashboard
    if (currentUrl.includes('/admin/dashboard')) {
      console.log('✅ Login successful! Redirected to admin dashboard.');
      
      // Navigate to vendor status page
      console.log('🔄 Navigating to vendor status control...');
      await page.goto('http://localhost:3000/admin/vendor-status');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of vendor status page
      await page.screenshot({ path: 'test-results/vendor-status-page.png' });
      console.log('📸 Screenshot saved: test-results/vendor-status-page.png');
      
      console.log('✅ Vendor status page loaded successfully!');
    } else {
      console.log('❌ Login failed. Current URL:', currentUrl);
      
      // Check for error messages
      const errorElements = await page.$$('.text-red-700, .text-red-500, [class*="error"]');
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const errorText = await element.textContent();
          console.log('🚨 Error message found:', errorText);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    await page.screenshot({ path: 'test-results/admin-login-error.png' });
    console.log('📸 Error screenshot saved: test-results/admin-login-error.png');
  } finally {
    await browser.close();
    console.log('🏁 Test completed.');
  }
}

// Run the test
testAdminLogin().catch(console.error);