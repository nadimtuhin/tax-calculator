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
    test('should render both calculation components side by side', () => {
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      expect(calculation2024.exists()).toBe(true);
      expect(calculation2025.exists()).toBe(true);
      expect(taxComparison.exists()).toBe(true);
    });

    test('should have correct layout structure', () => {
      const comparisonSection = wrapper.find('.tax-comparison-section');
      const comparisonRow = wrapper.find('.comparison-row');
      const comparisonCols = wrapper.findAll('.comparison-col');

      expect(comparisonSection.exists()).toBe(true);
      expect(comparisonRow.exists()).toBe(true);
      expect(comparisonCols).toHaveLength(2);
    });

    test('should display tax comparison summary above calculations', () => {
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      
      // Both components should exist
      expect(taxComparison.exists()).toBe(true);
      expect(calculation2024.exists()).toBe(true);
      
      // Tax comparison should be in a content section
      const comparisonSection = wrapper.find('.content-section').element;
      const calculationSection = wrapper.find('.tax-comparison-section').element;
      
      expect(comparisonSection).toBeTruthy();
      expect(calculationSection).toBeTruthy();
    });
  });

  describe('Data Flow Integration', () => {
    test('should update both calculations when taxpayer profile changes', async () => {
      // Get initial calculations
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const initialThreshold2024 = calculation2024.vm.taxFreeThreshold;
      const initialThreshold2025 = calculation2025.vm.taxFreeThreshold;

      // Change taxpayer profile
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      await wrapper.vm.$nextTick();

      const newThreshold2024 = calculation2024.vm.taxFreeThreshold;
      const newThreshold2025 = calculation2025.vm.taxFreeThreshold;

      expect(newThreshold2024).toBeGreaterThan(initialThreshold2024);
      expect(newThreshold2025).toBeGreaterThan(initialThreshold2025);
      expect(newThreshold2025).toBeGreaterThan(newThreshold2024); // 2025 should be higher
    });

    test('should update both calculations when salary changes', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const initialTax2024 = calculation2024.vm.totalTax;
      const initialTax2025 = calculation2025.vm.totalTax;

      // Increase salary
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      await wrapper.vm.$nextTick();

      const newTax2024 = calculation2024.vm.totalTax;
      const newTax2025 = calculation2025.vm.totalTax;

      expect(newTax2024).toBeGreaterThan(initialTax2024);
      expect(newTax2025).toBeGreaterThan(initialTax2025);
    });

    test('should update comparison summary when calculations change', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      
      const initialDifference = taxComparison.vm.taxDifference;

      // Change salary to affect tax calculations
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      const newDifference = taxComparison.vm.taxDifference;
      
      // Difference should change when calculations change
      expect(newDifference).not.toBe(initialDifference);
    });

    test('should respond to investment changes in both calculations', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const initialRebate2024 = calculation2024.vm.investmentRebate;
      const initialRebate2025 = calculation2025.vm.investmentRebate;

      // Add investment
      store.commit('changeInvestment', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      const newRebate2024 = calculation2024.vm.investmentRebate;
      const newRebate2025 = calculation2025.vm.investmentRebate;

      expect(newRebate2024).toBeGreaterThan(initialRebate2024);
      expect(newRebate2025).toBeGreaterThan(initialRebate2025);
    });
  });

  describe('Tax Calculation Accuracy', () => {
    test('should show different thresholds for same taxpayer profile', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const threshold2024 = calculation2024.vm.taxFreeThreshold;
      const threshold2025 = calculation2025.vm.taxFreeThreshold;

      expect(threshold2024).toBe(350000);
      expect(threshold2025).toBe(375000);
      expect(threshold2025 - threshold2024).toBe(25000); // 25K increase
    });

    test('should show different minimum tax amounts', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district' // Different location for 2024-25
      });

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const minimumTax2024 = calculation2024.vm.minimumTaxAmount;
      const minimumTax2025 = calculation2025.vm.minimumTaxAmount;

      expect(minimumTax2024).toBe(3000); // District minimum for 2024-25
      expect(minimumTax2025).toBe(5000); // Unified minimum for 2025-26
    });

    test('should handle different tax slab structures', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 }); // 600K annually

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const breakdown2024 = calculation2024.vm.taxBreakdown;
      const breakdown2025 = calculation2025.vm.taxBreakdown;

      expect(breakdown2024).toHaveLength(7); // 2024-25 has 7 slabs
      expect(breakdown2025).toHaveLength(6); // 2025-26 has 6 slabs

      // Check that 2024 has 5% bracket but 2025 doesn't
      const rates2024 = breakdown2024.map(slab => slab.slabPercentage);
      const rates2025 = breakdown2025.map(slab => slab.slabPercentage);

      expect(rates2024).toContain(5);
      expect(rates2025).not.toContain(5);
    });
  });

  describe('Comparison Accuracy', () => {
    test('should correctly calculate tax savings when 2025 is lower', async () => {
      // Set up scenario where 2025 tax might be lower due to higher threshold
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 35000 }); // 420K annually

      await wrapper.vm.$nextTick();

      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      const totalTax2024 = calculation2024.vm.totalTax;
      const totalTax2025 = calculation2025.vm.totalTax;
      const taxSavings = taxComparison.vm.taxSavings;
      const additionalTax = taxComparison.vm.additionalTax;

      if (totalTax2025 < totalTax2024) {
        expect(taxSavings).toBe(totalTax2024 - totalTax2025);
        expect(additionalTax).toBe(0);
      } else {
        expect(additionalTax).toBe(totalTax2025 - totalTax2024);
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

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      // Use store getters which handle negative amounts correctly
      const payable2025 = store.getters.payableTax2025;
      const payable2024 = Math.max(0, calculation2024.vm.totalTax - calculation2024.vm.totalTds - calculation2024.vm.investmentRebate);

      // Both should use same TDS and share common taxpayer data
      expect(calculation2024.vm.totalTds).toBe(calculation2025.vm.totalTds);
      expect(payable2024).toBeGreaterThanOrEqual(0);
      expect(payable2025).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Different Taxpayer Categories', () => {
    const testCategories = [
      { category: 'general', threshold2024: 350000, threshold2025: 375000 },
      { category: 'female', threshold2024: 400000, threshold2025: 425000 },
      { category: 'disabled', threshold2024: 475000, threshold2025: 500000 },
      { category: 'freedom_fighter', threshold2024: 500000, threshold2025: 525000 },
      { category: 'third_gender', threshold2024: 475000, threshold2025: 500000 }
    ];

    testCategories.forEach(({ category, threshold2024, threshold2025 }) => {
      test(`should handle ${category} taxpayer correctly`, async () => {
        store.commit('updateTaxpayerProfile', {
          category: category,
          age: 30,
          location: 'dhaka'
        });

        await wrapper.vm.$nextTick();

        const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
        const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
        
        expect(calculation2024.vm.taxFreeThreshold).toBe(threshold2024);
        expect(calculation2025.vm.taxFreeThreshold).toBe(threshold2025);
        expect(threshold2025 - threshold2024).toBe(25000); // Consistent 25K increase
      });
    });
  });

  describe('Responsive Design Integration', () => {
    test('should maintain proper layout structure', () => {
      const comparisonRow = wrapper.find('.comparison-row');
      const comparisonCols = wrapper.findAll('.comparison-col');

      expect(comparisonRow.classes()).toContain('comparison-row');
      expect(comparisonCols).toHaveLength(2);
      
      comparisonCols.forEach(col => {
        expect(col.classes()).toContain('comparison-col');
      });
    });

    test('should have CSS classes for responsive behavior', () => {
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

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      
      expect(calculation2024.vm.totalTax).toBe(calculation2024.vm.minimumTaxAmount);
      expect(calculation2025.vm.totalTax).toBe(calculation2025.vm.minimumTaxAmount);
      expect(taxComparison.vm.taxDifference).toBeDefined();
    });

    test('should handle very high income gracefully', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 1000000 }); // 12M annually

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      expect(calculation2024.vm.totalTax).toBeGreaterThan(1000000);
      expect(calculation2025.vm.totalTax).toBeGreaterThan(1000000);
      
      // Both should handle high income without errors
      expect(calculation2024.vm.taxBreakdown).toHaveLength(7);
      expect(calculation2025.vm.taxBreakdown).toHaveLength(6);
    });

    test('should handle missing taxpayer profile gracefully', async () => {
      // Reset taxpayer profile to empty
      store.commit('updateTaxpayerProfile', {});

      await wrapper.vm.$nextTick();

      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      // Should default to general taxpayer
      expect(calculation2024.vm.taxFreeThreshold).toBe(350000);
      expect(calculation2025.vm.taxFreeThreshold).toBe(375000);
    });
  });

  describe('Performance and Reactivity', () => {
    test('should update all components reactively', async () => {
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
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

      // All components should reflect the changes
      expect(calculation2024.vm.taxFreeThreshold).toBe(400000);
      expect(calculation2025.vm.taxFreeThreshold).toBe(425000);
      expect(calculation2024.vm.investmentRebate).toBeGreaterThan(0);
      expect(calculation2025.vm.investmentRebate).toBeGreaterThan(0);
      expect(taxComparison.vm.taxDifference).toBeDefined();
    });

    test('should maintain component isolation', async () => {
      const calculation2024 = wrapper.findComponent({ name: 'calculation-2024' });
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      
      // Components should have their own computed properties
      expect(calculation2024.vm.totalTax).toBeDefined();
      expect(calculation2025.vm.totalTax).toBeDefined();
      
      // But they should react to same store changes
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();
      
      expect(calculation2024.vm.totalTax).toBeGreaterThan(0);
      expect(calculation2025.vm.totalTax).toBeGreaterThan(0);
    });
  });
});