import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openFresh(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tax-calculator-never-star', 'true');
  });
  await page.reload();
}

test.describe('Progressive disclosure', () => {
  test('advanced sections start collapsed and the primary path stays visible', async ({ page }) => {
    await openFresh(page);
    await expect(page.getByLabel('July basic', { exact: true })).toBeVisible();
    await expect(page.getByTestId('hero-payable')).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'DPS amount', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: /Investment rebate/ })).toHaveAttribute('aria-expanded', 'false');
  });

  test('every input stays reachable once its section is opened', async ({ page }) => {
    await openFresh(page);
    await page.getByRole('button', { name: /Investment rebate/ }).click();
    const dps = page.getByRole('spinbutton', { name: 'DPS amount', exact: true });
    await expect(dps).toBeVisible();
    await dps.fill('100000');
    await page.getByRole('button', { name: /Full tax breakdown/ }).click();
    await expect(page.locator('.comparison-col').first()).toBeVisible();
  });

  test('a section with entered data opens itself', async ({ page }) => {
    await openFresh(page);
    await page.getByRole('button', { name: /Investment rebate/ }).click();
    await page.getByRole('spinbutton', { name: 'DPS amount', exact: true }).fill('50000');
    await page.getByRole('button', { name: /Investment rebate/ }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: /Investment rebate/ })).toHaveAttribute('aria-expanded', 'true');
  });
});
