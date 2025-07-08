import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check if admin login elements are present
    await expect(page.locator('text=Admin Login')).toBeVisible();
    await expect(page.locator('text=Access the AQUI administration panel')).toBeVisible();
    await expect(page.locator('input[placeholder*="Username"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    
    // Check security warning
    await expect(page.locator('text=This is a secure admin area')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try to submit empty form
    await page.click('button:has-text("Sign in")');
    
    // Wait a moment for any validation to appear
    await page.waitForTimeout(1000);
    
    // Check if form is still visible (indicating validation prevented submission)
    await expect(page.locator('text=Admin Login')).toBeVisible();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Fill in invalid credentials
    await page.fill('input[placeholder*="Username"], input[name="username"]', 'invalid_user');
    await page.fill('input[type="password"]', 'invalid_password');
    
    // Submit form
    await page.click('button:has-text("Sign in")');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should still be on login page or show error
    await expect(page.locator('text=Admin Login')).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check if form inputs have proper labels or placeholders
    const usernameInput = page.locator('input[placeholder*="Username"], input[name="username"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check if inputs are focusable
    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();
    
    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/login');
    
    // Check if admin login is still functional on mobile
    await expect(page.locator('text=Admin Login')).toBeVisible();
    await expect(page.locator('input[placeholder*="Username"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should redirect unauthorized access to admin routes', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('/admin/dashboard');
    
    // Should redirect to login or show unauthorized message
    await page.waitForTimeout(2000);
    
    // Check if redirected to login or shows proper error
    const currentUrl = page.url();
    const hasLogin = await page.locator('text=Admin Login').isVisible().catch(() => false);
    const hasUnauthorized = await page.locator('text=Unauthorized').isVisible().catch(() => false);
    
    expect(currentUrl.includes('/admin/login') || hasLogin || hasUnauthorized).toBeTruthy();
  });
});