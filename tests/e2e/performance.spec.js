import { test, expect } from '@playwright/test';

test.describe('Performance Testing - Dual Tax Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Disable star modal before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tax-calculator-never-star', 'true');
    });
    await page.reload();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Close star modal if it still appears
    const closeButton = page.locator('.star-modal .close-btn');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    // Page should already be loaded from beforeEach, but let's reload to measure
    await page.reload();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Check that both calculation sections are visible
    const comparisonSection = page.locator('.tax-comparison-section');
    await expect(comparisonSection).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds even on slower connections
    expect(loadTime).toBeLessThan(5000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should calculate taxes quickly when salary input changes', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    // Measure time for multiple calculations
    const calculationTimes = [];
    const testSalaries = ['30000', '50000', '75000', '100000', '150000'];
    
    for (const salary of testSalaries) {
      const startTime = Date.now();
      
      // Enter salary
      await salaryInput.fill(salary);
      
      // Wait for calculations to complete (look for updated h2 text)
      await page.waitForFunction((expectedSalary) => {
        const h2Elements = document.querySelectorAll('h2');
        return Array.from(h2Elements).some(h2 => 
          h2.textContent && h2.textContent.includes(expectedSalary.substring(0, 2))
        );
      }, salary, { timeout: 2000 });
      
      const calculationTime = Date.now() - startTime;
      calculationTimes.push(calculationTime);
    }
    
    // Average calculation time should be under 500ms
    const avgTime = calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length;
    expect(avgTime).toBeLessThan(500);
    
    // No single calculation should take more than 1 second
    const maxTime = Math.max(...calculationTimes);
    expect(maxTime).toBeLessThan(1000);
    
    console.log(`Average calculation time: ${avgTime.toFixed(2)}ms`);
    console.log(`Max calculation time: ${maxTime}ms`);
  });

  test('should handle rapid input changes without performance degradation', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    // Measure time for rapid successive changes
    const startTime = Date.now();
    const rapidInputs = ['25000', '35000', '45000', '55000', '65000', '75000', '85000'];
    
    for (const salary of rapidInputs) {
      await salaryInput.fill(salary);
      // Small delay to simulate realistic typing speed
      await page.waitForTimeout(50);
    }
    
    // Wait for final calculation to complete
    await page.waitForFunction(() => {
      const h2Elements = document.querySelectorAll('h2');
      return Array.from(h2Elements).some(h2 => 
        h2.textContent && /85|8[0-9]/.test(h2.textContent)
      );
    }, { timeout: 2000 });
    
    const totalTime = Date.now() - startTime;
    
    // Rapid successive changes should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);
    
    console.log(`Rapid input changes completed in: ${totalTime}ms`);
  });

  test('should handle taxpayer profile changes efficiently', async ({ page }) => {
    const categorySelect = page.locator('select').first();
    
    if (await categorySelect.count() > 0) {
      // Set initial salary
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);
      
      // Measure time for profile changes
      const profileChangeTimes = [];
      const categories = ['general', 'female', 'disabled', 'freedom_fighter', 'general'];
      
      for (const category of categories) {
        const startTime = Date.now();
        
        await categorySelect.selectOption(category);
        
        // Wait for calculations to update
        await page.waitForFunction((cat) => {
          // Check if calculations have updated by looking for tax changes
          const h2Elements = document.querySelectorAll('h2');
          return Array.from(h2Elements).length >= 2;
        }, category, { timeout: 1500 });
        
        const changeTime = Date.now() - startTime;
        profileChangeTimes.push(changeTime);
      }
      
      // Profile changes should be fast
      const avgTime = profileChangeTimes.reduce((a, b) => a + b, 0) / profileChangeTimes.length;
      expect(avgTime).toBeLessThan(300);
      
      console.log(`Average profile change time: ${avgTime.toFixed(2)}ms`);
    }
  });

  test('should maintain responsive performance on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    const salaryInput = page.locator('input[type="number"]').first();
    
    // Measure mobile calculation performance
    const startTime = Date.now();
    
    await salaryInput.fill('80000');
    
    // Wait for mobile calculations to complete
    await page.waitForFunction(() => {
      const h2Elements = document.querySelectorAll('h2');
      return Array.from(h2Elements).some(h2 => 
        h2.textContent && /8[0-9]/.test(h2.textContent)
      );
    }, { timeout: 2000 });
    
    const mobileCalculationTime = Date.now() - startTime;
    
    // Mobile should not be significantly slower than desktop
    expect(mobileCalculationTime).toBeLessThan(800);
    
    console.log(`Mobile calculation time: ${mobileCalculationTime}ms`);
  });

  test('should handle investment input changes efficiently', async ({ page }) => {
    // Set salary first
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('100000'); // High enough to benefit from investment rebate
    await page.waitForTimeout(500);
    
    // Find investment inputs
    const investmentInputs = page.locator('input[placeholder*="investment"], input[title*="investment"]');
    
    if (await investmentInputs.count() > 0) {
      const investmentAmounts = ['0', '50000', '100000', '150000', '200000'];
      const investmentTimes = [];
      
      for (const amount of investmentAmounts) {
        const startTime = Date.now();
        
        await investmentInputs.first().fill(amount);
        
        // Wait for rebate calculations to update
        await page.waitForFunction((investAmount) => {
          // Check if page content includes rebate information
          return document.body.textContent.includes('rebate') || 
                 document.body.textContent.includes(investAmount);
        }, amount, { timeout: 1500 });
        
        const investmentTime = Date.now() - startTime;
        investmentTimes.push(investmentTime);
      }
      
      // Investment calculations should be fast
      const avgTime = investmentTimes.reduce((a, b) => a + b, 0) / investmentTimes.length;
      expect(avgTime).toBeLessThan(400);
      
      console.log(`Average investment calculation time: ${avgTime.toFixed(2)}ms`);
    }
  });

  test('should not have memory leaks with repeated calculations', async ({ page }) => {
    const salaryInput = page.locator('input[type="number"]').first();
    
    // Perform many calculations to test for memory leaks
    const iterations = 20;
    const salaries = ['25000', '35000', '45000', '55000', '65000'];
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const salary = salaries[i % salaries.length];
      await salaryInput.fill(salary);
      await page.waitForTimeout(50); // Small delay
    }
    
    // Wait for final calculation
    await page.waitForFunction(() => {
      const h2Elements = document.querySelectorAll('h2');
      return Array.from(h2Elements).some(h2 => h2.textContent && /\d/.test(h2.textContent));
    }, { timeout: 2000 });
    
    const totalTime = Date.now() - startTime;
    
    // Many repeated calculations should complete reasonably fast
    expect(totalTime).toBeLessThan(5000);
    
    // Check that page is still responsive
    await salaryInput.fill('99999');
    await page.waitForTimeout(500);
    
    const finalH2Texts = await page.locator('h2').allTextContents();
    const stillResponsive = finalH2Texts.some(text => /99|9[0-9]/.test(text));
    expect(stillResponsive).toBe(true);
    
    console.log(`${iterations} calculations completed in: ${totalTime}ms`);
  });

  test('should handle complex scenarios without performance issues', async ({ page }) => {
    // Test complex scenario with multiple inputs changing
    const salaryInput = page.locator('input[type="number"]').first();
    const categorySelect = page.locator('select').first();
    
    const startTime = Date.now();
    
    // Complex scenario: change category, salary, and investment
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption('female');
      await page.waitForTimeout(100);
    }
    
    await salaryInput.fill('120000');
    await page.waitForTimeout(100);
    
    // Add investment if available
    const investmentInputs = page.locator('input[placeholder*="investment"], input[title*="investment"]');
    if (await investmentInputs.count() > 0) {
      await investmentInputs.first().fill('200000');
      await page.waitForTimeout(100);
    }
    
    // Add TDS if available
    const allNumberInputs = page.locator('input[type="number"]');
    const inputCount = await allNumberInputs.count();
    if (inputCount > 1) {
      await allNumberInputs.nth(1).fill('15000');
      await page.waitForTimeout(100);
    }
    
    // Wait for all calculations to complete
    await page.waitForFunction(() => {
      const h2Elements = document.querySelectorAll('h2');
      return Array.from(h2Elements).length >= 2 && 
             Array.from(h2Elements).every(h2 => h2.textContent && /\d/.test(h2.textContent));
    }, { timeout: 2000 });
    
    const complexScenarioTime = Date.now() - startTime;
    
    // Complex scenario should complete within reasonable time
    expect(complexScenarioTime).toBeLessThan(1500);
    
    console.log(`Complex scenario completed in: ${complexScenarioTime}ms`);
  });

  test('should render tables efficiently with dual calculations', async ({ page }) => {
    // Set high income to generate many table rows
    const salaryInput = page.locator('input[type="number"]').first();
    
    const startTime = Date.now();
    await salaryInput.fill('200000'); // 2.4M annually - will use all tax brackets
    
    // Wait for both tables to render completely
    await page.waitForFunction(() => {
      const tables = document.querySelectorAll('table');
      return tables.length >= 2 && 
             Array.from(tables).every(table => 
               table.textContent.includes('Total tax') && 
               table.textContent.includes('30%') // Highest bracket
             );
    }, { timeout: 3000 });
    
    const renderTime = Date.now() - startTime;
    
    // Table rendering should be fast even with complex calculations
    expect(renderTime).toBeLessThan(2000);
    
    // Check that both tables are fully rendered
    const tables = page.locator('table');
    const tableCount = await tables.count();
    expect(tableCount).toBeGreaterThanOrEqual(2);
    
    console.log(`Dual table rendering completed in: ${renderTime}ms`);
  });

  test('should maintain performance with large numbers', async ({ page }) => {
    // Test with very large salary amounts
    const salaryInput = page.locator('input[type="number"]').first();
    const largeSalaries = ['500000', '1000000', '5000000']; // Up to 60M annually
    
    for (const salary of largeSalaries) {
      const startTime = Date.now();
      
      await salaryInput.fill(salary);
      
      // Wait for calculations with large numbers
      await page.waitForFunction((sal) => {
        const h2Elements = document.querySelectorAll('h2');
        return Array.from(h2Elements).some(h2 => 
          h2.textContent && h2.textContent.includes(sal.substring(0, 3))
        );
      }, salary, { timeout: 2000 });
      
      const calculationTime = Date.now() - startTime;
      
      // Large number calculations should still be fast
      expect(calculationTime).toBeLessThan(800);
      
      console.log(`Large number (${salary}) calculation time: ${calculationTime}ms`);
    }
  });
});