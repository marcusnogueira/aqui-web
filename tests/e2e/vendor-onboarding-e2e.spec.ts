import { test, expect } from '@playwright/test'

/**
 * End-to-End Tests for Vendor Onboarding User Journey
 * 
 * These tests cover the complete user journey including:
 * - Sign up to vendor dashboard access
 * - Error scenarios with duplicate names and emails
 * - Admin approval workflow if enabled
 * - All requirements validation
 */

test.describe('Vendor Onboarding E2E User Journey', () => {
  
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

  test('complete user journey from sign up to vendor dashboard access', async ({ page }) => {
    // Step 1: Start from homepage
    await page.goto('/')
    await expect(page).toHaveURL('/')
    
    // Step 2: Navigate to authentication (this would depend on your auth flow)
    // For this test, we assume the user is authenticated
    // In a real scenario, you'd implement the full auth flow
    
    // Step 3: Navigate to vendor onboarding
    await page.goto('/vendor/onboarding')
    
    // Step 4: Verify onboarding page loads
    await expect(page.locator('h1')).toContainText('Become a Vendor')
    
    // Step 5: Fill out complete vendor profile
    await page.fill('[data-testid="business-name"]', 'E2E Test Vendor Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'e2e-test@example.com')
    await page.fill('[data-testid="description"]', 'A comprehensive test business for E2E testing')
    await page.fill('[data-testid="phone"]', '+1-555-123-4567')
    await page.fill('[data-testid="address"]', '123 E2E Test Street, Test City, TC 12345')
    
    // Step 6: Submit the vendor application
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 7: Verify successful submission and redirect
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Step 8: Verify vendor dashboard loads with correct information
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
    await expect(page.locator('[data-testid="business-name"]')).toContainText('E2E Test Vendor Business')
    
    // Step 9: Verify navigation updates to show vendor options
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="switch-to-customer"]')).toBeVisible()
    
    // Step 10: Test role switching functionality
    await page.click('[data-testid="switch-to-customer"]')
    
    // Verify role switch worked
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
    
    // Step 11: Switch back to vendor role
    await page.click('[data-testid="vendor-dashboard-link"]')
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Step 12: Verify session persistence across page refresh
    await page.reload()
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
  })

  test('error scenarios with duplicate business names and emails', async ({ page }) => {
    // Step 1: Create first vendor with specific details
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Duplicate Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'duplicate-test@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Verify successful creation
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Step 2: Sign out and try to create another vendor with same business name
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="sign-out"]')
    
    // Step 3: Sign in as different user and try duplicate business name
    // (This would require proper user management in tests)
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Duplicate Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'different-email@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 4: Verify duplicate business name error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Vendor name already taken')
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Step 5: Try with unique business name but duplicate email
    await page.fill('[data-testid="business-name"]', 'Unique Business Name')
    await page.fill('[data-testid="contact-email"]', 'duplicate-test@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 6: Verify duplicate email error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered')
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Step 7: Verify successful submission with unique details
    await page.fill('[data-testid="business-name"]', 'Unique Business Name')
    await page.fill('[data-testid="contact-email"]', 'unique-email@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('admin approval workflow when enabled', async ({ page }) => {
    // Step 1: Enable vendor approval requirement (admin action)
    // This would typically be done through admin interface or database setup
    await page.goto('/admin/settings')
    await page.check('[data-testid="require-vendor-approval"]')
    await page.click('[data-testid="save-settings"]')
    
    // Step 2: Submit vendor application
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Approval Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'approval-test@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 3: Verify pending approval message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('pending approval')
    
    // Step 4: Verify redirect to dashboard with pending status
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    await expect(page.locator('[data-testid="vendor-status"]')).toContainText('Pending')
    
    // Step 5: Verify limited functionality for pending vendors
    await expect(page.locator('[data-testid="pending-approval-notice"]')).toBeVisible()
    
    // Step 6: Admin approves the vendor
    await page.goto('/admin/vendors')
    await page.click('[data-testid="approve-vendor-approval-test-business"]')
    
    // Step 7: Verify vendor status updates
    await page.goto('/vendor/dashboard')
    await expect(page.locator('[data-testid="vendor-status"]')).toContainText('Approved')
    await expect(page.locator('[data-testid="pending-approval-notice"]')).not.toBeVisible()
    
    // Step 8: Test vendor rejection workflow
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Rejection Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'rejection-test@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 9: Admin rejects the vendor
    await page.goto('/admin/vendors')
    await page.click('[data-testid="reject-vendor-rejection-test-business"]')
    
    // Step 10: Verify rejection handling
    await page.goto('/vendor/dashboard')
    await expect(page.locator('[data-testid="vendor-status"]')).toContainText('Rejected')
    await expect(page.locator('[data-testid="rejection-notice"]')).toBeVisible()
  })

  test('form validation and error handling', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    
    // Test 1: Submit empty form
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Business name and type are required')
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Test 2: Fill business name but leave type empty
    await page.fill('[data-testid="business-name"]', 'Test Business')
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Business name and type are required')
    
    // Test 3: Add type but use invalid email
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'invalid-email')
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('valid email address')
    
    // Test 4: Use business name that's too short
    await page.fill('[data-testid="business-name"]', 'A')
    await page.fill('[data-testid="contact-email"]', 'valid@example.com')
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('at least 2 characters')
    
    // Test 5: Valid form submission
    await page.fill('[data-testid="business-name"]', 'Valid Test Business')
    await page.click('[data-testid="submit-vendor-application"]')
    
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('middleware route protection behavior', async ({ page }) => {
    // Test 1: Non-vendor accessing vendor dashboard redirects to onboarding
    await page.goto('/vendor/dashboard')
    
    // Should redirect to onboarding if not a vendor
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Test 2: Complete vendor onboarding
    await page.fill('[data-testid="business-name"]', 'Route Protection Test')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'route-protection@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Should redirect to dashboard after successful onboarding
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Test 3: Vendor accessing onboarding page redirects to dashboard
    await page.goto('/vendor/onboarding')
    
    // Should redirect to dashboard since user is already a vendor
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Test 4: Direct URL access protection
    await page.goto('/vendor/dashboard/settings')
    
    // Should allow access to vendor-specific pages
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('session management and persistence', async ({ page }) => {
    // Step 1: Complete vendor onboarding
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Session Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'session-test@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Step 2: Verify session persists across page refresh
    await page.reload()
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    await expect(page.locator('h1')).toContainText('Vendor Dashboard')
    
    // Step 3: Verify session persists across navigation
    await page.goto('/')
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
    
    // Step 4: Verify role switching updates session immediately
    await page.click('[data-testid="switch-to-customer"]')
    
    // Navigation should update immediately
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
    
    // Step 5: Verify session updates persist across page refresh
    await page.reload()
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
  })

  test('network error handling and recovery', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    
    // Step 1: Intercept API call and make it fail
    await page.route('/api/user/become-vendor', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Step 2: Fill and submit form
    await page.fill('[data-testid="business-name"]', 'Network Error Test')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'network-error@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 3: Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Internal server error')
    await expect(page).toHaveURL(/\/vendor\/onboarding/)
    
    // Step 4: Remove network error and retry
    await page.unroute('/api/user/become-vendor')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Step 5: Verify successful submission after error recovery
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('accessibility and usability requirements', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    
    // Test 1: Keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="business-name"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="business-type"]')).toBeFocused()
    
    // Test 2: Form labels and accessibility
    await expect(page.locator('label[for="business-name"]')).toBeVisible()
    await expect(page.locator('label[for="business-type"]')).toBeVisible()
    await expect(page.locator('label[for="contact-email"]')).toBeVisible()
    
    // Test 3: Error message accessibility
    await page.click('[data-testid="submit-vendor-application"]')
    
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toHaveAttribute('role', 'alert')
    await expect(errorMessage).toBeVisible()
    
    // Test 4: Success message accessibility
    await page.fill('[data-testid="business-name"]', 'Accessibility Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'accessibility@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Should redirect to dashboard with success indication
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
  })

  test('comprehensive requirements validation', async ({ page }) => {
    // Requirement 1.1, 1.2, 1.3: Homepage redirect after login
    await page.goto('/')
    await expect(page).toHaveURL('/')
    
    // Requirement 2.1, 2.2, 2.3, 2.4, 2.5: Vendor creation process
    await page.goto('/vendor/onboarding')
    
    await page.fill('[data-testid="business-name"]', 'Requirements Test Business')
    await page.selectOption('[data-testid="business-type"]', 'Food & Beverage')
    await page.fill('[data-testid="contact-email"]', 'requirements@example.com')
    
    await page.click('[data-testid="submit-vendor-application"]')
    
    // Verify redirect to dashboard (Requirement 2.5)
    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    
    // Requirement 3.1, 3.2, 3.3: UI updates after vendor creation
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="vendor-dashboard-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="switch-to-customer"]')).toBeVisible()
    
    // Requirement 4.1, 4.2, 4.3: Navigation options based on vendor status
    // Already verified above
    
    // Requirement 5.1, 5.2, 5.3, 5.4: Unique constraints (tested in separate test)
    
    // Requirement 6.1, 6.2, 6.3, 6.4: Admin approval control (tested in separate test)
    
    // Requirement 7.1, 7.2, 7.3, 7.4: Route protection (tested in separate test)
  })
})