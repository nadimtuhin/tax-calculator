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

test.describe('blog guide navigation', () => {
  const slug = 'section-78-investment-rebate-bangladesh';

  // The first-visit star prompt opens after 1.5s and would cover these clicks.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tax-calculator-never-star', 'true'));
  });

  test('a table of contents link scrolls its heading below the sticky navbar and keeps the guide title', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}`);
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
    await page.locator('.toc-rail a[href="#worked-numerical-example"]').click();
    await expect(page).toHaveURL(/#worked-numerical-example$/);
    const top = Math.round((await page.locator('#worked-numerical-example').boundingBox()).y);
    expect(top).toBeGreaterThanOrEqual(60);
    expect(top).toBeLessThanOrEqual(100);
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
  });

  test('a shared section link opens at that section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}#worked-numerical-example`);
    await expect(page.locator('#worked-numerical-example')).toBeInViewport();
  });

  test('a related guide link opens that guide, also after a table of contents click', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}`);
    await page.locator('.toc-rail a[href="#sources-heading"]').click();
    await expect(page).toHaveURL(/#sources-heading$/);
    const related = page.locator('.related-link').first();
    const href = await related.getAttribute('href');
    expect(href).not.toBe(`/blog/${slug}`);
    await related.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator('h1')).not.toContainText(/Section 78/);
    await page.goBack();
    await expect(page.locator('h1')).toContainText(/Section 78/);
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
  });

  test('no horizontal overflow at 390px, and the inline table of contents works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/blog', `/blog/${slug}`]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await expect(page.locator('.toc-rail')).toBeHidden();
    await page.locator('.toc-inline summary').click();
    await page.locator('.toc-inline a[href="#sources-heading"]').click();
    await expect(page.locator('#sources-heading')).toBeInViewport();
  });
});

test.describe('smoke without JavaScript (prerendered HTML)', () => {
  test.use({ javaScriptEnabled: false });

  test('a guide serves its own title, canonical, h1 and body', async ({ page }) => {
    const slug = 'section-78-investment-rebate-bangladesh';
    await page.goto(`/blog/${slug}`);
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tax.nadimtuhin.com/blog/${slug}`);
    await expect(page.locator('h1')).toContainText(/Section 78/);
    await expect(page.locator('main p').first()).toBeVisible();
  });

  test('a guide serves its table of contents, reading time and related guides', async ({ page }) => {
    await page.goto('/blog/fiscal-year-vs-assessment-year-bangladesh');
    await expect(page.locator('a[href="#tax-day-statutory-deadline"]').first()).toBeAttached();
    await expect(page.locator('h2#tax-day-statutory-deadline')).toBeAttached();
    await expect(page.locator('.article-meta')).toContainText(/\d+ min read/);
    await expect(page.locator('.related-link')).toHaveCount(2);
  });
});
