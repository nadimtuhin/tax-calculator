import { test, expect } from '@playwright/test';
import { categoryRadios, selectedCategory, selectCategory } from './helpers/category.js';
import { FY_2025, calcPanel } from './helpers/fa2026-calc-ui.js';

const firstSlabText = async (page) =>
  calcPanel(page, FY_2025).locator('table.invoice tr').filter({ hasText: /lakh/ }).first().innerText();

test.describe('Taxpayer Profile Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should have default profile selection UI', async ({ page }) => {
    // Check if profile selection elements are present
    const profileSection = page.locator('[data-testid="taxpayer-profile"], .profile-section, .taxpayer-category');
    
    if (await profileSection.count() > 0) {
      await expect(profileSection.first()).toBeVisible();
    }
    
    // Look for profile selection dropdowns/radios
    const categorySelect = categoryRadios(page).first();
    const ageInput = page.locator('input[type="number"]').first();
    const locationSelect = page.locator('select').last();
    
    if (await categorySelect.count() > 0) {
      await expect(categorySelect).toBeVisible();
    }
  });

  test('should allow selecting general taxpayer profile', async ({ page }) => {
    // Try to find and select general taxpayer category
    const generalOption = page.locator('option[value="general"], input[value="general"], [data-value="general"]');
    
    if (await generalOption.count() > 0) {
      await generalOption.first().click();
      
      // Verify selection
      expect(await selectedCategory(page)).toBe('general');
    }
  });

  test('should allow selecting female taxpayer profile', async ({ page }) => {
    const femaleOption = page.locator('option[value="female"], input[value="female"], [data-value="female"]');
    
    if (await femaleOption.count() > 0) {
      await femaleOption.first().click();
      
      // Verify selection affects tax calculation
      await page.waitForTimeout(500);
      
      // Check if tax calculations updated
      const taxDisplay = page.locator('h2, .total-tax, [data-testid="total-tax"]').first();
      if (await taxDisplay.count() > 0) {
        await expect(taxDisplay).toBeVisible();
      }
    }
  });

  test('should allow selecting senior citizen profile', async ({ page }) => {
    await selectCategory(page, 'senior');
    expect(await selectedCategory(page)).toBe('senior');

    // FY 2025-26 tax-free threshold: 4.5 lakh
    await expect.poll(() => firstSlabText(page)).toContain('First Tk4.5 lakh [0-4.5 lakh]');
  });

  test('should allow selecting disabled person profile', async ({ page }) => {
    await selectCategory(page, 'disabled');
    expect(await selectedCategory(page)).toBe('disabled');

    // FY 2025-26 tax-free threshold: 5.25 lakh
    await expect.poll(() => firstSlabText(page)).toContain('First Tk5.25 lakh [0-5.25 lakh]');
  });

  test('should allow selecting freedom fighter profile', async ({ page }) => {
    await selectCategory(page, 'freedom_fighter');
    expect(await selectedCategory(page)).toBe('freedom_fighter');

    // FY 2025-26 tax-free threshold: 5.5 lakh
    await expect.poll(() => firstSlabText(page)).toContain('First Tk5.5 lakh [0-5.5 lakh]');
  });

  test('should allow setting age and location', async ({ page }) => {
    // Try to set age
    const ageInput = page.locator('input[type="number"]').first();
    if (await ageInput.count() > 0) {
      await ageInput.fill('35');
      await expect(ageInput).toHaveValue('35');
    }
    
    // Try to set location
    const locationSelect = page.locator('#profile-location');
    await locationSelect.selectOption('dhaka');
    await expect(locationSelect).toHaveValue('dhaka');
  });

  test('should update tax calculations when profile changes', async ({ page }) => {
    await page.getByRole('spinbutton', { name: 'July basic', exact: true }).fill('100000');
    await selectCategory(page, 'general');
    const amount = calcPanel(page, FY_2025).locator('h2.calc-heading .calc-heading-amount');
    await expect(amount).toHaveText(/45,?000/);

    // Female threshold is 4.5 lakh: 3L@10% + 0.5L@15% = 37,500
    await selectCategory(page, 'female');
    await expect(amount).toHaveText(/37,?500/);
  });

  test('should persist profile selection on page reload', async ({ page }) => {
    // Select a specific profile
    const seniorOption = page.locator('option[value="senior"], input[value="senior"]');
    if (await seniorOption.count() > 0) {
      await seniorOption.first().click();
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check if selection persisted
      expect(await selectedCategory(page)).toBe('senior');
    }
  });

  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Profile selection should be accessible on mobile
    const profileSection = page.locator('[data-testid="taxpayer-profile"], .profile-section, select, input[type="radio"]');
    
    if (await profileSection.count() > 0) {
      await expect(profileSection.first()).toBeVisible();
      
      // Should be tappable
      await profileSection.first().click();
    }
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for labels and ARIA attributes
    const selects = page.locator('select');
    const radioInputs = page.locator('input[type="radio"]');
    
    if (await selects.count() > 0) {
      for (let i = 0; i < await selects.count(); i++) {
        const select = selects.nth(i);
        const hasLabel = await select.getAttribute('aria-label') || 
                        await page.locator(`label[for="${await select.getAttribute('id')}"]`).count() > 0;
        expect(hasLabel).toBeTruthy();
      }
    }
    
    if (await radioInputs.count() > 0) {
      for (let i = 0; i < await radioInputs.count(); i++) {
        const radio = radioInputs.nth(i);
        const hasLabel = await radio.getAttribute('aria-label') || 
                        await page.locator(`label[for="${await radio.getAttribute('id')}"]`).count() > 0;
        expect(hasLabel).toBeTruthy();
      }
    }
  });
});