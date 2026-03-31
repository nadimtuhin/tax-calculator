import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/Home.vue';
import salariesStore from '@/store/salaries';

describe('Side-by-Side Tax Comparison Integration', () => {
  let wrapper;
  let store;
  let router;

  beforeEach(async () => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false
        }
      }
    });

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Home', component: Home }
      ]
    });

    await router.push('/');

    wrapper = mount(Home, {
      global: {
        plugins: [store, router]
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Integration', () => {
    test('should render active year calculation and tax comparison', () => {
      // Active year (2025-26 by default) renders full-width
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      expect(calculation2025.exists()).toBe(true);
      expect(taxComparison.exists()).toBe(true);
    });

    test('should show 2-column comparison when toggled open', async () => {
      // Toggle comparison open
      await wrapper.vm.$nextTick();
      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const comparisonSection = wrapper.find('.tax-comparison-section');
      const comparisonRow = wrapper.find('.comparison-row');
      const comparisonCols = wrapper.findAll('.comparison-col');

      expect(comparisonSection.exists()).toBe(true);
      expect(comparisonRow.exists()).toBe(true);
      expect(comparisonCols).toHaveLength(2);
    });

    test('should display tax comparison summary', () => {
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      expect(taxComparison.exists()).toBe(true);

      const comparisonSection = wrapper.find('.content-section').element;
      expect(comparisonSection).toBeTruthy();
    });
  });

  describe('Data Flow Integration', () => {
    test('should update calculation when taxpayer profile changes', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });

      const initialThreshold = calculation2025.vm.taxFreeThreshold;

      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      await wrapper.vm.$nextTick();

      const newThreshold = calculation2025.vm.taxFreeThreshold;
      expect(newThreshold).toBeGreaterThan(initialThreshold);
    });

    test('should update calculation when salary changes', async () => {
      store.commit('updateTaxpayerProfile', { category: 'general', age: 30, location: 'dhaka' });

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const initialTax = calculation2025.vm.totalTax;

      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      await wrapper.vm.$nextTick();

      expect(calculation2025.vm.totalTax).toBeGreaterThan(initialTax);
    });

    test('should update comparison summary when calculations change', async () => {
      store.commit('updateTaxpayerProfile', { category: 'general', age: 30, location: 'dhaka' });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      expect(taxComparison.vm.activeTaxDifference).toBeDefined();

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const taxBefore = calculation2025.vm.totalTax;

      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      expect(calculation2025.vm.totalTax).toBeGreaterThan(taxBefore);
    });

    test('should respond to investment changes', async () => {
      store.commit('updateTaxpayerProfile', { category: 'general', age: 30, location: 'dhaka' });
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const initialRebate = calculation2025.vm.investmentRebate;

      store.commit('changeInvestment', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      expect(calculation2025.vm.investmentRebate).toBeGreaterThan(initialRebate);
    });
  });

  describe('Tax Calculation Accuracy', () => {
    test('should show correct thresholds for general taxpayer in both years', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const threshold2025 = calc2025.vm.taxFreeThreshold;
      const threshold2026 = calc2026.vm.taxFreeThreshold;

      // Both 2025-26 and 2026-27 have 375k threshold for general taxpayer
      expect(threshold2025).toBe(375000);
      expect(threshold2026).toBe(375000);
    });

    test('should show correct minimum tax amounts per location', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district'
      });

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const minimumTax2025 = calc2025.vm.minimumTaxAmount;
      const minimumTax2026 = calc2026.vm.minimumTaxAmount;

      // Both 2025-26 and 2026-27 have flat 5000 for all locations
      expect(minimumTax2025).toBe(5000);
      expect(minimumTax2026).toBe(5000);
    });

    test('should handle tax slab structures (no 5% bracket in both years)', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 }); // 600K annually

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const breakdown2025 = calc2025.vm.taxBreakdown;
      const breakdown2026 = calc2026.vm.taxBreakdown;

      // Both 2025-26 and 2026-27 have 6 slabs (no 5% bracket)
      expect(breakdown2025).toHaveLength(6);
      expect(breakdown2026).toHaveLength(6);

      // Neither year has a 5% bracket
      const rates2025 = breakdown2025.map(slab => slab.slabPercentage);
      const rates2026 = breakdown2026.map(slab => slab.slabPercentage);

      expect(rates2025).not.toContain(5);
      expect(rates2026).not.toContain(5);
    });
  });

  describe('Comparison Accuracy', () => {
    test('should correctly calculate tax savings/additional tax', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 35000 }); // 420K annually

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const totalTax2025 = calc2025.vm.totalTax;
      const totalTax2026 = calc2026.vm.totalTax;
      const taxSavings = taxComparison.vm.activeTaxSavings;
      const additionalTax = taxComparison.vm.activeAdditionalTax;

      if (totalTax2026 < totalTax2025) {
        expect(taxSavings).toBe(totalTax2025 - totalTax2026);
        expect(additionalTax).toBe(0);
      } else {
        expect(additionalTax).toBe(totalTax2026 - totalTax2025);
        expect(taxSavings).toBe(0);
      }
    });

    test('should show consistent payable amounts', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      store.commit('changeSubsequentTds', { index: 0, value: 5000 });
      store.commit('changeInvestment', { index: 0, value: 100000 });

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // Use store getters which handle negative amounts correctly
      const payable2025 = store.getters.payableTax2025;
      const payable2026 = store.getters.payableTax2026;

      // Both should use same TDS and share common taxpayer data
      expect(calc2025.vm.totalTds).toBe(calc2026.vm.totalTds);
      expect(payable2025).toBeGreaterThanOrEqual(0);
      expect(payable2026).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Different Taxpayer Categories', () => {
    // 2025-26 and 2026-27 share the same thresholds for all existing categories
    const testCategories = [
      { category: 'general', threshold2025: 375000, threshold2026: 375000 },
      { category: 'female', threshold2025: 425000, threshold2026: 425000 },
      { category: 'disabled', threshold2025: 500000, threshold2026: 500000 },
      { category: 'freedom_fighter', threshold2025: 525000, threshold2026: 525000 },
      { category: 'third_gender', threshold2025: 500000, threshold2026: 500000 }
    ];

    testCategories.forEach(({ category, threshold2025, threshold2026 }) => {
      test(`should handle ${category} taxpayer correctly`, async () => {
        store.commit('updateTaxpayerProfile', {
          category: category,
          age: 30,
          location: 'dhaka'
        });

        wrapper.vm.showComparison = true;
        await wrapper.vm.$nextTick();

        const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
        const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

        expect(calc2025.vm.taxFreeThreshold).toBe(threshold2025);
        expect(calc2026.vm.taxFreeThreshold).toBe(threshold2026);
        // Thresholds are equal between 2025-26 and 2026-27 for existing categories
        expect(threshold2026).toBe(threshold2025);
      });
    });
  });

  describe('Responsive Design Integration', () => {
    test('should maintain proper layout structure', async () => {
      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const comparisonRow = wrapper.find('.comparison-row');
      const comparisonCols = wrapper.findAll('.comparison-col');

      expect(comparisonRow.classes()).toContain('comparison-row');
      expect(comparisonCols).toHaveLength(2);

      comparisonCols.forEach(col => {
        expect(col.classes()).toContain('comparison-col');
      });
    });

    test('should have CSS classes for responsive behavior', async () => {
      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      // Check that the CSS classes exist for responsive design
      const mainContent = wrapper.find('.main-content');
      const comparisonSection = wrapper.find('.tax-comparison-section');

      expect(mainContent.exists()).toBe(true);
      expect(comparisonSection.exists()).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle zero income gracefully', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 0 });

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      expect(calc2025.vm.totalTax).toBe(calc2025.vm.minimumTaxAmount);
      expect(calc2026.vm.totalTax).toBe(calc2026.vm.minimumTaxAmount);
      expect(taxComparison.vm.activeTaxDifference).toBeDefined();
    });

    test('should handle very high income gracefully', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 1000000 }); // 12M annually

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      expect(calc2025.vm.totalTax).toBeGreaterThan(1000000);
      expect(calc2026.vm.totalTax).toBeGreaterThan(1000000);

      // Both should handle high income without errors (6 slabs each)
      expect(calc2025.vm.taxBreakdown).toHaveLength(6);
      expect(calc2026.vm.taxBreakdown).toHaveLength(6);
    });

    test('should handle missing taxpayer profile gracefully', async () => {
      // Reset taxpayer profile to empty
      store.commit('updateTaxpayerProfile', {});

      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // Should default to general taxpayer (375k for both years)
      expect(calc2025.vm.taxFreeThreshold).toBe(375000);
      expect(calc2026.vm.taxFreeThreshold).toBe(375000);
    });
  });

  describe('Performance and Reactivity', () => {
    test('should update all components reactively', async () => {
      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      // Make multiple changes
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 60000 });
      store.commit('changeInvestment', { index: 0, value: 80000 });

      await wrapper.vm.$nextTick();

      // All components should reflect the changes (female threshold = 425k in both years)
      expect(calc2025.vm.taxFreeThreshold).toBe(425000);
      expect(calc2026.vm.taxFreeThreshold).toBe(425000);
      expect(calc2025.vm.investmentRebate).toBeGreaterThan(0);
      expect(calc2026.vm.investmentRebate).toBeGreaterThan(0);
      expect(taxComparison.vm.activeTaxDifference).toBeDefined();
    });

    test('should maintain component isolation', async () => {
      wrapper.vm.showComparison = true;
      await wrapper.vm.$nextTick();

      const calc2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calc2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // Components should have their own computed properties
      expect(calc2025.vm.totalTax).toBeDefined();
      expect(calc2026.vm.totalTax).toBeDefined();

      // But they should react to same store changes
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      expect(calc2025.vm.totalTax).toBeGreaterThan(0);
      expect(calc2026.vm.totalTax).toBeGreaterThan(0);
    });
  });
});
