import { test, expect } from '@playwright/test';
import { categoryRadios, selectCategory } from './helpers/category.js';
import { FY_2025, FY_2026, calcPanel, panelRow, setMonthly, expectHeadingAmount } from './helpers/fa2026-calc-ui.js';

const expectBothYears = async (page, amount) => {
  await expectHeadingAmount(page, FY_2025, amount);
  await expectHeadingAmount(page, FY_2026, amount);
};

test.describe('Edge Cases and Boundary Values - Dual Tax Calculator', () => {
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

  test('should handle zero income correctly', async ({ page }) => {
    await selectCategory(page, 'general');
    await setMonthly(page, 'basic', 0);

    // Minimum tax applies only above the threshold, so zero income owes nothing
    await expectBothYears(page, 0);
    await expect(page.locator('.min-tax-notice')).toHaveCount(0);
  });

  test('should handle exact threshold amounts for general taxpayer', async ({ page }) => {
    await selectCategory(page, 'general');
    await page.waitForTimeout(300);

    // Verify FY 2024-25 threshold preserved at 350,000 in profile selector
    await page.locator('#profile-fiscal-year').selectOption('2024-25');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 350,000');

    // Switch back to FY 2025-26 and verify exact 400,000 taxable income (Gross 50,000 * 12 = 600,000 -> Para 27 1/3 exempt = 200,000 -> 400,000 taxable)
    await page.locator('#profile-fiscal-year').selectOption('2025-26');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 400,000');

    const basicInput = page.getByLabel('July basic');
    const bonusInput = page.getByLabel('Bonus', { exact: true });
    await basicInput.fill('50000');
    await bonusInput.fill('0');
    await page.waitForTimeout(300);

    // Exact 400,000 taxable salary: at threshold -> 0 tax (minimum tax applies only above threshold)
    const cols = page.locator('.comparison-col');
    await expect(cols.nth(0)).toContainText('Tax for FY 2025-2026 0');
    await expect(cols.nth(0)).toContainText('First Tk4 lakh [0-4 lakh]');
    await expect(cols.nth(1)).toContainText('Tax for FY 2026-2027 0');
    await expect(cols.nth(1)).toContainText('First Tk4 lakh [0-4 lakh]');

    // Step above threshold: +90,000 bonus -> Gross 690,000 -> exempt 230,000 -> taxable 460,000 -> 60,000 @ 10% = 6,000 tax
    await bonusInput.fill('90000');
    await expect(cols.nth(0)).toContainText('Tax for FY 2025-2026 6000');
    await expect(cols.nth(1)).toContainText('Tax for FY 2026-2027 6000');
  });

  test('should handle boundary values for different taxpayer categories', async ({ page }) => {
    // Monthly basic chosen so taxable salary (2/3 of gross) is 60,000 above each threshold
    const categoryTests = [
      { category: 'female', monthlyBasic: 63750, tax: 6000 }, // threshold 450,000, taxable 510,000
      { category: 'disabled', monthlyBasic: 73125, tax: 6000 }, // threshold 525,000, taxable 585,000
      { category: 'freedom_fighter', monthlyBasic: 76250, tax: 6000 }, // threshold 550,000, taxable 610,000
    ];

    for (const { category, monthlyBasic, tax } of categoryTests) {
      await selectCategory(page, category);
      await setMonthly(page, 'basic', monthlyBasic);
      await expectBothYears(page, tax);
    }
  });

  test('should handle very high income correctly', async ({ page }) => {
    await selectCategory(page, 'general');

    // Gross 6M: exemption capped at 500,000 -> taxable 5.5M
    // 30,000 + 60,000 + 100,000 + 500,000 + 30% of the 1.9M above 36 lakh
    await setMonthly(page, 'basic', 500000);
    await expectBothYears(page, 1260000);

    // Gross 12M -> taxable 11.5M: 690,000 + 30% of 7.9M
    await setMonthly(page, 'basic', 1000000);
    await expectBothYears(page, 3060000);

    await expect(panelRow(page, FY_2025, 'Slab tax (gross)').first()).toBeVisible();
  });

  test('should handle negative and invalid input values', async ({ page }) => {
    const julyBasic = page.getByRole('spinbutton', { name: 'July basic', exact: true });

    // A negative breakdown entry is clamped to zero
    await julyBasic.fill('-1000');
    await expect(julyBasic).toHaveValue('0');
    await expectBothYears(page, 0);

    // Extremely large value still yields a finite, positive tax
    await julyBasic.fill('99999999');
    await expect(julyBasic).toHaveValue('99999999');
    await expect
      .poll(async () => Number((await calcPanel(page, FY_2025).locator('.calc-heading-amount').innerText()).replace(/[^\d.-]/g, '')))
      .toBeGreaterThan(0);
  });

  test('should handle minimum tax boundaries for different locations', async ({ page }) => {
    // 50,500 x 12 = 606,000 gross -> taxable 404,000: slab tax 400, just above the 4 lakh threshold
    await setMonthly(page, 'basic', 50500);

    // FY 2025-26 and FY 2026-27 use one unified minimum tax across every location
    for (const location of ['dhaka', 'chittagong', 'other_city', 'district']) {
      await page.locator('#profile-location').selectOption(location);
      await expectBothYears(page, 5000);
    }

    // First-time filers pay BDT 1,000 minimum instead
    await page.locator('#first-time-filer').check({ force: true });
    await expectBothYears(page, 1000);
  });

  test('should handle tax slab boundary values', async ({ page }) => {
    await selectCategory(page, 'general');

    // taxable salary = 2/3 of gross while gross <= 1.5M, so monthly basic = taxable / 8
    const slabBoundaryTests = [
      { monthly: 50000, taxable: 400000, tax: 0 },
      { monthly: 87500, taxable: 700000, tax: 30000 },
      { monthly: 125000, taxable: 1000000, tax: 75000 },
      { monthly: 175000, taxable: 1600000, tax: 190000 }, // gross 2.1M, exemption capped at 500,000
    ];

    for (const { monthly, tax } of slabBoundaryTests) {
      await setMonthly(page, 'basic', monthly);
      await expectBothYears(page, tax);
    }
  });

  test('should handle investment rebate boundary values', async ({ page }) => {
    // Set higher income to test investment rebate
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('83334'); // 1M annually
    await page.waitForTimeout(500);
    
    // Test different investment amounts
    const investmentTests = [
      { amount: 0, description: 'No investment' },
      { amount: 50000, description: 'Low investment' },
      { amount: 200000, description: '20% of income (max rebateable)' },
      { amount: 500000, description: 'Investment exceeds 20% limit' },
      { amount: 1000000, description: 'Very high investment' }
    ];
    
    for (const test of investmentTests) {
      // Find and fill investment field
      const investmentInputs = page.locator('input[placeholder*="investment"], input[title*="investment"]');
      
      if (await investmentInputs.count() > 0) {
        await investmentInputs.first().fill(test.amount.toString());
        await page.waitForTimeout(1000);
        
        // Should show investment rebate calculations
        const pageContent = await page.textContent('body');
        
        if (test.amount > 0) {
          // Should show rebate information
          expect(pageContent).toMatch(/rebate|investment/i);
          
          // Should show updated tax calculations
          const h2Elements = page.locator('h2');
          const h2Texts = await h2Elements.allTextContents();
          const hasNumbers = h2Texts.every(text => /\d/.test(text));
          expect(hasNumbers).toBe(true);
        }
      }
    }
  });

  test('should handle TDS boundary values and negative payable scenarios', async ({ page }) => {
    // Set reasonable income
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('60000'); // 720K annually
    await page.waitForTimeout(500);
    
    // Test different TDS amounts
    const tdsTests = [
      { amount: 0, description: 'No TDS' },
      { amount: 30000, description: 'Reasonable TDS' },
      { amount: 100000, description: 'High TDS (might exceed tax)' },
      { amount: 200000, description: 'Very high TDS (definitely exceeds tax)' }
    ];
    
    for (const test of tdsTests) {
      // Find TDS input (usually second input in rows)
      const allNumberInputs = page.locator('input[type="number"]');
      const inputCount = await allNumberInputs.count();
      
      if (inputCount > 1) {
        const tdsInput = allNumberInputs.nth(1);
        await tdsInput.fill(test.amount.toString());
        await page.waitForTimeout(1000);
        
        // Should show payable calculations
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/payable/i);
        
        // For high TDS amounts, payable should not go negative
        if (test.amount >= 100000) {
          // Look for payable amounts in the page
          const payableMatches = pageContent.match(/payable[^0-9]*(\d+)/i);
          if (payableMatches) {
            const payableAmount = parseInt(payableMatches[1]);
            expect(payableAmount).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  test('should handle exact slab amount boundaries', async ({ page }) => {
    // Test incomes that exactly hit slab boundaries
    const exactBoundaryTests = [
      {
        category: 'general',
        monthly: 87500,
        bonus: 0, // Gross 1,050,000 -> Para 27 exempt 350,000 -> 700,000 taxable (400K + 300K @ 10% = 30,000)
        expectedSlabRow: 'Next Tk3 lakh [4-7 lakh]',
        expectedTax: 30000
      },
      {
        category: 'female',
        monthly: 93750,
        bonus: 0, // Gross 1,125,000 -> Para 27 exempt 375,000 -> 750,000 taxable (450K + 300K @ 10% = 30,000)
        expectedSlabRow: 'Next Tk3 lakh [4.5-7.5 lakh]',
        expectedTax: 30000
      },
      {
        category: 'disabled',
        monthly: 103125,
        bonus: 0, // Gross 1,237,500 -> Para 27 exempt 412,500 -> 825,000 taxable (525K + 300K @ 10% = 30,000)
        expectedSlabRow: 'Next Tk3 lakh [5.25-8.25 lakh]',
        expectedTax: 30000
      }
    ];
    
    for (const testCase of exactBoundaryTests) {
      await selectCategory(page, testCase.category);
      await page.getByLabel('July basic').fill(String(testCase.monthly));
      await page.getByLabel('Bonus', { exact: true }).fill(String(testCase.bonus));
      await page.waitForTimeout(300);

      const cols = page.locator('.comparison-col');
      await expect(cols.nth(0)).toContainText(`Tax for FY 2025-2026 ${testCase.expectedTax}`);
      await expect(cols.nth(0)).toContainText(testCase.expectedSlabRow);
      await expect(cols.nth(1)).toContainText(`Tax for FY 2026-2027 ${testCase.expectedTax}`);
    }
  });

  test('should handle age-based category detection boundaries', async ({ page }) => {
    // Test senior citizen age boundary (if age input exists)
    const ageInputs = page.locator('input[type="number"]').filter({ hasText: /age/i });
    
    if (await ageInputs.count() > 0) {
      const ageTests = [
        { age: 64, description: 'Just below senior age' },
        { age: 65, description: 'Senior citizen threshold' },
        { age: 70, description: 'Clearly senior' }
      ];
      
      for (const test of ageTests) {
        await ageInputs.first().fill(test.age.toString());
        await page.waitForTimeout(500);
        
        // Set reasonable income
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('50000');
        await page.waitForTimeout(1000);
        
        // Check if tax calculations change based on age
        const h2Elements = page.locator('h2');
        const h2Texts = await h2Elements.allTextContents();
        const hasNumbers = h2Texts.every(text => /\d/.test(text));
        expect(hasNumbers).toBe(true);
      }
    }
  });
});