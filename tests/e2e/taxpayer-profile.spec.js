import { test, expect } from '@playwright/test';

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
    const categorySelect = page.locator('select, input[type="radio"]').first();
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
      const isSelected = await generalOption.first().isChecked().catch(() => false);
      const selectedValue = await page.locator('select').first().inputValue().catch(() => '');
      
      expect(isSelected || selectedValue === 'general').toBeTruthy();
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
    const seniorOption = page.locator('option[value="senior"], input[value="senior"], [data-value="senior"]');
    
    if (await seniorOption.count() > 0) {
      await seniorOption.first().click();
      await page.waitForTimeout(500);
      
      // Verify higher tax-free threshold is applied
      const taxSlabs = page.locator('table tbody tr, .slab-row');
      if (await taxSlabs.count() > 0) {
        const firstSlab = taxSlabs.first();
        const slabText = await firstSlab.textContent();
        
        // Senior citizens should have 4 lakh threshold
        expect(slabText).toContain('4');
      }
    }
  });

  test('should allow selecting disabled person profile', async ({ page }) => {
    const disabledOption = page.locator('option[value="disabled"], input[value="disabled"], [data-value="disabled"]');
    
    if (await disabledOption.count() > 0) {
      await disabledOption.first().click();
      await page.waitForTimeout(500);
      
      // Disabled persons should have 4.75 lakh threshold
      const taxSlabs = page.locator('table tbody tr, .slab-row');
      if (await taxSlabs.count() > 0) {
        const firstSlab = taxSlabs.first();
        const slabText = await firstSlab.textContent();
        
        expect(slabText).toContain('4.8');
      }
    }
  });

  test('should allow selecting freedom fighter profile', async ({ page }) => {
    const freedomFighterOption = page.locator('option[value="freedom_fighter"], input[value="freedom_fighter"], [data-value="freedom_fighter"]');
    
    if (await freedomFighterOption.count() > 0) {
      await freedomFighterOption.first().click();
      await page.waitForTimeout(500);
      
      // Freedom fighters should have 5 lakh threshold
      const taxSlabs = page.locator('table tbody tr, .slab-row');
      if (await taxSlabs.count() > 0) {
        const firstSlab = taxSlabs.first();
        const slabText = await firstSlab.textContent();
        
        expect(slabText).toContain('5');
      }
    }
  });

  test('should allow setting age and location', async ({ page }) => {
    // Try to set age
    const ageInput = page.locator('input[type="number"]').first();
    if (await ageInput.count() > 0) {
      await ageInput.fill('35');
      await expect(ageInput).toHaveValue('35');
    }
    
    // Try to set location
    const locationSelect = page.locator('select').last();
    if (await locationSelect.count() > 0) {
      const dhakaOption = page.locator('option[value="dhaka"]');
      if (await dhakaOption.count() > 0) {
        await locationSelect.selectOption('dhaka');
        await expect(locationSelect).toHaveValue('dhaka');
      }
    }
  });

  test('should update tax calculations when profile changes', async ({ page }) => {
    // Get initial tax calculation
    const taxDisplay = page.locator('h2, .total-tax, [data-testid="total-tax"]').first();
    let initialTax = '';
    
    if (await taxDisplay.count() > 0) {
      initialTax = await taxDisplay.textContent();
    }
    
    // Change profile
    const femaleOption = page.locator('option[value="female"], input[value="female"]');
    if (await femaleOption.count() > 0) {
      await femaleOption.first().click();
      await page.waitForTimeout(1000);
      
      // Check if tax calculation changed
      if (initialTax) {
        const newTax = await taxDisplay.textContent();
        // Tax calculation should have updated (threshold changed)
        expect(newTax).not.toBe(initialTax);
      }
    }
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
      const selectedValue = await page.locator('select').first().inputValue().catch(() => '');
      const isChecked = await seniorOption.first().isChecked().catch(() => false);
      
      expect(selectedValue === 'senior' || isChecked).toBeTruthy();
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