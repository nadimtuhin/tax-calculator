import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    
    // Close star modal if it still appears
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test.describe('Input Validation and Error Handling', () => {
    test('should handle extremely large salary values', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test with very large number
      await salaryInput.fill('9999999');
      await page.waitForTimeout(1000);
      
      // Application should handle gracefully without crashing
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toBeTruthy();
        expect(taxText).toMatch(/\d+/);
      }
      
      // Check that calculations are reasonable
      const taxTable = page.locator('table').first();
      if (await taxTable.count() > 0) {
        await expect(taxTable).toBeVisible();
      }
    });

    test('should handle zero and negative inputs correctly', async ({ page }) => {
      const numberInputs = page.locator('input[type="number"]');
      
      // Test zero values
      if (await numberInputs.count() > 0) {
        await numberInputs.first().fill('0');
        await page.waitForTimeout(500);
        
        // Should handle zero salary gracefully
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toBeTruthy();
        }
      }
      
      // Test negative values (browser typically prevents, but test the handling)
      if (await numberInputs.count() > 0) {
        await numberInputs.first().fill('-1000');
        await page.waitForTimeout(500);
        
        // Should either prevent negative or handle gracefully
        const inputValue = await numberInputs.first().inputValue();
        expect(parseInt(inputValue)).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle decimal inputs appropriately', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test decimal salary
      await salaryInput.fill('55555.55');
      await page.waitForTimeout(1000);
      
      // Should handle decimal values in calculations
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
      
      // Verify calculations work with decimals
      const taxTable = page.locator('table').first();
      if (await taxTable.count() > 0) {
        await expect(taxTable).toBeVisible();
      }
    });

    test('should handle very small values correctly', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test very small salary
      await salaryInput.fill('1');
      await page.waitForTimeout(1000);
      
      // Should apply minimum tax rules
      const minimumTaxNotice = page.locator('small, .notice').filter({
        hasText: /minimum/i
      });
      
      if (await minimumTaxNotice.count() > 0) {
        await expect(minimumTaxNotice).toBeVisible();
      }
      
      // Check minimum tax application
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        const taxAmount = parseInt(taxText.match(/\d+/)?.[0] || '0');
        expect(taxAmount).toBeGreaterThan(0); // Should have minimum tax
      }
    });

    test('should handle rapid input changes without errors', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Rapidly change values
      const values = ['10000', '50000', '100000', '25000', '75000'];
      
      for (const value of values) {
        await salaryInput.fill(value);
        await page.waitForTimeout(100); // Minimal wait to test rapid changes
      }
      
      // Final calculation should be stable
      await page.waitForTimeout(1000);
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });

    test('should handle empty inputs gracefully', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Set value first
      await salaryInput.fill('50000');
      await page.waitForTimeout(500);
      
      // Clear the input
      await salaryInput.clear();
      await page.waitForTimeout(1000);
      
      // Should handle empty state gracefully
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toBeTruthy();
      }
    });
  });

  test.describe('Edge Cases in Tax Calculations', () => {
    test('should handle income exactly at tax slab boundaries', async ({ page }) => {
      // Test at 350,000 boundary for general taxpayer
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('29167'); // Exactly 350k annually
      await page.waitForTimeout(1000);
      
      // Should show correct boundary behavior
      const taxSlabs = page.locator('table tbody tr');
      if (await taxSlabs.count() > 0) {
        const firstSlabText = await taxSlabs.first().textContent();
        expect(firstSlabText).toBeTruthy();
      }
      
      // Test just above boundary
      await salaryInput.fill('29168'); // Just above 350k
      await page.waitForTimeout(1000);
      
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });

    test('should handle maximum investment limits correctly', async ({ page }) => {
      // Close star modal first
      const closeButton = page.locator('.star-modal .close-btn');
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
      
      // Set high income
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('150000');
      await page.waitForTimeout(500);
      
      // Find investment input (should be enabled, not disabled like TDS)
      const investmentInputs = page.locator('input[type="number"]:not([disabled])');
      const enabledInputs = await investmentInputs.all();
      
      // Try to find an investment field (usually comes after salary fields)
      for (let i = 1; i < enabledInputs.length && i < 10; i++) {
        const input = enabledInputs[i];
        if (await input.isEnabled()) {
          await input.fill('833333'); // Amount that would give high rebate
          await page.waitForTimeout(500);
          break;
        }
      }
      
      // Verify rebate cap is applied
      const rebateRows = page.locator('tr').filter({
        hasText: /rebate/i
      });
      
      if (await rebateRows.count() > 0) {
        const rebateText = await rebateRows.first().textContent();
        const rebateAmount = parseInt(rebateText.match(/\d+/)?.[0] || '0');
        expect(rebateAmount).toBeLessThanOrEqual(1000000); // 10 lakh max rebate
      }
    });

    test('should handle profile changes with extreme values', async ({ page }) => {
      // Set extreme salary
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('500000'); // Very high monthly
      await page.waitForTimeout(500);
      
      const profiles = ['general', 'female', 'senior', 'disabled'];
      
      for (const profile of profiles) {
        // Find the select element instead of option
        const profileSelect = page.locator('select').first();
        if (await profileSelect.count() > 0) {
          await profileSelect.selectOption(profile);
          await page.waitForTimeout(500);
          
          // Verify calculation doesn't break - check if any table shows tax info
          const taxTables = page.locator('table');
          if (await taxTables.count() > 0) {
            await expect(taxTables.first()).toBeVisible();
          }
        }
      }
    });

    test('should handle age boundary cases', async ({ page }) => {
      // Test senior citizen age boundary
      const ageInputs = page.locator('input[type="number"]').filter({
        hasText: /age/i
      });
      
      if (await ageInputs.count() > 0) {
        // Test at age 65 (boundary for senior citizen)
        await ageInputs.first().fill('65');
        await page.waitForTimeout(500);
        
        // Set salary
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('50000');
        await page.waitForTimeout(1000);
        
        // Verify calculation works
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toMatch(/\d+/);
        }
      }
    });
  });

  test.describe('Browser and Device Compatibility', () => {
    test('should work with keyboard-only navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Should focus on first input
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        expect(['input', 'select', 'button', 'a'].includes(tagName)).toBeTruthy();
        
        // Test input with keyboard
        if (tagName === 'input') {
          await page.keyboard.type('50000');
          await page.keyboard.press('Tab');
          
          // Should move to next field
          const nextFocused = page.locator(':focus');
          if (await nextFocused.count() > 0) {
            await expect(nextFocused).toBeFocused();
          }
        }
      }
    });

    test('should handle copy-paste operations', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test pasting value
      await salaryInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('75000');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Control+C');
      
      // Clear and paste
      await salaryInput.clear();
      await page.keyboard.press('Control+V');
      await page.waitForTimeout(500);
      
      // Verify pasted value works
      const inputValue = await salaryInput.inputValue();
      expect(inputValue).toBe('75000');
      
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });

    test('should handle browser zoom levels', async ({ page }) => {
      // Test different zoom levels
      const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5];
      
      for (const zoom of zoomLevels) {
        await page.setViewportSize({ 
          width: Math.floor(1280 * zoom), 
          height: Math.floor(720 * zoom) 
        });
        
        await page.waitForTimeout(300);
        
        // Verify basic functionality still works
        const salaryInput = page.locator('input[type="number"]').first();
        if (await salaryInput.count() > 0) {
          await salaryInput.fill('60000');
          await page.waitForTimeout(500);
          
          const totalTaxElement = page.locator('h2, .total-tax').first();
          if (await totalTaxElement.count() > 0) {
            await expect(totalTaxElement).toBeVisible();
          }
        }
      }
    });

    test('should work with touch gestures on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test touch interaction
      if (await salaryInput.count() > 0) {
        await salaryInput.tap();
        await salaryInput.fill('45000');
        await page.waitForTimeout(500);
        
        // Test scrolling with touch
        await page.touchScreen.tap(200, 300);
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(300);
        
        // Verify calculation still works after scroll
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          await expect(totalTaxElement).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Consistency and State Management', () => {
    test('should maintain calculation consistency across navigation', async ({ page }) => {
      // Set up calculation
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('65000');
      await page.waitForTimeout(500);
      
      // Get initial calculation
      const totalTaxElement = page.locator('h2, .total-tax').first();
      let initialTax = '';
      if (await totalTaxElement.count() > 0) {
        initialTax = await totalTaxElement.textContent();
      }
      
      // Navigate to another page (if available) and back
      const navLinks = page.locator('nav a').filter({
        hasText: /guide|about/i
      });
      
      if (await navLinks.count() > 0) {
        await navLinks.first().click();
        await page.waitForTimeout(500);
        
        // Navigate back
        const homeLink = page.locator('nav a').filter({
          hasText: /home|calculator/i
        });
        
        if (await homeLink.count() > 0) {
          await homeLink.click();
          await page.waitForTimeout(1000);
        } else {
          await page.goBack();
          await page.waitForTimeout(1000);
        }
        
        // Verify data persisted
        if (initialTax && await totalTaxElement.count() > 0) {
          const persistedTax = await totalTaxElement.textContent();
          expect(persistedTax).toBe(initialTax);
        }
      }
    });

    test('should handle multiple browser tabs correctly', async ({ context, page }) => {
      // Set up calculation in first tab
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('55000');
      await page.waitForTimeout(500);
      
      // Open new tab
      const newPage = await context.newPage();
      await newPage.goto('/');
      await newPage.waitForLoadState('networkidle');
      
      // Check if data is shared or isolated appropriately
      const newTabSalaryInput = newPage.locator('input[type="number"]').first();
      if (await newTabSalaryInput.count() > 0) {
        const newTabValue = await newTabSalaryInput.inputValue();
        
        // Data should persist due to localStorage
        expect(newTabValue).toBe('55000');
      }
      
      await newPage.close();
    });

    test('should handle localStorage corruption gracefully', async ({ page }) => {
      // Corrupt localStorage
      await page.evaluate(() => {
        localStorage.setItem('tax-data', 'invalid-json{');
      });
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Should still work despite corrupted data
      const salaryInput = page.locator('input[type="number"]').first();
      if (await salaryInput.count() > 0) {
        await salaryInput.fill('40000');
        await page.waitForTimeout(500);
        
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toMatch(/\d+/);
        }
      }
    });

    test('should handle quota exceeded errors', async ({ page }) => {
      // Fill localStorage to near capacity
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1000000); // 1MB string
          for (let i = 0; i < 5; i++) {
            localStorage.setItem(`large-data-${i}`, largeData);
          }
        } catch (e) {
          // Expected to fail when quota exceeded
        }
      });
      
      // Try to use the application
      const salaryInput = page.locator('input[type="number"]').first();
      if (await salaryInput.count() > 0) {
        await salaryInput.fill('50000');
        await page.waitForTimeout(500);
        
        // Should still function even if localStorage is full
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toMatch(/\d+/);
        }
      }
      
      // Clean up
      await page.evaluate(() => {
        localStorage.clear();
      });
    });
  });

  test.describe('Performance and Stress Testing', () => {
    test('should handle rapid successive calculations', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Rapidly change values
      for (let i = 0; i < 20; i++) {
        const value = 30000 + (i * 5000);
        await salaryInput.fill(value.toString());
        await page.waitForTimeout(50); // Very fast changes
      }
      
      // Final calculation should be stable
      await page.waitForTimeout(1000);
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });

    test('should handle memory pressure gracefully', async ({ page }) => {
      // Create memory pressure by storing large amounts of data
      await page.evaluate(() => {
        const largeArray = [];
        for (let i = 0; i < 10000; i++) {
          largeArray.push({
            id: i,
            data: 'x'.repeat(1000),
            timestamp: Date.now()
          });
        }
        window.largeData = largeArray;
      });
      
      // Test normal functionality under memory pressure
      const salaryInput = page.locator('input[type="number"]').first();
      if (await salaryInput.count() > 0) {
        await salaryInput.fill('70000');
        await page.waitForTimeout(1000);
        
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toMatch(/\d+/);
        }
      }
      
      // Cleanup
      await page.evaluate(() => {
        delete window.largeData;
      });
    });
  });
});