import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import { calculateTaxSlabs } from '@/utils/taxSlabs';
import { calculateTaxSlabs2025 } from '@/utils/taxSlabs2025';
import calculateTaxBreakdown from '@/calculateTaxBreakdown';
import calculateTaxBreakdown2025 from '@/calculateTaxBreakdown2025';

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
        
        // 2024-25 calculations
        const threshold2024 = store.getters.taxFreeThreshold;
        const slabs2024 = calculateTaxSlabs(threshold2024);
        const breakdown2024 = calculateTaxBreakdown(taxableSalary, slabs2024);
        const calculatedTax2024 = breakdown2024.reduce((sum, slab) => sum + slab.slabCut, 0);
        const totalTax2024 = Math.max(calculatedTax2024, store.getters.minimumTaxAmount);

        // 2025-26 calculations
        const threshold2025 = store.getters.taxFreeThreshold2025;
        const slabs2025 = calculateTaxSlabs2025(threshold2025);
        const breakdown2025 = calculateTaxBreakdown2025(taxableSalary, slabs2025);
        const calculatedTax2025 = breakdown2025.reduce((sum, slab) => sum + slab.slabCut, 0);
        const totalTax2025 = Math.max(calculatedTax2025, store.getters.minimumTaxAmount2025);

        // Store calculations
        const storeTotalTax2025 = store.getters.totalTax2025;

        // Verify consistency
        expect(totalTax2025).toBe(storeTotalTax2025);
        
        // Verify thresholds
        expect(threshold2025 - threshold2024).toBe(25000);

        // Log for debugging specific cases
        if (annualSalary === 500000) {
          console.log(`Salary: ${annualSalary}, Tax2024: ${totalTax2024}, Tax2025: ${totalTax2025}, Difference: ${totalTax2025 - totalTax2024}`);
        }
      });
    });

    test('should calculate accurate tax differences for boundary cases', () => {
      const boundaryTestCases = [
        { salary: 350000, description: '𝟚024-25 threshold' },
        { salary: 375000, description: '2025-26 threshold' },
        { salary: 450000, description: 'End of 5% bracket (2024-25)' },
        { salary: 675000, description: 'End of first taxable bracket (2025-26)' },
        { salary: 850000, description: 'Slab boundary' },
        { salary: 1350000, description: 'Mid-level income' }
      ];

      boundaryTestCases.forEach(({ salary, description }) => {
        const monthlySalary = Math.round(salary / 12);
        
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

        const totalTax2024 = calculateTotalTax2024(store);
        const totalTax2025 = store.getters.totalTax2025;
        const difference = totalTax2025 - totalTax2024;

        console.log(`${description} (${salary}): 2024=${totalTax2024}, 2025=${totalTax2025}, diff=${difference}`);

        // Both should be valid positive amounts or minimum tax
        expect(totalTax2024).toBeGreaterThanOrEqual(0);
        expect(totalTax2025).toBeGreaterThanOrEqual(0);
        
        // For income at 2025 threshold (375k), 2025 should be lower due to higher threshold
        if (salary === 375000) {
          expect(totalTax2025).toBeLessThanOrEqual(totalTax2024);
        }
      });
    });
  });

  describe('Investment Rebate Accuracy', () => {
    test('should calculate rebates consistently for both tax years', () => {
      const testScenarios = [
        { salary: 600000, investment: 50000, description: 'Low investment' },
        { salary: 1000000, investment: 150000, description: 'Medium investment' },
        { salary: 2000000, investment: 300000, description: 'High investment' },
        { salary: 1500000, investment: 500000, description: 'Investment exceeds 20% limit' }
      ];

      testScenarios.forEach(({ salary, investment, description }) => {
        const monthlySalary = Math.round(salary / 12);
        
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });
        store.commit('changeInvestment', { index: 0, value: investment });

        const taxableSalary = store.getters.taxableSalary;
        
        // 2024-25 rebate
        const rebate2024 = store.getters.investmentRebate;
        
        // 2025-26 rebate
        const rebate2025 = store.getters.investmentRebate2025;
        const rebatePercentage2025 = store.getters.rebatePercentage2025;
        const maxRebateable2025 = store.getters.maxRebateableInvestment2025;

        // Both rebates should be calculated correctly
        expect(rebate2024).toBeGreaterThanOrEqual(0);
        expect(rebate2025).toBeGreaterThanOrEqual(0);
        
        // Rebate percentage should increase with income
        if (taxableSalary > 1100000) {
          expect(rebatePercentage2025).toBeGreaterThanOrEqual(15);
        }

        // Max rebateable should be 20% of taxable income or 10 lakh
        const expectedMax = Math.min(Math.round(taxableSalary / 5), 1000000);
        expect(maxRebateable2025).toBe(expectedMax);

        console.log(`${description}: Rebate2024=${rebate2024}, Rebate2025=${rebate2025}, %=${rebatePercentage2025}`);
      });
    });
  });

  describe('Minimum Tax Application', () => {
    test('should apply correct minimum tax for different locations', () => {
      const locations = ['dhaka', 'chittagong', 'other_city', 'district'];
      const expectedMinimums2024 = { dhaka: 5000, chittagong: 5000, other_city: 4000, district: 3000 };
      const expectedMinimum2025 = 5000; // Unified

      locations.forEach(location => {
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: location
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: 25000 }); // Low income

        const minimumTax2024 = store.getters.minimumTaxAmount;
        const minimumTax2025 = store.getters.minimumTaxAmount2025;
        const totalTax2024 = calculateTotalTax2024(store);
        const totalTax2025 = store.getters.totalTax2025;

        expect(minimumTax2024).toBe(expectedMinimums2024[location]);
        expect(minimumTax2025).toBe(expectedMinimum2025);
        
        // For low income, should apply minimum tax
        expect(totalTax2024).toBe(minimumTax2024);
        expect(totalTax2025).toBe(minimumTax2025);
      });
    });

    test('should handle minimum tax vs calculated tax correctly', () => {
      const testCases = [
        { salary: 300000, description: 'Below both thresholds' },
        { salary: 360000, description: 'Between thresholds' },
        { salary: 400000, description: 'Above both thresholds' },
        { salary: 500000, description: 'Clearly above both' }
      ];

      testCases.forEach(({ salary, description }) => {
        const monthlySalary = Math.round(salary / 12);
        
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

        const calculatedTax2024 = store.getters.calculatedTax2025; // Using store helper
        const calculatedTax2025 = store.getters.calculatedTax2025;
        const totalTax2024 = calculateTotalTax2024(store);
        const totalTax2025 = store.getters.totalTax2025;
        const isMinimumApplied2025 = store.getters.isMinimumTaxApplied2025;

        // Total tax should be at least the minimum
        expect(totalTax2024).toBeGreaterThanOrEqual(store.getters.minimumTaxAmount);
        expect(totalTax2025).toBeGreaterThanOrEqual(store.getters.minimumTaxAmount2025);

        // Minimum application should be consistent
        if (calculatedTax2025 < store.getters.minimumTaxAmount2025) {
          expect(isMinimumApplied2025).toBe(true);
          expect(totalTax2025).toBe(store.getters.minimumTaxAmount2025);
        } else {
          expect(isMinimumApplied2025).toBe(false);
          expect(totalTax2025).toBe(calculatedTax2025);
        }

        console.log(`${description}: Calc2025=${calculatedTax2025}, Total2025=${totalTax2025}, MinApplied=${isMinimumApplied2025}`);
      });
    });
  });

  describe('Taxpayer Category Accuracy', () => {
    const categories = [
      { category: 'general', threshold2024: 350000, threshold2025: 375000 },
      { category: 'female', threshold2024: 400000, threshold2025: 425000 },
      { category: 'disabled', threshold2024: 475000, threshold2025: 500000 },
      { category: 'freedom_fighter', threshold2024: 500000, threshold2025: 525000 },
      { category: 'third_gender', threshold2024: 475000, threshold2025: 500000 }
    ];

    categories.forEach(({ category, threshold2024, threshold2025 }) => {
      test(`should calculate accurately for ${category} taxpayer`, () => {
        store.commit('updateTaxpayerProfile', {
          category: category,
          age: 30,
          location: 'dhaka'
        });

        // Test at threshold + 100k to ensure tax calculation
        const testSalary = threshold2025 + 100000;
        const monthlySalary = Math.round(testSalary / 12);
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

        const actualThreshold2024 = store.getters.taxFreeThreshold;
        const actualThreshold2025 = store.getters.taxFreeThreshold2025;
        const totalTax2024 = calculateTotalTax2024(store);
        const totalTax2025 = store.getters.totalTax2025;

        expect(actualThreshold2024).toBe(threshold2024);
        expect(actualThreshold2025).toBe(threshold2025);
        expect(actualThreshold2025 - actualThreshold2024).toBe(25000);

        // Both should have some tax at this income level
        expect(totalTax2024).toBeGreaterThan(0);
        expect(totalTax2025).toBeGreaterThan(0);
        
        // Due to removal of 5% bracket, 2025 tax is often higher than 2024
        // The 25K higher threshold helps, but 10% vs 5% rate hurts
        const taxDifference = totalTax2025 - totalTax2024;
        
        // Tax difference should be reasonable (not extreme)
        expect(Math.abs(taxDifference)).toBeLessThan(testSalary * 0.05); // Less than 5% of income
      });
    });
  });

  describe('Tax Slab Structure Validation', () => {
    test('should use correct number of slabs for each tax year', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      const threshold2024 = store.getters.taxFreeThreshold;
      const threshold2025 = store.getters.taxFreeThreshold2025;
      
      const slabs2024 = calculateTaxSlabs(threshold2024);
      const slabs2025 = calculateTaxSlabs2025(threshold2025);

      expect(slabs2024).toHaveLength(7); // 2024-25 structure
      expect(slabs2025).toHaveLength(6); // 2025-26 structure

      // Verify rate structures
      const rates2024 = slabs2024.map(slab => slab[3]);
      const rates2025 = slabs2025.map(slab => slab[3]);

      expect(rates2024).toEqual([0, 5, 10, 15, 20, 25, 30]);
      expect(rates2025).toEqual([0, 10, 15, 20, 25, 30]);
    });

    test('should calculate progressive taxation correctly', () => {
      const testIncome = 1500000; // 15 lakh
      const monthlySalary = Math.round(testIncome / 12);

      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

      const taxableSalary = store.getters.taxableSalary;

      // Manual calculation for 2024-25
      const slabs2024 = store.getters.taxSlabs2025; // This should be 2024 slabs
      const breakdown2024 = calculateTaxBreakdown(taxableSalary, calculateTaxSlabs(350000));
      
      // Manual calculation for 2025-26
      const breakdown2025 = store.getters.taxBreakdown2025;

      // Verify progressive nature
      let cumulativeAmount2024 = 0;
      let cumulativeAmount2025 = 0;

      breakdown2024.forEach(slab => {
        cumulativeAmount2024 += slab.slabAmount;
        expect(slab.slabAmount).toBeGreaterThanOrEqual(0);
      });

      breakdown2025.forEach(slab => {
        cumulativeAmount2025 += slab.slabAmount;
        expect(slab.slabAmount).toBeGreaterThanOrEqual(0);
      });

      expect(cumulativeAmount2024).toBe(taxableSalary);
      expect(cumulativeAmount2025).toBe(taxableSalary);
    });
  });

  describe('Edge Case Validations', () => {
    test('should handle exact threshold amounts correctly', () => {
      const exactThresholds = [350000, 375000, 400000, 425000, 500000, 525000];

      exactThresholds.forEach(threshold => {
        const monthlySalary = Math.round(threshold / 12);
        
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: 'dhaka'
        });
        store.commit('changeSubsequentSalaries', { index: 0, value: monthlySalary });

        const totalTax2024 = calculateTotalTax2024(store);
        const totalTax2025 = store.getters.totalTax2025;

        // At exact thresholds, calculated tax should be minimal
        // but minimum tax might apply
        expect(totalTax2024).toBeGreaterThanOrEqual(store.getters.minimumTaxAmount);
        expect(totalTax2025).toBeGreaterThanOrEqual(store.getters.minimumTaxAmount2025);
      });
    });

    test('should handle zero and negative scenarios', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 0 });

      const totalTax2024 = calculateTotalTax2024(store);
      const totalTax2025 = store.getters.totalTax2025;
      const payable2025 = store.getters.payableTax2025;

      // Should apply minimum tax
      expect(totalTax2024).toBe(store.getters.minimumTaxAmount);
      expect(totalTax2025).toBe(store.getters.minimumTaxAmount2025);
      
      // Payable should never be negative
      expect(payable2025).toBeGreaterThanOrEqual(0);
    });
  });

  // Helper function to calculate 2024 total tax (since it's not in store)
  function calculateTotalTax2024(store) {
    const taxableSalary = store.getters.taxableSalary;
    const threshold = store.getters.taxFreeThreshold;
    const slabs = calculateTaxSlabs(threshold);
    const breakdown = calculateTaxBreakdown(taxableSalary, slabs);
    const calculatedTax = breakdown.reduce((sum, slab) => sum + slab.slabCut, 0);
    const minimumTax = store.getters.minimumTaxAmount;
    return Math.max(calculatedTax, minimumTax);
  }
});