import { test, expect } from '@playwright/test';
import { categoryRadios, selectCategory } from './helpers/category.js';
import { grossPill, formatBdt, setMonthlyBasic, setMonthlyTds, setInvestment, calcHeadings } from './helpers/fa2026-inputs.js';

test.describe('Performance Testing - Dual Tax Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Close star modal if it still appears
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    // Page should already be loaded from beforeEach, but let's reload to measure
    await page.reload();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Check that both calculation sections are visible
    const comparisonSection = page.locator('.tax-comparison-section');
    await expect(comparisonSection).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds even on slower connections
    expect(loadTime).toBeLessThan(5000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should calculate taxes quickly when salary input changes', async ({ page }) => {
    const calculationTimes = [];
    const testSalaries = [30000, 50000, 75000, 100000, 150000];

    for (const salary of testSalaries) {
      const startTime = Date.now();
      await setMonthlyBasic(page, salary);
      await expect(grossPill(page)).toContainText(formatBdt(salary * 12), { timeout: 2000 });
      calculationTimes.push(Date.now() - startTime);
    }

    const avgTime = calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length;
    expect(avgTime).toBeLessThan(500);

    const maxTime = Math.max(...calculationTimes);
    expect(maxTime).toBeLessThan(1000);

    console.log(`Average calculation time: ${avgTime.toFixed(2)}ms`);
    console.log(`Max calculation time: ${maxTime}ms`);
  });

  test('should handle rapid input changes without performance degradation', async ({ page }) => {
    const startTime = Date.now();
    const rapidInputs = [25000, 35000, 45000, 55000, 65000, 75000, 85000];

    for (const salary of rapidInputs) {
      await setMonthlyBasic(page, salary);
      await page.waitForTimeout(50);
    }

    await expect(grossPill(page)).toContainText(formatBdt(85000 * 12), { timeout: 2000 });

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(2000);

    console.log(`Rapid input changes completed in: ${totalTime}ms`);
  });

  test('should handle taxpayer profile changes efficiently', async ({ page }) => {
    await expect(categoryRadios(page).first()).toBeAttached();
    await setMonthlyBasic(page, 60000);
    await expect(grossPill(page)).toContainText(formatBdt(60000 * 12));

    const profileChangeTimes = [];
    const categories = ['general', 'female', 'disabled', 'freedom_fighter', 'general'];

    for (const category of categories) {
      const startTime = Date.now();

      await selectCategory(page, category);
      await expect(
        page.locator(`input[type="radio"][name="taxpayer-category"][value="${category}"]`)
      ).toBeChecked({ timeout: 1500 });
      await expect(calcHeadings(page)).toHaveCount(2, { timeout: 1500 });

      profileChangeTimes.push(Date.now() - startTime);
    }

    const avgTime = profileChangeTimes.reduce((a, b) => a + b, 0) / profileChangeTimes.length;
    expect(avgTime).toBeLessThan(300);

    console.log(`Average profile change time: ${avgTime.toFixed(2)}ms`);
  });

  test('should maintain responsive performance on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const startTime = Date.now();

    await setMonthlyBasic(page, 80000);
    await expect(grossPill(page)).toContainText(formatBdt(80000 * 12), { timeout: 2000 });

    const mobileCalculationTime = Date.now() - startTime;
    expect(mobileCalculationTime).toBeLessThan(800);

    console.log(`Mobile calculation time: ${mobileCalculationTime}ms`);
  });

  test('should handle investment input changes efficiently', async ({ page }) => {
    await setMonthlyBasic(page, 100000);
    await expect(grossPill(page)).toContainText(formatBdt(100000 * 12));

    const investmentAmounts = [0, 50000, 100000, 150000, 200000];
    const investmentTimes = [];

    for (const amount of investmentAmounts) {
      const startTime = Date.now();

      await setInvestment(page, 'DPS', amount);
      await expect(page.getByRole('row', { name: /^Total Investment/ })).toContainText(
        amount.toLocaleString('en-US'),
        { timeout: 1500 }
      );

      investmentTimes.push(Date.now() - startTime);
    }

    const avgTime = investmentTimes.reduce((a, b) => a + b, 0) / investmentTimes.length;
    expect(avgTime).toBeLessThan(400);

    console.log(`Average investment calculation time: ${avgTime.toFixed(2)}ms`);
  });

  test('should not have memory leaks with repeated calculations', async ({ page }) => {
    const iterations = 20;
    const salaries = [25000, 35000, 45000, 55000, 65000];

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await setMonthlyBasic(page, salaries[i % salaries.length]);
      await page.waitForTimeout(50);
    }

    await expect(grossPill(page)).toContainText(formatBdt(salaries[(iterations - 1) % salaries.length] * 12), { timeout: 2000 });

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);

    await setMonthlyBasic(page, 99999);
    await expect(grossPill(page)).toContainText(formatBdt(99999 * 12));

    console.log(`${iterations} calculations completed in: ${totalTime}ms`);
  });

  test('should handle complex scenarios without performance issues', async ({ page }) => {
    const startTime = Date.now();

    await selectCategory(page, 'female');
    await setMonthlyBasic(page, 120000);
    await setInvestment(page, 'DPS', 200000);
    await setMonthlyTds(page, 15000);

    await expect(grossPill(page)).toContainText(formatBdt(120000 * 12), { timeout: 2000 });
    await expect(calcHeadings(page)).toHaveCount(2);
    await expect(calcHeadings(page).first()).toContainText(/\d/);
    await expect(calcHeadings(page).nth(1)).toContainText(/\d/);

    const complexScenarioTime = Date.now() - startTime;
    expect(complexScenarioTime).toBeLessThan(1500);

    console.log(`Complex scenario completed in: ${complexScenarioTime}ms`);
  });

  test('should render tables efficiently with dual calculations', async ({ page }) => {
    const startTime = Date.now();
    await setMonthlyBasic(page, 200000);

    const invoices = page.locator('table.invoice');
    await expect(invoices).toHaveCount(2, { timeout: 3000 });
    await expect(invoices.nth(0)).toContainText('Total tax', { timeout: 3000 });
    await expect(invoices.nth(1)).toContainText('Total tax', { timeout: 3000 });
    await expect(invoices.nth(0)).toContainText('30%', { timeout: 3000 });
    await expect(invoices.nth(1)).toContainText('30%', { timeout: 3000 });

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000);

    console.log(`Dual table rendering completed in: ${renderTime}ms`);
  });

  test('should maintain performance with large numbers', async ({ page }) => {
    const largeSalaries = [500000, 1000000, 5000000];

    for (const salary of largeSalaries) {
      const startTime = Date.now();

      await setMonthlyBasic(page, salary);
      await expect(grossPill(page)).toContainText(formatBdt(salary * 12), { timeout: 2000 });

      const calculationTime = Date.now() - startTime;
      expect(calculationTime).toBeLessThan(800);

      console.log(`Large number (${salary}) calculation time: ${calculationTime}ms`);
    }
  });
});
