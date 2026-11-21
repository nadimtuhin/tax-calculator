import { expect } from '@playwright/test';

export const FY_2025 = 'FY 2025-2026';
export const FY_2026 = 'FY 2026-2027';

// Panel (card) for one fiscal year, located through its h2.calc-heading.
export const calcPanel = (page, fy) =>
  page.locator('.content-section').filter({
    has: page.locator('h2.calc-heading', { hasText: `Tax for ${fy}` }),
  });

export const panelRow = (page, fy, label) =>
  calcPanel(page, fy).locator('tr').filter({ has: page.locator('strong', { hasText: label }) });

// Numeric value of the last cell of a labelled row ("-1,200" -> -1200).
export async function rowAmount(page, fy, label) {
  const text = await panelRow(page, fy, label).first().locator('td').last().innerText();
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

export const headingAmount = async (page, fy) =>
  Number(
    (await calcPanel(page, fy).locator('h2.calc-heading .calc-heading-amount').innerText()).replace(/[^\d.-]/g, '')
  );

// Setting July's cell propagates to all following months.
export async function setMonthly(page, part, value) {
  await page.getByRole('spinbutton', { name: `July ${part}`, exact: true }).fill(String(value));
}

export const monthlyInput = (page, month, part) =>
  page.getByRole('spinbutton', { name: `${month} ${part}`, exact: true });

export async function expectHeadingAmount(page, fy, value) {
  await expect.poll(() => headingAmount(page, fy)).toBe(value);
}
