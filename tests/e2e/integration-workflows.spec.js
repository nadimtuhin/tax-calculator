import { test, expect } from '@playwright/test';
import { selectCategory, selectedCategory } from './helpers/category.js';
import {
  FY_2025,
  FY_2026,
  calcPanel,
  rowAmount,
  setMonthly,
  expectHeadingAmount,
} from './helpers/fa2026-calc-ui.js';

// Taxable salary = gross - min(gross / 3, 500,000). FY 2025-26 and FY 2026-27 share Schedule 1.

const setInvestment = (page, name, amount) =>
  page.getByRole('spinbutton', { name: `${name} amount`, exact: true }).fill(String(amount));

const expectBothYears = async (page, amount) => {
  await expectHeadingAmount(page, FY_2025, amount);
  await expectHeadingAmount(page, FY_2026, amount);
};

const expectPayable = (page, amount) => expect.poll(() => rowAmount(page, FY_2025, 'Payable')).toBe(amount);

test.describe('End-to-End User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(calcPanel(page, FY_2025)).toBeVisible();
  });

  test('complete tax calculation workflow for general taxpayer', async ({ page }) => {
    await selectCategory(page, 'general');
    await setMonthly(page, 'basic', 100000); // 1.2M gross -> 800k taxable -> slab tax 45,000
    await setInvestment(page, 'DPS', 100000); // rebate 10,000
    await setMonthly(page, 'TDS', 2000); // 24,000 a year

    const firstSlab = calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ }).first();
    await expect(firstSlab).toContainText('First Tk4 lakh [0-4 lakh]');
    await expectBothYears(page, 35000);
    await expectPayable(page, 11000);
  });

  test('complete tax calculation workflow for female taxpayer', async ({ page }) => {
    await selectCategory(page, 'female');
    await setMonthly(page, 'basic', 100000); // taxable 800k -> slab tax 37,500 with 4.5 lakh threshold
    await setInvestment(page, 'DPS', 100000); // rebate 10,000
    await setMonthly(page, 'TDS', 2000); // 24,000 a year

    const firstSlab = calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ }).first();
    await expect(firstSlab).toContainText('First Tk4.5 lakh [0-4.5 lakh]');
    await expectBothYears(page, 27500);
    await expectPayable(page, 3500);
  });

  test('salary breakdown to tax calculation workflow', async ({ page }) => {
    // July salary is the derived sum of the breakdown parts; edits copy to every later month
    await setMonthly(page, 'basic', 50000);
    await setMonthly(page, 'house', 20000);
    await setMonthly(page, 'medical', 5000);

    await expect(page.getByRole('spinbutton', { name: 'July salary', exact: true })).toHaveValue('75000');
    await expect(page.getByRole('spinbutton', { name: 'December salary', exact: true })).toHaveValue('75000');

    // 75,000 x 12 = 900,000 gross -> taxable 600,000 -> 200,000 at 10%
    await expectBothYears(page, 20000);
  });

  test('profile change impact on existing calculations', async ({ page }) => {
    await setMonthly(page, 'basic', 80000); // taxable 640k

    // Thresholds 4 / 4.5 / 5.25 lakh, 10% on the 3 lakh above each
    const expected = { general: 24000, female: 19000, disabled: 11500 };
    for (const [profile, tax] of Object.entries(expected)) {
      await selectCategory(page, profile);
      await expectBothYears(page, tax);
    }
  });

  test('investment rebate calculation workflow', async ({ page }) => {
    await setMonthly(page, 'basic', 100000); // slab tax 45,000

    await setInvestment(page, 'DPS', 50000); // 10% = 5,000
    await expectBothYears(page, 40000);

    await setInvestment(page, 'DPS', 100000); // 10% = 10,000
    await expectBothYears(page, 35000);

    await setInvestment(page, 'DPS', 150000); // DPS capped at 120,000 -> 12,000
    await expectBothYears(page, 33000);
  });

  test('minimum tax application workflow', async ({ page }) => {
    await page.locator('#profile-location').selectOption('dhaka');

    // 20,000 x 12 = 240k gross, below the 4 lakh threshold: nothing owed, no minimum tax
    await setMonthly(page, 'basic', 20000);
    await expectBothYears(page, 0);
    await expect(page.locator('.min-tax-notice')).toHaveCount(0);

    // 50,500 x 12 = 606k gross -> taxable 404k: slab tax 400 is lifted to the 5,000 minimum
    await setMonthly(page, 'basic', 50500);
    await expectBothYears(page, 5000);
    await expect(calcPanel(page, FY_2025).locator('.min-tax-notice')).toContainText('Minimum tax applied: BDT 5000');

    // FY 2025-26 and FY 2026-27 use one unified minimum tax, also outside the cities
    await page.locator('#profile-location').selectOption('district');
    await expectBothYears(page, 5000);
  });

  test('complete application state persistence workflow', async ({ page }) => {
    await selectCategory(page, 'female');
    await setMonthly(page, 'basic', 100000);
    await setInvestment(page, 'DPS', 100000);
    await expectBothYears(page, 27500);

    // Navigate away and back through the site navigation
    const siteNav = page.getByRole('navigation', { name: 'Site pages' });
    await siteNav.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await siteNav.getByRole('link', { name: 'Calculator' }).click();

    const expectRestored = async () => {
      await expect(page.getByRole('spinbutton', { name: 'July basic', exact: true })).toHaveValue('100000');
      await expect(page.getByRole('spinbutton', { name: 'DPS amount', exact: true })).toHaveValue('100000');
      expect(await selectedCategory(page)).toBe('female');
      await expectBothYears(page, 27500);
    };
    await expectRestored();

    // Wait for the persisted write before reloading
    await page.waitForFunction(() => localStorage.getItem('0.8')?.includes('100000'));
    await page.reload();
    await expectRestored();
  });

  test('responsive design workflow across devices', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await setMonthly(page, 'basic', 65000); // 780k gross -> 520k taxable -> 120,000 at 10%
    await expectHeadingAmount(page, FY_2025, 12000);

    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await expectHeadingAmount(page, FY_2025, 12000);
    }

    // The calculator still accepts input on the mobile viewport
    const mobileInput = page.getByRole('spinbutton', { name: 'July basic', exact: true });
    await mobileInput.scrollIntoViewIfNeeded();
    await mobileInput.fill('55000');
    await expect(mobileInput).toHaveValue('55000');
  });

  test('accessibility workflow with keyboard navigation', async ({ page }) => {
    // Keyboard-only: type a salary, then choose a category with the arrow keys
    await page.getByRole('spinbutton', { name: 'July basic', exact: true }).focus();
    await page.keyboard.type('80000');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('spinbutton', { name: 'July house', exact: true })).toBeFocused();
    await expectBothYears(page, 24000);

    await page.locator('input[type="radio"][name="taxpayer-category"][value="general"]').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => selectedCategory(page)).toBe('female');
    await expectBothYears(page, 19000);
  });
});
