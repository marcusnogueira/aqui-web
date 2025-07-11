import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main elements are present
    await expect(page.locator('text=Aqui')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Check if the vendor counters are present
    await expect(page.locator('text=Open')).toBeVisible();
    await expect(page.locator('text=Closing Soon')).toBeVisible();
  });

  test('should open sign in modal when clicking sign in', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.click('button:has-text("Sign In"), a:has-text("Sign In")');
    
    // Check if modal appears
    await expect(page.locator('text=Welcome to Aqui')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    
    // Check if modal is closed
    await expect(page.locator('text=Welcome to Aqui')).not.toBeVisible();
  });

  test('should display no vendors message when no data', async ({ page }) => {
    await page.goto('/');
    
    // Check for no vendors message
    await expect(page.locator('text=No vendors found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your search or filters')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if main elements are still visible on mobile
    await expect(page.locator('text=Aqui')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const title = await page.title();
    expect(title).toContain('Aqui');
    
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toContain('local vendors');
  });
});