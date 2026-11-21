import { test, expect } from '@playwright/test';
import { selectCategory } from './helpers/category.js';
import {
  openCalculator,
  setMonthlySalary,
  setInvestment,
  calcPanel,
  panelTotal,
  rowAmount,
  totalTax,
  PANEL_2026,
} from './helpers/fa2026-flow.js';

// Salary maths used below (FY 2025-26 / 2026-27): taxable = gross - min(gross / 3, 500,000);
// tax-free threshold 400,000 for the general category; minimum tax 5,000 above the threshold.

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await openCalculator(page);
  });

  test.describe('Input Validation and Error Handling', () => {
    test('should handle extremely large salary values', async ({ page }) => {
      await setMonthlySalary(page, 9999999);

      await expect(page.getByLabel('July salary')).toHaveValue('9999999');
      await expect(panelTotal(page)).toHaveText(/^\d+$/);
      expect(await totalTax(page)).toBeGreaterThan(1000000);
      await expect(calcPanel(page).locator('table')).toBeVisible();
    });

    test('should handle zero and negative inputs correctly', async ({ page }) => {
      await setMonthlySalary(page, 0);
      await expect(panelTotal(page)).toHaveText('0');

      // Negative amounts are rejected: the field falls back to 0 and tax is never negative
      await setMonthlySalary(page, -1000);
      await expect(page.getByLabel('July basic', { exact: true })).toHaveValue('0');
      await expect(page.getByLabel('July salary')).toHaveValue('0');
      await expect(panelTotal(page)).toHaveText('0');
    });

    test('should handle decimal inputs appropriately', async ({ page }) => {
      // 55,555.55 x 12 = 666,666.6 gross, taxable ~444,444 -> slab tax ~4,444 < 5,000 minimum
      await setMonthlySalary(page, '55555.55');

      await expect(calcPanel(page).locator('.min-tax-notice')).toContainText('Minimum tax applied: BDT 5000');
      expect(await totalTax(page)).toBe(5000);
    });

    test('should handle very small values correctly', async ({ page }) => {
      // Minimum tax applies only above the tax-free threshold, so a tiny salary owes nothing
      await setMonthlySalary(page, 1);

      await expect(panelTotal(page)).toHaveText('0');
      await expect(calcPanel(page).locator('.min-tax-notice')).toHaveCount(0);
    });

    test('should handle rapid input changes without errors', async ({ page }) => {
      for (const value of ['10000', '50000', '100000', '25000', '75000']) {
        await setMonthlySalary(page, value);
      }

      // 75,000 x 12 = 900k gross -> 600k taxable -> 10% of 200k
      await expect(panelTotal(page)).toHaveText('20000');
    });

    test('should handle empty inputs gracefully', async ({ page }) => {
      await setMonthlySalary(page, 60000);
      await expect(panelTotal(page)).toHaveText('8000');

      await page.getByLabel('July basic', { exact: true }).clear();

      await expect(page.getByLabel('July salary')).toHaveValue('0');
      await expect(panelTotal(page)).toHaveText('0');
    });
  });

  test.describe('Edge Cases in Tax Calculations', () => {
    test('should handle income exactly at tax slab boundaries', async ({ page }) => {
      // 50,000 x 12 = 600k gross -> exactly 400,000 taxable = the general tax-free threshold
      await setMonthlySalary(page, 50000);
      await expect(panelTotal(page)).toHaveText('0');
      await expect(calcPanel(page).locator('.min-tax-notice')).toHaveCount(0);

      // One taka more per month crosses the threshold and the 5,000 minimum tax kicks in
      await setMonthlySalary(page, 50001);
      await expect(panelTotal(page)).toHaveText('5000');
      await expect(calcPanel(page).locator('.min-tax-notice')).toContainText('Minimum tax applied');
    });

    test('should handle maximum investment limits correctly', async ({ page }) => {
      // 150,000 x 12 = 1.8M gross -> 500k exemption cap -> 1.3M taxable -> 3% cap = 39,000
      await setMonthlySalary(page, 150000);
      await setInvestment(page, 'Stocks', 833333);

      const rebate = await rowAmount(page, /Tax rebate on investment/);
      expect(Math.abs(rebate)).toBe(39000);
      expect(Math.abs(rebate)).toBeLessThanOrEqual(750000); // statutory rebate ceiling
    });

    test('should handle profile changes with extreme values', async ({ page }) => {
      await setMonthlySalary(page, 500000);

      const totals = {};
      for (const profile of ['general', 'female', 'senior', 'disabled']) {
        await selectCategory(page, profile);
        await expect(calcPanel(page).locator('table')).toBeVisible();
        await expect(panelTotal(page)).toHaveText(/^\d+$/);
        totals[profile] = await totalTax(page);
        expect(totals[profile]).toBeGreaterThan(0);
      }

      // A higher tax-free threshold always lowers tax at this income
      expect(totals.disabled).toBeLessThan(totals.general);
    });

    test('should handle age boundary cases', async ({ page }) => {
      const age = page.getByLabel('Age', { exact: true });
      const notice = page.getByText('You qualify for Senior Citizen category');

      await age.fill('64');
      await expect(notice).toHaveCount(0);

      await age.fill('65');
      await expect(notice).toBeVisible();

      await setMonthlySalary(page, 60000);
      await expect(panelTotal(page)).toHaveText('8000');
    });
  });

  test.describe('Browser and Device Compatibility', () => {
    test('should work with keyboard-only navigation', async ({ page }) => {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

      await page.getByLabel('July basic', { exact: true }).focus();
      await page.keyboard.type('60000');
      await page.keyboard.press('Tab');

      await expect(page.getByLabel('July house', { exact: true })).toBeFocused();
      await expect(panelTotal(page)).toHaveText('8000');
    });

    test('should handle copy-paste operations', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const salaryInput = page.getByLabel('July basic', { exact: true });

      await salaryInput.click();
      await page.keyboard.type('75000');
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');

      await salaryInput.clear();
      await expect(page.getByLabel('July salary')).toHaveValue('0');
      await page.keyboard.press('ControlOrMeta+V');

      await expect(salaryInput).toHaveValue('75000');
      await expect(panelTotal(page)).toHaveText('20000');
    });

    test('should handle browser zoom levels', async ({ page }) => {
      for (const zoom of [0.5, 0.75, 1.0, 1.25, 1.5]) {
        await page.setViewportSize({
          width: Math.floor(1280 * zoom),
          height: Math.floor(720 * zoom),
        });

        await setMonthlySalary(page, 60000);

        await expect(panelTotal(page)).toBeVisible();
        await expect(panelTotal(page)).toHaveText('8000');
      }
    });

    test.describe('touch device', () => {
      test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

      test('should work with touch gestures on mobile', async ({ page }) => {
        const salaryInput = page.getByLabel('July basic', { exact: true });

        await salaryInput.tap();
        await salaryInput.fill('60000');

        await page.touchScreen.tap(200, 300);
        await page.evaluate(() => window.scrollBy(0, 200));

        await expect(panelTotal(page)).toHaveText('8000');
      });
    });
  });

  test.describe('Data Consistency and State Management', () => {
    test('should maintain calculation consistency across navigation', async ({ page }) => {
      // 65,000 x 12 = 780k gross -> 520k taxable -> 10% of 120k
      await setMonthlySalary(page, 65000);
      await expect(panelTotal(page)).toHaveText('12000');

      const siteNav = page.getByRole('navigation', { name: 'Site pages' });
      await siteNav.getByRole('link', { name: 'Blog' }).click();
      await expect(page).toHaveURL(/\/blog$/);

      await siteNav.getByRole('link', { name: 'Calculator' }).click();
      await expect(page).toHaveURL(/\/$/);

      await expect(page.getByLabel('July salary')).toHaveValue('65000');
      await expect(panelTotal(page)).toHaveText('12000');
    });

    test('should handle multiple browser tabs correctly', async ({ context, page }) => {
      await setMonthlySalary(page, 55000);
      // State is saved to localStorage on a 200ms debounce
      await page.waitForFunction(() => localStorage.getItem('app')?.includes('55000'));

      const newPage = await context.newPage();
      await newPage.goto('/');
      await newPage.waitForLoadState('networkidle');

      await expect(newPage.getByLabel('July basic', { exact: true })).toHaveValue('55000');
      await expect(newPage.getByLabel('July salary')).toHaveValue('55000');

      await newPage.close();
    });

    test('should handle localStorage corruption gracefully', async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      // The app persists its whole state under the "app" key
      await page.evaluate(() => {
        localStorage.setItem('app', 'invalid-json{');
      });
      await page.reload();
      await expect(page.locator('main')).toBeVisible();

      await setMonthlySalary(page, 60000);
      await expect(panelTotal(page)).toHaveText('8000');
      expect(pageErrors).toEqual([]);
    });

    test('should handle quota exceeded errors', async ({ page }) => {
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1000000); // 1MB string
          for (let i = 0; i < 6; i++) {
            localStorage.setItem(`large-data-${i}`, largeData);
          }
        } catch (e) {
          // Expected to fail once the quota is exceeded
        }
      });

      // The calculator keeps working even though it can no longer save
      await setMonthlySalary(page, 60000);
      await expect(panelTotal(page)).toHaveText('8000');

      await page.evaluate(() => {
        localStorage.clear();
      });
    });
  });

  test.describe('Performance and Stress Testing', () => {
    test('should handle rapid successive calculations', async ({ page }) => {
      const salaryInput = page.getByLabel('July basic', { exact: true });

      for (let i = 0; i < 20; i++) {
        await salaryInput.fill((30000 + i * 5000).toString());
      }

      // Last value 125,000 x 12 = 1.5M gross -> 1.0M taxable -> 30,000 + 45,000
      await expect(panelTotal(page)).toHaveText('75000');
    });

    test('should handle memory pressure gracefully', async ({ page }) => {
      await page.evaluate(() => {
        const largeArray = [];
        for (let i = 0; i < 10000; i++) {
          largeArray.push({ id: i, data: 'x'.repeat(1000), timestamp: Date.now() });
        }
        window.largeData = largeArray;
      });

      // 70,000 x 12 = 840k gross -> 560k taxable -> 10% of 160k
      await setMonthlySalary(page, 70000);
      await expect(panelTotal(page)).toHaveText('16000');

      await page.evaluate(() => {
        delete window.largeData;
      });
    });
  });
});
