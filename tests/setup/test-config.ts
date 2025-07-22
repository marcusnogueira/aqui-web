/**
 * Test Configuration for Vendor Onboarding Tests
 * 
 * This file contains shared configuration and utilities for testing
 * the vendor onboarding redirect functionality.
 */

import { expect } from '@playwright/test'

export const TEST_CONFIG = {
  // Test timeouts
  NAVIGATION_TIMEOUT: 15000,
  FORM_SUBMISSION_TIMEOUT: 10000,
  ELEMENT_WAIT_TIMEOUT: 5000,
  
  // Test data
  TEST_BUSINESS_TYPES: [
    'Food & Beverage',
    'Arts & Crafts', 
    'Beauty & Wellness',
    'Mobile Services',
    'Other'
  ],
  
  // URLs
  VENDOR_ONBOARDING_URL: '/vendor/onboarding',
  VENDOR_DASHBOARD_URL: '/vendor/dashboard',
  VENDOR_CONFIRMATION_URL: '/vendor/onboarding/confirmation', // Should NOT be used after fix
  
  // Test user data generators
  generateTestEmail: () => `test-vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  generateBusinessName: (prefix: string = 'Test') => `${prefix} Business ${Date.now()}`,
  
  // Common test data
  DEFAULT_PASSWORD: 'TestPassword123!',
  DEFAULT_PHONE: '555-0123',
  DEFAULT_DESCRIPTION: 'A test business for automated testing purposes'
}

/**
 * Utility functions for vendor onboarding tests
 */
export class VendorTestUtils {
  
  /**
   * Creates a new test user and signs them in
   */
  static async createAndSignInTestUser(page: any, email?: string) {
    const testEmail = email || TEST_CONFIG.generateTestEmail()
    
    await page.goto('/')
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', TEST_CONFIG.DEFAULT_PASSWORD)
    await page.click('[data-testid="signup-button"]')
    
    // Wait for authentication to complete
    await page.waitForSelector('[data-testid="user-menu"]', { 
      timeout: TEST_CONFIG.NAVIGATION_TIMEOUT 
    })
    
    return testEmail
  }
  
  /**
   * Fills out the vendor onboarding form with test data
   */
  static async fillVendorOnboardingForm(page: any, options: {
    businessName?: string
    businessType?: string
    description?: string
    phone?: string
    address?: string
  } = {}) {
    const {
      businessName = TEST_CONFIG.generateBusinessName(),
      businessType = TEST_CONFIG.TEST_BUSINESS_TYPES[0],
      description = TEST_CONFIG.DEFAULT_DESCRIPTION,
      phone = TEST_CONFIG.DEFAULT_PHONE,
      address
    } = options
    
    await page.fill('[name="business_name"]', businessName)
    await page.selectOption('[name="business_type"]', businessType)
    await page.fill('[name="description"]', description)
    
    if (phone) {
      await page.fill('[name="phone"]', phone)
    }
    
    if (address) {
      await page.fill('[data-testid="address-input"]', address)
    }
    
    return {
      businessName,
      businessType,
      description,
      phone,
      address
    }
  }
  
  /**
   * Submits the vendor onboarding form and waits for redirect
   */
  static async submitVendorOnboardingForm(page: any) {
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/vendor/dashboard', { 
      timeout: TEST_CONFIG.NAVIGATION_TIMEOUT 
    })
  }
  
  /**
   * Verifies that we're on the vendor dashboard
   */
  static async verifyOnVendorDashboard(page: any) {
    // Check URL
    const url = page.url()
    if (!url.includes('/vendor/dashboard')) {
      throw new Error(`Expected to be on vendor dashboard, but URL is: ${url}`)
    }
    
    // Check for dashboard elements
    await page.waitForSelector('h1', { timeout: TEST_CONFIG.ELEMENT_WAIT_TIMEOUT })
    const heading = await page.locator('h1').textContent()
    
    if (!heading?.toLowerCase().includes('dashboard')) {
      throw new Error(`Expected dashboard heading, but found: ${heading}`)
    }
  }
  
  /**
   * Verifies that we're NOT on the confirmation page
   */
  static async verifyNotOnConfirmationPage(page: any) {
    const url = page.url()
    if (url.includes('/vendor/onboarding/confirmation')) {
      throw new Error(`Should not be on confirmation page, but URL is: ${url}`)
    }
  }
  
  /**
   * Clears browser state for clean test runs
   */
  static async clearBrowserState(page: any) {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Clear cookies
    const context = page.context()
    await context.clearCookies()
  }
  
  /**
   * Sets up page listeners to catch unexpected navigation
   */
  static setupNavigationListeners(page: any, forbiddenUrls: string[] = ['/vendor/onboarding/confirmation']) {
    page.on('framenavigated', (frame: any) => {
      if (frame === page.mainFrame()) {
        const url = frame.url()
        for (const forbiddenUrl of forbiddenUrls) {
          if (url.includes(forbiddenUrl)) {
            throw new Error(`Unexpected navigation to forbidden URL: ${url}`)
          }
        }
      }
    })
  }
  
  /**
   * Waits for and verifies successful form submission
   */
  static async waitForSuccessfulSubmission(page: any) {
    // Look for loading states to disappear
    const submitButton = page.locator('button[type="submit"]')
    
    // Wait for button to not be disabled (submission complete)
    await page.waitForFunction(() => {
      const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
      return button && !button.disabled
    }, { timeout: TEST_CONFIG.FORM_SUBMISSION_TIMEOUT })
  }
  
  /**
   * Verifies vendor data is displayed correctly on dashboard
   */
  static async verifyVendorDataOnDashboard(page: any, expectedData: {
    businessName?: string
    businessType?: string
    email?: string
  }) {
    const { businessName, businessType, email } = expectedData
    
    if (businessName) {
      const businessNameElement = page.locator('[data-testid="business-name"]')
      if (await businessNameElement.isVisible()) {
        await expect(businessNameElement).toContainText(businessName)
      }
    }
    
    if (businessType) {
      const businessTypeElement = page.locator('[data-testid="business-type"]')
      if (await businessTypeElement.isVisible()) {
        await expect(businessTypeElement).toContainText(businessType)
      }
    }
    
    if (email) {
      const emailElement = page.locator('[data-testid="user-email"]')
      if (await emailElement.isVisible()) {
        await expect(emailElement).toContainText(email)
      }
    }
  }
}

/**
 * Mock data for testing
 */
export const MOCK_VENDOR_DATA = {
  business_name: 'Mock Test Business',
  business_type: 'Food & Beverage',
  description: 'A mock business for testing purposes',
  phone: '555-MOCK',
  address: '123 Mock Street, Test City, TC 12345'
}

/**
 * Expected API response structure for vendor creation
 */
export interface ExpectedVendorResponse {
  success: boolean
  newVendor: {
    id: string
    business_name: string
    business_type: string
    description: string
    phone?: string
    is_approved: boolean
    user_id: string
  }
  updatedUser: {
    id: string
    email: string
    is_vendor: boolean
    active_role: 'vendor' | 'customer'
  }
  message: string
}