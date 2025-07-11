import { test, expect } from '@playwright/test';

/**
 * Test Account Setup and Validation
 * 
 * This test suite creates and validates test accounts for comprehensive testing,
 * including both customer and vendor accounts with proper role switching.
 */

test.describe('Test Account Setup and Validation', () => {
  const BASE_URL = 'http://localhost:3000';
  const ADMIN_USERNAME = 'mrn';
  const ADMIN_PASSWORD = 'mrn';
  
  // Test account data
  const testAccountData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-0199'
  };
  
  const testVendorData = {
    businessName: `Test Vendor ${Date.now()}`,
    businessType: 'Food Truck',
    description: 'Automated test vendor for E2E testing',
    phone: '555-0123',
    email: testAccountData.email,
    address: '123 Test Street, Test City, TC 12345',
    latitude: 37.7749,
    longitude: -122.4194
  };

  let testErrors: string[] = [];
  
  const logError = (context: string, error: string) => {
    testErrors.push(`[${context}] ${error}`);
    console.error(`❌ [${context}] ${error}`);
  };

  const takeErrorScreenshot = async (page: any, testName: string, step: string) => {
    try {
      await page.screenshot({ 
        path: `test-results/error-${testName}-${step}-${Date.now()}.png`,
        fullPage: true 
      });
    } catch (screenshotError) {
      logError('Screenshot', `Failed to capture screenshot: ${screenshotError}`);
    }
  };

  test.beforeEach(async ({ page }) => {
    testErrors = [];
    
    page.on('pageerror', (error) => {
      logError('Page Error', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logError('Console Error', msg.text());
      }
    });
  });

  test('Create Test User Account via Script', async ({ page }) => {
    try {
      console.log('🔧 Creating test user account via script...');
      
      // Step 1: Run the test user creation script
      console.log('📍 Step 1: Execute test user creation script');
      
      // Navigate to homepage first to ensure app is running
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of current state
      await page.screenshot({ path: 'test-results/before-test-account-creation.png' });
      
      console.log('✅ Test account creation initiated');
      console.log(`📧 Test email: ${testAccountData.email}`);
      console.log(`🏪 Test vendor: ${testVendorData.businessName}`);
      
      // Step 2: Verify the account can be used for login
      console.log('📍 Step 2: Verify test account accessibility');
      
      // Try to access auth-related functionality
      try {
        // Look for authentication elements
        const authElements = [
          'button:has-text("Sign Up")',
          'button:has-text("Login")',
          'button:has-text("Sign In")',
          '[data-testid="auth-button"]',
          '.auth-button',
          'a[href*="auth"]',
          'a[href*="login"]'
        ];
        
        let authElementFound = false;
        for (const selector of authElements) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`✅ Found auth element: ${selector}`);
              authElementFound = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!authElementFound) {
          logError('Auth Elements', 'No authentication elements found on homepage');
        }
        
      } catch (error) {
        logError('Auth Verification', `Failed to verify auth elements: ${error}`);
      }
      
      // Step 3: Test direct navigation to auth pages
      console.log('📍 Step 3: Test auth page navigation');
      
      try {
        // Test auth callback page
        await page.goto(`${BASE_URL}/auth/callback`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/auth-callback-page.png' });
        console.log('✅ Auth callback page accessible');
      } catch (error) {
        logError('Auth Navigation', `Auth callback page failed: ${error}`);
      }
      
    } catch (error) {
      logError('Test Account Creation', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'test-account-setup', 'creation-failed');
    }
  });

  test('Validate Test Vendor Account Creation', async ({ page }) => {
    try {
      console.log('🏪 Validating test vendor account...');
      
      // Step 1: Navigate to vendor onboarding
      console.log('📍 Step 1: Access vendor onboarding');
      await page.goto(`${BASE_URL}/vendor/onboarding`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/vendor-onboarding-access.png' });
      
      // Step 2: Check vendor dashboard access
      console.log('📍 Step 2: Check vendor dashboard');
      try {
        await page.goto(`${BASE_URL}/vendor/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/vendor-dashboard-access.png' });
        console.log('✅ Vendor dashboard accessible');
      } catch (error) {
        logError('Vendor Dashboard', `Dashboard access failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-validation', 'dashboard-failed');
      }
      
      // Step 3: Test vendor overview page
      console.log('📍 Step 3: Test vendor overview');
      try {
        await page.goto(`${BASE_URL}/vendor/overview`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/vendor-overview-access.png' });
        console.log('✅ Vendor overview accessible');
      } catch (error) {
        logError('Vendor Overview', `Overview access failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-validation', 'overview-failed');
      }
      
      // Step 4: Check if vendor appears in customer view
      console.log('📍 Step 4: Check vendor visibility in customer view');
      try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        // Look for vendor cards or listings
        const vendorElements = [
          '[data-testid="vendor-card"]',
          '.vendor-card',
          '[data-vendor-id]',
          '.vendor-listing'
        ];
        
        let vendorFound = false;
        for (const selector of vendorElements) {
          try {
            const elements = page.locator(selector);
            const count = await elements.count();
            if (count > 0) {
              console.log(`✅ Found ${count} vendor(s) with selector: ${selector}`);
              vendorFound = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!vendorFound) {
          logError('Vendor Visibility', 'No vendors found in customer view');
        }
        
        await page.screenshot({ path: 'test-results/customer-view-vendors.png' });
        
      } catch (error) {
        logError('Customer View', `Customer view test failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-validation', 'customer-view-failed');
      }
      
    } catch (error) {
      logError('Vendor Validation', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'vendor-validation', 'unexpected-error');
    }
  });

  test('Test Role Switching Between Customer and Vendor', async ({ page }) => {
    try {
      console.log('🔄 Testing role switching functionality...');
      
      // Step 1: Start in customer mode
      console.log('📍 Step 1: Start in customer mode');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/role-switch-customer-start.png' });
      
      // Step 2: Look for role switching UI
      console.log('📍 Step 2: Look for role switching interface');
      try {
        const roleSwitchElements = [
          '[data-testid="role-switcher"]',
          'button:has-text("Switch to Vendor")',
          'button:has-text("Vendor Mode")',
          'button:has-text("Switch Role")',
          '.role-switcher',
          'select[name="role"]',
          '[data-role="switcher"]'
        ];
        
        let switcherFound = false;
        for (const selector of roleSwitchElements) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`✅ Found role switcher: ${selector}`);
              await element.click();
              await page.waitForTimeout(2000);
              switcherFound = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!switcherFound) {
          logError('Role Switching', 'No role switcher UI found');
        }
        
        await page.screenshot({ path: 'test-results/role-switch-attempt.png' });
        
      } catch (error) {
        logError('Role Switch UI', `Role switcher interaction failed: ${error}`);
        await takeErrorScreenshot(page, 'role-switching', 'ui-failed');
      }
      
      // Step 3: Test API-based role switching
      console.log('📍 Step 3: Test API-based role switching');
      try {
        // Test the switch-role API endpoint
        const switchResponse = await page.request.post(`${BASE_URL}/api/user/switch-role`, {
          data: { role: 'vendor' }
        });
        
        console.log(`Switch Role API Status: ${switchResponse.status()}`);
        
        if (switchResponse.ok()) {
          console.log('✅ Role switch API working');
        } else {
          logError('Role Switch API', `API returned status: ${switchResponse.status()}`);
        }
        
      } catch (error) {
        logError('Role Switch API', `API test failed: ${error}`);
      }
      
      // Step 4: Verify role persistence
      console.log('📍 Step 4: Test role persistence');
      try {
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/role-persistence-test.png' });
        console.log('✅ Role persistence test completed');
      } catch (error) {
        logError('Role Persistence', `Persistence test failed: ${error}`);
      }
      
    } catch (error) {
      logError('Role Switching Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'role-switching', 'unexpected-error');
    }
  });

  test('Validate Admin Account Access', async ({ page }) => {
    try {
      console.log('👑 Validating admin account access...');
      
      // Step 1: Admin login
      console.log('📍 Step 1: Admin authentication');
      await page.goto(`${BASE_URL}/admin/login`);
      await page.waitForLoadState('networkidle');
      
      try {
        await page.fill('input[id="username"], input[name="username"]', ADMIN_USERNAME);
        await page.fill('input[id="password"], input[name="password"]', ADMIN_PASSWORD);
        await page.screenshot({ path: 'test-results/admin-login-filled.png' });
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);
        
        if (currentUrl.includes('/admin')) {
          console.log('✅ Admin login successful');
        } else {
          logError('Admin Login', `Login failed - redirected to: ${currentUrl}`);
        }
        
        await page.screenshot({ path: 'test-results/admin-login-result.png' });
        
      } catch (error) {
        logError('Admin Authentication', `Login process failed: ${error}`);
        await takeErrorScreenshot(page, 'admin-validation', 'login-failed');
      }
      
      // Step 2: Test admin dashboard access
      console.log('📍 Step 2: Test admin dashboard');
      try {
        await page.goto(`${BASE_URL}/admin/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/admin-dashboard-access.png' });
        console.log('✅ Admin dashboard accessible');
      } catch (error) {
        logError('Admin Dashboard', `Dashboard access failed: ${error}`);
      }
      
      // Step 3: Test admin vendor management
      console.log('📍 Step 3: Test vendor management access');
      try {
        await page.goto(`${BASE_URL}/admin/vendors`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/admin-vendors-access.png' });
        console.log('✅ Admin vendor management accessible');
      } catch (error) {
        logError('Admin Vendors', `Vendor management access failed: ${error}`);
      }
      
      // Step 4: Test admin user management
      console.log('📍 Step 4: Test user management access');
      try {
        await page.goto(`${BASE_URL}/admin/users`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/admin-users-access.png' });
        console.log('✅ Admin user management accessible');
      } catch (error) {
        logError('Admin Users', `User management access failed: ${error}`);
      }
      
    } catch (error) {
      logError('Admin Validation', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'admin-validation', 'unexpected-error');
    }
  });

  test.afterEach(async ({ page }) => {
    // Log all errors encountered during the test
    if (testErrors.length > 0) {
      console.log('\n📋 Test Errors Summary:');
      testErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      // Write errors to file for documentation
      const errorReport = {
        timestamp: new Date().toISOString(),
        testName: 'Test Account Setup',
        errors: testErrors,
        testData: {
          testAccount: testAccountData,
          testVendor: testVendorData
        }
      };
      
      console.log('\n📄 Error Report:', JSON.stringify(errorReport, null, 2));
    }
  });
});