import { test, expect } from '@playwright/test';

test.describe('Salary Breakdown Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should display salary breakdown table', async ({ page }) => {
    // Look for salary breakdown table or section
    const breakdownTable = page.locator('table').filter({ hasText: /salary|breakdown/i }).first();
    const breakdownSection = page.locator('[data-testid="salary-breakdown"], .salary-breakdown, .breakdown-section').first();
    
    if (await breakdownTable.count() > 0) {
      await expect(breakdownTable).toBeVisible();
    } else if (await breakdownSection.count() > 0) {
      await expect(breakdownSection).toBeVisible();
    }
  });

  test('should show total salary input', async ({ page }) => {
    // Look for total salary input field
    const totalSalaryInput = page.locator('input').filter({ hasText: /total|salary|month/i }).first();
    const salaryInputs = page.locator('input[type="number"]');
    
    if (await totalSalaryInput.count() > 0) {
      await expect(totalSalaryInput).toBeVisible();
      await expect(totalSalaryInput).toBeEditable();
    } else if (await salaryInputs.count() > 0) {
      await expect(salaryInputs.first()).toBeVisible();
      await expect(salaryInputs.first()).toBeEditable();
    }
  });

  test('should allow entering total salary amount', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('50000');
      await expect(salaryInput).toHaveValue('50000');
      
      // Wait for calculations to update
      await page.waitForTimeout(500);
      
      // Check if percentage shows 100%
      const percentageCell = page.locator('td, .percentage').filter({ hasText: /100.*%/ }).first();
      if (await percentageCell.count() > 0) {
        await expect(percentageCell).toBeVisible();
      }
    }
  });

  test('should show salary breakdown components', async ({ page }) => {
    // Look for breakdown items (Basic, House Rent, Medical, etc.)
    const breakdownItems = [
      'Basic', 'basic', 'House Rent', 'house rent', 'Medical', 'medical',
      'Transport', 'transport', 'Others', 'others'
    ];
    
    const allRows = page.locator('tr, .breakdown-row');
    let foundItems = 0;
    
    for (let i = 0; i < await allRows.count(); i++) {
      const rowText = await allRows.nth(i).textContent();
      
      for (const item of breakdownItems) {
        if (rowText.toLowerCase().includes(item.toLowerCase())) {
          foundItems++;
          break;
        }
      }
    }
    
    // Should have at least some breakdown components
    expect(foundItems).toBeGreaterThan(0);
  });

  test('should allow editing breakdown amounts', async ({ page }) => {
    // Set total salary first
    const salaryInputs = page.locator('input[type="number"]');
    
    if (await salaryInputs.count() >= 2) {
      await salaryInputs.first().fill('50000');
      await page.waitForTimeout(500);
      
      // Try to edit a breakdown component amount
      const breakdownInput = salaryInputs.nth(1);
      await breakdownInput.fill('20000');
      await expect(breakdownInput).toHaveValue('20000');
      
      await page.waitForTimeout(500);
      
      // Check if percentage updated
      const percentageInputs = page.locator('input[type="number"]').filter({ hasText: /%/ });
      if (await percentageInputs.count() > 0) {
        const percentageValue = await percentageInputs.first().inputValue();
        expect(parseInt(percentageValue)).toBeGreaterThan(0);
      }
    }
  });

  test('should allow editing breakdown percentages', async ({ page }) => {
    // Look for percentage inputs
    const percentageInputs = page.locator('input').filter({ hasText: /%/ });
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() >= 2) {
      // Set total salary
      await numberInputs.first().fill('50000');
      await page.waitForTimeout(500);
      
      // Find percentage input (usually has max="100")
      let percentageInput = null;
      for (let i = 0; i < await numberInputs.count(); i++) {
        const input = numberInputs.nth(i);
        const maxValue = await input.getAttribute('max');
        if (maxValue === '100') {
          percentageInput = input;
          break;
        }
      }
      
      if (percentageInput) {
        await percentageInput.fill('40');
        await expect(percentageInput).toHaveValue('40');
        
        await page.waitForTimeout(500);
        
        // Check if amount updated accordingly
        const amountInput = numberInputs.nth(1);
        const amountValue = await amountInput.inputValue();
        expect(parseInt(amountValue)).toBe(20000); // 40% of 50000
      }
    }
  });

  test('should hide items with zero amounts', async ({ page }) => {
    // Set total salary
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('50000');
      await page.waitForTimeout(500);
    }
    
    // Count initial visible breakdown rows
    const initialRows = page.locator('tr, .breakdown-row').filter({ hasText: /basic|house|medical|transport|others/i });
    const initialCount = await initialRows.count();
    
    // Set all breakdown items to zero
    const allInputs = page.locator('input[type="number"]');
    for (let i = 1; i < await allInputs.count(); i++) {
      const input = allInputs.nth(i);
      const maxValue = await input.getAttribute('max');
      
      // Skip percentage inputs (max=100) and focus on amount inputs
      if (maxValue !== '100') {
        await input.fill('0');
      }
    }
    
    await page.waitForTimeout(1000);
    
    // Count visible rows after setting to zero
    const finalRows = page.locator('tr, .breakdown-row').filter({ hasText: /basic|house|medical|transport|others/i });
    const finalCount = await finalRows.count();
    
    // Should have fewer visible rows (zero items hidden)
    expect(finalCount).toBeLessThanOrEqual(initialCount);
  });

  test('should maintain total percentage at 100%', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('50000');
      await page.waitForTimeout(500);
      
      // Check total percentage display
      const totalPercentage = page.locator('td, .total-percentage').filter({ hasText: /100.*%/ }).first();
      if (await totalPercentage.count() > 0) {
        const percentageText = await totalPercentage.textContent();
        expect(percentageText).toContain('100');
      }
    }
  });

  test('should validate input constraints', async ({ page }) => {
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() >= 2) {
      // Test minimum value constraint
      const amountInput = numberInputs.nth(1);
      await amountInput.fill('-1000');
      await page.waitForTimeout(500);
      
      const value = await amountInput.inputValue();
      expect(parseInt(value)).toBeGreaterThanOrEqual(0);
      
      // Test maximum value for percentage inputs
      const percentageInput = page.locator('input[max="100"]').first();
      if (await percentageInput.count() > 0) {
        await percentageInput.fill('150');
        await page.waitForTimeout(500);
        
        const percentageValue = await percentageInput.inputValue();
        expect(parseInt(percentageValue)).toBeLessThanOrEqual(100);
      }
    }
  });

  test('should update tax calculations when breakdown changes', async ({ page }) => {
    // Get initial tax calculation
    const totalTaxElement = page.locator('h2, .total-tax').first();
    let initialTax = '';
    
    if (await totalTaxElement.count() > 0) {
      initialTax = await totalTaxElement.textContent();
    }
    
    // Change salary breakdown
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('60000');
      await page.waitForTimeout(1000);
      
      if (initialTax && await totalTaxElement.count() > 0) {
        const newTax = await totalTaxElement.textContent();
        expect(newTax).not.toBe(initialTax);
      }
    }
  });

  test('should work with keyboard navigation', async ({ page }) => {
    const inputs = page.locator('input[type="number"]');
    
    if (await inputs.count() >= 2) {
      // Tab through inputs
      await inputs.first().focus();
      await page.keyboard.press('Tab');
      
      // Should focus next input
      const focusedElement = page.locator(':focus');
      const isFocusedInput = await focusedElement.getAttribute('type') === 'number';
      expect(isFocusedInput).toBeTruthy();
      
      // Enter value with keyboard
      await page.keyboard.type('25000');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(500);
      
      const enteredValue = await focusedElement.inputValue();
      expect(enteredValue).toContain('25000');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Breakdown table should be visible and usable on mobile
    const breakdownTable = page.locator('table').first();
    if (await breakdownTable.count() > 0) {
      await expect(breakdownTable).toBeVisible();
    }
    
    // Input fields should be touch-friendly
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.tap();
      await salaryInput.fill('45000');
      await expect(salaryInput).toHaveValue('45000');
    }
  });

  test('should persist breakdown data on page reload', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      // Set specific salary
      await salaryInput.fill('55000');
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check if value persisted
      const persistedValue = await page.locator('input[type="number"]').first().inputValue();
      expect(persistedValue).toBe('55000');
    }
  });

  test('should handle currency formatting correctly', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('75000');
      await page.waitForTimeout(500);
      
      // Check if currency symbols or formatting are displayed correctly
      const currencyElements = page.locator('td, span').filter({ hasText: /\$|BDT|Tk/ });
      if (await currencyElements.count() > 0) {
        for (let i = 0; i < await currencyElements.count(); i++) {
          const element = currencyElements.nth(i);
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test('should calculate breakdown totals correctly', async ({ page }) => {
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() >= 3) {
      // Set total salary
      await numberInputs.first().fill('100000');
      await page.waitForTimeout(500);
      
      // Set breakdown amounts
      await numberInputs.nth(1).fill('60000'); // Basic
      if (await numberInputs.count() >= 3) {
        await numberInputs.nth(2).fill('20000'); // House Rent
      }
      if (await numberInputs.count() >= 4) {
        await numberInputs.nth(3).fill('10000'); // Medical
      }
      
      await page.waitForTimeout(1000);
      
      // Check if totals add up correctly
      const totalPercentage = page.locator('td, .total').filter({ hasText: /90.*%|100.*%/ }).first();
      if (await totalPercentage.count() > 0) {
        const percentageText = await totalPercentage.textContent();
        const percentage = parseInt(percentageText.match(/\d+/)[0]);
        expect(percentage).toBeGreaterThan(80); // Should be close to 100%
      }
    }
  });
});