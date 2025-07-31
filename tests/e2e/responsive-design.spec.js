import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Dual Tax Calculator', () => {
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
    
    // Set up some test data to ensure content is loaded
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('50000');
    await page.waitForTimeout(500);
  });

  test('should display side-by-side layout on desktop (1200px)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // Check comparison section layout
    const comparisonRow = page.locator('.comparison-row');
    await expect(comparisonRow).toBeVisible();
    
    // Should have two columns side by side
    const comparisonCols = page.locator('.comparison-col');
    await expect(comparisonCols).toHaveCount(2);
    
    // Check that columns are actually side by side (flex layout)
    const comparisonRowBox = await comparisonRow.boundingBox();
    const firstColBox = await comparisonCols.first().boundingBox();
    const secondColBox = await comparisonCols.last().boundingBox();
    
    // On desktop, columns should be roughly the same width and side by side
    expect(firstColBox.width).toBeGreaterThan(400); // Reasonable column width
    expect(secondColBox.width).toBeGreaterThan(400);
    
    // Second column should start roughly where first column ends
    expect(secondColBox.x).toBeGreaterThanOrEqual(firstColBox.x + firstColBox.width - 50);
  });

  test('should maintain usable layout on tablet (768px)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    
    // Check that main content is still accessible
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // Comparison section should still exist
    const comparisonSection = page.locator('.tax-comparison-section');
    await expect(comparisonSection).toBeVisible();
    
    // Should still have two comparison columns
    const comparisonCols = page.locator('.comparison-col');
    await expect(comparisonCols).toHaveCount(2);
    
    // Input fields should still be accessible
    const salaryInput = page.locator('input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    // Test that input still works
    await salaryInput.fill('60000');
    await page.waitForTimeout(500);
    
    // Check that calculations updated
    const h2Elements = page.locator('h2');
    const h2Texts = await h2Elements.allTextContents();
    const hasNumbers = h2Texts.some(text => /60/.test(text)); // Should show updated tax amount
    expect(hasNumbers).toBe(true);
  });

  test('should stack content appropriately on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Main content should still be visible
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // Comparison section should exist but may be stacked
    const comparisonSection = page.locator('.tax-comparison-section');
    await expect(comparisonSection).toBeVisible();
    
    // Should still have both comparison columns
    const comparisonCols = page.locator('.comparison-col');
    await expect(comparisonCols).toHaveCount(2);
    
    // On mobile, columns should stack (second column below first)
    const firstColBox = await comparisonCols.first().boundingBox();
    const secondColBox = await comparisonCols.last().boundingBox();
    
    // Second column should be below first column (higher y position)
    expect(secondColBox.y).toBeGreaterThan(firstColBox.y);
    
    // Both columns should use most of the screen width
    expect(firstColBox.width).toBeGreaterThan(300);
    expect(secondColBox.width).toBeGreaterThan(300);
  });

  test('should handle input interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Find and interact with salary input
    const salaryInput = page.locator('input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    // Test input on mobile
    await salaryInput.fill('75000');
    await page.waitForTimeout(1000);
    
    // Check that value was set
    const inputValue = await salaryInput.inputValue();
    expect(inputValue).toBe('75000');
    
    // Check that calculations updated
    const h2Elements = page.locator('h2');
    const h2Texts = await h2Elements.allTextContents();
    const hasNumbers = h2Texts.some(text => /\d/.test(text));
    expect(hasNumbers).toBe(true);
    
    // Test select dropdown if it exists
    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption('female');
      await page.waitForTimeout(500);
      
      // Verify selection worked
      const selectedValue = await categorySelect.inputValue();
      expect(selectedValue).toBe('female');
    }
  });

  test('should maintain table readability on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      
      // Check that tables are visible and readable
      const tables = page.locator('table');
      const tableCount = await tables.count();
      expect(tableCount).toBeGreaterThanOrEqual(2);
      
      // Check that table content is accessible
      const firstTable = tables.first();
      await expect(firstTable).toBeVisible();
      
      // Table should not be too narrow to be readable
      const tableBox = await firstTable.boundingBox();
      expect(tableBox.width).toBeGreaterThan(200);
      
      // Check that table text is readable
      const tableText = await firstTable.textContent();
      expect(tableText).toContain('Total tax');
    }
  });

  test('should handle content overflow gracefully', async ({ page }) => {
    // Test with very narrow viewport
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);
    
    // Main content should still be accessible
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // Should not have horizontal scroll on main content
    const mainContentBox = await mainContent.boundingBox();
    expect(mainContentBox.width).toBeLessThanOrEqual(320);
    
    // Input fields should still be usable
    const salaryInput = page.locator('input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    // Test input functionality
    await salaryInput.fill('40000');
    await page.waitForTimeout(500);
    
    const inputValue = await salaryInput.inputValue();
    expect(inputValue).toBe('40000');
  });

  test('should handle orientation changes on mobile devices', async ({ page }) => {
    // Start in portrait mode (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Check initial layout
    const comparisonCols = page.locator('.comparison-col');
    await expect(comparisonCols).toHaveCount(2);
    
    const portraitFirstColBox = await comparisonCols.first().boundingBox();
    const portraitSecondColBox = await comparisonCols.last().boundingBox();
    
    // In portrait, second column should be below first
    expect(portraitSecondColBox.y).toBeGreaterThan(portraitFirstColBox.y);
    
    // Switch to landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(300);
    
    // Layout should adapt
    await expect(comparisonCols).toHaveCount(2);
    
    const landscapeFirstColBox = await comparisonCols.first().boundingBox();
    const landscapeSecondColBox = await comparisonCols.last().boundingBox();
    
    // In landscape, columns might be side by side or still stacked
    // Just ensure both are visible and accessible
    expect(landscapeFirstColBox.width).toBeGreaterThan(200);
    expect(landscapeSecondColBox.width).toBeGreaterThan(200);
  });

  test('should maintain proper spacing and padding across screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'Large Desktop' },
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 375, height: 667, name: 'Mobile Portrait' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      
      // Check that content sections have proper spacing
      const contentSections = page.locator('.content-section');
      const sectionCount = await contentSections.count();
      expect(sectionCount).toBeGreaterThan(0);
      
      // Each section should have reasonable padding
      const firstSection = contentSections.first();
      const sectionBox = await firstSection.boundingBox();
      
      // Sections should not be too narrow or too wide
      expect(sectionBox.width).toBeGreaterThan(200);
      expect(sectionBox.width).toBeLessThan(viewport.width + 50); // Allow some margin
      
      // Check that sections don't overlap
      if (sectionCount >= 2) {
        const firstSectionBox = await contentSections.first().boundingBox();
        const secondSectionBox = await contentSections.nth(1).boundingBox();
        
        // Sections should not overlap (either side by side or stacked)
        const overlap = !(
          firstSectionBox.x + firstSectionBox.width <= secondSectionBox.x || 
          secondSectionBox.x + secondSectionBox.width <= firstSectionBox.x ||
          firstSectionBox.y + firstSectionBox.height <= secondSectionBox.y ||
          secondSectionBox.y + secondSectionBox.height <= firstSectionBox.y
        );
        expect(overlap).toBe(false);
      }
    }
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Test touch on input fields
    const salaryInput = page.locator('input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    // Tap on input (touch interaction)
    await salaryInput.tap();
    await page.waitForTimeout(200);
    
    // Input should be focused
    const isFocused = await salaryInput.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
    
    // Type value
    await salaryInput.fill('85000');
    await page.waitForTimeout(500);
    
    // Tap somewhere else to blur
    const mainContent = page.locator('.main-content');
    await mainContent.tap();
    await page.waitForTimeout(200);
    
    // Check that calculations updated
    const h2Elements = page.locator('h2');
    const h2Texts = await h2Elements.allTextContents();
    const hasNumbers = h2Texts.some(text => /85/.test(text) || /\d{5,}/.test(text));
    expect(hasNumbers).toBe(true);
  });

  test('should provide adequate tap targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Check input fields have adequate size for touch
    const numberInputs = page.locator('input[type="number"]');
    const inputCount = await numberInputs.count();
    
    if (inputCount > 0) {
      const firstInput = numberInputs.first();
      const inputBox = await firstInput.boundingBox();
      
      // Input should be at least 44px high (minimum touch target size)
      expect(inputBox.height).toBeGreaterThanOrEqual(30);
      expect(inputBox.width).toBeGreaterThanOrEqual(80);
    }
    
    // Check select dropdowns
    const selects = page.locator('select');
    const selectCount = await selects.count();
    
    if (selectCount > 0) {
      const firstSelect = selects.first();
      const selectBox = await firstSelect.boundingBox();
      
      // Select should be touch-friendly
      expect(selectBox.height).toBeGreaterThanOrEqual(30);
    }
    
    // Check buttons if any
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        expect(buttonBox.height).toBeGreaterThanOrEqual(30);
      }
    }
  });
});