import { test, expect } from '@playwright/test';
import { selectCategory } from './helpers/category.js';
import {
  FY_2025,
  calcPanel,
  panelRow,
  rowAmount,
  setMonthly,
  expectHeadingAmount,
} from './helpers/fa2026-calc-ui.js';

// Monthly basic 100,000 -> gross 1,200,000, Para 27 exemption 400,000, taxable 800,000.
const HIGH_MONTHLY_BASIC = 100000;

test.describe('Tax Calculation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
    await expect(calcPanel(page, FY_2025)).toBeVisible();
  });

  test('should display tax calculation table', async ({ page }) => {
    const panel = calcPanel(page, FY_2025);
    const table = panel.locator('table.invoice');
    await expect(table).toBeVisible();

    const headerRow = table.locator('tr').first();
    await expect(headerRow).toContainText('Income (per year)');
    await expect(headerRow).toContainText('New rate [%]');
    await expect(headerRow).toContainText('Tax (BDT)');
  });

  test('should show progressive tax slabs for general taxpayer', async ({ page }) => {
    await selectCategory(page, 'general');

    const slabRows = calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ });
    await expect(slabRows).toHaveCount(6);

    // FY 2025-26 general threshold is 4 lakh at 0%, then 10% (5% bracket removed)
    await expect(slabRows.nth(0)).toContainText('First Tk4 lakh [0-4 lakh]');
    await expect(slabRows.nth(0).locator('td').nth(1)).toHaveText('0');
    await expect(slabRows.nth(1)).toContainText('Next Tk3 lakh [4-7 lakh]');
    await expect(slabRows.nth(1).locator('td').nth(1)).toHaveText('10');
  });

  test('should calculate tax correctly for income above threshold', async ({ page }) => {
    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);

    // taxable 800,000: 4L@0% + 3L@10% (30,000) + 1L@15% (15,000)
    await expectHeadingAmount(page, FY_2025, 45000);
    expect(await rowAmount(page, FY_2025, 'Slab tax (gross)')).toBe(45000);
  });

  test('should apply minimum tax for low income', async ({ page }) => {
    // 51,250 x 12 = 615,000 gross -> taxable 410,000: slab tax 1,000 < minimum 5,000
    await setMonthly(page, 'basic', 51250);

    await expectHeadingAmount(page, FY_2025, 5000);
    await expect(calcPanel(page, FY_2025).locator('.min-tax-notice')).toContainText(
      'Minimum tax applied: BDT 5000'
    );
  });

  test('should calculate different tax for different profiles', async ({ page }) => {
    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);

    await selectCategory(page, 'general');
    await expectHeadingAmount(page, FY_2025, 45000);

    // Female threshold is 4.5 lakh: 3L@10% (30,000) + 0.5L@15% (7,500)
    await selectCategory(page, 'female');
    await expectHeadingAmount(page, FY_2025, 37500);
  });

  test('should show tax deduction at source (TDS)', async ({ page }) => {
    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);
    await page.getByRole('spinbutton', { name: 'July TDS', exact: true }).fill('5000');

    const tdsRow = panelRow(page, FY_2025, 'Tax deducted at source');
    await expect(tdsRow).toBeVisible();
    // 5,000 x 12 months
    await expect(tdsRow).toContainText('-60000');
    expect(await rowAmount(page, FY_2025, 'Payable')).toBe(0); // payable is floored at 0 when TDS exceeds total tax
  });

  test('should show investment rebate calculation', async ({ page }) => {
    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);
    await page.getByRole('spinbutton', { name: 'DPS amount', exact: true }).fill('100000');

    const rebateRow = panelRow(page, FY_2025, 'Tax rebate on investment');
    await expect(rebateRow).toBeVisible();
    // min(3% x 800,000 = 24,000, 10% x 100,000 = 10,000, 750,000)
    await expect.poll(() => rowAmount(page, FY_2025, 'Tax rebate on investment')).toBe(-10000);
    await expectHeadingAmount(page, FY_2025, 35000);
  });

  test('should calculate final payable amount', async ({ page }) => {
    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);
    await page.getByRole('spinbutton', { name: 'July TDS', exact: true }).fill('2000');
    await page.getByRole('spinbutton', { name: 'DPS amount', exact: true }).fill('100000');

    const payableRow = panelRow(page, FY_2025, 'Payable');
    await expect(payableRow).toBeVisible();
    // total tax 45,000 - 10,000 rebate = 35,000; TDS 24,000 -> payable 11,000
    await expect.poll(() => rowAmount(page, FY_2025, 'Payable')).toBe(11000);
  });

  test('should update calculations in real-time', async ({ page }) => {
    // 30,000 x 12 = 360,000 gross -> taxable 240,000, below threshold
    await setMonthly(page, 'basic', 30000);
    await expectHeadingAmount(page, FY_2025, 0);

    await setMonthly(page, 'basic', HIGH_MONTHLY_BASIC);
    await expectHeadingAmount(page, FY_2025, 45000);
  });

  test('should handle edge cases at slab boundaries', async ({ page }) => {
    // 50,000 x 12 = 600,000 gross -> taxable exactly 400,000 (the general threshold)
    await setMonthly(page, 'basic', 50000);

    await expectHeadingAmount(page, FY_2025, 0);
    const firstSlab = calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ }).first();
    await expect(firstSlab.locator('td').last()).toHaveText('0');
    // Minimum tax applies only above the threshold
    await expect(calcPanel(page, FY_2025).locator('.min-tax-notice')).toHaveCount(0);
  });

  test('should show tax slabs with ranges', async ({ page }) => {
    const slabRows = calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ });
    await expect(slabRows).toHaveCount(6);

    for (let i = 0; i < 3; i++) {
      const slabText = await slabRows.nth(i).innerText();
      expect(slabText).toMatch(/\[[\d.]+-[\d.]+ lakh\]/);
    }
  });

  test('should validate input ranges', async ({ page }) => {
    const julyBasic = page.getByRole('spinbutton', { name: 'July basic', exact: true });

    await julyBasic.fill('-1000');
    // Negative salary must never produce negative or NaN tax
    await expectHeadingAmount(page, FY_2025, 0);

    await julyBasic.fill('999999');
    // 999,999 x 12 gross, exemption capped at 500,000 -> large but finite positive tax
    await expect.poll(() => rowAmount(page, FY_2025, 'Slab tax (gross)')).toBeGreaterThan(0);
    const total = await rowAmount(page, FY_2025, 'Total tax');
    expect(Number.isFinite(total)).toBeTruthy();
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(calcPanel(page, FY_2025).locator('table.invoice')).toBeVisible();

    const julyBasic = page.getByRole('spinbutton', { name: 'July basic', exact: true });
    await julyBasic.scrollIntoViewIfNeeded();
    await julyBasic.fill('50000');
    await expect(julyBasic).toHaveValue('50000');
  });

  test('should preserve calculations on page reload', async ({ page }) => {
    await setMonthly(page, 'basic', 60000);
    await expectHeadingAmount(page, FY_2025, 8000);
    const originalTax = await calcPanel(page, FY_2025).locator('.calc-heading-amount').innerText();

    await page.reload();
    await expect(page.locator('#app')).toBeVisible();

    await expect(page.getByRole('spinbutton', { name: 'July basic', exact: true })).toHaveValue('60000');
    await expect(calcPanel(page, FY_2025).locator('.calc-heading-amount')).toHaveText(originalTax);
  });
});
