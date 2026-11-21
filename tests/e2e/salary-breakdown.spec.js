import { test, expect } from '@playwright/test';
import {
  FY_2025,
  calcPanel,
  setMonthly,
  monthlyInput,
  expectHeadingAmount,
} from './helpers/fa2026-calc-ui.js';

const salaryGrid = (page) => page.getByRole('region', { name: 'Monthly salary grid' });
const grossPill = (page) => page.locator('.section-pill').filter({ hasText: /^Gross/ });

test.describe('Salary Breakdown Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
    await expect(salaryGrid(page)).toBeVisible();
  });

  test('should display salary breakdown table', async ({ page }) => {
    const table = salaryGrid(page).locator('table.salary-grid');
    await expect(table).toBeVisible();
    // 12 month rows + Bonus + Others (Additional Income)
    await expect(table.locator('tbody tr')).toHaveCount(14);
    await expect(table.locator('tbody tr').first()).toContainText('July');
    await expect(table.locator('tbody tr').nth(11)).toContainText('June');
  });

  test('should show total salary input', async ({ page }) => {
    // Monthly salary is derived from the breakdown parts, so it is read-only
    const julySalary = monthlyInput(page, 'July', 'salary');
    await expect(julySalary).toBeVisible();
    await expect(julySalary).toBeDisabled();

    // The editable entry points are the breakdown parts
    await expect(monthlyInput(page, 'July', 'basic')).toBeEditable();
  });

  test('should allow entering total salary amount', async ({ page }) => {
    await setMonthly(page, 'basic', 50000);
    await expect(monthlyInput(page, 'July', 'basic')).toHaveValue('50000');

    // Salary is the sum of the breakdown parts; gross = 12 months
    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('50000');
    await expect(grossPill(page)).toContainText('৳600,000');
  });

  test('should show salary breakdown components', async ({ page }) => {
    const headers = salaryGrid(page).locator('thead th');
    for (const name of ['Salary', 'TDS*', 'Basic', 'House', 'Medical', 'Transport', 'Others']) {
      await expect(headers.filter({ hasText: name })).toHaveCount(1);
    }
    for (const part of ['basic', 'house', 'medical', 'transport', 'others']) {
      await expect(monthlyInput(page, 'July', part)).toBeVisible();
    }
  });

  test('should allow editing breakdown amounts', async ({ page }) => {
    await setMonthly(page, 'basic', 20000);
    await setMonthly(page, 'house', 10000);
    await expect(monthlyInput(page, 'July', 'basic')).toHaveValue('20000');
    await expect(monthlyInput(page, 'July', 'house')).toHaveValue('10000');

    // Salary sums the parts, and a July edit carries to every following month
    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('30000');
    await expect(monthlyInput(page, 'June', 'salary')).toHaveValue('30000');

    // Editing a later month overrides only that month onwards
    await monthlyInput(page, 'January', 'house').fill('0');
    await expect(monthlyInput(page, 'December', 'salary')).toHaveValue('30000');
    await expect(monthlyInput(page, 'January', 'salary')).toHaveValue('20000');
    await expect(monthlyInput(page, 'June', 'salary')).toHaveValue('20000');
  });

  test('should validate input constraints', async ({ page }) => {
    const julyBasic = monthlyInput(page, 'July', 'basic');
    await expect(julyBasic).toHaveAttribute('min', '0');
    await expect(julyBasic).toHaveAttribute('max', '999999');
    await expect(julyBasic).toHaveAttribute('type', 'number');

    // A negative entry must not produce negative tax
    await julyBasic.fill('-1000');
    await expectHeadingAmount(page, FY_2025, 0);
  });

  test('should update tax calculations when breakdown changes', async ({ page }) => {
    const amount = calcPanel(page, FY_2025).locator('.calc-heading-amount');
    await expect(amount).toHaveText('0');

    // 100,000 x 12 gross, exemption 400,000 -> taxable 800,000 -> tax 45,000
    await setMonthly(page, 'basic', 100000);
    await expectHeadingAmount(page, FY_2025, 45000);

    // Splitting the same salary across parts keeps the same total tax
    await setMonthly(page, 'basic', 60000);
    await setMonthly(page, 'house', 40000);
    await expectHeadingAmount(page, FY_2025, 45000);

    // Adding another part raises it: gross 1.32M, exemption 440k -> taxable 880k
    // 400k at 0 + 300k at 10% + 180k at 15% = 30,000 + 27,000
    await setMonthly(page, 'medical', 10000);
    await expectHeadingAmount(page, FY_2025, 57000);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Salary column is disabled, so Tab from TDS lands on Basic
    await monthlyInput(page, 'July', 'TDS').focus();
    await page.keyboard.press('Tab');

    const julyBasic = monthlyInput(page, 'July', 'basic');
    await expect(julyBasic).toBeFocused();

    await page.keyboard.type('25000');
    await page.keyboard.press('Enter');

    await expect(julyBasic).toHaveValue('25000');
    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('25000');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // The grid scrolls sideways inside its own region rather than breaking the layout
    await expect(salaryGrid(page).locator('table.salary-grid')).toBeVisible();
    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasPageOverflow).toBeFalsy();

    const julyBasic = monthlyInput(page, 'July', 'basic');
    await julyBasic.scrollIntoViewIfNeeded();
    await julyBasic.fill('45000');
    await expect(julyBasic).toHaveValue('45000');
  });

  test('should persist breakdown data on page reload', async ({ page }) => {
    await setMonthly(page, 'basic', 55000);
    await setMonthly(page, 'house', 5000);
    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('60000');

    await page.reload();
    await expect(salaryGrid(page)).toBeVisible();

    await expect(monthlyInput(page, 'July', 'basic')).toHaveValue('55000');
    await expect(monthlyInput(page, 'July', 'house')).toHaveValue('5000');
    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('60000');
  });

  test('should handle currency formatting correctly', async ({ page }) => {
    await setMonthly(page, 'basic', 75000);

    // Gross pill shows the BDT sign and thousands separators
    await expect(grossPill(page)).toHaveText(/Gross\s*৳900,000/);
    await expect(page.locator('.money-prefix').first()).toHaveText('৳');
    await expect(page.locator('.money-prefix').first()).toBeVisible();
  });

  test('should calculate breakdown totals correctly', async ({ page }) => {
    await setMonthly(page, 'basic', 60000);
    await setMonthly(page, 'house', 20000);
    await setMonthly(page, 'medical', 10000);

    await expect(monthlyInput(page, 'July', 'salary')).toHaveValue('90000');
    await expect(monthlyInput(page, 'June', 'salary')).toHaveValue('90000');
    // 90,000 x 12 months
    await expect(grossPill(page)).toContainText('৳1,080,000');

    // Bonus and Others add to gross on top of the monthly total
    await page.getByRole('spinbutton', { name: 'Bonus', exact: true }).fill('100000');
    await page.getByRole('spinbutton', { name: 'Others', exact: true }).fill('20000');
    await expect(grossPill(page)).toContainText('৳1,200,000');
  });
});
