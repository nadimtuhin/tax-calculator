import { expect } from '@playwright/test';

export const PANEL_2025 = 'Tax for FY 2025-2026';
export const PANEL_2026 = 'Tax for FY 2026-2027';

export async function openCalculator(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tax-calculator-never-star', 'true');
    localStorage.setItem('tax-calculator-ui-open', 'all');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeVisible();
}

// "July salary" is derived (disabled): it is the sum of the July breakdown parts, and a
// breakdown edit is copied to every later month. Filling "July basic" sets a flat monthly salary.
export async function setMonthlySalary(page, amount) {
  await page.getByLabel('July basic', { exact: true }).fill(String(amount));
}

export async function setMonthlyTds(page, amount) {
  await page.getByLabel('July TDS', { exact: true }).fill(String(amount));
}

export async function setInvestment(page, name, amount) {
  await page.getByLabel(`${name} amount`, { exact: true }).fill(String(amount));
}

export const calcPanel = (page, heading = PANEL_2026) =>
  page.locator('.comparison-col').filter({
    has: page.locator('h2.calc-heading', { hasText: heading }),
  });

export const panelTotal = (page, heading = PANEL_2026) =>
  calcPanel(page, heading).locator('h2.calc-heading .calc-heading-amount');

export const panelRow = (page, label, heading = PANEL_2026) =>
  calcPanel(page, heading).getByRole('row', { name: label });

export const parseAmount = (text) => Number(String(text).replace(/[^0-9.-]/g, ''));

export async function rowAmount(page, label, heading = PANEL_2026) {
  const cell = panelRow(page, label, heading).first().getByRole('cell').last();
  return parseAmount(await cell.innerText());
}

export async function totalTax(page, heading = PANEL_2026) {
  return parseAmount(await panelTotal(page, heading).innerText());
}
