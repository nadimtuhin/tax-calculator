import { test, expect } from '@playwright/test';
import { openCalculator, setMonthlySalary, totalTax, PANEL_2025 } from './helpers/fa2026-flow.js';

test.describe('smoke', () => {
  test('home loads and FY 2025-26 general, July basic 100000 gives total payable 45000', async ({ page }) => {
    await openCalculator(page);
    await expect(page).toHaveTitle(/Bangladesh Tax calculator/);
    await setMonthlySalary(page, 100000);
    await expect.poll(() => totalTax(page, PANEL_2025)).toBe(45000);
  });

  test('blog index loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('a guide loads by direct URL', async ({ page }) => {
    await page.goto('/blog/fiscal-year-vs-assessment-year-bangladesh');
    await expect(page.locator('h1')).toContainText(/fiscal year/i);
  });

  test('referrals loads', async ({ page }) => {
    await page.goto('/referrals');
    await expect(page.locator('h1')).toBeVisible();
  });
});
