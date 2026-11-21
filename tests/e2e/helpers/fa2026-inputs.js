export const grossPill = (page) => page.locator('.section-pill.amount', { hasText: /^Gross/ });

export const formatBdt = (n) => `৳${Number(n).toLocaleString('en-US')}`;

export const setMonthlyBasic = (page, monthly) => page.getByLabel('July basic').fill(String(monthly));

export const setMonthlyTds = (page, monthly) => page.getByLabel('July TDS').fill(String(monthly));

export const setBonus = (page, amount) => page.getByLabel('Bonus', { exact: true }).fill(String(amount));

export const setInvestment = (page, name, amount) => page.getByLabel(`${name} amount`).fill(String(amount));

export const calcHeadings = (page) => page.locator('h2.calc-heading');

export const calcTaxAmounts = async (page) => {
  const texts = await page.locator('h2.calc-heading .calc-heading-amount').allTextContents();
  return texts.map((t) => Number(t.replace(/[^\d.-]/g, '')));
};

export const calcCols = (page) => page.locator('.comparison-col');

export const dismissStarModal = async (page) => {
  const closeButton = page.locator('.star-modal .close-btn');
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  }
};
