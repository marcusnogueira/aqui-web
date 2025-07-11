import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should initiate Google OAuth when sign-in button is clicked', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Click the main sign-in button to open the modal
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for the modal to appear and assert its title
    await expect(page.getByRole('heading', { name: 'Welcome to Aqui' })).toBeVisible();

    // The sign-in function triggers a navigation to an external OAuth provider.
    // We can't fully test the external login, but we can verify the initial redirect.
    // We'll start waiting for the new page before clicking the button.
    const popupPromise = page.waitForEvent('popup');

    // Click the "Continue with Google" button
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    // Wait for the new tab/popup to open
    const popup = await popupPromise;

    // Assert that the popup URL is for Supabase auth, which then redirects to Google
    // This confirms the OAuth flow has been initiated correctly.
    await popup.waitForLoadState();
    expect(popup.url()).toContain('supabase.co/auth/v1/authorize');
    
    // Close the popup page as we can't proceed with Google login in a test
    await popup.close();
  });
});
