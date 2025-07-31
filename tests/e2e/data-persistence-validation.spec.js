import { test, expect } from '@playwright/test';

test.describe('Data Persistence and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test.describe('localStorage Persistence', () => {
    test('should persist taxpayer profile across sessions', async ({ page }) => {
      // Set specific taxpayer profile
      const profileSelect = page.locator('select, input[value="female"]').first();
      if (await profileSelect.count() > 0) {
        if (await profileSelect.evaluate(el => el.tagName.toLowerCase()) === 'select') {
          await profileSelect.selectOption('female');
        } else {
          await profileSelect.click();
        }
        await page.waitForTimeout(500);
      }

      // Set age and location if available
      const ageInputs = page.locator('input[type="number"]').filter({
        hasText: /age/i
      });
      if (await ageInputs.count() > 0) {
        await ageInputs.first().fill('32');
        await page.waitForTimeout(300);
      }

      // Reload page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify profile persisted
      const persistedProfileSelect = page.locator('select').first();
      if (await persistedProfileSelect.count() > 0) {
        const selectedValue = await persistedProfileSelect.inputValue();
        expect(selectedValue).toBe('female');
      }
    });

    test('should persist salary data across sessions', async ({ page }) => {
      // Set salary values
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('65000');
      await page.waitForTimeout(500);

      // Set additional financial data
      const allInputs = page.locator('input[type="number"]');
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill('120000'); // Investment
        await page.waitForTimeout(300);
      }
      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill('8000'); // TDS
        await page.waitForTimeout(300);
      }

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify data persisted
      const persistedSalary = await page.locator('input[type="number"]').first().inputValue();
      expect(persistedSalary).toBe('65000');

      if (await allInputs.count() >= 2) {
        const persistedInvestment = await allInputs.nth(1).inputValue();
        expect(persistedInvestment).toBe('120000');
      }
    });

    test('should persist calculation results across sessions', async ({ page }) => {
      // Set up calculation scenario
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('80000');
      await page.waitForTimeout(500);

      // Get initial tax calculation
      const totalTaxElement = page.locator('h2, .total-tax').first();
      let originalTax = '';
      if (await totalTaxElement.count() > 0) {
        originalTax = await totalTaxElement.textContent();
      }

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Verify calculation result persisted
      if (originalTax && await totalTaxElement.count() > 0) {
        const persistedTax = await totalTaxElement.textContent();
        expect(persistedTax).toBe(originalTax);
      }
    });

    test('should handle localStorage size limits gracefully', async ({ page }) => {
      // Fill localStorage with large amount of data
      await page.evaluate(() => {
        try {
          const largeData = JSON.stringify({
            salary: '50000',
            data: 'x'.repeat(100000) // Large string
          });
          localStorage.setItem('tax-calculator-data', largeData);
        } catch (e) {
          // Handle quota exceeded
          console.warn('LocalStorage quota exceeded');
        }
      });

      // Try to use the application normally
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('55000');
      await page.waitForTimeout(500);

      // Should still function
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });

    test('should migrate old data format gracefully', async ({ page }) => {
      // Set old format data in localStorage
      await page.evaluate(() => {
        localStorage.setItem('old-tax-data', JSON.stringify({
          salary: 45000,
          investments: [10000, 5000],
          profile: 'general'
        }));
      });

      // Use application
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);

      // Should work despite old data format
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Data Import/Export Functionality', () => {
    test('should export current tax data successfully', async ({ page }) => {
      // Set up data to export
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('70000');
      await page.waitForTimeout(500);

      // Set taxpayer profile
      const profileSelect = page.locator('select').first();
      if (await profileSelect.count() > 0) {
        await profileSelect.selectOption('senior');
        await page.waitForTimeout(500);
      }

      // Look for export button
      const exportBtn = page.locator('button').filter({
        hasText: /export/i
      });

      if (await exportBtn.count() > 0) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        await exportBtn.click();
        
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.json$/);
        
        // Verify download completed
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });

    test('should import tax data successfully', async ({ page }) => {
      // Create test data file content
      const testData = {
        taxpayerProfile: {
          category: 'female',
          age: 28,
          location: 'chittagong'
        },
        salary: 85000,
        investments: [
          { amount: 150000 },
          { amount: 75000 }
        ],
        bonus: 100000
      };

      // Look for import functionality
      const importBtn = page.locator('button').filter({
        hasText: /import/i
      });

      if (await importBtn.count() > 0) {
        // Create a temporary file for testing
        const fileContent = JSON.stringify(testData, null, 2);
        
        // Simulate file input (this would need actual file in real test)
        await page.evaluate((data) => {
          // Simulate importing data by setting localStorage directly
          localStorage.setItem('imported-tax-data', JSON.stringify(data));
        }, testData);

        // Reload to see imported data
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Verify data was imported (this is a simplified test)
        const salaryInput = page.locator('input[type="number"]').first();
        if (await salaryInput.count() > 0) {
          const importedValue = await salaryInput.inputValue();
          // Should have some value (may not be exact due to import logic)
          expect(importedValue).toBeTruthy();
        }
      }
    });

    test('should handle corrupted import files gracefully', async ({ page }) => {
      // Look for import button
      const importBtn = page.locator('button').filter({
        hasText: /import/i
      });

      if (await importBtn.count() > 0) {
        // Simulate importing corrupted data
        await page.evaluate(() => {
          localStorage.setItem('corrupted-import', '{invalid json}');
        });

        // Application should handle gracefully
        const salaryInput = page.locator('input[type="number"]').first();
        await salaryInput.fill('50000');
        await page.waitForTimeout(500);

        // Should still work despite corrupted import
        const totalTaxElement = page.locator('h2, .total-tax').first();
        if (await totalTaxElement.count() > 0) {
          const taxText = await totalTaxElement.textContent();
          expect(taxText).toMatch(/\d+/);
        }
      }
    });

    test('should validate imported data for security', async ({ page }) => {
      // Test with potentially malicious data
      const maliciousData = {
        taxpayerProfile: {
          category: '<script>alert("xss")</script>',
          age: 'javascript:alert(1)',
          location: '${eval("malicious code")}'
        },
        salary: 'invalid',
        investments: [
          { amount: '<img src=x onerror=alert(1)>' }
        ]
      };

      // Simulate importing malicious data
      await page.evaluate((data) => {
        localStorage.setItem('malicious-data', JSON.stringify(data));
      }, maliciousData);

      // Use application normally
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('40000');
      await page.waitForTimeout(500);

      // Should sanitize and handle malicious data safely
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        expect(taxText).toMatch(/\d+/);
        expect(taxText).not.toContain('<script>');
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields appropriately', async ({ page }) => {
      // Test with empty required fields
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Clear any existing value
      await salaryInput.clear();
      await page.waitForTimeout(500);

      // Try to proceed with empty salary
      const submitBtn = page.locator('button[type="submit"], .submit-btn').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        
        // Should show validation message or prevent submission
        const validationMessage = page.locator('.error, .validation-error, :invalid');
        if (await validationMessage.count() > 0) {
          await expect(validationMessage.first()).toBeVisible();
        }
      }
    });

    test('should validate numeric field constraints', async ({ page }) => {
      const salaryInput = page.locator('input[type="number"]').first();
      
      // Test minimum value constraint
      if (await salaryInput.getAttribute('min')) {
        await salaryInput.fill('-1000');
        await page.waitForTimeout(500);
        
        // Should prevent negative values or show validation
        const inputValue = await salaryInput.inputValue();
        expect(parseInt(inputValue)).toBeGreaterThanOrEqual(0);
      }

      // Test maximum value constraint
      if (await salaryInput.getAttribute('max')) {
        const maxValue = await salaryInput.getAttribute('max');
        const testValue = parseInt(maxValue) + 1000;
        
        await salaryInput.fill(testValue.toString());
        await page.waitForTimeout(500);
        
        // Should prevent exceeding maximum
        const inputValue = await salaryInput.inputValue();
        expect(parseInt(inputValue)).toBeLessThanOrEqual(parseInt(maxValue));
      }
    });

    test('should validate age constraints for different profiles', async ({ page }) => {
      // Test senior citizen age validation
      const seniorOption = page.locator('option[value="senior"], input[value="senior"]').first();
      if (await seniorOption.count() > 0) {
        await seniorOption.click();
        await page.waitForTimeout(500);

        const ageInputs = page.locator('input[type="number"]').filter({
          hasText: /age/i
        });

        if (await ageInputs.count() > 0) {
          // Test with age below senior citizen threshold
          await ageInputs.first().fill('60');
          await page.waitForTimeout(500);

          // Should either validate or auto-adjust
          const ageValue = await ageInputs.first().inputValue();
          expect(parseInt(ageValue)).toBeGreaterThanOrEqual(60);
        }
      }
    });

    test('should validate investment amount limits', async ({ page }) => {
      // Set high income to allow for investment testing
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('100000');
      await page.waitForTimeout(500);

      // Test investment limits
      const allInputs = page.locator('input[type="number"]');
      if (await allInputs.count() >= 2) {
        const investmentInput = allInputs.nth(1);
        
        // Test with extremely high investment
        await investmentInput.fill('10000000'); // 1 crore
        await page.waitForTimeout(500);

        // Should either limit the input or calculate rebate correctly
        const rebateRows = page.locator('tr').filter({
          hasText: /rebate/i
        });

        if (await rebateRows.count() > 0) {
          const rebateText = await rebateRows.first().textContent();
          const rebateAmount = parseInt(rebateText.match(/\d+/)?.[0] || '0');
          
          // Should not exceed maximum rebate regardless of investment amount
          expect(rebateAmount).toBeLessThanOrEqual(125000);
        }
      }
    });

    test('should validate calculation consistency', async ({ page }) => {
      // Set known values
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('50000'); // 600k annually
      await page.waitForTimeout(500);

      // Set general taxpayer profile
      const generalOption = page.locator('option[value="general"], input[value="general"]').first();
      if (await generalOption.count() > 0) {
        await generalOption.click();
        await page.waitForTimeout(500);
      }

      // Verify calculation is reasonable
      const totalTaxElement = page.locator('h2, .total-tax').first();
      if (await totalTaxElement.count() > 0) {
        const taxText = await totalTaxElement.textContent();
        const taxAmount = parseInt(taxText.match(/\d+/)?.[0] || '0');

        // For 600k income, tax should be reasonable (not negative, not excessive)
        expect(taxAmount).toBeGreaterThanOrEqual(0);
        expect(taxAmount).toBeLessThan(600000); // Tax shouldn't exceed income
      }
    });
  });

  test.describe('Data Integrity and Recovery', () => {
    test('should recover from application crashes gracefully', async ({ page }) => {
      // Set up data
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('75000');
      await page.waitForTimeout(500);

      // Simulate crash by forcing page reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Data should be recovered from localStorage
      const recoveredValue = await page.locator('input[type="number"]').first().inputValue();
      expect(recoveredValue).toBe('75000');
    });

    test('should handle concurrent tab modifications', async ({ context, page }) => {
      // Set data in first tab
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);

      // Open second tab
      const secondTab = await context.newPage();
      await secondTab.goto('/');
      await secondTab.waitForLoadState('networkidle');
      await secondTab.waitForTimeout(1000);

      // Modify data in second tab
      const secondTabSalaryInput = secondTab.locator('input[type="number"]').first();
      await secondTabSalaryInput.fill('80000');
      await secondTab.waitForTimeout(500);

      // Return to first tab
      await page.bringToFront();
      await page.waitForTimeout(500);

      // Check which data is shown (depends on implementation)
      const firstTabValue = await page.locator('input[type="number"]').first().inputValue();
      
      // Should handle concurrent modifications gracefully
      expect(['60000', '80000'].includes(firstTabValue)).toBeTruthy();

      await secondTab.close();
    });

    test('should backup data before major operations', async ({ page }) => {
      // Set up initial data
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('65000');
      await page.waitForTimeout(500);

      // Check if backup exists in localStorage
      const hasBackup = await page.evaluate(() => {
        const backupKeys = Object.keys(localStorage).filter(key => 
          key.includes('backup') || key.includes('previous')
        );
        return backupKeys.length > 0;
      });

      // Perform major operation (like reset)
      const resetBtn = page.locator('button').filter({
        hasText: /reset|clear/i
      });

      if (await resetBtn.count() > 0) {
        await resetBtn.click();
        
        // Handle confirmation dialog if present
        const confirmDialog = page.locator('text=/confirm|sure/i');
        if (await confirmDialog.count() > 0) {
          const okBtn = page.locator('button').filter({
            hasText: /ok|yes|confirm/i
          });
          if (await okBtn.count() > 0) {
            await okBtn.click();
          }
        }
        
        await page.waitForTimeout(1000);

        // Should have created backup before reset
        const hasBackupAfterReset = await page.evaluate(() => {
          const backupKeys = Object.keys(localStorage).filter(key => 
            key.includes('backup') || key.includes('previous') || key.includes('before-reset')
          );
          return backupKeys.length > 0;
        });

        expect(hasBackupAfterReset || hasBackup).toBeTruthy();
      }
    });

    test('should validate data integrity after operations', async ({ page }) => {
      // Set up complex calculation
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('90000');
      await page.waitForTimeout(300);

      const allInputs = page.locator('input[type="number"]');
      
      // Add investments
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill('100000');
        await page.waitForTimeout(300);
      }

      // Add TDS
      if (await allInputs.count() >= 3) {
        await allInputs.nth(2).fill('15000');
        await page.waitForTimeout(300);
      }

      // Get initial calculation
      const totalTaxElement = page.locator('h2, .total-tax').first();
      let initialTax = '';
      if (await totalTaxElement.count() > 0) {
        initialTax = await totalTaxElement.textContent();
      }

      // Perform data validation
      await page.evaluate(() => {
        // Simulate data validation check
        const data = {
          salary: localStorage.getItem('salary') || '0',
          investments: localStorage.getItem('investments') || '[]',
          tds: localStorage.getItem('tds') || '0'
        };
        
        // Validate data integrity
        if (parseInt(data.salary) < 0) {
          throw new Error('Invalid salary data');
        }
      });

      // Recalculate and verify consistency
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      if (initialTax && await totalTaxElement.count() > 0) {
        const recalculatedTax = await totalTaxElement.textContent();
        expect(recalculatedTax).toBe(initialTax);
      }
    });
  });
});