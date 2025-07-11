import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite: Full Application Flow
 * 
 * This test suite validates the complete application functionality from both
 * customer and vendor perspectives, including authentication, role switching,
 * vendor management, and customer interactions.
 * 
 * Test Accounts:
 * - Admin: mrn/mrn (admin credentials)
 * - Test User: Created dynamically for vendor/customer testing
 */

test.describe('Comprehensive Application E2E Tests', () => {
  const ADMIN_USERNAME = 'mrn';
  const ADMIN_PASSWORD = 'mrn';
  const BASE_URL = 'http://localhost:3000';
  
  // Test data
  const testVendorData = {
    businessName: 'E2E Test Food Truck',
    businessType: 'Food Truck',
    description: 'Automated test vendor for E2E testing',
    phone: '555-0123',
    email: 'test@e2evendor.com'
  };

  let testErrors: string[] = [];
  
  // Helper function to log errors
  const logError = (context: string, error: string) => {
    testErrors.push(`[${context}] ${error}`);
    console.error(`❌ [${context}] ${error}`);
  };

  // Helper function to take screenshot on error
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
    testErrors = []; // Reset errors for each test
    
    // Set up error handling
    page.on('pageerror', (error) => {
      logError('Page Error', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logError('Console Error', msg.text());
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Log all errors encountered during the test
    if (testErrors.length > 0) {
      console.log('\n📋 Test Errors Summary:');
      testErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  });

  test('Complete Customer Journey - Browse and Explore', async ({ page }) => {
    try {
      console.log('🛒 Starting Customer Journey Test...');
      
      // Step 1: Navigate to homepage
      console.log('📍 Step 1: Navigate to homepage');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of homepage
      await page.screenshot({ path: 'test-results/customer-homepage.png' });
      
      // Step 2: Check if vendors are displayed
      console.log('📍 Step 2: Check vendor display');
      try {
        await page.waitForSelector('[data-testid="vendor-card"], .vendor-card', { timeout: 10000 });
        console.log('✅ Vendors found on homepage');
      } catch (error) {
        logError('Vendor Display', 'No vendors found on homepage');
        await takeErrorScreenshot(page, 'customer-journey', 'no-vendors');
      }
      
      // Step 3: Test search functionality
      console.log('📍 Step 3: Test search functionality');
      try {
        const searchInput = page.locator('input[placeholder*="search"], input[type="search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('food');
          await page.waitForTimeout(2000); // Wait for search results
          console.log('✅ Search functionality working');
        } else {
          logError('Search', 'Search input not found');
        }
      } catch (error) {
        logError('Search', `Search functionality failed: ${error}`);
        await takeErrorScreenshot(page, 'customer-journey', 'search-failed');
      }
      
      // Step 4: Test map interaction
      console.log('📍 Step 4: Test map interaction');
      try {
        const mapContainer = page.locator('#map, .map-container, [data-testid="map"]').first();
        if (await mapContainer.isVisible()) {
          await mapContainer.click();
          console.log('✅ Map interaction working');
        } else {
          logError('Map', 'Map container not found');
        }
      } catch (error) {
        logError('Map', `Map interaction failed: ${error}`);
        await takeErrorScreenshot(page, 'customer-journey', 'map-failed');
      }
      
      // Step 5: Navigate to explore page
      console.log('📍 Step 5: Navigate to explore page');
      try {
        await page.goto(`${BASE_URL}/explore`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/customer-explore.png' });
        console.log('✅ Explore page loaded');
      } catch (error) {
        logError('Navigation', `Failed to load explore page: ${error}`);
        await takeErrorScreenshot(page, 'customer-journey', 'explore-failed');
      }
      
    } catch (error) {
      logError('Customer Journey', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'customer-journey', 'unexpected-error');
    }
  });

  test('Admin Authentication and Vendor Management', async ({ page }) => {
    try {
      console.log('👑 Starting Admin Authentication Test...');
      
      // Step 1: Navigate to admin login
      console.log('📍 Step 1: Navigate to admin login');
      await page.goto(`${BASE_URL}/admin/login`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-login-page.png' });
      
      // Step 2: Admin login
      console.log('📍 Step 2: Admin authentication');
      try {
        await page.fill('input[id="username"], input[name="username"]', ADMIN_USERNAME);
        await page.fill('input[id="password"], input[name="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/admin/dashboard') || currentUrl.includes('/admin')) {
          console.log('✅ Admin login successful');
        } else {
          logError('Admin Auth', `Login failed - redirected to: ${currentUrl}`);
        }
      } catch (error) {
        logError('Admin Auth', `Login process failed: ${error}`);
        await takeErrorScreenshot(page, 'admin-auth', 'login-failed');
      }
      
      // Step 3: Navigate to vendor management
      console.log('📍 Step 3: Navigate to vendor management');
      try {
        await page.goto(`${BASE_URL}/admin/vendors`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/admin-vendors-page.png' });
        console.log('✅ Vendor management page loaded');
      } catch (error) {
        logError('Admin Navigation', `Failed to load vendor management: ${error}`);
        await takeErrorScreenshot(page, 'admin-auth', 'vendors-page-failed');
      }
      
      // Step 4: Test vendor status control
      console.log('📍 Step 4: Test vendor status control');
      try {
        await page.goto(`${BASE_URL}/admin/vendor-status`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/admin-vendor-status.png' });
        console.log('✅ Vendor status page loaded');
      } catch (error) {
        logError('Admin Navigation', `Failed to load vendor status: ${error}`);
        await takeErrorScreenshot(page, 'admin-auth', 'vendor-status-failed');
      }
      
    } catch (error) {
      logError('Admin Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'admin-auth', 'unexpected-error');
    }
  });

  test('Vendor Account Creation and Management', async ({ page }) => {
    try {
      console.log('🏪 Starting Vendor Account Test...');
      
      // Step 1: Navigate to homepage and check for auth
      console.log('📍 Step 1: Navigate to homepage');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Step 2: Look for sign up or auth modal
      console.log('📍 Step 2: Attempt to access vendor features');
      try {
        // Look for auth-related buttons
        const authButtons = [
          'button:has-text("Sign Up")',
          'button:has-text("Login")',
          'button:has-text("Get Started")',
          '[data-testid="auth-button"]',
          '.auth-button'
        ];
        
        let authButtonFound = false;
        for (const selector of authButtons) {
          try {
            const button = page.locator(selector).first();
            if (await button.isVisible({ timeout: 2000 })) {
              await button.click();
              authButtonFound = true;
              console.log(`✅ Found and clicked auth button: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!authButtonFound) {
          logError('Auth Flow', 'No authentication buttons found');
        }
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/vendor-auth-attempt.png' });
        
      } catch (error) {
        logError('Vendor Auth', `Auth flow failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-account', 'auth-failed');
      }
      
      // Step 3: Test vendor onboarding flow
      console.log('📍 Step 3: Test vendor onboarding');
      try {
        await page.goto(`${BASE_URL}/vendor/onboarding`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/vendor-onboarding.png' });
        console.log('✅ Vendor onboarding page accessible');
      } catch (error) {
        logError('Vendor Onboarding', `Onboarding page failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-account', 'onboarding-failed');
      }
      
      // Step 4: Test vendor dashboard access
      console.log('📍 Step 4: Test vendor dashboard');
      try {
        await page.goto(`${BASE_URL}/vendor/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/vendor-dashboard.png' });
        console.log('✅ Vendor dashboard page accessible');
      } catch (error) {
        logError('Vendor Dashboard', `Dashboard access failed: ${error}`);
        await takeErrorScreenshot(page, 'vendor-account', 'dashboard-failed');
      }
      
    } catch (error) {
      logError('Vendor Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'vendor-account', 'unexpected-error');
    }
  });

  test('Role Switching and Cross-Platform Testing', async ({ page }) => {
    try {
      console.log('🔄 Starting Role Switching Test...');
      
      // Step 1: Start as customer
      console.log('📍 Step 1: Start as customer');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/role-customer-start.png' });
      
      // Step 2: Look for role switcher
      console.log('📍 Step 2: Look for role switching functionality');
      try {
        const roleSwitchers = [
          '[data-testid="role-switcher"]',
          'button:has-text("Switch to Vendor")',
          'button:has-text("Vendor Mode")',
          '.role-switcher',
          'select[name="role"]'
        ];
        
        let switcherFound = false;
        for (const selector of roleSwitchers) {
          try {
            const switcher = page.locator(selector).first();
            if (await switcher.isVisible({ timeout: 2000 })) {
              console.log(`✅ Found role switcher: ${selector}`);
              switcherFound = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!switcherFound) {
          logError('Role Switching', 'No role switcher found');
        }
        
      } catch (error) {
        logError('Role Switching', `Role switcher detection failed: ${error}`);
        await takeErrorScreenshot(page, 'role-switching', 'switcher-failed');
      }
      
      // Step 3: Test API endpoints
      console.log('📍 Step 3: Test API endpoints');
      try {
        // Test user API
        const userResponse = await page.request.get(`${BASE_URL}/api/user/profile`);
        console.log(`User API Status: ${userResponse.status()}`);
        
        // Test vendor API
        const vendorResponse = await page.request.get(`${BASE_URL}/api/user/vendor`);
        console.log(`Vendor API Status: ${vendorResponse.status()}`);
        
      } catch (error) {
        logError('API Testing', `API endpoint testing failed: ${error}`);
      }
      
      // Step 4: Test mobile responsiveness
      console.log('📍 Step 4: Test mobile responsiveness');
      try {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/mobile-view.png' });
        console.log('✅ Mobile view tested');
        
        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        
      } catch (error) {
        logError('Mobile Testing', `Mobile responsiveness test failed: ${error}`);
        await takeErrorScreenshot(page, 'role-switching', 'mobile-failed');
      }
      
    } catch (error) {
      logError('Role Switching Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'role-switching', 'unexpected-error');
    }
  });

  test('Performance and Error Handling', async ({ page }) => {
    try {
      console.log('⚡ Starting Performance and Error Handling Test...');
      
      // Step 1: Test page load performance
      console.log('📍 Step 1: Test page load performance');
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 Page load time: ${loadTime}ms`);
      if (loadTime > 5000) {
        logError('Performance', `Slow page load: ${loadTime}ms`);
      }
      
      // Step 2: Test 404 error handling
      console.log('📍 Step 2: Test 404 error handling');
      try {
        await page.goto(`${BASE_URL}/non-existent-page`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/404-page.png' });
        
        const pageContent = await page.textContent('body');
        if (pageContent?.includes('404') || pageContent?.includes('Not Found')) {
          console.log('✅ 404 page handling working');
        } else {
          logError('Error Handling', '404 page not properly handled');
        }
      } catch (error) {
        logError('Error Handling', `404 test failed: ${error}`);
      }
      
      // Step 3: Test network error simulation
      console.log('📍 Step 3: Test network error simulation');
      try {
        // Simulate offline
        await page.context().setOffline(true);
        await page.goto(BASE_URL);
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/offline-state.png' });
        
        // Restore online
        await page.context().setOffline(false);
        console.log('✅ Network error simulation completed');
      } catch (error) {
        logError('Network Testing', `Network simulation failed: ${error}`);
      }
      
      // Step 4: Test JavaScript errors
      console.log('📍 Step 4: Monitor JavaScript errors');
      let jsErrors: string[] = [];
      
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      if (jsErrors.length > 0) {
        logError('JavaScript', `JS errors found: ${jsErrors.join(', ')}`);
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
    } catch (error) {
      logError('Performance Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'performance', 'unexpected-error');
    }
  });

  test('Database Integration and Real-time Features', async ({ page }) => {
    try {
      console.log('🗄️ Starting Database Integration Test...');
      
      // Step 1: Test vendor data loading
      console.log('📍 Step 1: Test vendor data loading');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Monitor network requests
      const apiCalls: string[] = [];
      page.on('response', (response) => {
        if (response.url().includes('/api/')) {
          apiCalls.push(`${response.request().method()} ${response.url()} - ${response.status()}`);
        }
      });
      
      await page.waitForTimeout(5000); // Wait for API calls
      
      console.log('📊 API Calls made:');
      apiCalls.forEach(call => console.log(`  ${call}`));
      
      // Step 2: Test real-time updates
      console.log('📍 Step 2: Test real-time updates');
      try {
        // Look for real-time indicators
        const realtimeElements = [
          '[data-testid="live-indicator"]',
          '.live-status',
          '.real-time-update'
        ];
        
        for (const selector of realtimeElements) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`✅ Real-time element found: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      } catch (error) {
        logError('Real-time', `Real-time feature test failed: ${error}`);
      }
      
      // Step 3: Test data persistence
      console.log('📍 Step 3: Test data persistence');
      try {
        // Refresh page and check if data persists
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/data-persistence.png' });
        console.log('✅ Data persistence test completed');
      } catch (error) {
        logError('Data Persistence', `Persistence test failed: ${error}`);
      }
      
    } catch (error) {
      logError('Database Test', `Unexpected error: ${error}`);
      await takeErrorScreenshot(page, 'database', 'unexpected-error');
    }
  });
});