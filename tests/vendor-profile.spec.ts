import { test, expect } from '@playwright/test';

// Define the base URL from an environment variable or use a default
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// --- Test Suite for Vendor Profile Actions ---
test.describe('Vendor Profile Actions', () => {
  let vendorId: string;

  // --- Before all tests, find a vendor to test with ---
  test.beforeAll(async ({ request }) => {
    // This assumes you have an API endpoint to get a list of vendors
    // If not, you might need to create a test vendor or hardcode an ID
    const response = await request.get(`${BASE_URL}/api/vendors`);
    expect(response.ok()).toBeTruthy();
    const vendors = await response.json();
    
    // Find a vendor that is suitable for testing (e.g., not owned by the test user)
    const testVendor = vendors.find(v => v.user_id !== 'YOUR_TEST_USER_ID'); // Replace with your test user's ID
    expect(testVendor).toBeDefined();
    vendorId = testVendor.id;
  });

  // --- Before each test, log in as a customer ---
  test.beforeEach(async ({ page }) => {
    // This assumes you have a way to log in via the UI or an API endpoint
    // For simplicity, this example will navigate to a login page
    await page.goto(`${BASE_URL}/auth/login`);

    // Fill in login credentials
    await page.fill('input[name="email"]', 'customer@example.com'); // Replace with your test customer's email
    await page.fill('input[name="password"]', 'password123'); // Replace with your test customer's password
    await page.click('button[type="submit"]');

    // Wait for successful login and navigation
    await expect(page).toHaveURL(/\/$/); // Should redirect to the homepage
  });

  // --- Test: Favorite and Unfavorite a Vendor ---
  test('should allow a user to favorite and unfavorite a vendor', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/${vendorId}`);

    const favoriteButton = page.getByRole('button', { name: /favorite/i });

    // Add to favorites
    await favoriteButton.click();
    await expect(favoriteButton).toHaveText(/favorited/i);

    // Remove from favorites
    await favoriteButton.click();
    await expect(favoriteButton).toHaveText(/add to favorites/i);
  });

  // --- Test: Submit a Review ---
  test('should allow a user to submit a review', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/${vendorId}`);

    // Fill out the review form
    await page.getByLabel(/rate 5 stars/i).click();
    await page.fill('textarea[placeholder="Share your experience..."]', 'This is a test review from Playwright!');
    
    // Submit the review
    await page.getByRole('button', { name: /submit review/i }).click();

    // Expect a success message or the new review to appear
    await expect(page.getByText('This is a test review from Playwright!')).toBeVisible();
  });

  // --- Test: Report a Vendor ---
  test('should allow a user to report a vendor', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/${vendorId}`);

    // Open the report modal
    await page.getByRole('button', { name: /report vendor/i }).click();
    
    // Fill out the report form
    await page.selectOption('select[aria-label="Reason for report"]', 'spam');
    await page.fill('textarea[placeholder="Please provide additional details..."]', 'This is a test report from Playwright.');

    // Submit the report
    await page.getByRole('button', { name: /submit report/i }).click();

    // Expect a success message
    await expect(page.getByText(/report submitted successfully/i)).toBeVisible();
  });
});
