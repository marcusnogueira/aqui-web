import { test, expect } from '@playwright/test'

/**
 * Integration Tests for Vendor Onboarding Redirect Fix
 * 
 * These tests verify that the redirect fix works correctly in a real browser environment
 * and that users are properly redirected to the dashboard after vendor creation.
 */

test.describe('Vendor Onboarding Redirect Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/')
    
    // Clear any existing sessions
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should redirect to vendor dashboard after successful onboarding', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Sign up as a new user
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-vendor-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    // Wait for authentication to complete
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Navigate to vendor onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill out the vendor onboarding form
    await page.fill('[name="business_name"]', 'Test Integration Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="description"]', 'A test business for integration testing')
    await page.fill('[name="phone"]', '555-0123')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for the redirect to happen
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    
    // Verify we're on the dashboard page
    expect(page.url()).toContain('/vendor/dashboard')
    
    // Verify the dashboard loads with vendor data
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
    await expect(page.locator('[data-testid="business-name"]')).toContainText('Test Integration Business')
  })

  test('should NOT redirect to confirmation page anymore', async ({ page }) => {
    // Set up a page listener to catch any navigation to confirmation page
    const navigationPromises: Promise<any>[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url()
        if (url.includes('/vendor/onboarding/confirmation')) {
          throw new Error(`Unexpected navigation to confirmation page: ${url}`)
        }
      }
    })
    
    // Navigate and sign up
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-no-confirm-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill and submit form
    await page.fill('[name="business_name"]', 'No Confirmation Test')
    await page.selectOption('[name="business_type"]', 'Arts & Crafts')
    await page.click('button[type="submit"]')
    
    // Should go directly to dashboard, not confirmation
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/vendor/dashboard')
    expect(page.url()).not.toContain('/vendor/onboarding/confirmation')
  })

  test('should handle vendor creation errors gracefully', async ({ page }) => {
    // Navigate and sign up
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-error-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Try to create a vendor with a duplicate business name (if one exists)
    await page.fill('[name="business_name"]', 'Duplicate Business Name')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // If there's an error, we should stay on the onboarding page
    // and see an error message
    await page.waitForTimeout(3000) // Give time for any potential redirect
    
    // Should still be on onboarding page if there was an error
    if (page.url().includes('/vendor/onboarding') && !page.url().includes('/vendor/dashboard')) {
      // Look for error message
      const errorMessage = page.locator('.text-red-800, .bg-red-50, [data-testid="error-message"]')
      await expect(errorMessage).toBeVisible()
    }
  })

  test('should maintain session data after redirect', async ({ page }) => {
    // Navigate and sign up
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    const testEmail = `test-session-${Date.now()}@example.com`
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill out form
    await page.fill('[name="business_name"]', 'Session Test Business')
    await page.selectOption('[name="business_type"]', 'Mobile Services')
    await page.fill('[name="description"]', 'Testing session persistence')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    
    // Verify session data is maintained
    const userEmail = await page.locator('[data-testid="user-email"]').textContent()
    expect(userEmail).toContain(testEmail)
    
    // Verify vendor role is active
    const roleIndicator = page.locator('[data-testid="active-role"]')
    await expect(roleIndicator).toContainText('vendor')
    
    // Verify we can access vendor-specific features
    await expect(page.locator('[data-testid="vendor-controls"]')).toBeVisible()
  })

  test('should work with address and location data', async ({ page }) => {
    // Navigate and sign up
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-location-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill out form with location
    await page.fill('[name="business_name"]', 'Location Test Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="description"]', 'Testing with location data')
    
    // Fill address (this might trigger Google Places autocomplete)
    await page.fill('[data-testid="address-input"]', '123 Test Street, San Francisco, CA')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    
    // Verify we're on dashboard
    expect(page.url()).toContain('/vendor/dashboard')
    
    // Verify location data was saved (if displayed on dashboard)
    const locationInfo = page.locator('[data-testid="vendor-location"]')
    if (await locationInfo.isVisible()) {
      await expect(locationInfo).toContainText('123 Test Street')
    }
  })

  test('should handle pending approval status correctly', async ({ page }) => {
    // This test assumes the platform might have approval requirements
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-pending-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill out form
    await page.fill('[name="business_name"]', 'Pending Approval Test')
    await page.selectOption('[name="business_type"]', 'Other')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should still redirect to dashboard even if pending approval
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/vendor/dashboard')
    
    // Dashboard should show appropriate status
    const statusIndicator = page.locator('[data-testid="vendor-status"]')
    if (await statusIndicator.isVisible()) {
      const statusText = await statusIndicator.textContent()
      expect(statusText).toMatch(/(approved|pending|active)/i)
    }
  })

  test('should preserve form data during submission', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', `test-preserve-${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="signup-button"]')
    
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
    
    // Go to onboarding
    await page.goto('/vendor/onboarding')
    
    // Fill out comprehensive form data
    const businessName = 'Comprehensive Test Business'
    const businessType = 'Beauty & Wellness'
    const description = 'A comprehensive test of form data preservation'
    const phone = '555-9876'
    
    await page.fill('[name="business_name"]', businessName)
    await page.selectOption('[name="business_type"]', businessType)
    await page.fill('[name="description"]', description)
    await page.fill('[name="phone"]', phone)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL('**/vendor/dashboard', { timeout: 15000 })
    
    // Verify the data was preserved and is displayed on dashboard
    await expect(page.locator('[data-testid="business-name"]')).toContainText(businessName)
    
    // Check if other data is displayed (depending on dashboard implementation)
    const businessTypeDisplay = page.locator('[data-testid="business-type"]')
    if (await businessTypeDisplay.isVisible()) {
      await expect(businessTypeDisplay).toContainText(businessType)
    }
  })
})