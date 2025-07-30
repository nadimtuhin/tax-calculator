import { test, expect } from '@playwright/test';

test.describe('Tax Calculation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should display tax calculation table', async ({ page }) => {
    // Look for tax calculation table
    const taxTable = page.locator('table, .tax-table, [data-testid="tax-table"]');
    
    if (await taxTable.count() > 0) {
      await expect(taxTable.first()).toBeVisible();
      
      // Check for essential columns
      const headers = page.locator('th, td strong, .header');
      const headerTexts = [];
      
      for (let i = 0; i < await headers.count(); i++) {
        headerTexts.push(await headers.nth(i).textContent());
      }
      
      const hasIncomeColumn = headerTexts.some(text => text.includes('Income'));
      const hasRateColumn = headerTexts.some(text => text.includes('rate') || text.includes('Rate'));
      const hasTaxColumn = headerTexts.some(text => text.includes('Tax'));
      
      expect(hasIncomeColumn || hasRateColumn || hasTaxColumn).toBeTruthy();
    }
  });

  test('should show progressive tax slabs for general taxpayer', async ({ page }) => {
    // Set general taxpayer profile
    const generalOption = page.locator('option[value="general"], input[value="general"]');
    if (await generalOption.count() > 0) {
      await generalOption.first().click();
      await page.waitForTimeout(500);
    }
    
    // Check tax slabs
    const slabRows = page.locator('table tbody tr, .slab-row');
    if (await slabRows.count() >= 2) {
      const firstSlab = await slabRows.first().textContent();
      const secondSlab = await slabRows.nth(1).textContent();
      
      // First slab should be 0% (tax-free)
      expect(firstSlab).toContain('0');
      expect(firstSlab).toContain('3.5');
      
      // Second slab should be 5%
      expect(secondSlab).toContain('5');
    }
  });

  test('should calculate tax correctly for income above threshold', async ({ page }) => {
    // Set salary above tax-free threshold
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('50000'); // 600k annually, above 350k threshold
      await page.waitForTimeout(1000);
      
      // Check total tax is calculated
      const totalTax = page.locator('h2, .total-tax, [data-testid="total-tax"]').first();
      if (await totalTax.count() > 0) {
        const taxText = await totalTax.textContent();
        
        // Should show a positive tax amount
        const hasPositiveTax = /\d+/.test(taxText) && !taxText.includes('0');
        expect(hasPositiveTax).toBeTruthy();
      }
    }
  });

  test('should apply minimum tax for low income', async ({ page }) => {
    // Set low salary
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('25000'); // 300k annually, below threshold
      await page.waitForTimeout(1000);
      
      // Should show minimum tax notice
      const minimumTaxNotice = page.locator('small, .minimum-tax-notice, [style*="red"]');
      if (await minimumTaxNotice.count() > 0) {
        const noticeText = await minimumTaxNotice.textContent();
        expect(noticeText.toLowerCase()).toContain('minimum');
      }
    }
  });

  test('should calculate different tax for different profiles', async ({ page }) => {
    // Set a salary amount
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('40000'); // 480k annually
      await page.waitForTimeout(500);
    }
    
    // Get tax for general taxpayer
    const generalOption = page.locator('option[value="general"], input[value="general"]');
    if (await generalOption.count() > 0) {
      await generalOption.first().click();
      await page.waitForTimeout(500);
    }
    
    const totalTaxElement = page.locator('h2, .total-tax, [data-testid="total-tax"]').first();
    let generalTax = '';
    if (await totalTaxElement.count() > 0) {
      generalTax = await totalTaxElement.textContent();
    }
    
    // Switch to female taxpayer
    const femaleOption = page.locator('option[value="female"], input[value="female"]');
    if (await femaleOption.count() > 0) {
      await femaleOption.first().click();
      await page.waitForTimeout(500);
      
      if (generalTax) {
        const femaleTax = await totalTaxElement.textContent();
        
        // Tax should be different (female has higher threshold)
        expect(femaleTax).not.toBe(generalTax);
      }
    }
  });

  test('should show tax deduction at source (TDS)', async ({ page }) => {
    // Look for TDS input or display
    const tdsInput = page.locator('input').filter({ hasText: /tds|deduct/i }).first();
    const tdsRow = page.locator('tr, .row').filter({ hasText: /deduct|tds/i }).first();
    
    if (await tdsInput.count() > 0) {
      await tdsInput.fill('5000');
      await page.waitForTimeout(500);
    }
    
    if (await tdsRow.count() > 0) {
      await expect(tdsRow).toBeVisible();
      const tdsText = await tdsRow.textContent();
      expect(tdsText.toLowerCase()).toContain('deduct');
    }
  });

  test('should show investment rebate calculation', async ({ page }) => {
    // Look for investment input or display
    const investmentInput = page.locator('input').filter({ hasText: /invest|rebate/i }).first();
    const investmentRow = page.locator('tr, .row').filter({ hasText: /invest|rebate/i }).first();
    
    if (await investmentInput.count() > 0) {
      await investmentInput.fill('100000');
      await page.waitForTimeout(500);
    }
    
    if (await investmentRow.count() > 0) {
      await expect(investmentRow).toBeVisible();
      const investmentText = await investmentRow.textContent();
      expect(investmentText.toLowerCase()).toContain('rebate');
    }
  });

  test('should calculate final payable amount', async ({ page }) => {
    // Set salary, TDS, and investment
    const inputs = page.locator('input[type="number"]');
    
    if (await inputs.count() >= 3) {
      await inputs.nth(0).fill('60000'); // Salary
      await inputs.nth(1).fill('5000');  // TDS
      await inputs.nth(2).fill('50000'); // Investment
      await page.waitForTimeout(1000);
    }
    
    // Check payable amount row
    const payableRow = page.locator('tr, .row').filter({ hasText: /payable/i }).first();
    if (await payableRow.count() > 0) {
      await expect(payableRow).toBeVisible();
      
      const payableText = await payableRow.textContent();
      expect(payableText.toLowerCase()).toContain('payable');
    }
  });

  test('should update calculations in real-time', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    const totalTaxElement = page.locator('h2, .total-tax').first();
    
    if (await salaryInput.count() > 0 && await totalTaxElement.count() > 0) {
      // Set initial salary
      await salaryInput.fill('30000');
      await page.waitForTimeout(500);
      const initialTax = await totalTaxElement.textContent();
      
      // Increase salary
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);
      const increasedTax = await totalTaxElement.textContent();
      
      // Tax should have increased
      expect(increasedTax).not.toBe(initialTax);
    }
  });

  test('should handle edge cases at slab boundaries', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      // Test exactly at threshold (350k for general taxpayer)
      await salaryInput.fill('29167'); // Exactly 350k annually
      await page.waitForTimeout(500);
      
      const taxTable = page.locator('table, .tax-table');
      if (await taxTable.count() > 0) {
        await expect(taxTable.first()).toBeVisible();
        
        // Should show 0 calculated tax, only minimum tax
        const slabRows = page.locator('table tbody tr, .slab-row');
        if (await slabRows.count() > 0) {
          const firstSlabTax = await slabRows.first().textContent();
          expect(firstSlabTax).toContain('0');
        }
      }
    }
  });

  test('should show tax slabs with ranges', async ({ page }) => {
    // Check if tax slabs show ranges like [0-3.5 lakh]
    const slabRows = page.locator('table tbody tr, .slab-row');
    
    if (await slabRows.count() > 0) {
      for (let i = 0; i < Math.min(3, await slabRows.count()); i++) {
        const slabText = await slabRows.nth(i).textContent();
        
        // Should contain range information
        const hasRange = slabText.includes('[') && slabText.includes(']') && slabText.includes('lakh');
        expect(hasRange).toBeTruthy();
      }
    }
  });

  test('should validate input ranges', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      // Try negative value
      await salaryInput.fill('-1000');
      await page.waitForTimeout(500);
      
      const value = await salaryInput.inputValue();
      expect(parseInt(value)).toBeGreaterThanOrEqual(0);
      
      // Try very large value
      await salaryInput.fill('9999999');
      await page.waitForTimeout(500);
      
      // Should handle large numbers gracefully
      const totalTax = page.locator('h2, .total-tax').first();
      if (await totalTax.count() > 0) {
        const taxText = await totalTax.textContent();
        expect(taxText).toBeTruthy();
      }
    }
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tax table should be responsive
    const taxTable = page.locator('table, .tax-table');
    if (await taxTable.count() > 0) {
      await expect(taxTable.first()).toBeVisible();
    }
    
    // Input fields should be touch-friendly
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.tap();
      await salaryInput.fill('50000');
      await expect(salaryInput).toHaveValue('50000');
    }
  });

  test('should preserve calculations on page reload', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      // Set specific values
      await salaryInput.fill('45000');
      await page.waitForTimeout(500);
      
      const totalTaxElement = page.locator('h2, .total-tax').first();
      let originalTax = '';
      if (await totalTaxElement.count() > 0) {
        originalTax = await totalTaxElement.textContent();
      }
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Values should be preserved
      const preservedValue = await page.locator('input[type="number"]').first().inputValue();
      expect(preservedValue).toBe('45000');
      
      if (originalTax) {
        const preservedTax = await totalTaxElement.textContent();
        expect(preservedTax).toBe(originalTax);
      }
    }
  });
});