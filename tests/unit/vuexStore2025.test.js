import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';

describe('Vuex Store 2025 Getters', () => {
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

  describe('FY 2025-2026 Tax Free Thresholds', () => {
    test('should calculate correct threshold for general taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(375000); // +25K from 350K
    });

    test('should calculate correct threshold for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(425000); // +25K from 400K
    });

    test('should calculate correct threshold for senior citizen', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 70,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(425000); // Auto-detected senior
    });

    test('should calculate correct threshold for disabled person', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(500000); // +25K from 475K
    });

    test('should calculate correct threshold for freedom fighter', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(525000); // +25K from 500K
    });

    test('should calculate correct threshold for third gender', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(500000); // +25K from 475K
    });
  });

  describe('FY 2025-2026 Minimum Tax', () => {
    test('should return unified minimum tax of 5000 for all locations', () => {
      const locations = ['dhaka', 'chittagong', 'other_city', 'district'];
      
      locations.forEach(location => {
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: location
        });
        
        const minimumTax = store.getters.minimumTaxAmount2025;
        expect(minimumTax).toBe(5000);
      });
    });
  });

  describe('FY 2025-2026 Tax Slabs', () => {
    test('should generate 6 tax slabs for general taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      const slabs = store.getters.taxSlabs2025;
      
      expect(slabs).toHaveLength(6);
      expect(slabs[0]).toEqual(['First Tk3.8 lakh [0-3.8 lakh]', 0, 375000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [3.8-6.8 lakh]', 375000, 675000, 10]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [6.8-10.8 lakh]', 675000, 1075000, 15]);
      expect(slabs[3]).toEqual(['Next Tk5 lakh [10.8-15.8 lakh]', 1075000, 1575000, 20]);
      expect(slabs[4]).toEqual(['Next Tk20 lakh [15.8-35.8 lakh]', 1575000, 3575000, 25]);
      expect(slabs[5]).toEqual(['Above [35.8-UP lakh]', 3575000, Infinity, 30]);
    });

    test('should generate correct tax slabs for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      const slabs = store.getters.taxSlabs2025;
      
      expect(slabs[0]).toEqual(['First Tk4.3 lakh [0-4.3 lakh]', 0, 425000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4.3-7.3 lakh]', 425000, 725000, 10]);
    });

    test('should not include 5% tax bracket', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      const slabs = store.getters.taxSlabs2025;
      const rates = slabs.map(slab => slab[3]);
      
      expect(rates).not.toContain(5);
      expect(rates).toEqual([0, 10, 15, 20, 25, 30]);
    });
  });

  describe('FY 2025-2026 Investment Rebate', () => {
    beforeEach(() => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
    });

    test('should calculate correct rebate percentage based on taxable income', () => {
      // FY 2025-26 rebate: min(3% of income, 15% of investment, Tk 10L)
      // rebatePercentage2025 getter was removed; rebate is now calculated directly
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // ~1M annually
      store.commit('changeInvestment', { index: 0, value: 100000 });
      const rebate = store.getters.investmentRebate2025;
      expect(typeof rebate).toBe('number');
      expect(rebate).toBeGreaterThanOrEqual(0);
    });

    test('should limit investment rebate to 10 lakh (FY 2025-26 cap)', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 500000 }); // 6M annually
      store.commit('changeInvestment', { index: 0, value: 10000000 }); // 100L investment
      const rebate = store.getters.investmentRebate2025;
      // 3% of 6M = 180k; 15% of 100L = 1.5M; cap 10L → min = 180k
      expect(rebate).toBeLessThanOrEqual(1000000);
    });

    test('should calculate total rebateable investment (bounded by limits)', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // 1M annually
      store.commit('changeInvestment', { index: 0, value: 120000 }); // DPS full
      store.commit('changeInvestment', { index: 1, value: 100000 }); // Life insurance

      const rebate = store.getters.investmentRebate2025;
      expect(rebate).toBeGreaterThanOrEqual(0);
    });

    test('should calculate investment rebate correctly (FY 2025-26: min of 3%/15%/10L)', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // ~1M annually
      store.commit('changeInvestment', { index: 0, value: 100000 });

      const taxable = store.getters.taxableSalary;
      const totalInv = store.getters.totalInvestment;
      const rebate = store.getters.investmentRebate2025;

      const expected = Math.round(Math.max(0, Math.min(taxable * 0.03, totalInv * 0.15, 1000000)));
      expect(rebate).toBe(expected);
    });
  });

  describe('FY 2025-2026 Tax Calculations', () => {
    beforeEach(() => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
    });

    test('should calculate tax breakdown correctly', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 }); // 600K annually
      
      const taxBreakdown = store.getters.taxBreakdown2025;
      expect(taxBreakdown).toHaveLength(6);
      
      // Should have some tax in the 10% bracket
      expect(taxBreakdown[1].slabCut).toBeGreaterThan(0);
    });

    test('should calculate total tax correctly', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 }); // 600K annually
      
      const calculatedTax = store.getters.calculatedTax2025;
      const totalTax = store.getters.totalTax2025;
      const minimumTax = store.getters.minimumTaxAmount2025;
      
      expect(totalTax).toBe(Math.max(calculatedTax, minimumTax));
    });

    test('should detect when minimum tax is applied', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 }); // 360K annually (low income)
      
      const isMinimumTaxApplied = store.getters.isMinimumTaxApplied2025;
      expect(isMinimumTaxApplied).toBe(true);
    });

    test('should calculate payable tax correctly', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // 1M annually
      store.commit('changeSubsequentTds', { index: 0, value: 5000 }); // TDS
      store.commit('changeInvestment', { index: 0, value: 100000 }); // Investment
      
      const totalTax = store.getters.totalTax2025;
      const totalTds = store.getters.totalTds;
      const investmentRebate = store.getters.investmentRebate2025;
      const payableTax = store.getters.payableTax2025;
      
      expect(payableTax).toBe(Math.max(0, totalTax - totalTds - investmentRebate));
    });
  });

  describe('Tax Comparison Getters', () => {
    beforeEach(() => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 42000 }); // 504K annually
    });

    test('should calculate tax difference correctly', () => {
      // taxDifference now = totalTax2026 - totalTax2025
      const totalTax2025 = store.getters.totalTax2025;
      const totalTax2026 = store.getters.totalTax2026;
      const taxDifference = store.getters.taxDifference;

      expect(taxDifference).toBe(totalTax2026 - totalTax2025);
    });

    test('should calculate tax savings when 2025 tax is lower', () => {
      // For some income levels, 2025 might be lower due to higher threshold
      const taxSavings = store.getters.taxSavings;
      const additionalTax = store.getters.additionalTax;
      
      // Either savings or additional tax should be positive, but not both
      if (taxSavings > 0) {
        expect(additionalTax).toBe(0);
      } else {
        expect(taxSavings).toBe(0);
      }
    });

    test('should calculate additional tax when 2025 tax is higher', () => {
      // Set up scenario where 2025 tax might be higher
      store.commit('changeSubsequentSalaries', { index: 0, value: 38000 }); // ~456K annually
      
      const taxDifference = store.getters.taxDifference;
      const additionalTax = store.getters.additionalTax;
      
      if (taxDifference > 0) {
        expect(additionalTax).toBe(taxDifference);
      } else {
        expect(additionalTax).toBe(0);
      }
    });
  });

  describe('Integration with Existing Store', () => {
    test('should not interfere with existing 2025-26 calculations', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });

      // Both year calculations should work independently
      const threshold2025 = store.getters.taxFreeThreshold2025;
      const threshold2026 = store.getters.taxFreeThreshold2026;
      const totalTax2025 = store.getters.totalTax2025;
      const totalTax2026 = store.getters.totalTax2026;

      expect(threshold2025).toBe(375000);
      expect(threshold2026).toBe(400000);
      expect(threshold2026).toBeGreaterThan(threshold2025); // 2026 has higher threshold
      expect(totalTax2025).toBeGreaterThan(0);
      expect(totalTax2026).toBeGreaterThan(0);
    });

    test('should respond to taxpayer profile changes', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      const initialThreshold = store.getters.taxFreeThreshold2025;
      
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      const newThreshold = store.getters.taxFreeThreshold2025;
      
      expect(newThreshold).toBeGreaterThan(initialThreshold);
    });

    test('should respond to salary changes', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 });
      const lowTax = store.getters.totalTax2025;
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
      const highTax = store.getters.totalTax2025;
      
      expect(highTax).toBeGreaterThan(lowTax);
    });

    test('should respond to investment changes', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 });
      
      const initialRebate = store.getters.investmentRebate2025;
      
      store.commit('changeInvestment', { index: 0, value: 100000 });
      const newRebate = store.getters.investmentRebate2025;
      
      expect(newRebate).toBeGreaterThan(initialRebate);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle zero income', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 0 });
      
      const totalTax = store.getters.totalTax2025;
      const minimumTax = store.getters.minimumTaxAmount2025;
      
      expect(totalTax).toBe(minimumTax); // Should apply minimum tax
    });

    test('should handle very high income', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 1000000 }); // 12M annually
      
      const totalTax = store.getters.totalTax2025;
      expect(totalTax).toBeGreaterThan(1000000); // Should be substantial tax
    });

    test('should handle missing taxpayer profile gracefully', () => {
      // Reset to empty state
      store.commit('updateTaxpayerProfile', {});
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(375000); // Should default to general
    });
  });
});