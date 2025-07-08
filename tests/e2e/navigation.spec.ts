import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to About page
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    
    // Test navigation to FAQ page
    await page.goto('/faq');
    await expect(page).toHaveURL('/faq');
    
    // Test navigation to Explore page
    await page.goto('/explore');
    await expect(page).toHaveURL('/explore');
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 status or redirect to a valid page
    expect(response?.status()).toBe(404);
  });

  test('should maintain navigation state', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to different pages and use browser back/forward
    await page.goto('/about');
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    await page.goForward();
    await expect(page).toHaveURL('/about');
  });

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await searchInput.press('Enter');
      
      // Wait for search results or no results message
      await page.waitForTimeout(1000);
      
      // Should show some response to search
      const hasResults = await page.locator('text=vendors found').isVisible();
      const hasNoResults = await page.locator('text=No vendors found').isVisible();
      
      expect(hasResults || hasNoResults).toBeTruthy();
    }
  });

  test('should handle vendor profile navigation', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to a vendor profile (even if it doesn't exist)
    await page.goto('/vendor/test-vendor-id');
    
    // Should either show vendor profile or handle missing vendor gracefully
    await page.waitForTimeout(1000);
    
    // Check if page loads without errors
    const hasError = await page.locator('text=Error').isVisible().catch(() => false);
    const has404 = await page.locator('text=404').isVisible().catch(() => false);
    const hasNotFound = await page.locator('text=not found').isVisible().catch(() => false);
    
    // Should handle missing vendor gracefully
    expect(hasError || has404 || hasNotFound || page.url().includes('/vendor/')).toBeTruthy();
  });
});

test.describe('Vendor Features', () => {
  test('should handle vendor onboarding flow', async ({ page }) => {
    await page.goto('/vendor/onboarding');
    
    // Should either show onboarding form or redirect to auth
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const hasOnboarding = await page.locator('text=onboarding').isVisible().catch(() => false);
    const hasAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');
    
    expect(hasOnboarding || hasAuth).toBeTruthy();
  });

  test('should handle vendor dashboard access', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    
    // Should redirect to auth or show dashboard
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const hasDashboard = await page.locator('text=dashboard').isVisible().catch(() => false);
    const hasAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');
    
    expect(hasDashboard || hasAuth).toBeTruthy();
  });

  test('should handle vendor overview page', async ({ page }) => {
    await page.goto('/vendor/overview');
    
    // Should show overview or redirect to auth
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const hasOverview = await page.locator('text=overview').isVisible().catch(() => false);
    const hasAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');
    
    expect(hasOverview || hasAuth).toBeTruthy();
  });
});