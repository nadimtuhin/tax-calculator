import { test, expect } from '@playwright/test';

test.describe('Core Tax Calculator Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    
    // Close star modal if it still appears
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should load application successfully', async ({ page }) => {
    // Check if main components are visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h2').first()).toBeVisible(); // Fix: Use first() to avoid strict mode violation
    
    // Check if input fields are present
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible();
  });

  test('should allow salary input and show calculations', async ({ page }) => {
    // Find the first salary input and enter a value
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('50000');
    
    // Wait for calculations to update
    await page.waitForTimeout(500);
    
    // Check if calculations table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('should allow taxpayer profile selection', async ({ page }) => {
    // Look for profile selection elements
    const profileSelect = page.locator('select').first();
    if (await profileSelect.count() > 0) {
      await profileSelect.selectOption('female');
      await page.waitForTimeout(500);
      
      // Verify selection worked
      const selectedValue = await profileSelect.inputValue();
      expect(selectedValue).toBe('female');
    }
  });

  test('should show navbar action buttons', async ({ page }) => {
    // Check if action buttons are visible (6 total: Random, Export, Import, Reset, Star, GitHub)
    await expect(page.locator('.action-btn')).toHaveCount(6);
    
    // Check specific buttons exist (on mobile, text might be hidden)
    const viewport = page.viewportSize();
    if (viewport && viewport.width > 768) {
      // Desktop - check text is visible
      await expect(page.getByText('Random')).toBeVisible();
      await expect(page.getByText('Export')).toBeVisible();
      await expect(page.getByText('Import')).toBeVisible();
      await expect(page.getByText('Reset')).toBeVisible();
    } else {
      // Mobile - just check buttons exist
      await expect(page.locator('.action-btn-random')).toBeVisible();
      await expect(page.locator('.action-btn').filter({ hasText: 'Export' }).or(page.locator('[title="Export Data"]'))).toBeVisible();
      await expect(page.locator('.action-btn').filter({ hasText: 'Import' }).or(page.locator('[title="Import Data"]'))).toBeVisible();
      await expect(page.locator('.action-btn-danger')).toBeVisible();
    }
  });

  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if page loads properly on mobile
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check if first input is accessible
    const firstInput = page.locator('input[type="number"]').first();
    await expect(firstInput).toBeVisible();
    
    // Try entering a value
    await firstInput.fill('30000');
    await expect(firstInput).toHaveValue('30000');
  });

  test('should handle random data generation', async ({ page }) => {
    // Make sure star modal is closed before clicking Random
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
    
    // Click random button - use more specific selector
    await page.locator('.action-btn-random').click();
    
    // Wait for data to populate
    await page.waitForTimeout(1000);
    
    // Check if first input has a value
    const firstInput = page.locator('input[type="number"]').first();
    const value = await firstInput.inputValue();
    expect(parseInt(value)).toBeGreaterThan(0);
  });

  test('should show bonus fields with + button', async ({ page }) => {
    // Disable star modal by setting localStorage before interaction
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    
    // Wait a bit and then force close any modal that might still appear
    await page.waitForTimeout(2000);
    
    // Try multiple methods to close star modal
    const starModalOverlay = page.locator('.star-modal-overlay');
    const closeBtn = page.locator('.star-modal .close-btn');
    const neverBtn = page.locator('.never-btn');
    
    if (await starModalOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await neverBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await neverBtn.click();
      } else if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await starModalOverlay.click({ force: true });
      }
      await page.waitForTimeout(500);
    }
    
    // Look for the + button next to bonus
    const addBonusBtn = page.locator('.add-bonus-btn');
    await expect(addBonusBtn).toBeVisible();
    
    // Force click the button even if modal might be interfering
    await addBonusBtn.click({ force: true });
    await page.waitForTimeout(500);
    
    // Check if bonus2 row appeared - it will have "Bonus" text in second row
    const bonusRows = page.locator('tr:has-text("Bonus")');
    const bonusRowCount = await bonusRows.count();
    expect(bonusRowCount).toBeGreaterThanOrEqual(2); // Should have at least 2 bonus rows
  });

  test('should persist data on page reload', async ({ page }) => {
    // Enter some data
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.fill('45000');
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    
    // Check if data persisted
    const reloadedValue = await firstInput.inputValue();
    expect(reloadedValue).toBe('45000');
  });
});