import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Tax calculator/);
    await expect(page.locator('#app').first()).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation links are present
    const homeLink = page.locator('nav a[href="/"]').first();
    const taxGuideLink = page.locator('nav a[href="/tax-guide"]').first();
    
    if (await homeLink.count() > 0) {
      await expect(homeLink).toBeVisible();
    }
    
    if (await taxGuideLink.count() > 0) {
      await expect(taxGuideLink).toBeVisible();
      await taxGuideLink.click();
      await expect(page).toHaveURL('/tax-guide');
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check for main content landmark
    await expect(page.locator('main')).toBeVisible();
    
    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      await expect(h1).toBeVisible();
    }
  });

  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await expect(page.locator('#app').first()).toBeVisible();
    
    // Check if mobile navigation works
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });
});