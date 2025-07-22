import { test, expect } from '@playwright/test'

/**
 * Integration Tests for Vendor Onboarding Flow
 * 
 * These tests cover the complete vendor onboarding process including:
 * - Form submission to dashboard access
 * - Role switching and session updates
 * - Middleware route protection behavior
 */

test.describe('Vendor Onboarding Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/')
    
    // Clear any existing sessions
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Clear cookies
    await page.context().clearCookies()
  })

  test('should complete vendor onboarding flow from form submission to dashboard access', async ({ page }) => {
    // Step 1: Navigate to vendor onboarding page
    await page.goto('/vendor/onboarding')
    
    // Should be redirected to login if not authenticated
    // For this test, we'll assume we have a test user authentication mechanism
    // In a real scenario, you'd implement proper test authentication
    
    // Step 2: Fill out vendor onboarding form
    await page.fill('[name="business_name"]', 'Test Integration Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'integration-test@example.com')
    await page.fill('[name="description"]', 'A test business for integration testing')
    await page.fill('[name="phone"]', '+1234567890')
    await page.fill('[name="address"]', '123 Test Street, Test City, TC 12345')
    
    // Step 3: Submit the form
    await page.click('button[type="submit"]')
    
    // Step 4: Verify successful submission
    // Should show success message or redirect to dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Step 5: Verify dashboard loads correctly
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
    
    // Step 6: Verify vendor information is displayed
    await expect(page.locator('text=Test Integration Business')).toBeVisible()
  })

  test('should handle unique constraint violations with proper error messages', async ({ page }) => {
    // This test assumes there's already a vendor with these details
    await page.goto('/vendor/onboarding')
    
    // Fill form with duplicate business name
    await page.fill('[name="business_name"]', 'Existing Business Name')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'unique-email@example.com')
    
    await page.click('button[type="submit"]')
    
    // Should show error message for duplicate business name
    await expect(page.locator('.error-message')).toContainText('Vendor name already taken')
    
    // Try with duplicate email
    await page.fill('[name="business_name"]', 'Unique Business Name')
    await page.fill('[name="contact_email"]', 'existing-email@example.com')
    
    await page.click('button[type="submit"]')
    
    // Should show error message for duplicate email
    await expect(page.locator('.error-message')).toContainText('Email already registered')
  })

  test('should handle role switching and session updates', async ({ page }) => {
    // Assume user is logged in and has completed vendor onboarding
    await page.goto('/vendor/dashboard')
    
    // Verify we're on vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Check navigation shows vendor options
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Switch to Customer')).toBeVisible()
    
    // Switch to customer role
    await page.click('text=Switch to Customer')
    
    // Verify role switch worked
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Vendor Dashboard')).toBeVisible()
    
    // Switch back to vendor role
    await page.click('text=Vendor Dashboard')
    
    // Should be redirected to vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('should enforce middleware route protection', async ({ page }) => {
    // Test 1: Non-vendor accessing vendor dashboard should redirect to onboarding
    await page.goto('/vendor/dashboard')
    
    // Should redirect to onboarding if not a vendor
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Test 2: Complete onboarding process
    await page.fill('[name="business_name"]', 'Route Protection Test Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'route-test@example.com')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after successful onboarding
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Test 3: Vendor accessing onboarding page should redirect to dashboard
    await page.goto('/vendor/onboarding')
    
    // Should redirect to dashboard since user is already a vendor
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('should update navigation UI immediately after vendor creation', async ({ page }) => {
    // Start as non-vendor user
    await page.goto('/')
    
    // Check navigation shows "Become a Vendor"
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Become a Vendor')).toBeVisible()
    
    // Go through vendor onboarding
    await page.click('text=Become a Vendor')
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Fill and submit form
    await page.fill('[name="business_name"]', 'Navigation Test Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'nav-test@example.com')
    
    await page.click('button[type="submit"]')
    
    // After successful creation, navigation should update
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Vendor Dashboard')).toBeVisible()
    await expect(page.locator('text=Switch to Customer')).toBeVisible()
    
    // "Become a Vendor" should no longer be visible
    await expect(page.locator('text=Become a Vendor')).not.toBeVisible()
  })

  test('should handle vendor approval workflow when enabled', async ({ page }) => {
    // This test assumes admin has enabled vendor approval requirement
    
    await page.goto('/vendor/onboarding')
    
    // Fill and submit vendor application
    await page.fill('[name="business_name"]', 'Approval Test Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'approval-test@example.com')
    
    await page.click('button[type="submit"]')
    
    // Should show pending approval message
    await expect(page.locator('.success-message')).toContainText('pending approval')
    
    // Should still redirect to dashboard but show pending status
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Dashboard should indicate pending status
    await expect(page.locator('.vendor-status')).toContainText('Pending')
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('.error-message')).toContainText('Business name and type are required')
    
    // Fill business name but leave type empty
    await page.fill('[name="business_name"]', 'Test Business')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.error-message')).toContainText('Business name and type are required')
    
    // Fill type but use invalid email
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.error-message')).toContainText('valid email address')
    
    // Use business name that's too short
    await page.fill('[name="business_name"]', 'A')
    await page.fill('[name="contact_email"]', 'valid@example.com')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.error-message')).toContainText('at least 2 characters')
  })

  test('should maintain session state across page refreshes', async ({ page }) => {
    // Complete vendor onboarding
    await page.goto('/vendor/onboarding')
    
    await page.fill('[name="business_name"]', 'Session Test Business')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'session-test@example.com')
    
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Refresh the page
    await page.reload()
    
    // Should still be on dashboard and show vendor info
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
    
    // Navigation should still show vendor options
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Switch to Customer')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    
    // Intercept API call and make it fail
    await page.route('/api/user/become-vendor', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Fill and submit form
    await page.fill('[name="business_name"]', 'Network Error Test')
    await page.selectOption('[name="business_type"]', 'Food & Beverage')
    await page.fill('[name="contact_email"]', 'network-test@example.com')
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('.error-message')).toContainText('Internal server error')
    
    // Should remain on onboarding page
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
  })
})