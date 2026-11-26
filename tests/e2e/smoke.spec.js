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

  test('Back from a related guide returns to the section in the URL hash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}`);
    await page.locator('.toc-rail a[href="#sources-heading"]').click();
    await expect(page).toHaveURL(/#sources-heading$/);
    await page.locator('.related-link').first().click();
    await expect(page.locator('h1')).not.toContainText(/Section 78/);
    await page.goBack();
    await expect(page.locator('h1')).toContainText(/Section 78/);
    await expect(page).toHaveURL(/#sources-heading$/);
    await expect(page.locator('#sources-heading')).toBeInViewport();
  });

  // Chromium's own restoration ('auto') happens to win the race with the client render; 'manual'
  // checks that the page restores the reader's place itself.
  for (const scrollRestoration of ['auto', 'manual']) {
    test(`Back from a related guide to a guide without a hash returns to where the reader was (scrollRestoration ${scrollRestoration})`, async ({ page }) => {
      await page.addInitScript((mode) => { history.scrollRestoration = mode; }, scrollRestoration);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/blog/${slug}`);
      const related = page.locator('.related-link').first();
      await related.scrollIntoViewIfNeeded();
      await expect(related).toBeInViewport();
      const readerY = await page.evaluate(() => window.scrollY);
      expect(readerY).toBeGreaterThan(400);
      await related.click();
      await expect(page.locator('h1')).not.toContainText(/Section 78/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.goBack();
      await expect(page.locator('h1')).toContainText(/Section 78/);
      await expect(page).toHaveURL(new RegExp(`/blog/${slug}$`));
      await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - readerY)).toBeLessThan(5);
      await expect(page.locator('.related-link').first()).toBeInViewport();
    });
  }

  test('a TOC click keeps the query string, and hash-only Back keeps the guide title', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}?utm_source=fb`);
    await page.locator('.toc-rail a[href="#worked-numerical-example"]').click();
    await expect(page).toHaveURL(new RegExp(`/blog/${slug}\\?utm_source=fb#worked-numerical-example$`));
    // The URL changes before the router's afterEach writes the generic title; let it run first.
    const settled = () => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => setTimeout(done, 50))));
    await page.evaluate(() => { location.hash = '#sources-heading'; });
    await expect(page).toHaveURL(/#sources-heading$/);
    await settled();
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
    await page.goBack();
    await expect(page).toHaveURL(/\?utm_source=fb#worked-numerical-example$/);
    await settled();
    await expect(page).toHaveTitle(/Section 78 Investment Rebate/);
  });

  test('after a related guide click, focus moves to the new h1 and the inline TOC closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/blog/${slug}`);
    await page.locator('.toc-inline summary').click();
    await expect(page.locator('.toc-inline')).toHaveAttribute('open', '');
    await page.locator('.related-link').first().click();
    await expect(page.locator('h1')).not.toContainText(/Section 78/);
    await expect(page.locator('h1')).toBeFocused();
    await expect(page.locator('.toc-inline')).not.toHaveAttribute('open');
  });

  test('the active TOC item follows the reader back up the page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/blog/${slug}`);
    const ids = await page.locator('.toc-rail .toc-link').evaluateAll((links) => links.map((a) => a.getAttribute('href').slice(1)));
    const placeHeading = (id, y) =>
      page.evaluate(([id, y]) => {
        window.scrollTo({ top: window.scrollY + document.getElementById(id).getBoundingClientRect().top - y, behavior: 'instant' });
      }, [id, y]);
    const active = page.locator('.toc-rail .toc-link[aria-current="true"]');
    await placeHeading(ids[2], 150);
    await expect(active).toHaveAttribute('href', `#${ids[2]}`);
    // Below the observer band (80px to 40% of the viewport), with the previous heading above it.
    await placeHeading(ids[2], 450);
    expect(await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, ids[1])).toBeLessThan(80);
    await expect(active).toHaveAttribute('href', `#${ids[1]}`);
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

  test('a guide links its page stylesheet, so both tables of contents are styled before JS', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/blog/section-78-investment-rebate-bangladesh');
    await expect(page.locator('head link[rel="stylesheet"][href^="/assets/BlogPost-"][href$=".css"]')).toHaveCount(1);
    await expect(page.locator('.toc-rail')).toHaveCSS('display', 'none');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.toc-rail')).toHaveCSS('position', 'sticky');
    await expect(page.locator('.toc-inline')).toHaveCSS('display', 'none');
  });
});
