import { test, expect } from '@playwright/test';

test.describe('StarModal Component', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should show modal on first visit after delay', async ({ page }) => {
    await page.goto('/');
    
    // Modal should not be visible immediately
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
    
    // Wait for modal to appear (1.5s delay)
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Check modal content
    await expect(page.locator('.star-modal h2')).toContainText('Enjoying the Bangladesh Tax Calculator?');
    await expect(page.locator('.star-modal .star-btn')).toContainText('Star on GitHub');
    await expect(page.locator('.star-modal .later-btn')).toContainText('Maybe Later');
    await expect(page.locator('.star-modal .never-btn')).toContainText("Don't Show Again");
  });

  test('should not show modal on subsequent visits', async ({ page }) => {
    await page.goto('/');
    
    // Wait for modal to appear on first visit
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Close modal
    await page.locator('.close-btn').click();
    
    // Reload page
    await page.reload();
    
    // Modal should not appear again
    await page.waitForTimeout(2000);
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    await page.locator('.close-btn').click();
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    await page.keyboard.press('Escape');
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Click on overlay (outside modal)
    await page.locator('.star-modal-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });

  test('should not close modal when clicking inside modal content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Click inside modal content
    await page.locator('.star-modal').click();
    await expect(page.locator('.star-modal-overlay')).toBeVisible();
  });

  test('should handle "Star on GitHub" button click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Mock the external link click
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.star-modal .star-btn').click()
    ]);
    
    expect(popup.url()).toBe('https://github.com/nadimtuhin/tax-calculator');
    
    // Modal should close
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
    
    // localStorage should be set to prevent future shows
    const starred = await page.evaluate(() => localStorage.getItem('tax-calculator-starred'));
    expect(starred).toBe('true');
  });

  test('should handle "Maybe Later" button click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    await page.locator('.star-modal .later-btn').click();
    
    // Modal should close
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
    
    // localStorage should store reminder date
    const reminded = await page.evaluate(() => localStorage.getItem('tax-calculator-star-reminded'));
    expect(reminded).toBeTruthy();
  });

  test('should handle "Don\'t Show Again" button click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    await page.locator('.star-modal .never-btn').click();
    
    // Modal should close
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
    
    // localStorage should be set to never show again
    const neverShow = await page.evaluate(() => localStorage.getItem('tax-calculator-never-star'));
    expect(neverShow).toBe('true');
    
    // Reload and confirm modal doesn't appear
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });

  test('should force show modal via console method', async ({ page }) => {
    await page.goto('/');
    
    // Clear localStorage to ensure no natural modal showing
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    
    // Modal should not be visible
    await page.waitForTimeout(2000);
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
    
    // Force show via console method
    await page.evaluate(() => window.showStarModal());
    
    // Modal should now be visible
    await expect(page.locator('.star-modal-overlay')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Check modal is properly sized on mobile
    const modal = page.locator('.star-modal');
    await expect(modal).toBeVisible();
    
    // Buttons should be adequately sized for touch
    const starBtn = page.locator('.star-btn');
    const laterBtn = page.locator('.later-btn');
    const neverBtn = page.locator('.never-btn');
    
    await expect(starBtn).toBeVisible();
    await expect(laterBtn).toBeVisible();
    await expect(neverBtn).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.star-modal-overlay')).toBeVisible({ timeout: 3000 });
    
    // Tab through the buttons
    await page.keyboard.press('Tab'); // Focus star button
    await expect(page.locator('.star-modal .star-btn')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus later button
    await expect(page.locator('.star-modal .later-btn')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus never button
    await expect(page.locator('.star-modal .never-btn')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus close button
    await expect(page.locator('.close-btn')).toBeFocused();
    
    // Press Enter on close button
    await page.keyboard.press('Enter');
    await expect(page.locator('.star-modal-overlay')).not.toBeVisible();
  });
});