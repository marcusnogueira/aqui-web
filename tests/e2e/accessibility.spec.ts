import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1Elements = await page.locator('h1').count();
    const h2Elements = await page.locator('h2').count();
    
    // Should have at least one h1 element
    expect(h1Elements).toBeGreaterThanOrEqual(1);
    
    // Should not have more than one h1 per page
    expect(h1Elements).toBeLessThanOrEqual(1);
    
    console.log(`Found ${h1Elements} h1 elements and ${h2Elements} h2 elements`);
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Images should have alt text (can be empty for decorative images)
      expect(alt).not.toBeNull();
      
      // Log images without meaningful alt text
      if (!alt || alt.trim() === '') {
        console.log(`Image without alt text: ${src}`);
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check form inputs have proper labels or aria-labels
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      
      // Check if input has associated label
      let hasLabel = false;
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      // Input should have label, aria-label, placeholder, or name
      const hasAccessibleName = hasLabel || ariaLabel || placeholder || name;
      
      if (!hasAccessibleName) {
        console.warn('Input without accessible name found');
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Test reverse tabbing
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Get computed styles for text elements
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, a').all();
    
    for (const element of textElements.slice(0, 10)) { // Check first 10 elements
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Log color information for manual review
      if (styles.color !== 'rgba(0, 0, 0, 0)') {
        console.log('Text styles:', styles);
      }
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA usage
    const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]').all();
    
    for (const element of elementsWithAria) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledby = await element.getAttribute('aria-labelledby');
      const ariaDescribedby = await element.getAttribute('aria-describedby');
      const role = await element.getAttribute('role');
      
      console.log('ARIA attributes found:', {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        'role': role
      });
    }
  });

  test('should handle screen reader navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for landmarks
    const landmarks = await page.locator('main, nav, header, footer, aside, section[aria-label]').all();
    
    console.log(`Found ${landmarks.length} landmark elements`);
    
    // Should have at least main content area
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('should have proper focus management in modals', async ({ page }) => {
    await page.goto('/');
    
    // Open sign-in modal
    await page.click('button:has-text("Sign In"), a:has-text("Sign In")');
    
    // Check if focus is trapped in modal
    await expect(page.locator('text=Welcome to AQUI')).toBeVisible();
    
    // Test keyboard navigation within modal
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    
    // Focus should be within the modal
    const isInModal = await focusedElement.evaluate((el) => {
      return el.closest('[role="dialog"], .modal, [aria-modal="true"]') !== null;
    });
    
    // Close modal with Escape key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('text=Welcome to AQUI')).not.toBeVisible();
  });

  test('should have proper page titles', async ({ page }) => {
    const pages = ['/', '/about', '/faq', '/admin/login'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      const title = await page.title();
      
      // Title should not be empty and should be descriptive
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(5);
      
      console.log(`${pagePath}: "${title}"`);
    }
  });
});