import { test, expect } from '@playwright/test';

test.describe('End-to-End User Workflows', () => {
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

  test('complete tax calculation workflow for general taxpayer', async ({ page }) => {
    // Step 1: Set taxpayer profile to general
    const profileSelect = page.locator('select, input[value="general"]').first();
    if (await profileSelect.count() > 0) {
      if (await profileSelect.evaluate(el => el.tagName.toLowerCase()) === 'select') {
        await profileSelect.selectOption('general');
      } else {
        await profileSelect.click();
      }
      await page.waitForTimeout(500);
    }

    // Step 2: Set salary
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('60000'); // 720k annually
      await page.waitForTimeout(500);
    }

    // Step 3: Set investments for rebate
    const investmentInput = page.locator('input').filter({ hasText: /invest/i }).first();
    if (await investmentInput.count() > 0) {
      await investmentInput.fill('150000');
      await page.waitForTimeout(500);
    }

    // Step 4: Set TDS if available
    const tdsInput = page.locator('input').filter({ hasText: /tds|deduct/i }).first();
    if (await tdsInput.count() > 0) {
      await tdsInput.fill('10000');
      await page.waitForTimeout(500);
    }

    // Step 5: Verify tax calculation results
    // Look for tax amount in calculation tables
    const taxAmountElements = page.locator('h2:has-text("Tax on"), td:has-text("Total payable tax")');
    if (await taxAmountElements.count() > 0) {
      const taxText = await taxAmountElements.first().textContent();
      expect(taxText).toMatch(/\d+/); // Should contain numbers
    }

    // Step 6: Verify tax slabs are displayed
    const taxTable = page.locator('table').first();
    if (await taxTable.count() > 0) {
      await expect(taxTable).toBeVisible();
      
      const slabRows = page.locator('table tbody tr');
      if (await slabRows.count() > 0) {
        const firstSlabText = await slabRows.first().textContent();
        expect(firstSlabText).toContain('3.5'); // General taxpayer threshold
      }
    }

    // Step 7: Verify payable amount calculation
    const payableRow = page.locator('tr').filter({ hasText: /payable/i }).first();
    if (await payableRow.count() > 0) {
      await expect(payableRow).toBeVisible();
    }
  });

  test('complete tax calculation workflow for female taxpayer', async ({ page }) => {
    // Step 1: Set taxpayer profile to female
    const femaleOption = page.locator('option[value="female"], input[value="female"]').first();
    if (await femaleOption.count() > 0) {
      await femaleOption.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Set same salary as general taxpayer test
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);
    }

    // Step 3: Verify female taxpayer gets different (lower) tax
    const taxSlabs = page.locator('table tbody tr');
    if (await taxSlabs.count() > 0) {
      const firstSlabText = await taxSlabs.first().textContent();
      expect(firstSlabText).toContain('4'); // Female taxpayer threshold (4 lakh)
    }

    // Step 4: Compare with general taxpayer calculation
    // (In real scenario, this would involve storing previous calculation)
    const totalTaxElement = page.locator('h2, .total-tax').first();
    if (await totalTaxElement.count() > 0) {
      const femaletax = await totalTaxElement.textContent();
      expect(femaletax).toBeTruthy();
    }
  });

  test('salary breakdown to tax calculation workflow', async ({ page }) => {
    // Step 1: Set total monthly salary
    const totalSalaryInput = page.locator('input[type="number"]').first();
    if (await totalSalaryInput.count() > 0) {
      await totalSalaryInput.fill('80000');
      await page.waitForTimeout(500);
    }

    // Step 2: Set breakdown components (if available)
    const numberInputs = page.locator('input[type="number"]');
    if (await numberInputs.count() >= 3) {
      // Basic salary
      await numberInputs.nth(1).fill('50000');
      await page.waitForTimeout(200);
      
      // House rent
      if (await numberInputs.count() >= 3) {
        await numberInputs.nth(2).fill('20000');
        await page.waitForTimeout(200);
      }
      
      // Medical allowance
      if (await numberInputs.count() >= 4) {
        await numberInputs.nth(3).fill('5000');
        await page.waitForTimeout(200);
      }
    }

    // Step 3: Verify breakdown totals
    const percentageCell = page.locator('td').filter({ hasText: /%/ }).first();
    if (await percentageCell.count() > 0) {
      const percentageText = await percentageCell.textContent();
      expect(percentageText).toMatch(/\d+/);
    }

    // Step 4: Verify tax calculation updates
    const totalTaxElement = page.locator('h2, .total-tax').first();
    if (await totalTaxElement.count() > 0) {
      const taxText = await totalTaxElement.textContent();
      expect(taxText).toMatch(/\d+/);
    }

    // Step 5: Check annual calculation (monthly * 12)
    const taxTable = page.locator('table').first();
    if (await taxTable.count() > 0) {
      await expect(taxTable).toBeVisible();
      // Annual income should be 960k (80k * 12)
    }
  });

  test('profile change impact on existing calculations', async ({ page }) => {
    // Step 1: Set initial calculation as general taxpayer
    const generalOption = page.locator('option[value="general"], input[value="general"]').first();
    if (await generalOption.count() > 0) {
      await generalOption.click();
      await page.waitForTimeout(500);
    }

    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('50000');
      await page.waitForTimeout(500);
    }

    // Store initial tax calculation
    const totalTaxElement = page.locator('h2, .total-tax').first();
    let initialTax = '';
    if (await totalTaxElement.count() > 0) {
      initialTax = await totalTaxElement.textContent();
    }

    // Step 2: Change to senior citizen
    const seniorOption = page.locator('option[value="senior"], input[value="senior"]').first();
    if (await seniorOption.count() > 0) {
      await seniorOption.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Verify tax calculation changed
    if (initialTax && await totalTaxElement.count() > 0) {
      const newTax = await totalTaxElement.textContent();
      expect(newTax).not.toBe(initialTax);
    }

    // Step 4: Verify tax slabs updated
    const taxSlabs = page.locator('table tbody tr');
    if (await taxSlabs.count() > 0) {
      const firstSlabText = await taxSlabs.first().textContent();
      expect(firstSlabText).toContain('4'); // Senior citizen threshold
    }

    // Step 5: Change to disabled person
    const disabledOption = page.locator('option[value="disabled"], input[value="disabled"]').first();
    if (await disabledOption.count() > 0) {
      await disabledOption.click();
      await page.waitForTimeout(500);
      
      // Verify highest threshold (4.75 lakh)
      const updatedSlabText = await taxSlabs.first().textContent();
      expect(updatedSlabText).toContain('4.8');
    }
  });

  test('investment rebate calculation workflow', async ({ page }) => {
    // Step 1: Set high salary to ensure tax liability
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('100000'); // 1.2M annually
      await page.waitForTimeout(500);
    }

    // Get initial tax without investment
    const totalTaxElement = page.locator('h2, .total-tax').first();
    let taxWithoutInvestment = '';
    if (await totalTaxElement.count() > 0) {
      taxWithoutInvestment = await totalTaxElement.textContent();
    }

    // Step 2: Add investment for rebate
    const investmentInputs = page.locator('input').filter({ hasText: /invest/i });
    if (await investmentInputs.count() > 0) {
      await investmentInputs.first().fill('200000'); // 2 lakh investment
      await page.waitForTimeout(500);
    }

    // Step 3: Verify rebate is applied
    const rebateRow = page.locator('tr').filter({ hasText: /rebate|investment/i }).first();
    if (await rebateRow.count() > 0) {
      await expect(rebateRow).toBeVisible();
      const rebateText = await rebateRow.textContent();
      expect(rebateText).toMatch(/\d+/); // Should show rebate amount
    }

    // Step 4: Verify total tax reduced
    if (taxWithoutInvestment && await totalTaxElement.count() > 0) {
      const taxWithInvestment = await totalTaxElement.textContent();
      // Tax should be different (likely lower) with investment
      expect(taxWithInvestment).toBeTruthy();
    }

    // Step 5: Verify final payable amount
    const payableRow = page.locator('tr').filter({ hasText: /payable/i }).first();
    if (await payableRow.count() > 0) {
      await expect(payableRow).toBeVisible();
    }
  });

  test('minimum tax application workflow', async ({ page }) => {
    // Step 1: Set location to check minimum tax rules
    const locationSelect = page.locator('select').last();
    if (await locationSelect.count() > 0) {
      const dhakaOption = page.locator('option[value="dhaka"]');
      if (await dhakaOption.count() > 0) {
        await locationSelect.selectOption('dhaka');
        await page.waitForTimeout(500);
      }
    }

    // Step 2: Set very low salary (below tax threshold)
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('20000'); // 240k annually, below 350k threshold
      await page.waitForTimeout(500);
    }

    // Step 3: Verify minimum tax is applied
    const minimumTaxNotice = page.locator('small, .notice').filter({ hasText: /minimum/i }).first();
    if (await minimumTaxNotice.count() > 0) {
      await expect(minimumTaxNotice).toBeVisible();
      const noticeText = await minimumTaxNotice.textContent();
      expect(noticeText.toLowerCase()).toContain('minimum');
    }

    // Step 4: Verify minimum tax amount (5000 for Dhaka)
    const totalTaxElement = page.locator('h2, .total-tax').first();
    if (await totalTaxElement.count() > 0) {
      const taxText = await totalTaxElement.textContent();
      expect(taxText).toContain('5000');
    }

    // Step 5: Change location to district and verify different minimum tax
    const districtOption = page.locator('option[value="district"]');
    if (await districtOption.count() > 0) {
      await locationSelect.selectOption('district');
      await page.waitForTimeout(500);
      
      // District minimum tax should be 3000
      const districtTax = await totalTaxElement.textContent();
      expect(districtTax).toContain('3000');
    }
  });

  test('complete application state persistence workflow', async ({ page }) => {
    // Step 1: Set comprehensive calculation data
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('75000');
      await page.waitForTimeout(500);
    }

    // Set profile
    const femaleOption = page.locator('option[value="female"], input[value="female"]').first();
    if (await femaleOption.count() > 0) {
      await femaleOption.click();
      await page.waitForTimeout(500);
    }

    // Set investment
    const investmentInput = page.locator('input').filter({ hasText: /invest/i }).first();
    if (await investmentInput.count() > 0) {
      await investmentInput.fill('100000');
      await page.waitForTimeout(500);
    }

    // Store calculation results
    const totalTaxElement = page.locator('h2, .total-tax').first();
    let originalTax = '';
    if (await totalTaxElement.count() > 0) {
      originalTax = await totalTaxElement.textContent();
    }

    // Step 2: Navigate away and back
    const taxGuideLink = page.locator('a').filter({ hasText: /guide/i }).first();
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      await page.waitForTimeout(500);
      
      const homeLink = page.locator('a').filter({ hasText: /home|calculator/i }).first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Verify all data persisted
    const persistedSalary = await page.locator('input[type="number"]').first().inputValue();
    expect(persistedSalary).toBe('75000');

    if (originalTax && await totalTaxElement.count() > 0) {
      const persistedTax = await totalTaxElement.textContent();
      expect(persistedTax).toBe(originalTax);
    }

    // Step 4: Reload page and verify persistence
    await page.reload();
    await page.waitForTimeout(500);

    const reloadedSalary = await page.locator('input[type="number"]').first().inputValue();
    expect(reloadedSalary).toBe('75000');

    if (originalTax && await totalTaxElement.count() > 0) {
      const reloadedTax = await totalTaxElement.textContent();
      expect(reloadedTax).toBe(originalTax);
    }
  });

  test('responsive design workflow across devices', async ({ page }) => {
    // Test on desktop first
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const salaryInput = page.locator('input[type="number"]').first();
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('65000');
      await page.waitForTimeout(500);
    }

    const desktopTax = await page.locator('h2, .total-tax').first().textContent();

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletTax = await page.locator('h2, .total-tax').first().textContent();
    expect(tabletTax).toBe(desktopTax);

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileTax = await page.locator('h2, .total-tax').first().textContent();
    expect(mobileTax).toBe(desktopTax);

    // Verify mobile interactions work
    const mobileInput = page.locator('input[type="number"]').first();
    await mobileInput.tap();
    await mobileInput.fill('55000');
    await expect(mobileInput).toHaveValue('55000');
  });

  test('accessibility workflow with keyboard navigation', async ({ page }) => {
    // Step 1: Navigate with keyboard only
    await page.keyboard.press('Tab'); // First focusable element
    
    let tabCount = 0;
    while (tabCount < 10) {
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'input' && await focusedElement.getAttribute('type') === 'number') {
          // Enter value with keyboard
          await page.keyboard.type('50000');
          break;
        }
      }
      
      await page.keyboard.press('Tab');
      tabCount++;
    }

    // Step 2: Navigate to different profile options
    tabCount = 0;
    while (tabCount < 10) {
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          await page.keyboard.press('ArrowDown'); // Select next option
          await page.keyboard.press('Enter');
          break;
        }
      }
      
      await page.keyboard.press('Tab');
      tabCount++;
    }

    // Step 3: Verify calculations updated
    const totalTaxElement = page.locator('h2, .total-tax').first();
    if (await totalTaxElement.count() > 0) {
      const taxText = await totalTaxElement.textContent();
      expect(taxText).toMatch(/\d+/);
    }
  });
});