import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// IMPORTANT: These should be loaded from environment variables in a real CI/CD setup
// For local testing, ensure you have a .env.local file with these values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL or Service Role Key is not defined. Please check your environment variables.");
}

// Create a server-side Supabase client with the service role key
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

test.describe('Authenticated User Flow', () => {
  let testUser: any;
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'password123';

  test.beforeAll(async () => {
    // Create a new user for the test suite
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm the email
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }
    testUser = data.user;
  });

  test.afterAll(async () => {
    // Clean up the created user after all tests are done
    if (testUser) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      if (error) {
        console.error('Failed to delete test user:', error.message);
      }
    }
  });

  test('should be able to access a protected route with an injected session', async ({ page }) => {
    // Programmatically sign in to get a session
    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(signInError).toBeNull();
    expect(sessionData.session).not.toBeNull();

    const session = sessionData.session;

    // The session object contains the access_token and other details.
    // Supabase's client library stores the session in a cookie named 'sb-<project_ref>-auth-token'.
    // We need to set this cookie in the browser context.
    const projectRef = supabaseUrl.split('.')[0].replace('https://', '');
    const cookieName = `sb-${projectRef}-auth-token`;
    
    // The cookie value is a stringified array containing the session object.
    const cookieValue = JSON.stringify([session]);

    // Set the cookie in the browser context before navigating
    await page.context().addCookies([{
      name: cookieName,
      value: cookieValue,
      domain: 'localhost', // Use 'localhost' for local testing
      path: '/',
      httpOnly: false, // Supabase cookie is accessible to JS
      secure: false, // For http://localhost
      sameSite: 'Lax'
    }]);

    // Navigate to the page that the OAuth callback would redirect to
    await page.goto('/explore');
    // Should redirect to homepage
    await expect(page).toHaveURL('/');

    // Verify that the page loaded correctly and doesn't show an auth error
    // Check that the URL does not contain an error parameter
    expect(page.url()).not.toContain('error=auth_failed');

    // Check for an element that only a logged-in user would see.
    // For example, let's assume the Navigation component shows a "Sign Out" button.
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });
});
