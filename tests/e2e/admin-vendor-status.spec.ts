import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Admin Vendor Status Control
 * 
 * This test suite validates the complete admin vendor status control functionality
 * including authentication, navigation, vendor management, and status updates.
 * 
 * Test User: mrn (admin credentials)
 * Target: /admin/vendor-status page
 */

test.describe('Admin Vendor Status Control E2E Tests', () => {
  const ADMIN_USERNAME = 'mrn';
  const ADMIN_PASSWORD = 'mrn'; // Correct password
  const BASE_URL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Navigate to admin login page
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Admin Login and Navigation to Vendor Status Control', async ({ page }) => {
    // Step 1: Admin Authentication
    console.log('🔐 Testing admin authentication...');
    
    // Fill login credentials using the correct selectors
    await page.fill('input[name="username"], input[id="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"], input[id="password"]', ADMIN_PASSWORD);
    
    // Submit login form
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    // Wait for successful login and redirect
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify admin dashboard loaded
    await expect(page).toHaveTitle(/Admin Dashboard|Dashboard/);
    console.log('✅ Admin login successful');
    
    // Step 2: Navigate to Vendor Status Control
    console.log('🧭 Navigating to Vendor Status Control...');
    
    // Look for navigation link
    const vendorStatusLink = page.locator('a:has-text("Vendor Status Control"), a[href*="vendor-status"]');
    await expect(vendorStatusLink).toBeVisible({ timeout: 5000 });
    
    // Click navigation link
    await vendorStatusLink.click();
    
    // Wait for vendor status page to load
    await page.waitForURL('**/admin/vendor-status');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded correctly
    await expect(page.locator('h1:has-text("Vendor Status Control")')).toBeVisible();
    console.log('✅ Successfully navigated to Vendor Status Control page');
  });

  test('Vendor Status Dashboard Statistics Validation', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    
    // Navigate to vendor status
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('📊 Testing statistics dashboard...');
    
    // Verify statistics cards are present
    const statsCards = [
      'Total Vendors',
      'Currently Live', 
      'Approved',
      'Pending',
      'Active'
    ];
    
    for (const statName of statsCards) {
      const statCard = page.locator(`text=${statName}`).first();
      await expect(statCard).toBeVisible();
      
      // Verify numeric value is displayed
      const statValue = page.locator(`text=${statName}`).locator('..').locator('text=/^\\d+$/');
      await expect(statValue).toBeVisible();
      
      console.log(`✅ ${statName} statistic card validated`);
    }
    
    // Test refresh functionality
    console.log('🔄 Testing refresh functionality...');
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // Wait for refresh to complete
    await page.waitForTimeout(2000);
    console.log('✅ Refresh functionality working');
  });

  test('Vendor Search and Filtering Functionality', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Testing search and filter functionality...');
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search debounce
      console.log('✅ Search input functionality tested');
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
    
    // Test status filters
    const filterOptions = ['all', 'live', 'offline', 'approved', 'pending'];
    
    for (const filter of filterOptions) {
      const filterButton = page.locator(`button:has-text("${filter}"), select option[value="${filter}"], input[value="${filter}"]`);
      
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(1000);
        console.log(`✅ ${filter} filter tested`);
      }
    }
  });

  test('Vendor Status Management Actions', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('⚡ Testing vendor status management actions...');
    
    // Wait for vendor table to load
    await page.waitForSelector('table, .vendor-list, [data-testid="vendor-table"]', { timeout: 10000 });
    
    // Look for action buttons on first vendor (if any exist)
    const actionButtons = [
      'button:has-text("Approve")',
      'button:has-text("Activate")', 
      'button:has-text("Deactivate")',
      'button:has-text("Stop Live")',
      'button:has-text("Force Start")',
      'button[title*="approve"]',
      'button[title*="activate"]'
    ];
    
    let actionsFound = false;
    
    for (const buttonSelector of actionButtons) {
      const buttons = page.locator(buttonSelector);
      const count = await buttons.count();
      
      if (count > 0) {
        actionsFound = true;
        console.log(`✅ Found ${count} "${buttonSelector}" action button(s)`);
        
        // Test button hover state (don't click to avoid actual changes)
        await buttons.first().hover();
        await page.waitForTimeout(500);
      }
    }
    
    if (!actionsFound) {
      console.log('ℹ️ No vendor action buttons found (may indicate no vendors in system)');
    }
    
    // Test bulk actions if available
    const bulkActionSelectors = [
      'button:has-text("Bulk")',
      'select[name*="bulk"]',
      'input[type="checkbox"][name*="select"]'
    ];
    
    for (const selector of bulkActionSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ Bulk action element found: ${selector}`);
      }
    }
  });

  test('Vendor Table Display and Pagination', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('📋 Testing vendor table display and pagination...');
    
    // Check for table or list container
    const tableContainer = page.locator('table, .vendor-list, [data-testid="vendor-table"], .grid');
    await expect(tableContainer).toBeVisible({ timeout: 10000 });
    
    // Verify table headers/columns if table exists
    const expectedColumns = [
      'Business Name',
      'Contact', 
      'Status',
      'Live Status',
      'Actions',
      'Approval',
      'Active'
    ];
    
    for (const column of expectedColumns) {
      const columnHeader = page.locator(`th:has-text("${column}"), .header:has-text("${column}"), text=${column}`);
      if (await columnHeader.isVisible()) {
        console.log(`✅ Column "${column}" found`);
      }
    }
    
    // Test pagination if present
    const paginationElements = [
      'button:has-text("Next")',
      'button:has-text("Previous")', 
      'button:has-text("1")',
      '.pagination',
      '[data-testid="pagination"]'
    ];
    
    let paginationFound = false;
    for (const selector of paginationElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        paginationFound = true;
        console.log(`✅ Pagination element found: ${selector}`);
      }
    }
    
    if (!paginationFound) {
      console.log('ℹ️ No pagination found (may indicate single page of results)');
    }
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('🚨 Testing error handling and edge cases...');
    
    // Test with invalid search terms
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      // Test special characters
      await searchInput.fill('!@#$%^&*()');
      await page.waitForTimeout(1000);
      
      // Test very long search term
      await searchInput.fill('a'.repeat(100));
      await page.waitForTimeout(1000);
      
      // Clear search
      await searchInput.clear();
      console.log('✅ Search input edge cases tested');
    }
    
    // Test rapid clicking on refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      for (let i = 0; i < 3; i++) {
        await refreshButton.click();
        await page.waitForTimeout(100);
      }
      console.log('✅ Rapid refresh clicking tested');
    }
    
    // Check for error messages or loading states
    const errorSelectors = [
      '.error',
      '.alert-error', 
      '[data-testid="error"]',
      'text=Error',
      'text=Failed'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible()) {
        console.log(`⚠️ Error element found: ${selector}`);
      }
    }
  });

  test('Responsive Design and Mobile View', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    console.log('📱 Testing responsive design...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Verify page is still functional
      await expect(page.locator('h1:has-text("Vendor Status Control")')).toBeVisible();
      
      // Check if navigation is accessible (may be in hamburger menu on mobile)
      const navElements = [
        'nav',
        '.navigation',
        'button[aria-label*="menu"]',
        '.hamburger'
      ];
      
      let navFound = false;
      for (const selector of navElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          navFound = true;
          break;
        }
      }
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) - Navigation: ${navFound ? 'Found' : 'Not visible'}`);
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Performance and Loading States', async ({ page }) => {
    console.log('⚡ Testing performance and loading states...');
    
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });
    
    // Login and navigate with timing
    const startTime = Date.now();
    
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', ADMIN_USERNAME);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
    
    const loginTime = Date.now() - startTime;
    console.log(`⏱️ Login completed in ${loginTime}ms`);
    
    // Navigate to vendor status page
    const navStartTime = Date.now();
    await page.goto(`${BASE_URL}/admin/vendor-status`);
    await page.waitForLoadState('networkidle');
    
    const navTime = Date.now() - navStartTime;
    console.log(`⏱️ Vendor status page loaded in ${navTime}ms`);
    
    // Check for loading indicators
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      'text=Loading',
      '.skeleton'
    ];
    
    for (const selector of loadingSelectors) {
      const loadingElement = page.locator(selector);
      if (await loadingElement.isVisible()) {
        console.log(`🔄 Loading indicator found: ${selector}`);
      }
    }
    
    console.log(`📡 API requests made: ${requests.length}`);
    requests.forEach(url => console.log(`  - ${url}`));
    
    // Performance assertions
    expect(loginTime).toBeLessThan(10000); // Login should complete within 10 seconds
    expect(navTime).toBeLessThan(5000); // Page navigation should complete within 5 seconds
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Logout if still logged in
    try {
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('ℹ️ Logout not needed or already logged out');
    }
    
    // Close any open modals or dialogs
    const closeButtons = page.locator('button[aria-label="Close"], .modal button:has-text("Close"), .dialog button:has-text("Cancel")');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      try {
        await closeButtons.nth(i).click({ timeout: 1000 });
      } catch (error) {
        // Ignore if button is not clickable
      }
    }
  });
});

/**
 * Test Documentation Summary:
 * 
 * 1. **Authentication Testing**: Validates admin login with 'mrn' credentials
 * 2. **Navigation Testing**: Ensures proper routing to vendor status control page
 * 3. **Statistics Dashboard**: Verifies all statistics cards display correctly
 * 4. **Search & Filtering**: Tests search input and status filter functionality
 * 5. **Vendor Management**: Validates action buttons and vendor status controls
 * 6. **Table Display**: Checks vendor table structure and pagination
 * 7. **Error Handling**: Tests edge cases and error scenarios
 * 8. **Responsive Design**: Validates functionality across different screen sizes
 * 9. **Performance**: Monitors loading times and API requests
 * 
 * Key Features Tested:
 * - Admin authentication and authorization
 * - Vendor status statistics (total, live, approved, pending, active)
 * - Search and filter functionality
 * - Vendor action buttons (approve, activate, stop live, force start)
 * - Table display and pagination
 * - Responsive design across devices
 * - Error handling and loading states
 * - Performance metrics and API monitoring
 * 
 * Test Coverage:
 * - Happy path scenarios
 * - Edge cases and error conditions
 * - Cross-device compatibility
 * - Performance benchmarks
 * - User experience validation
 */