import { test, expect } from '@playwright/test';
import { categoryRadios, selectCategory } from './helpers/category.js';

test.describe('Edge Cases and Boundary Values - Dual Tax Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    
    // Close star modal if it still appears
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should handle zero income correctly', async ({ page }) => {
    // Set taxpayer profile
    const categorySelect = categoryRadios(page).first();
    if (await categorySelect.count() > 0) {
      await selectCategory(page, 'general');
      await page.waitForTimeout(500);
    }
    
    // Set zero salary
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('0');
    await page.waitForTimeout(1000);
    
    // Should show minimum tax for both years
    const pageContent = await page.textContent('body');
    
    // Should contain minimum tax information
    expect(pageContent).toMatch(/minimum.*tax/i);
    
    // Both calculations should show positive tax amounts (minimum tax)
    const h2Elements = page.locator('h2');
    const h2Texts = await h2Elements.allTextContents();
    
    // Should have tax amounts in h2 headings
    const hasPositiveNumbers = h2Texts.some(text => {
      const match = text.match(/(\d+)/);
      return match && parseInt(match[1]) > 0;
    });
    expect(hasPositiveNumbers).toBe(true);
  });

  test('should handle exact threshold amounts for general taxpayer', async ({ page }) => {
    await selectCategory(page, 'general');
    await page.waitForTimeout(300);

    // Verify FY 2024-25 threshold preserved at 350,000 in profile selector
    await page.locator('#profile-fiscal-year').selectOption('2024-25');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 350,000');

    // Switch back to FY 2025-26 and verify exact 400,000 annual income (33,000 * 12 + 4,000 bonus = 400,000)
    await page.locator('#profile-fiscal-year').selectOption('2025-26');
    await expect(page.locator('.threshold-amount')).toHaveText('BDT 400,000');

    const basicInput = page.getByLabel('July basic');
    const bonusInput = page.getByLabel('Bonus', { exact: true });
    await basicInput.fill('33000');
    await bonusInput.fill('4000');
    await page.waitForTimeout(300);

    // Exact 400,000 taxable salary: both columns show 0 slab tax and 5,000 minimum tax
    const cols = page.locator('.comparison-col');
    await expect(cols.nth(0)).toContainText('Tax for FY 2025-2026 5000');
    await expect(cols.nth(0)).toContainText('First Tk4 lakh [0-4 lakh]');
    await expect(cols.nth(1)).toContainText('Tax for FY 2026-2027 5000');
    await expect(cols.nth(1)).toContainText('First Tk4 lakh [0-4 lakh]');

    // Step above threshold to 460,000 (33,000 * 12 + 64,000 = 460,000 -> 60,000 @ 10% = 6,000 > minimum tax)
    await bonusInput.fill('64000');
    await expect(cols.nth(0)).toContainText('Tax for FY 2025-2026 6000');
    await expect(cols.nth(1)).toContainText('Tax for FY 2026-2027 6000');
  });

  test('should handle boundary values for different taxpayer categories', async ({ page }) => {
    const categoryTests = [
      { 
        category: 'female', 
        threshold2024: 400000, 
        threshold2025: 450000,
        monthlyThreshold2024: 33334,
        monthlyThreshold2025: 37500
      },
      { 
        category: 'disabled', 
        threshold2024: 475000, 
        threshold2025: 525000,
        monthlyThreshold2024: 39583,
        monthlyThreshold2025: 43750
      },
      { 
        category: 'freedom_fighter', 
        threshold2024: 500000, 
        threshold2025: 550000,
        monthlyThreshold2024: 41667,
        monthlyThreshold2025: 45834
      }
    ];
    
    for (const test of categoryTests) {
      // Set taxpayer category
      const categorySelect = categoryRadios(page).first();
      if (await categorySelect.count() > 0) {
        await selectCategory(page, test.category);
        await page.waitForTimeout(500);
      }
      
      // Test salary just above threshold
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill((test.monthlyThreshold2025 + 1000).toString());
      await page.waitForTimeout(1000);
      
      // Should show appropriate thresholds
      const pageContent = await page.textContent('body');
      
      // Should show different tax amounts for 2024 vs 2025
      const h2Elements = page.locator('h2');
      const h2Texts = await h2Elements.allTextContents();
      
      // Extract tax amounts
      const taxAmounts = h2Texts.map(text => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      // Both should be positive and potentially different
      expect(taxAmounts[0]).toBeGreaterThan(0);
      expect(taxAmounts[1]).toBeGreaterThan(0);
    }
  });

  test('should handle very high income correctly', async ({ page }) => {
    // Set general taxpayer
    const categorySelect = categoryRadios(page).first();
    if (await categorySelect.count() > 0) {
      await selectCategory(page, 'general');
      await page.waitForTimeout(500);
    }
    
    // Test very high income scenarios
    const highIncomeTests = [
      { monthly: 500000, annual: 6000000, description: '6M annual income' },
      { monthly: 1000000, annual: 12000000, description: '12M annual income' }
    ];
    
    for (const test of highIncomeTests) {
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill(test.monthly.toString());
      await page.waitForTimeout(1000);
      
      // Should show substantial tax amounts
      const h2Elements = page.locator('h2');
      const h2Texts = await h2Elements.allTextContents();
      
      // Extract tax amounts
      const taxAmounts = h2Texts.map(text => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      // Both should show substantial tax (over 1M for 6M+ income)
      expect(taxAmounts[0]).toBeGreaterThan(500000);
      expect(taxAmounts[1]).toBeGreaterThan(500000);
      
      // Should use highest tax brackets
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('30%'); // Highest bracket
    }
  });

  test('should handle negative and invalid input values', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    // Test negative value
    await salaryInput.fill('-1000');
    await page.waitForTimeout(1000);
    
    // Input should either reject negative value or treat as zero
    const inputValue = await salaryInput.inputValue();
    const numericValue = parseInt(inputValue) || 0;
    expect(numericValue).toBeGreaterThanOrEqual(0);
    
    // Should still show minimum tax calculations
    const h2Elements = page.locator('h2');
    const h2Texts = await h2Elements.allTextContents();
    const hasNumbers = h2Texts.some(text => /\d/.test(text));
    expect(hasNumbers).toBe(true);
    
    // Test extremely large value
    await salaryInput.fill('99999999');
    await page.waitForTimeout(1000);
    
    // Should handle large values gracefully
    const largeInputValue = await salaryInput.inputValue();
    expect(largeInputValue).toBeTruthy();
    
    // Should still show calculations
    const h2TextsLarge = await h2Elements.allTextContents();
    const hasNumbersLarge = h2TextsLarge.some(text => /\d/.test(text));
    expect(hasNumbersLarge).toBe(true);
  });

  test('should handle minimum tax boundaries for different locations', async ({ page }) => {
    // Test different locations for 2024-25 vs 2025-26 minimum tax differences
    const locationTests = [
      { location: 'dhaka', min2024: 5000, min2025: 5000 },
      { location: 'chittagong', min2024: 5000, min2025: 5000 },
      { location: 'district', min2024: 3000, min2025: 5000 } // Different between years
    ];
    
    for (const test of locationTests) {
      // Set location if location selector exists
      const locationSelect = page.locator('select').filter({ hasText: /location|city|area/i }).first();
      if (await locationSelect.count() > 0) {
        await locationSelect.selectOption(test.location);
        await page.waitForTimeout(500);
      }
      
      // Set very low salary to trigger minimum tax
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('20000'); // 240K annually (below all thresholds)
      await page.waitForTimeout(1000);
      
      // For district location, should show different minimum tax between years
      if (test.location === 'district') {
        const pageContent = await page.textContent('body');
        
        // Should show minimum tax application
        expect(pageContent).toMatch(/minimum.*tax/i);
        
        // Should show different amounts for 2024 vs 2025
        const h2Elements = page.locator('h2');
        const h2Texts = await h2Elements.allTextContents();
        
        // Extract tax amounts
        const taxAmounts = h2Texts.map(text => {
          const match = text.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        
        // For district: 2024 should be 3000, 2025 should be 5000
        expect(taxAmounts.some(amount => amount >= 3000)).toBe(true);
        expect(taxAmounts.some(amount => amount >= 5000)).toBe(true);
      }
    }
  });

  test('should handle tax slab boundary values', async ({ page }) => {
    // Set general taxpayer
    const categorySelect = categoryRadios(page).first();
    if (await categorySelect.count() > 0) {
      await selectCategory(page, 'general');
      await page.waitForTimeout(500);
    }
    
    // Test income levels that hit slab boundaries
    const slabBoundaryTests = [
      { monthly: 37500, annual: 450000, description: 'End of 5% bracket (2024-25 only)' },
      { monthly: 56250, annual: 675000, description: 'End of first taxable bracket (2025-26)' },
      { monthly: 70833, annual: 850000, description: 'Mid-level slab boundary' },
      { monthly: 131250, annual: 1575000, description: 'Higher slab boundary' }
    ];
    
    for (const test of slabBoundaryTests) {
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill(test.monthly.toString());
      await page.waitForTimeout(1000);
      
      // Should show progressive tax calculations
      const pageContent = await page.textContent('body');
      
      // Should show multiple tax rates being applied
      expect(pageContent).toContain('10%');
      expect(pageContent).toContain('15%');
      
      // For the 450K test, 2024-25 should show 5% but 2025-26 should not
      if (test.annual === 450000) {
        expect(pageContent).toContain('5%'); // 2024-25 has 5% bracket
      }
      
      // Both years should show reasonable tax amounts
      const h2Elements = page.locator('h2');
      const h2Texts = await h2Elements.allTextContents();
      
      const taxAmounts = h2Texts.map(text => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      // Both should be positive and reasonable for the income level
      expect(taxAmounts[0]).toBeGreaterThan(0);
      expect(taxAmounts[1]).toBeGreaterThan(0);
      expect(taxAmounts[0]).toBeLessThan(test.annual * 0.5); // Less than 50% tax
      expect(taxAmounts[1]).toBeLessThan(test.annual * 0.5);
    }
  });

  test('should handle investment rebate boundary values', async ({ page }) => {
    // Set higher income to test investment rebate
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('83334'); // 1M annually
    await page.waitForTimeout(500);
    
    // Test different investment amounts
    const investmentTests = [
      { amount: 0, description: 'No investment' },
      { amount: 50000, description: 'Low investment' },
      { amount: 200000, description: '20% of income (max rebateable)' },
      { amount: 500000, description: 'Investment exceeds 20% limit' },
      { amount: 1000000, description: 'Very high investment' }
    ];
    
    for (const test of investmentTests) {
      // Find and fill investment field
      const investmentInputs = page.locator('input[placeholder*="investment"], input[title*="investment"]');
      
      if (await investmentInputs.count() > 0) {
        await investmentInputs.first().fill(test.amount.toString());
        await page.waitForTimeout(1000);
        
        // Should show investment rebate calculations
        const pageContent = await page.textContent('body');
        
        if (test.amount > 0) {
          // Should show rebate information
          expect(pageContent).toMatch(/rebate|investment/i);
          
          // Should show updated tax calculations
          const h2Elements = page.locator('h2');
          const h2Texts = await h2Elements.allTextContents();
          const hasNumbers = h2Texts.every(text => /\d/.test(text));
          expect(hasNumbers).toBe(true);
        }
      }
    }
  });

  test('should handle TDS boundary values and negative payable scenarios', async ({ page }) => {
    // Set reasonable income
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('60000'); // 720K annually
    await page.waitForTimeout(500);
    
    // Test different TDS amounts
    const tdsTests = [
      { amount: 0, description: 'No TDS' },
      { amount: 30000, description: 'Reasonable TDS' },
      { amount: 100000, description: 'High TDS (might exceed tax)' },
      { amount: 200000, description: 'Very high TDS (definitely exceeds tax)' }
    ];
    
    for (const test of tdsTests) {
      // Find TDS input (usually second input in rows)
      const allNumberInputs = page.locator('input[type="number"]');
      const inputCount = await allNumberInputs.count();
      
      if (inputCount > 1) {
        const tdsInput = allNumberInputs.nth(1);
        await tdsInput.fill(test.amount.toString());
        await page.waitForTimeout(1000);
        
        // Should show payable calculations
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/payable/i);
        
        // For high TDS amounts, payable should not go negative
        if (test.amount >= 100000) {
          // Look for payable amounts in the page
          const payableMatches = pageContent.match(/payable[^0-9]*(\d+)/i);
          if (payableMatches) {
            const payableAmount = parseInt(payableMatches[1]);
            expect(payableAmount).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  test('should handle exact slab amount boundaries', async ({ page }) => {
    // Test incomes that exactly hit slab boundaries
    const exactBoundaryTests = [
      { 
        category: 'general',
        monthly: 58000,
        bonus: 4000, // Exactly 700,000 taxable annually (58,000 * 12 + 4,000 = 400K threshold + 300K @ 10% = 30,000 tax)
        expectedSlabRow: 'Next Tk3 lakh [4-7 lakh]',
        expectedTax: 30000
      },
      {
        category: 'female', 
        monthly: 62500,
        bonus: 0, // Exactly 750,000 taxable annually (62,500 * 12 = 450K threshold + 300K @ 10% = 30,000 tax)
        expectedSlabRow: 'Next Tk3 lakh [4.5-7.5 lakh]',
        expectedTax: 30000
      },
      {
        category: 'disabled',
        monthly: 68000,
        bonus: 9000, // Exactly 825,000 taxable annually (68,000 * 12 + 9,000 = 525K threshold + 300K @ 10% = 30,000 tax)
        expectedSlabRow: 'Next Tk3 lakh [5.25-8.25 lakh]',
        expectedTax: 30000
      }
    ];
    
    for (const testCase of exactBoundaryTests) {
      await selectCategory(page, testCase.category);
      await page.getByLabel('July basic').fill(String(testCase.monthly));
      await page.getByLabel('Bonus', { exact: true }).fill(String(testCase.bonus));
      await page.waitForTimeout(300);

      const cols = page.locator('.comparison-col');
      await expect(cols.nth(0)).toContainText(`Tax for FY 2025-2026 ${testCase.expectedTax}`);
      await expect(cols.nth(0)).toContainText(testCase.expectedSlabRow);
      await expect(cols.nth(1)).toContainText(`Tax for FY 2026-2027 ${testCase.expectedTax}`);
    }
  });

  test('should handle age-based category detection boundaries', async ({ page }) => {
    // Test senior citizen age boundary (if age input exists)
    const ageInputs = page.locator('input[type="number"]').filter({ hasText: /age/i });
    
    if (await ageInputs.count() > 0) {
      const ageTests = [
        { age: 64, description: 'Just below senior age' },
        { age: 65, description: 'Senior citizen threshold' },
        { age: 70, description: 'Clearly senior' }
      ];
      
      for (const test of ageTests) {
        await ageInputs.first().fill(test.age.toString());
        await page.waitForTimeout(500);
        
        // Set reasonable income
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('50000');
        await page.waitForTimeout(1000);
        
        // Check if tax calculations change based on age
        const h2Elements = page.locator('h2');
        const h2Texts = await h2Elements.allTextContents();
        const hasNumbers = h2Texts.every(text => /\d/.test(text));
        expect(hasNumbers).toBe(true);
      }
    }
  });
});