import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should allow an admin to log in and see the dashboard', async ({ page }) => {
    // Navigate to the admin login page
    await page.goto('/admin/login');

    // Fill in the login form
    await page.fill('input[name="username"]', 'mrn');
    await page.fill('input[name="password"]', 'mrn');

    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for navigation to the dashboard and assert the URL
    await page.waitForURL('/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');

    // Assert that the dashboard contains a welcome message
    const welcomeMessage = page.locator('text=Welcome back, mrn');
    await expect(welcomeMessage).toBeVisible();
  });

  test('should show an error message for invalid credentials', async ({ page }) => {
    // Navigate to the admin login page
    await page.goto('/admin/login');

    // Fill in incorrect credentials
    await page.fill('input[name="username"]', 'mrn');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // Assert that an error message is displayed
    const errorMessage = page.locator('text=Invalid credentials');
    await expect(errorMessage).toBeVisible();

    // Assert that the URL is still the login page
    expect(page.url()).toContain('/admin/login');
  });
});
