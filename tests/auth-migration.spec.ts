import { test, expect } from '@playwright/test'

test.describe('NextAuth Migration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test to ensure clean state
    await page.goto('http://localhost:3000')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.context().clearCookies()
  })

  test('should show NextAuth login modal when clicking Sign In', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should see Sign In button when not authenticated
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton).toBeVisible()
    
    // Click Sign In button
    await signInButton.click()
    
    // Should show NextAuth modal (not Supabase)
    await expect(page.getByText('Welcome to Aqui')).toBeVisible()
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    
    // Should have Google and Apple sign-in buttons
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible()
    
    // Should NOT have any Supabase-specific elements
    await expect(page.locator('[data-testid="supabase-auth"]')).not.toBeVisible()
  })

  test('should redirect to NextAuth for Google OAuth', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Click Google sign-in
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    await expect(googleButton).toBeVisible()
    
    // Listen for navigation to Google OAuth
    const navigationPromise = page.waitForURL(/accounts\.google\.com|localhost:3000\/api\/auth/)
    await googleButton.click()
    
    // Should redirect to Google OAuth or NextAuth callback
    await navigationPromise
    
    // Verify we're not using Supabase auth URLs
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('supabase.co/auth')
    expect(currentUrl).not.toContain('supabase.com/auth')
  })

  test('should have NextAuth session endpoint working', async ({ page }) => {
    // Test the NextAuth session API directly
    const response = await page.request.get('http://localhost:3000/api/auth/session')
    expect(response.status()).toBe(200)
    
    const sessionData = await response.json()
    // When not authenticated, should return empty object or null user
    expect(sessionData.user).toBeFalsy()
  })

  test('should have user registration API working', async ({ page }) => {
    // Test the new registration endpoint
    const response = await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      }
    })
    
    // Should either succeed (201) or fail with user exists (409)
    expect([200, 201, 409]).toContain(response.status())
    
    const responseData = await response.json()
    if (response.status() === 409) {
      expect(responseData.error).toContain('already exists')
    } else {
      expect(responseData.success).toBe(true)
    }
  })

  test('should not have any Supabase auth API calls', async ({ page }) => {
    // Monitor network requests
    const supabaseAuthRequests: string[] = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.includes('supabase.co/auth') || url.includes('supabase.com/auth')) {
        supabaseAuthRequests.push(url)
      }
    })
    
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Try to trigger auth modal
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForTimeout(2000) // Wait for any async requests
    
    // Should have no Supabase auth requests
    expect(supabaseAuthRequests).toHaveLength(0)
  })

  test('should handle credentials login flow', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // For now, just test that the credentials provider is configured
    // We can't easily test actual login without real credentials
    const response = await page.request.post('http://localhost:3000/api/auth/signin/credentials', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    })
    
    // Should get a response (even if it's an error)
    expect(response.status()).toBeLessThan(500) // Not a server error
  })

  test('should clear old Supabase auth storage', async ({ page }) => {
    // Set some fake Supabase auth data
    await page.goto('http://localhost:3000')
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'fake-token')
      localStorage.setItem('sb-project-auth-token', 'fake-token')
    })
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that we're still not authenticated (old tokens ignored)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Navigation component should not be visible
    await expect(page.locator('[data-testid="user-navigation"]')).not.toBeVisible()
  })

  test('should have proper NextAuth configuration', async ({ page }) => {
    // Test NextAuth configuration endpoint
    const response = await page.request.get('http://localhost:3000/api/auth/providers')
    expect(response.status()).toBe(200)
    
    const providers = await response.json()
    
    // Should have Google, Apple, and Credentials providers
    expect(providers.google).toBeDefined()
    expect(providers.apple).toBeDefined()
    expect(providers.credentials).toBeDefined()
    
    // Should not have any Supabase providers
    expect(providers.supabase).toBeUndefined()
  })

  test('should handle sign out correctly', async ({ page }) => {
    // This test assumes we can somehow get authenticated first
    // For now, just test the sign out endpoint exists
    const response = await page.request.post('http://localhost:3000/api/auth/signout')
    expect(response.status()).toBeLessThan(500)
  })

  test('should have admin login separate from main auth', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/login')
    
    // Should show admin login page
    await expect(page.getByText('Admin Login')).toBeVisible()
    
    // Should have username/password fields (not OAuth)
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Should not show the main auth modal
    await expect(page.getByText('Continue with Google')).not.toBeVisible()
  })
})