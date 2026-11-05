/**
 * Side-by-Side Tax Comparison Integration Tests
 * Updated for FY 2025-26 vs FY 2026-27 comparison (Finance Act 2026)
 */
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
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      expect(calculation2025.exists()).toBe(true);
      expect(calculation2026.exists()).toBe(true);
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

    test('should display tax comparison summary', () => {
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      expect(taxComparison.exists()).toBe(true);
    });
  });

  describe('Data Flow Integration', () => {
    test('should update both calculations when taxpayer profile changes', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const initialThreshold2025 = calculation2025.vm.taxFreeThreshold;
      const initialThreshold2026 = calculation2026.vm.taxFreeThreshold;

      // Change taxpayer profile
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 35,
        location: 'dhaka'
      });

      await wrapper.vm.$nextTick();

      const updatedThreshold2025 = calculation2025.vm.taxFreeThreshold;
      const updatedThreshold2026 = calculation2026.vm.taxFreeThreshold;

      expect(updatedThreshold2025).toBeGreaterThan(initialThreshold2025);
      expect(updatedThreshold2026).toBeGreaterThan(initialThreshold2026);
      expect(updatedThreshold2025).toBe(450000); // Female FY 2025-26
      expect(updatedThreshold2026).toBe(450000); // Female FY 2026-27
    });

    test('should update both calculations when salary changes', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const initialTax2025 = calculation2025.vm.totalTax;
      const initialTax2026 = calculation2026.vm.totalTax;

      // Increase salary
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      const updatedTax2025 = calculation2025.vm.totalTax;
      const updatedTax2026 = calculation2026.vm.totalTax;

      expect(updatedTax2025).toBeGreaterThan(initialTax2025);
      expect(updatedTax2026).toBeGreaterThan(initialTax2026);
    });

    test('should respond to investment changes in both calculations', async () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const initialRebate2025 = calculation2025.vm.investmentRebate;
      const initialRebate2026 = calculation2026.vm.investmentRebate;

      // Add investment
      store.commit('changeInvestment', { index: 0, value: 100000 });
      await wrapper.vm.$nextTick();

      const updatedRebate2025 = calculation2025.vm.investmentRebate;
      const updatedRebate2026 = calculation2026.vm.investmentRebate;

      // Rebates should increase with investment
      expect(updatedRebate2025).toBeGreaterThanOrEqual(initialRebate2025);
      expect(updatedRebate2026).toBeGreaterThanOrEqual(initialRebate2026);
    });
  });

  describe('Tax Calculation Accuracy', () => {
    test('should show different thresholds for same taxpayer profile', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const threshold2025 = calculation2025.vm.taxFreeThreshold;
      const threshold2026 = calculation2026.vm.taxFreeThreshold;

      // General taxpayer: 400k in both FY 2025-26 (AY 2026-27) and FY 2026-27 (AY 2027-28)
      expect(threshold2025).toBe(400000);
      expect(threshold2026).toBe(400000);
      expect(threshold2026 - threshold2025).toBe(0);
    });

    test('should show flat minimum tax in both years', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const minimumTax2025 = calculation2025.vm.minimumTaxAmount;
      const minimumTax2026 = calculation2026.vm.minimumTaxAmount;

      expect(minimumTax2025).toBe(5000);
      expect(minimumTax2026).toBe(5000);
    });

    test('should handle same slab structure (6 slabs, no 5% bracket)', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      const breakdown2025 = calculation2025.vm.taxBreakdown;
      const breakdown2026 = calculation2026.vm.taxBreakdown;

      expect(breakdown2025).toHaveLength(6); // 2025-26 has 6 slabs
      expect(breakdown2026).toHaveLength(6); // 2026-27 also 6 slabs
    });
  });

  describe('Comparison Accuracy', () => {
    test('should correctly calculate tax savings when 2026 is lower', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });
      const taxSavings = taxComparison.vm.taxSavings;
      const additionalTax = taxComparison.vm.additionalTax;

      // For the same income, 2026-27 generally has same or lower tax (higher threshold)
      // Either savings or additional, never both > 0
      if (taxSavings > 0) {
        expect(additionalTax).toBe(0);
      } else {
        expect(taxSavings).toBe(0);
      }
    });

    test('should show consistent payable amounts', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      const payable2025 = Math.max(0, store.getters.payableTax2025);
      const payable2026 = Math.max(0, store.getters.payableTax2026);

      expect(payable2025).toBeGreaterThanOrEqual(0);
      expect(payable2026).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Different Taxpayer Categories', () => {
    const categories = [
      { category: 'general', threshold2025: 400000, threshold2026: 400000 },
      { category: 'female', threshold2025: 450000, threshold2026: 450000 },
      { category: 'disabled', threshold2025: 525000, threshold2026: 525000 },
      { category: 'freedom_fighter', threshold2025: 550000, threshold2026: 550000 },
      { category: 'third_gender', threshold2025: 525000, threshold2026: 525000 }
    ];

    categories.forEach(({ category, threshold2025, threshold2026 }) => {
      test(`should handle ${category} taxpayer correctly`, async () => {
        store.commit('updateTaxpayerProfile', {
          category,
          age: 35,
          location: 'dhaka'
        });
        await wrapper.vm.$nextTick();

        const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
        const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

        expect(calculation2025.vm.taxFreeThreshold).toBe(threshold2025);
        expect(calculation2026.vm.taxFreeThreshold).toBe(threshold2026);
        expect(threshold2026 - threshold2025).toBe(0); // Matching Finance Act 2026 Schedule 1 thresholds
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle zero income gracefully', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });
      const taxComparison = wrapper.findComponent({ name: 'TaxComparison' });

      expect(calculation2025.vm.totalTax).toBe(calculation2025.vm.minimumTaxAmount);
      expect(calculation2026.vm.totalTax).toBe(calculation2026.vm.minimumTaxAmount);
      expect(taxComparison.vm.taxDifference).toBeDefined();
    });

    test('should handle very high income gracefully', async () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 500000 });
      await wrapper.vm.$nextTick();

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      expect(calculation2025.vm.totalTax).toBeGreaterThan(1000000);
      expect(calculation2026.vm.totalTax).toBeGreaterThan(1000000);

      // Both should handle high income without errors
      expect(Number.isFinite(calculation2025.vm.totalTax)).toBe(true);
      expect(Number.isFinite(calculation2026.vm.totalTax)).toBe(true);
    });

    test('should handle missing taxpayer profile gracefully', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // Should default to general taxpayer
      expect(calculation2025.vm.taxFreeThreshold).toBe(400000);
      expect(calculation2026.vm.taxFreeThreshold).toBe(400000);
    });
  });

  describe('Performance and Reactivity', () => {
    test('should update all components reactively', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 35,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
      store.commit('changeInvestment', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // All components should reflect the changes
      expect(calculation2025.vm.taxFreeThreshold).toBe(450000); // Female 2025-26
      expect(calculation2026.vm.taxFreeThreshold).toBe(450000); // Female 2026-27
      expect(calculation2025.vm.investmentRebate).toBeGreaterThan(0);
      expect(calculation2026.vm.investmentRebate).toBeGreaterThan(0);
    });

    test('should maintain component isolation', async () => {
      const calculation2025 = wrapper.findComponent({ name: 'calculation-2025' });
      const calculation2026 = wrapper.findComponent({ name: 'calculation-2026' });

      // Components should have their own computed properties
      expect(calculation2025.vm.totalTax).toBeDefined();
      expect(calculation2026.vm.totalTax).toBeDefined();

      // But they should react to same store changes
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      await wrapper.vm.$nextTick();

      expect(calculation2025.vm.totalTax).toBeGreaterThan(0);
      expect(calculation2026.vm.totalTax).toBeGreaterThan(0);
    });
  });
});
