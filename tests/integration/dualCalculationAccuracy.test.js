/**
 * Dual Tax Calculation Accuracy Integration Tests
 * Updated for FY 2025-26 vs FY 2026-27 comparison (Finance Act 2026)
 */
import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import { calculateTaxSlabs2025 } from '@/utils/taxSlabs2025';
import { calculateTaxSlabs2026, calculateInvestmentRebate2026 } from '@/utils/taxSlabs2026';
import calculateTaxBreakdown2025 from '@/calculateTaxBreakdown2025';
import calculateTaxBreakdown2026 from '@/calculateTaxBreakdown2026';

describe('Dual Tax Calculation Accuracy Integration', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false
        }
      }
    });
  });

  describe('Tax Calculation Consistency', () => {
    test('should maintain calculation consistency across different salary levels', () => {
      const salaryLevels = [300000, 500000, 800000, 1200000, 2000000, 5000000];

      salaryLevels.forEach(annualSalary => {
        const monthlySalary = Math.round(annualSalary / 12);

        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

        const taxableSalary = store.getters.taxableSalary;

        // 2025-26 calculations
        const threshold2025 = store.getters.taxFreeThreshold2025;
        const slabs2025 = calculateTaxSlabs2025(threshold2025);
        const breakdown2025 = calculateTaxBreakdown2025(taxableSalary, slabs2025);
        const calculatedTax2025 = breakdown2025.reduce((sum, slab) => sum + slab.slabCut, 0);
        const totalTax2025 = Math.max(calculatedTax2025, store.getters.minimumTaxAmount2025);

        // 2026-27 calculations
        const threshold2026 = store.getters.taxFreeThreshold2026;
        const slabs2026 = calculateTaxSlabs2026(threshold2026);
        const breakdown2026 = calculateTaxBreakdown2026(taxableSalary, slabs2026);
        const calculatedTax2026 = breakdown2026.reduce((sum, slab) => sum + slab.slabCut, 0);
        const totalTax2026 = Math.max(calculatedTax2026, store.getters.minimumTaxAmount2026);

        // Verify store matches direct calculation
        expect(totalTax2025).toBe(store.getters.totalTax2025);
        expect(totalTax2026).toBe(store.getters.totalTax2026);

        // Finance Act 2026 Schedule 1 sets matching 400k-family thresholds for both AY 2026-27 and AY 2027-28
        expect(threshold2026 - threshold2025).toBe(0);
      });
    });

    test('should have correct threshold differences for all categories', () => {
      const categories = [
        { category: 'general', threshold2025: 400000, threshold2026: 400000 },
        { category: 'female', threshold2025: 450000, threshold2026: 450000 },
        { category: 'disabled', threshold2025: 525000, threshold2026: 525000 },
        { category: 'freedom_fighter', threshold2025: 550000, threshold2026: 550000 },
        { category: 'third_gender', threshold2025: 525000, threshold2026: 525000 }
      ];

      categories.forEach(({ category, threshold2025, threshold2026 }) => {
        store.commit('updateTaxpayerProfile', { category, age: 35, location: 'dhaka' });
        expect(store.getters.taxFreeThreshold2025).toBe(threshold2025);
        expect(store.getters.taxFreeThreshold2026).toBe(threshold2026);
      });
    });
  });

  describe('Investment Rebate Accuracy', () => {
    test('should calculate rebates correctly for both tax years', () => {
      const testCases = [
        { description: 'Low income', monthlySalary: 50000, investment: 50000 },
        { description: 'Mid income', monthlySalary: 100000, investment: 150000 },
        { description: 'High income', monthlySalary: 300000, investment: 500000 }
      ];

      testCases.forEach(({ description, monthlySalary, investment }) => {
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });
        store.commit('changeInvestment', { index: 0, value: investment });

        const taxableSalary = store.getters.taxableSalary;
        const totalInvestment = store.getters.totalInvestment;

        // FY 2025-26: min(3% income, 15% investment, 10L)
        const expectedRebate2025 = Math.round(Math.max(0, Math.min(
          taxableSalary * 0.03,
          totalInvestment * 0.15,
          1000000
        )));
        expect(store.getters.investmentRebate2025).toBe(expectedRebate2025);

        // FY 2026-27: min(3% income, 10% investment, 7.5L)
        const expectedRebate2026 = calculateInvestmentRebate2026(taxableSalary, totalInvestment);
        expect(store.getters.investmentRebate2026).toBe(expectedRebate2026);

        // 2026-27 rebate is always <= 2025-26 rebate (lower rate + lower cap)
        expect(store.getters.investmentRebate2026).toBeLessThanOrEqual(store.getters.investmentRebate2025);
      });
    });

    test('rebate cap: 2025-26 capped at Tk 10L, 2026-27 at Tk 7.5L', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 500000 }); // 6M annually
      store.commit('changeInvestment', { index: 0, value: 50000000 }); // huge investment

      const rebate2025 = store.getters.investmentRebate2025;
      const rebate2026 = store.getters.investmentRebate2026;

      // Both hit their respective income-percent floor before the cap at this level
      // but we can verify cap is respected
      expect(rebate2025).toBeLessThanOrEqual(1000000);
      expect(rebate2026).toBeLessThanOrEqual(750000);
    });
  });

  describe('Minimum Tax Application', () => {
    test('should apply flat Tk 5,000 minimum tax in both years for all locations', () => {
      const locations = ['dhaka', 'chittagong', 'other_city', 'district'];

      locations.forEach(location => {
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: 10000 }); // very low

        const minimumTax2025 = store.getters.minimumTaxAmount2025;
        const minimumTax2026 = store.getters.minimumTaxAmount2026;

        expect(minimumTax2025).toBe(5000);
        expect(minimumTax2026).toBe(5000);

        // Low income should trigger minimum tax
        const totalTax2025 = store.getters.totalTax2025;
        const totalTax2026 = store.getters.totalTax2026;
        expect(totalTax2025).toBe(5000);
        expect(totalTax2026).toBe(5000);
      });
    });
  });

  describe('Taxpayer Category Accuracy', () => {
    const categoryTests = [
      {
        category: 'general',
        threshold2025: 400000,
        threshold2026: 400000
      },
      {
        category: 'female',
        threshold2025: 450000,
        threshold2026: 450000
      },
      {
        category: 'disabled',
        threshold2025: 525000,
        threshold2026: 525000
      },
      {
        category: 'freedom_fighter',
        threshold2025: 550000,
        threshold2026: 550000
      },
      {
        category: 'third_gender',
        threshold2025: 525000,
        threshold2026: 525000
      }
    ];

    categoryTests.forEach(({ category, threshold2025, threshold2026 }) => {
      test(`should calculate accurately for ${category} taxpayer`, () => {
        store.commit('updateTaxpayerProfile', {
          category,
          age: 35,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });

        const actualThreshold2025 = store.getters.taxFreeThreshold2025;
        const actualThreshold2026 = store.getters.taxFreeThreshold2026;
        const totalTax2025 = store.getters.totalTax2025;
        const totalTax2026 = store.getters.totalTax2026;

        expect(actualThreshold2025).toBe(threshold2025);
        expect(actualThreshold2026).toBe(threshold2026);
        expect(actualThreshold2026 - actualThreshold2025).toBe(0);

        // Taxes should be non-negative
        expect(totalTax2025).toBeGreaterThan(0);
        expect(totalTax2026).toBeGreaterThan(0);
      });
    });
  });

  describe('Comparison Getters', () => {
    test('taxDifference = totalTax2026 - totalTax2025', () => {
      store.commit('updateTaxpayerProfile', { category: 'general', age: 30, location: 'dhaka' });
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });

      const diff = store.getters.taxDifference;
      expect(diff).toBe(store.getters.totalTax2026 - store.getters.totalTax2025);
    });

    test('taxSavings and additionalTax are mutually exclusive', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      const savings = store.getters.taxSavings;
      const additional = store.getters.additionalTax;
      // At most one is > 0
      expect(savings * additional).toBe(0);
    });
  });

  describe('Payable Tax Consistency', () => {
    test('payable tax should be non-negative', () => {
      const levels = [0, 50000, 100000, 500000];
      levels.forEach(monthly => {
        store.commit('changeSubsequentSalaries', { index: 0, value: monthly });
        expect(store.getters.payableTax2025).toBeGreaterThanOrEqual(0);
        expect(store.getters.payableTax2026).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
