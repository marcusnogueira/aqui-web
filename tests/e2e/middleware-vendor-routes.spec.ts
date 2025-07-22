import { test, expect } from '@playwright/test';

test.describe('Middleware Vendor Route Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/');
  });

  test('should redirect unauthenticated users from vendor routes to homepage', async ({ page }) => {
    // Test vendor onboarding route - should redirect to homepage
    const onboardingResponse = await page.goto('/vendor/onboarding');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');

    // Test vendor dashboard route - should redirect to homepage
    const dashboardResponse = await page.goto('/vendor/dashboard');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('should allow public access to vendor profile pages', async ({ page }) => {
    // Test that public vendor profile pages are accessible without authentication
    // This tests the "other vendor routes" logic in middleware
    
    // Try to access a vendor profile page
    const response = await page.goto('/vendor/test-vendor-id', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // The middleware should allow this route through
    // It may show a 404 or the actual page, but should not redirect to homepage
    const finalUrl = page.url();
    
    // Check that we didn't get redirected to homepage
    expect(finalUrl).not.toBe('http://localhost:3000/');
    
    // The URL should still contain the vendor ID path
    expect(finalUrl).toContain('/vendor/test-vendor-id');
  });

  test('should handle middleware redirects correctly', async ({ page }) => {
    // Test that middleware redirects work by checking response status and final URL
    
    // Test unauthenticated access to onboarding
    const response = await page.goto('/vendor/onboarding', { waitUntil: 'networkidle' });
    
    // Should end up on homepage due to middleware redirect
    await expect(page).toHaveURL('/');
    
    // The response might be a redirect (3xx) or the final page (200)
    // Both are acceptable as long as we end up on the right page
    expect([200, 301, 302, 307, 308]).toContain(response?.status() || 200);
  });

  test('should preserve middleware behavior for different route patterns', async ({ page }) => {
    // Test various vendor route patterns to ensure middleware handles them correctly
    
    const routes = [
      '/vendor/onboarding',
      '/vendor/dashboard', 
      '/vendor/overview',
      '/vendor/some-vendor-id'
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      if (route === '/vendor/onboarding' || route === '/vendor/dashboard' || route === '/vendor/overview') {
        // These should redirect to homepage for unauthenticated users
        await expect(page).toHaveURL('/');
      } else {
        // Other vendor routes (like vendor profiles) should be allowed through (may show 404 but not redirect)
        expect(page.url()).not.toBe('http://localhost:3000/');
      }
    }
  });

  test('should handle edge cases and malformed routes', async ({ page }) => {
    // Test edge cases in vendor route handling with shorter timeout
    
    const edgeCases = [
      '/vendor/',           // Trailing slash
      '/vendor',            // No trailing slash
      '/vendor/onboarding/', // Trailing slash on onboarding
      '/vendor/dashboard/'   // Trailing slash on dashboard
    ];

    for (const route of edgeCases) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // For routes that should be protected, ensure they redirect
      if (route.includes('onboarding') || route.includes('dashboard')) {
        await expect(page).toHaveURL('/');
      }
      
      // For other routes, ensure they don't cause errors
      const url = page.url();
      expect(url).toBeDefined();
    }
  });

  test('should maintain consistent behavior across multiple requests', async ({ page }) => {
    // Test that middleware behavior is consistent across multiple requests
    
    // Make multiple requests to the same protected route with shorter timeout
    for (let i = 0; i < 2; i++) {
      await page.goto('/vendor/onboarding', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await expect(page).toHaveURL('/');
      
      await page.goto('/vendor/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle concurrent requests to vendor routes', async ({ page, context }) => {
    // Test middleware behavior with concurrent requests
    
    // Create multiple pages to simulate concurrent requests
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    try {
      // Make concurrent requests to different vendor routes with shorter timeout
      const promises = [
        page.goto('/vendor/onboarding', { waitUntil: 'domcontentloaded', timeout: 10000 }),
        page2.goto('/vendor/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 }),
        page3.goto('/vendor/some-id', { waitUntil: 'domcontentloaded', timeout: 10000 })
      ];
      
      await Promise.all(promises);
      
      // Check that each page ended up in the correct location
      await expect(page).toHaveURL('/');   // onboarding -> homepage
      await expect(page2).toHaveURL('/');  // dashboard -> homepage
      expect(page3.url()).toContain('/vendor/some-id'); // profile -> stays
      
    } finally {
      await page2.close();
      await page3.close();
    }
  });
});