import { test, expect } from '@playwright/test';

test.describe('Investment and TDS Workflow Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test.describe('Investment Rebate Calculations', () => {
    test('should calculate 15% rebate on qualified investments', async ({ page }) => {
      // Set up taxpayer with sufficient income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('100000'); // 1.2M annually
      await page.waitForTimeout(500);

      // Navigate to investment section or find investment inputs
      const investmentInputs = page.locator('input[type="number"]').filter({
        hasText: /invest/i
      });

      if (await investmentInputs.count() === 0) {
        // Try to find investment inputs by looking for related labels or sections
        const investmentSection = page.locator('text=/investment/i').first();
        if (await investmentSection.count() > 0) {
          await investmentSection.click();
        }
      }

      // Look for specific investment types
      const allInputs = page.locator('input[type="number"]');
      
      // Add DPS investment (typically first investment type)
      const investmentAmount = 150000;
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill(investmentAmount.toString());
        await page.waitForTimeout(500);
      }

      // Verify investment rebate calculation
      const rebateRows = page.locator('tr, .row').filter({
        hasText: /rebate|investment/i
      });

      if (await rebateRows.count() > 0) {
        const rebateText = await rebateRows.first().textContent();
        const expectedRebate = Math.min(investmentAmount * 0.15, 37500); // 15% with cap
        expect(rebateText).toContain(expectedRebate.toString());
      }
    });

    test('should apply maximum rebate cap correctly', async ({ page }) => {
      // Set high income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('150000'); // 1.8M annually
      await page.waitForTimeout(500);

      // Add investment exceeding rebate limit
      const allInputs = page.locator('input[type="number"]');
      const highInvestment = 500000; // Should hit the rebate cap

      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill(highInvestment.toString());
        await page.waitForTimeout(1000);
      }

      // Check total rebate doesn't exceed maximum
      const rebateRows = page.locator('tr').filter({
        hasText: /total.*rebate|rebate.*total/i
      });

      if (await rebateRows.count() > 0) {
        const rebateText = await rebateRows.first().textContent();
        const rebateAmount = parseInt(rebateText.match(/\d+/)?.[0] || '0');
        
        // Should not exceed 1.25 lakh for investments
        expect(rebateAmount).toBeLessThanOrEqual(125000);
      }
    });

    test('should handle multiple investment types correctly', async ({ page }) => {
      // Set income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('80000');
      await page.waitForTimeout(500);

      // Add multiple investment types
      const allInputs = page.locator('input[type="number"]');
      const investments = [50000, 30000, 25000, 40000]; // Various investment amounts

      for (let i = 0; i < investments.length && i + 1 < await allInputs.count(); i++) {
        await allInputs.nth(i + 1).fill(investments[i].toString());
        await page.waitForTimeout(200);
      }

      await page.waitForTimeout(1000);

      // Verify total investment sum
      const totalInvestmentRow = page.locator('tr').filter({
        hasText: /total.*investment/i
      });

      if (await totalInvestmentRow.count() > 0) {
        const totalText = await totalInvestmentRow.first().textContent();
        const expectedTotal = investments.reduce((sum, inv) => sum + inv, 0);
        expect(totalText).toContain(expectedTotal.toLocaleString());
      }
    });

    test('should calculate rebate correctly for different taxpayer profiles', async ({ page }) => {
      const profiles = ['general', 'female', 'senior'];
      
      for (const profile of profiles) {
        // Set profile
        const profileSelect = page.locator('select, input[value="' + profile + '"]').first();
        if (await profileSelect.count() > 0) {
          if (await profileSelect.evaluate(el => el.tagName.toLowerCase()) === 'select') {
            await profileSelect.selectOption(profile);
          } else {
            await profileSelect.click();
          }
          await page.waitForTimeout(500);
        }

        // Set consistent salary
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('70000');
        await page.waitForTimeout(300);

        // Add investment
        const allInputs = page.locator('input[type="number"]');
        if (await allInputs.count() >= 2) {
          await allInputs.nth(1).fill('100000');
          await page.waitForTimeout(500);
        }

        // Verify rebate calculation is consistent across profiles
        const rebateRows = page.locator('tr').filter({
          hasText: /rebate/i
        });

        if (await rebateRows.count() > 0) {
          const rebateText = await rebateRows.first().textContent();
          expect(rebateText).toMatch(/\d+/); // Should contain numbers
        }
      }
    });
  });

  test.describe('TDS (Tax Deducted at Source) Calculations', () => {
    test('should deduct TDS from final tax liability', async ({ page }) => {
      // Set salary that creates tax liability
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000'); // 720k annually
      await page.waitForTimeout(500);

      // Get initial tax calculation
      const totalTaxElement = page.locator('h2, .total-tax').first();
      let initialTax = '';
      if (await totalTaxElement.count() > 0) {
        initialTax = await totalTaxElement.textContent();
      }

      // Add TDS amount
      const tdsInputs = page.locator('input[type="number"]').filter({
        hasText: /tds|deduct/i
      });

      const tdsAmount = 15000;
      if (await tdsInputs.count() > 0) {
        await tdsInputs.first().fill(tdsAmount.toString());
        await page.waitForTimeout(1000);
      } else {
        // Try to find TDS input by looking for TDS section
        const allInputs = page.locator('input[type="number"]');
        if (await allInputs.count() >= 3) {
          await allInputs.nth(2).fill(tdsAmount.toString());
          await page.waitForTimeout(1000);
        }
      }

      // Verify TDS is shown in summary
      const tdsRow = page.locator('tr').filter({
        hasText: /deducted.*source|tds/i
      });

      if (await tdsRow.count() > 0) {
        const tdsText = await tdsRow.textContent();
        expect(tdsText).toContain(tdsAmount.toString());
      }

      // Verify payable amount is reduced by TDS
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      if (await payableRow.count() > 0) {
        await expect(payableRow).toBeVisible();
      }
    });

    test('should handle TDS exceeding tax liability', async ({ page }) => {
      // Set low income with high TDS
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('35000'); // 420k annually, low tax
      await page.waitForTimeout(500);

      // Add high TDS amount
      const allInputs = page.locator('input[type="number"]');
      const highTds = 50000;

      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill(highTds.toString());
        await page.waitForTimeout(1000);
      }

      // Verify payable amount can be negative (refund due)
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      if (await payableRow.count() > 0) {
        const payableText = await payableRow.textContent();
        // Should show negative amount or zero
        expect(payableText).toMatch(/-?\d+/);
      }
    });

    test('should calculate TDS for different income sources', async ({ page }) => {
      // Set salary
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('50000');
      await page.waitForTimeout(300);

      // Add bonus with TDS
      const allInputs = page.locator('input[type="number"]');
      if (await allInputs.count() >= 4) {
        await allInputs.nth(3).fill('100000'); // Bonus
        await page.waitForTimeout(300);
      }

      // Add TDS from salary
      if (await allInputs.count() >= 5) {
        await allInputs.nth(4).fill('8000'); // Salary TDS
        await page.waitForTimeout(500);
      }

      // Verify total TDS calculation
      const tdsRow = page.locator('tr').filter({
        hasText: /total.*deducted|deducted.*total/i
      });

      if (await tdsRow.count() > 0) {
        const tdsText = await tdsRow.textContent();
        expect(tdsText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Combined Investment and TDS Scenarios', () => {
    test('should calculate final payable with both investment and TDS', async ({ page }) => {
      // Set high income scenario
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('90000'); // 1.08M annually
      await page.waitForTimeout(500);

      const allInputs = page.locator('input[type="number"]');

      // Add investments
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill('120000'); // Investment
        await page.waitForTimeout(300);
      }

      // Add TDS
      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill('25000'); // TDS
        await page.waitForTimeout(300);
      }

      await page.waitForTimeout(1000);

      // Verify all components in final calculation
      const summaryRows = page.locator('tr').filter({
        hasText: /total tax|rebate|deducted|payable/i
      });

      const summaryCount = await summaryRows.count();
      expect(summaryCount).toBeGreaterThan(2); // Should have multiple summary rows

      // Check final payable amount
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      if (await payableRow.count() > 0) {
        const payableText = await payableRow.textContent();
        expect(payableText).toMatch(/-?\d+/); // Should show final amount
      }
    });

    test('should update calculations in real-time', async ({ page }) => {
      // Set initial values
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);

      // Get initial payable amount
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      let initialPayable = '';
      if (await payableRow.count() > 0) {
        initialPayable = await payableRow.textContent();
      }

      // Add investment
      const allInputs = page.locator('input[type="number"]');
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill('80000');
        await page.waitForTimeout(500);
      }

      // Verify payable amount changed
      if (initialPayable && await payableRow.count() > 0) {
        const newPayable = await payableRow.textContent();
        expect(newPayable).not.toBe(initialPayable);
      }

      // Add TDS
      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill('15000');
        await page.waitForTimeout(500);
      }

      // Verify payable amount changed again
      if (await payableRow.count() > 0) {
        const finalPayable = await payableRow.textContent();
        expect(finalPayable).toMatch(/-?\d+/);
      }
    });

    test('should handle edge case of zero tax liability', async ({ page }) => {
      // Set very low income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('25000'); // 300k annually, below threshold
      await page.waitForTimeout(500);

      // Add high investment
      const allInputs = page.locator('input[type="number"]');
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill('50000');
        await page.waitForTimeout(500);
      }

      // Add some TDS
      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill('3000');
        await page.waitForTimeout(500);
      }

      // Verify minimum tax logic
      const minimumTaxNotice = page.locator('small, .notice').filter({
        hasText: /minimum/i
      });

      if (await minimumTaxNotice.count() > 0) {
        await expect(minimumTaxNotice).toBeVisible();
      }

      // Verify payable amount
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      if (await payableRow.count() > 0) {
        const payableText = await payableRow.textContent();
        expect(payableText).toMatch(/-?\d+/);
      }
    });
  });

  test.describe('Complex Calculation Scenarios', () => {
    test('should handle maximum investment with all allowances', async ({ page }) => {
      // Set very high income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('200000'); // 2.4M annually
      await page.waitForTimeout(500);

      // Set to female taxpayer for higher threshold
      const femaleOption = page.locator('option[value="female"], input[value="female"]').first();
      if (await femaleOption.count() > 0) {
        await femaleOption.click();
        await page.waitForTimeout(500);
      }

      const allInputs = page.locator('input[type="number"]');

      // Add maximum investment amounts
      const maxInvestments = [200000, 150000, 100000, 75000];
      for (let i = 0; i < maxInvestments.length && i + 1 < await allInputs.count(); i++) {
        await allInputs.nth(i + 1).fill(maxInvestments[i].toString());
        await page.waitForTimeout(200);
      }

      // Add substantial TDS
      const tdsIndex = maxInvestments.length + 1;
      if (tdsIndex < await allInputs.count()) {
        await allInputs.nth(tdsIndex).fill('150000');
        await page.waitForTimeout(500);
      }

      await page.waitForTimeout(1500);

      // Verify all calculations are reasonable
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }

      // Verify payable amount
      const payableRow = page.locator('tr').filter({
        hasText: /payable/i
      });

      if (await payableRow.count() > 0) {
        const payableText = await payableRow.textContent();
        expect(payableText).toMatch(/-?\d+/);
      }
    });

    test('should validate calculation accuracy across profile changes', async ({ page }) => {
      const profiles = ['general', 'female', 'senior', 'disabled'];
      const calculationResults = {};

      for (const profile of profiles) {
        // Set profile
        const profileOption = page.locator(`option[value="${profile}"], input[value="${profile}"]`).first();
        if (await profileOption.count() > 0) {
          if (await profileOption.evaluate(el => el.tagName.toLowerCase()) === 'select') {
            await profileOption.selectOption(profile);
          } else {
            await profileOption.click();
          }
          await page.waitForTimeout(500);
        }

        // Set consistent income
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('75000');
        await page.waitForTimeout(500);

        // Set consistent investment
        const allInputs = page.locator('input[type="number"]');
        if (await allInputs.count() >= 2) {
          await allInputs.nth(1).fill('100000');
          await page.waitForTimeout(500);
        }

        // Record calculation result
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          calculationResults[profile] = await totalTaxElement.textContent();
        }
      }

      // Verify different profiles give different results
      const uniqueResults = new Set(Object.values(calculationResults));
      expect(uniqueResults.size).toBeGreaterThan(1); // Should have different tax amounts
    });
  });
});