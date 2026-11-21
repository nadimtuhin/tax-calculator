import { test, expect } from '@playwright/test';
import { selectCategory } from './helpers/category.js';
import {
  FY_2025,
  FY_2026,
  calcPanel,
  rowAmount,
  setMonthly,
  expectHeadingAmount,
} from './helpers/fa2026-calc-ui.js';

// Section 78 rebate = min(3% of taxable income, 10% of eligible investment, 750,000).
// Taxable salary = gross - min(gross / 3, 500,000).

const setInvestment = (page, name, amount) =>
  page.getByRole('spinbutton', { name: `${name} amount`, exact: true }).fill(String(amount));

const expectPanelRow = (page, fy, label, amount) =>
  expect.poll(() => rowAmount(page, fy, label)).toBe(amount);

const expectBothYears = async (page, amount) => {
  await expectHeadingAmount(page, FY_2025, amount);
  await expectHeadingAmount(page, FY_2026, amount);
};

test.describe('Investment and TDS Workflow Testing', () => {
  test.beforeEach(async ({ page }) => {
    // The star prompt appears after 1.5s and would cover the form
    await page.addInitScript(() => localStorage.setItem('tax-calculator-never-star', 'true'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(calcPanel(page, FY_2025)).toBeVisible();
  });

  test.describe('Investment Rebate Calculations', () => {
    test('should calculate Section 78 10% rebate on capped DPS investment', async ({ page }) => {
      await setMonthly(page, 'basic', 100000); // 1.2M gross -> 800k taxable (3% = 24,000)
      await setInvestment(page, 'DPS', 150000); // DPS capped at 120,000 -> 10% = 12,000

      const rebatePill = page.locator('.section-pill-accent').filter({ hasText: /Rebate/ });
      await expect(rebatePill).toContainText('12,000');
      // Slab tax 45,000 - 12,000
      await expectBothYears(page, 33000);
    });

    test('should apply maximum rebate cap correctly', async ({ page }) => {
      await setMonthly(page, 'basic', 100000); // taxable 800k -> 3% cap = 24,000
      await setInvestment(page, 'Stocks', 500000); // 10% of 500,000 = 50,000, above the 3% cap

      await expectPanelRow(page, FY_2025, 'Tax rebate on investment', -24000);
      await expectPanelRow(page, FY_2026, 'Tax rebate on investment', -24000);
      await expectBothYears(page, 21000);
    });

    test('should handle multiple investment types correctly', async ({ page }) => {
      await setMonthly(page, 'basic', 80000); // 960k gross -> 640k taxable, slab tax 24,000
      await setInvestment(page, 'DPS', 50000);
      await setInvestment(page, 'Stocks', 30000);
      await setInvestment(page, 'Mutual fund', 25000);
      await setInvestment(page, 'Savings certificate', 40000);

      // 145,000 eligible -> 10% = 14,500 (below the 3% cap of 19,200)
      await expectPanelRow(page, FY_2025, 'Tax rebate on investment', -14500);
      await expectBothYears(page, 9500);
    });

    test('should calculate rebate correctly for different taxpayer profiles', async ({ page }) => {
      await setMonthly(page, 'basic', 100000);
      await setInvestment(page, 'DPS', 100000); // 10% = 10,000 under every profile

      for (const profile of ['general', 'female', 'senior', 'disabled']) {
        await selectCategory(page, profile);
        await expectPanelRow(page, FY_2025, 'Tax rebate on investment', -10000);
      }
    });
  });

  test.describe('TDS (Tax Deducted at Source) Calculations', () => {
    test('should deduct TDS from final tax liability', async ({ page }) => {
      await setMonthly(page, 'basic', 60000); // total tax 8,000
      await setMonthly(page, 'TDS', 500); // 500 x 12 = 6,000

      await expectPanelRow(page, FY_2025, 'Tax deducted at source', -6000);
      await expectPanelRow(page, FY_2025, 'Payable', 2000);
      await expectPanelRow(page, FY_2026, 'Payable', 2000);
    });

    test('should handle TDS exceeding tax liability', async ({ page }) => {
      await setMonthly(page, 'basic', 60000); // total tax 8,000
      await setMonthly(page, 'TDS', 1000); // 12,000 deducted

      await expectPanelRow(page, FY_2025, 'Tax deducted at source', -12000);
      // Payable is floored at zero; there is no negative refund row
      await expectPanelRow(page, FY_2025, 'Payable', 0);
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should calculate TDS for different income sources', async ({ page }) => {
      await setMonthly(page, 'basic', 50000);
      await page.getByLabel('Bonus', { exact: true }).fill('90000'); // gross 690k -> taxable 460k -> 6,000 tax
      await setMonthly(page, 'TDS', 100); // 1,200 a year

      await expectHeadingAmount(page, FY_2025, 6000);
      await expectPanelRow(page, FY_2025, 'Tax deducted at source', -1200);
      await expectPanelRow(page, FY_2025, 'Payable', 4800);
    });
  });

  test.describe('Combined Investment and TDS Scenarios', () => {
    test('should calculate final payable with both investment and TDS', async ({ page }) => {
      await setMonthly(page, 'basic', 90000); // 1.08M gross -> 720k taxable -> slab tax 33,000
      await setInvestment(page, 'DPS', 120000); // rebate 12,000
      await setMonthly(page, 'TDS', 1000); // 12,000 a year

      await expectPanelRow(page, FY_2025, 'Tax rebate on investment', -12000);
      await expectBothYears(page, 21000);
      await expectPanelRow(page, FY_2025, 'Payable', 9000);
      await expectPanelRow(page, FY_2026, 'Payable', 9000);
    });

    test('should update calculations in real-time', async ({ page }) => {
      await setMonthly(page, 'basic', 100000);
      await expectPanelRow(page, FY_2025, 'Payable', 45000);

      await setInvestment(page, 'DPS', 80000); // rebate 8,000
      await expectPanelRow(page, FY_2025, 'Payable', 37000);

      await setMonthly(page, 'TDS', 1000); // 12,000 a year
      await expectPanelRow(page, FY_2025, 'Payable', 25000);
    });

    test('should handle edge case of zero tax liability', async ({ page }) => {
      await setMonthly(page, 'basic', 25000); // 300k gross -> 200k taxable, below threshold
      await setInvestment(page, 'DPS', 50000);
      await setMonthly(page, 'TDS', 250);

      await expectBothYears(page, 0);
      await expect(page.locator('.min-tax-notice')).toHaveCount(0);
      await expectPanelRow(page, FY_2025, 'Payable', 0);
    });
  });

  test.describe('Complex Calculation Scenarios', () => {
    test('should handle maximum investment with all allowances', async ({ page }) => {
      await setMonthly(page, 'basic', 200000); // 2.4M gross, exemption 500k -> taxable 1.9M
      await selectCategory(page, 'female'); // threshold 4.5 lakh -> slab tax 252,500

      await setInvestment(page, 'DPS', 200000); // capped at 120,000
      await setInvestment(page, 'Stocks', 150000);
      await setInvestment(page, 'Mutual fund', 100000);
      await setInvestment(page, 'Savings certificate', 75000);
      await setMonthly(page, 'TDS', 12500); // 150,000 a year

      // 445,000 eligible -> 10% = 44,500 (3% of taxable would allow 57,000)
      await expectPanelRow(page, FY_2025, 'Tax rebate on investment', -44500);
      await expectBothYears(page, 208000);
      await expectPanelRow(page, FY_2025, 'Payable', 58000);
    });

    test('should validate calculation accuracy across profile changes', async ({ page }) => {
      await setMonthly(page, 'basic', 100000); // taxable 800k
      await setInvestment(page, 'DPS', 100000); // rebate 10,000

      // slab tax 45,000 / 37,500 / 27,500 minus the 10,000 rebate
      const expected = { general: 35000, female: 27500, disabled: 17500 };
      for (const [profile, tax] of Object.entries(expected)) {
        await selectCategory(page, profile);
        await expectBothYears(page, tax);
      }
    });
  });
});
