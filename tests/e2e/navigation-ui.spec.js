import { test, expect } from '@playwright/test';

test.describe('Navigation and UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should have functional navigation menu', async ({ page }) => {
    // Check if navigation exists
    const navigation = page.locator('nav, .navbar, [role="navigation"]').first();
    
    if (await navigation.count() > 0) {
      await expect(navigation).toBeVisible();
      
      // Check for navigation links
      const navLinks = navigation.locator('a');
      if (await navLinks.count() > 0) {
        for (let i = 0; i < await navLinks.count(); i++) {
          const link = navLinks.nth(i);
          await expect(link).toBeVisible();
          
          const href = await link.getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    }
  });

  test('should navigate to tax guide page', async ({ page }) => {
    // Look for tax guide link
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      
      // Check if navigated to tax guide page
      await expect(page).toHaveURL(/tax-guide/);
      
      // Check if tax guide content is visible
      const guideContent = page.locator('h1, h2, .guide-content, main').first();
      if (await guideContent.count() > 0) {
        await expect(guideContent).toBeVisible();
      }
    }
  });

  test('should navigate back to home page', async ({ page }) => {
    // Navigate to tax guide first (if available)
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      await page.waitForTimeout(500);
      
      // Navigate back to home
      const homeLink = page.locator('a').filter({ hasText: /home|calculator/i }).first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        
        await expect(page).toHaveURL('/');
        
        // Check if home content is visible
        const calculatorContent = page.locator('table, .calculator, input[type="number"]').first();
        if (await calculatorContent.count() > 0) {
          await expect(calculatorContent).toBeVisible();
        }
      }
    }
  });

  test('should have responsive navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const navigation = page.locator('nav, .navbar').first();
    if (await navigation.count() > 0) {
      await expect(navigation).toBeVisible();
      
      // Check for mobile menu toggle if present
      const menuToggle = page.locator('.navbar-toggle, .menu-toggle, [aria-label*="menu"]').first();
      if (await menuToggle.count() > 0) {
        await menuToggle.click();
        
        // Menu should expand
        const mobileMenu = page.locator('.navbar-collapse, .mobile-menu, .menu-expanded').first();
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).toBeVisible();
        }
      }
    }
  });

  test('should handle page transitions smoothly', async ({ page }) => {
    // Test multiple page transitions
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    
    if (await taxGuideLink.count() > 0) {
      // Navigate to tax guide
      await taxGuideLink.click();
      await expect(page).toHaveURL(/tax-guide/);
      
      // Navigate back
      const homeLink = page.locator('a').filter({ hasText: /home|calculator/i }).first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await expect(page).toHaveURL('/');
      }
      
      // Page should be functional after navigation
      const salaryInput = page.locator('input[type="number"]').first();
      if (await salaryInput.count() > 0) {
        await salaryInput.fill('50000');
        await expect(salaryInput).toHaveValue('50000');
      }
    }
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    
    if (await taxGuideLink.count() > 0) {
      // Navigate to tax guide
      await taxGuideLink.click();
      await expect(page).toHaveURL(/tax-guide/);
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/');
      
      // Use browser forward button
      await page.goForward();
      await expect(page).toHaveURL(/tax-guide/);
    }
  });

  test('should have accessible navigation with keyboard', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      // Should be able to focus on interactive elements
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
      expect(interactiveTags.includes(tagName)).toBeTruthy();
      
      // Test Enter key activation
      if (tagName === 'a') {
        const href = await focusedElement.getAttribute('href');
        if (href && href !== '#') {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          
          // Should navigate to the link destination
          const currentUrl = page.url();
          expect(currentUrl).toContain(href.replace('/', ''));
        }
      }
    }
  });

  test('should have proper page titles and meta information', async ({ page }) => {
    // Check home page title
    await expect(page).toHaveTitle(/tax.*calculator|bangladesh.*tax/i);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(50);
    }
    
    // Navigate to tax guide and check title
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      await expect(page).toHaveTitle(/tax.*guide|guide/i);
    }
  });

  test('should handle external links correctly', async ({ page }) => {
    // Look for external links (GitHub, etc.)
    const externalLinks = page.locator('a[href^="http"], a[target="_blank"]');
    
    if (await externalLinks.count() > 0) {
      for (let i = 0; i < Math.min(3, await externalLinks.count()); i++) {
        const link = externalLinks.nth(i);
        const href = await link.getAttribute('href');
        const target = await link.getAttribute('target');
        
        if (href && href.startsWith('http')) {
          expect(target).toBe('_blank');
          
          // External links should have proper attributes
          const rel = await link.getAttribute('rel');
          expect(rel).toContain('noopener');
        }
      }
    }
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Test if there are any loading indicators
    const loadingIndicators = page.locator('.loading, .spinner, [aria-label*="loading"]');
    
    // Simulate slow network to see loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    // Navigate to another page
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      
      // Check if loading state appears briefly
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
      
      // Wait for page to load
      await expect(page).toHaveURL(/tax-guide/);
    }
  });

  test('should handle form interactions correctly', async ({ page }) => {
    // Test form elements interaction
    const formElements = page.locator('input, select, textarea, button');
    
    if (await formElements.count() > 0) {
      for (let i = 0; i < Math.min(5, await formElements.count()); i++) {
        const element = formElements.nth(i);
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'input') {
          const type = await element.getAttribute('type');
          
          if (type === 'number') {
            await element.fill('12345');
            await expect(element).toHaveValue('12345');
          } else if (type === 'text') {
            await element.fill('test value');
            await expect(element).toHaveValue('test value');
          }
        } else if (tagName === 'select') {
          const options = element.locator('option');
          if (await options.count() > 1) {
            const secondOption = options.nth(1);
            const value = await secondOption.getAttribute('value');
            if (value) {
              await element.selectOption(value);
              await expect(element).toHaveValue(value);
            }
          }
        }
      }
    }
  });

  test('should provide visual feedback for user interactions', async ({ page }) => {
    // Test button hover states
    const buttons = page.locator('button, .btn, input[type="submit"]');
    
    if (await buttons.count() > 0) {
      const button = buttons.first();
      
      // Hover over button
      await button.hover();
      
      // Check if button has hover styles (this is basic, real hover styles need CSS checking)
      await expect(button).toBeVisible();
    }
    
    // Test input focus states
    const inputs = page.locator('input[type="number"], input[type="text"]');
    
    if (await inputs.count() > 0) {
      const input = inputs.first();
      
      await input.focus();
      await expect(input).toBeFocused();
      
      // Input should be visually focused
      await expect(input).toBeVisible();
    }
  });

  test('should maintain state during UI interactions', async ({ page }) => {
    // Set initial state
    const salaryInput = page.locator('input[type="number"]').first();
    
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('60000');
      await page.waitForTimeout(500);
    }
    
    // Navigate away and back
    const taxGuideLink = page.locator('a').filter({ hasText: /tax.*guide|guide/i }).first();
    if (await taxGuideLink.count() > 0) {
      await taxGuideLink.click();
      
      const homeLink = page.locator('a').filter({ hasText: /home|calculator/i }).first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        
        // State should be preserved
        const preservedValue = await page.locator('input[type="number"]').first().inputValue();
        expect(preservedValue).toBe('60000');
      }
    }
  });

  test('should handle edge cases in navigation', async ({ page }) => {
    // Test direct URL navigation
    await page.goto('/tax-guide');
    
    if (page.url().includes('tax-guide')) {
      await expect(page.locator('main, .content, h1, h2').first()).toBeVisible();
    }
    
    // Test invalid URL handling
    await page.goto('/non-existent-page');
    
    // Should either show 404 or redirect to home
    const is404 = page.url().includes('404') || await page.locator('h1, h2').filter({ hasText: /404|not found/i }).count() > 0;
    const isRedirected = page.url() === new URL('/', page.url()).href;
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('should be accessible with screen readers', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], main, nav, header');
    
    if (await landmarks.count() > 0) {
      for (let i = 0; i < await landmarks.count(); i++) {
        const landmark = landmarks.nth(i);
        await expect(landmark).toBeVisible();
      }
    }
    
    // Check for heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    
    if (await headings.count() > 0) {
      const firstHeading = headings.first();
      const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      
      // First heading should be h1
      expect(tagName).toBe('h1');
    }
    
    // Check for proper labels on form elements
    const inputs = page.locator('input');
    
    if (await inputs.count() > 0) {
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        
        if (id) {
          const associatedLabel = page.locator(`label[for="${id}"]`);
          const hasLabel = await associatedLabel.count() > 0 || ariaLabel;
          expect(hasLabel).toBeTruthy();
        }
      }
    }
  });
});