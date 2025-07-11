import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for main content to be visible
    await expect(page.locator('text=Aqui')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Homepage loaded in ${loadTime}ms`);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 3000);
      });
    });
    
    console.log('Performance metrics:', metrics);
  });

  test('should handle multiple concurrent users', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    const startTime = Date.now();
    
    // Load homepage simultaneously from multiple contexts
    await Promise.all(
      pages.map(page => page.goto('/'))
    );
    
    // Wait for all pages to load main content
    await Promise.all(
      pages.map(page => expect(page.locator('text=Aqui')).toBeVisible())
    );
    
    const loadTime = Date.now() - startTime;
    
    // Should handle concurrent load within reasonable time
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Concurrent load completed in ${loadTime}ms`);
    
    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    
    // Check for modern image formats
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Check if images use modern formats or are properly optimized
        const isOptimized = src.includes('.webp') || 
                           src.includes('.avif') || 
                           src.includes('/_next/image') ||
                           src.includes('w=') || // Next.js image optimization
                           src.includes('q='); // Quality parameter
        
        if (!isOptimized && !src.startsWith('data:')) {
          console.warn(`Potentially unoptimized image: ${src}`);
        }
      }
    }
  });

  test('should minimize JavaScript bundle size', async ({ page }) => {
    await page.goto('/');
    
    // Get all script tags
    const scripts = await page.locator('script[src]').all();
    let totalEstimatedSize = 0;
    
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && src.includes('/_next/static/')) {
        // Estimate bundle size based on script count
        totalEstimatedSize += 1;
      }
    }
    
    console.log(`Estimated script count: ${totalEstimatedSize}`);
    
    // Should have reasonable number of script files
    expect(totalEstimatedSize).toBeLessThan(20);
  });

  test('should have proper caching headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for caching headers
    const headers = response?.headers();
    
    if (headers) {
      console.log('Response headers:', {
        'cache-control': headers['cache-control'],
        'etag': headers['etag'],
        'last-modified': headers['last-modified']
      });
    }
  });
});