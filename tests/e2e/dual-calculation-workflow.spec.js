import { test, expect } from '@playwright/test';
import { categoryRadios, selectCategory } from './helpers/category.js';

test.describe('Dual Tax Calculation Workflow (2024-25 vs 2025-26)', () => {
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

  test('should display both 2024-25 and 2025-26 calculations side by side', async ({ page }) => {
    // Check that comparison section exists
    const taxComparisonSection = page.locator('.tax-comparison-section');
    await expect(taxComparisonSection).toBeVisible();
    
    // Check for side-by-side layout
    const comparisonRow = page.locator('.comparison-row');
    const comparisonCols = page.locator('.comparison-col');
    
    await expect(comparisonRow).toBeVisible();
    await expect(comparisonCols).toHaveCount(2);
    
    // Check that calculation headings exist (there may be more h2s in the page)
    const h2Elements = page.locator('h2');
    await expect(h2Elements.count()).resolves.toBeGreaterThanOrEqual(2);
  });

  test('should calculate tax amounts for both years when salary is entered', async ({ page }) => {
    // Set up test data
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('50000'); // 600K annually
    await page.waitForTimeout(1000);
    
    // Check that both calculation sections show tax calculations
    const h2Elements = page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
    
    // Both h2 elements should show tax amounts (numeric values in the title)
    const h2Texts = await h2Elements.allTextContents();
    
    // Both should contain numbers (tax amounts)
    const hasNumbers = h2Texts.every(text => /\d+/.test(text));
    expect(hasNumbers).toBe(true);
  });

  test('should show enacted 400k thresholds in both FY 2025-26 and FY 2026-27 calculation tables while preserving FY 2024-25 in profile', async ({ page }) => {
    const salaryInput = page.getByLabel('July basic');
    await salaryInput.fill('40000'); // 480,000 exact taxable salary annually (basic has 0 exemption)
    await page.waitForTimeout(500);

    // Verify both side-by-side columns independently render First Tk4 lakh [0-4 lakh]
    const cols = page.locator('.comparison-col');
    await expect(cols).toHaveCount(2);
    await expect(cols.nth(0)).toContainText('Tax for FY 2025-2026');
    await expect(cols.nth(0)).toContainText('First Tk4 lakh [0-4 lakh]');
    await expect(cols.nth(1)).toContainText('Tax for FY 2026-2027');
    await expect(cols.nth(1)).toContainText('First Tk4 lakh [0-4 lakh]');

    // Verify both comparison cards show Tax-free: ৳400,000
    const cards = page.locator('.comparison-card');
    await expect(cards.nth(0)).toContainText('FY 2025-2026');
    await expect(cards.nth(0)).toContainText('Tax-free: ৳400,000');
    await expect(cards.nth(1)).toContainText('FY 2026-2027');
    await expect(cards.nth(1)).toContainText('Tax-free: ৳400,000');

    // Verify selecting FY 2024-25 in profile still displays preserved BDT 350,000 threshold
    await page.locator('#profile-fiscal-year').selectOption('2024-25');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 350,000');
    await page.locator('#profile-fiscal-year').selectOption('2025-26');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 400,000');
  });

  test('should update both calculations when taxpayer profile changes', async ({ page }) => {
    // Enter salary first
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('60000'); // 720K annually
    await page.waitForTimeout(500);
    
    // Get initial h2 texts (which include tax amounts)
    const getH2Texts = async () => {
      return await page.locator('h2').allTextContents();
    };
    
    const initialH2Texts = await getH2Texts();
    
    // Change taxpayer profile
    const categorySelect = categoryRadios(page).first();
    if (await categorySelect.count() > 0) {
      await selectCategory(page, 'female');
      await page.waitForTimeout(1000);
      
      // Get new h2 texts
      const newH2Texts = await getH2Texts();
      
      // At least one should change (female has higher threshold, so lower tax)
      const hasChanged = newH2Texts.some((text, index) => text !== initialH2Texts[index]);
      expect(hasChanged).toBe(true);
    }
  });

  test('should maintain responsive layout on different screen sizes', async ({ page }) => {
    // Set salary first to ensure content is loaded
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('50000');
    await page.waitForTimeout(500);
    
    // Test on desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const comparisonRow = page.locator('.comparison-row');
    await expect(comparisonRow).toBeVisible();
    
    // On desktop, columns should be side by side
    const comparisonCols = page.locator('.comparison-col');
    await expect(comparisonCols).toHaveCount(2);
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Should still show both calculations (might be stacked)
    await expect(comparisonCols).toHaveCount(2);
    
    // Both calculation sections should still be visible
    const h2Elements = page.locator('h2');
    await expect(h2Elements.count()).resolves.toBeGreaterThanOrEqual(2);
  });

  test('should handle different taxpayer categories correctly', async ({ page }) => {
    const categories = ['general', 'female', 'disabled'];
    
    for (const category of categories) {
      // Set taxpayer category
      const categorySelect = categoryRadios(page).first();
      if (await categorySelect.count() > 0) {
        await selectCategory(page, category);
        await page.waitForTimeout(500);
        
        // Set salary
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('60000');
        await page.waitForTimeout(1000);
        
        // Both calculations should show tax amounts
        const h2Texts = await page.locator('h2').allTextContents();
        const hasNumbers = h2Texts.every(text => /\d+/.test(text));
        expect(hasNumbers).toBe(true);
      }
    }
  });

  test('should handle zero income gracefully in both calculations', async ({ page }) => {
    // Set zero salary
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('0');
    await page.waitForTimeout(1000);
    
    // Both calculations should still show minimum tax
    const h2Texts = await page.locator('h2').allTextContents();
    const hasNumbers = h2Texts.every(text => /\d+/.test(text));
    expect(hasNumbers).toBe(true);
    
    // Should show some positive tax amount (minimum tax)
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/minimum.*tax/i);
  });

  test('should show tax comparison summary', async ({ page }) => {
    // Enter salary that will show a comparison
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('45000'); // 540K annually
    await page.waitForTimeout(1000);
    
    // Look for tax comparison component
    const pageContent = await page.textContent('body');
    
    // Should show some kind of comparison indicator
    const hasComparison = /save|additional|difference|compare/i.test(pageContent);
    expect(hasComparison).toBe(true);
  });

  test('should handle high income correctly in both calculations', async ({ page }) => {
    // Set very high salary
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('200000'); // 2.4M annually
    await page.waitForTimeout(1000);
    
    // Both calculations should show substantial tax
    const h2Texts = await page.locator('h2').allTextContents();
    
    // Extract tax amounts from h2 texts
    const taxAmounts = h2Texts.map(text => {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Both should show substantial tax amounts
    expect(taxAmounts[0]).toBeGreaterThan(100000); // Over 1 lakh tax
    expect(taxAmounts[1]).toBeGreaterThan(100000);
  });

  test('should show different tax slab structures', async ({ page }) => {
    // Set salary that will use multiple tax brackets
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('100000'); // 1.2M annually
    await page.waitForTimeout(1000);
    
    // Get all table content
    const pageContent = await page.textContent('body');
    
    // 2024-25 should have 5% rate, 2025-26 should not
    expect(pageContent).toContain('5%'); // 2024-25 has 5% bracket
    
    // Both should show progressive tax rates
    expect(pageContent).toContain('10%');
    expect(pageContent).toContain('15%');
    expect(pageContent).toContain('20%');
  });

  test('should persist data consistency when inputs change', async ({ page }) => {
    // Fill salary
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('70000');
    await page.waitForTimeout(500);
    
    // Get initial calculations
    const getH2Texts = async () => {
      return await page.locator('h2').allTextContents();
    };
    
    const initialTaxes = await getH2Texts();
    
    // Change salary
    await salaryInput.fill('75000');
    await page.waitForTimeout(500);
    
    const newTaxes = await getH2Texts();
    
    // Tax amounts should change (both should increase)
    expect(newTaxes[0]).not.toBe(initialTaxes[0]);
    expect(newTaxes[1]).not.toBe(initialTaxes[1]);
    
    // Change back to original
    await salaryInput.fill('70000');
    await page.waitForTimeout(500);
    
    const revertedTaxes = await getH2Texts();
    
    // Should return to original values
    expect(revertedTaxes[0]).toBe(initialTaxes[0]);
    expect(revertedTaxes[1]).toBe(initialTaxes[1]);
  });
});