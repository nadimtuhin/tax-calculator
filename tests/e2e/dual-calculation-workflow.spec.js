import { test, expect } from '@playwright/test';
import { selectCategory } from './helpers/category.js';
import { FY_2025, FY_2026, calcPanel, setMonthly, expectHeadingAmount } from './helpers/fa2026-calc-ui.js';

// Both fiscal years use the same Schedule 1 slabs and 4 lakh general threshold.
const expectBothYears = async (page, amount) => {
  await expectHeadingAmount(page, FY_2025, amount);
  await expectHeadingAmount(page, FY_2026, amount);
};

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
    // 60,000 x 12 = 720,000 gross -> taxable 480,000: 80,000 above 4 lakh at 10%
    await setMonthly(page, 'basic', 60000);
    await expectBothYears(page, 8000);
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
    // 80,000 x 12 = 960,000 gross -> taxable 640,000
    await setMonthly(page, 'basic', 80000);
    await selectCategory(page, 'general');
    await expectBothYears(page, 24000);

    // Female threshold 4.5 lakh: 190,000 at 10%
    await selectCategory(page, 'female');
    await expectBothYears(page, 19000);
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
    await setMonthly(page, 'basic', 80000); // taxable 640,000
    const expectedTax = { general: 24000, female: 19000, disabled: 11500 }; // thresholds 4 / 4.5 / 5.25 lakh, 10% above

    for (const [category, tax] of Object.entries(expectedTax)) {
      await selectCategory(page, category);
      await expectBothYears(page, tax);
    }
  });

  test('should handle zero income gracefully in both calculations', async ({ page }) => {
    await setMonthly(page, 'basic', 0);

    await expectBothYears(page, 0);
    // Minimum tax applies only above the tax-free threshold
    await expect(page.locator('.min-tax-notice')).toHaveCount(0);
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
    // 200,000 x 12 = 2.4M gross, exemption capped at 500,000 -> taxable 1.9M
    // 0 + 30,000 + 60,000 + 100,000 + 75,000 (3L at 25%)
    await setMonthly(page, 'basic', 200000);
    await expectBothYears(page, 265000);
  });

  test('should show different tax slab structures', async ({ page }) => {
    await setMonthly(page, 'basic', 100000);

    // The 5% slab was removed: both years run 0/10/15/20/25/30
    for (const fy of [FY_2025, FY_2026]) {
      const slabRows = calcPanel(page, fy).locator('table.invoice tr').filter({ hasText: /lakh/ });
      await expect(slabRows).toHaveCount(6);
      const rates = await slabRows.evaluateAll((rows) => rows.map((r) => r.querySelectorAll('td')[1].textContent.trim()));
      expect(rates).toEqual(['0', '10', '15', '20', '25', '30']);
    }
  });

  test('should persist data consistency when inputs change', async ({ page }) => {
    // 70,000 x 12 = 840,000 -> taxable 560,000 -> 160,000 at 10%
    await setMonthly(page, 'basic', 70000);
    await expectBothYears(page, 16000);

    // 75,000 x 12 = 900,000 -> taxable 600,000 -> 200,000 at 10%
    await setMonthly(page, 'basic', 75000);
    await expectBothYears(page, 20000);

    await setMonthly(page, 'basic', 70000);
    await expectBothYears(page, 16000);
  });
});