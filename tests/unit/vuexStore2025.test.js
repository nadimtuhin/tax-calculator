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
      expect(threshold).toBe(400000); // +50K from FY 2024-25 (Finance Act 2026 Schedule 1)
    });

    test('should calculate correct threshold for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(450000); // +50K from FY 2024-25
    });

    test('should calculate correct threshold for senior citizen', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 70,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(450000); // Auto-detected senior
    });

    test('should calculate correct threshold for disabled person', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(525000); // +50K from FY 2024-25
    });

    test('should calculate correct threshold for freedom fighter', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(550000); // +50K from FY 2024-25
    });

    test('should calculate correct threshold for third gender', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold2025;
      expect(threshold).toBe(525000); // +50K from FY 2024-25
    });

    test('shared taxFreeThreshold getter for 2025-26 matches taxFreeThreshold2025 (including age-65+ promotion) and preserves 2024-25 / 2026-27', () => {
      const expected2025And2026 = {
        general: 400000,
        female: 450000,
        senior: 450000,
        disabled: 525000,
        third_gender: 525000,
        freedom_fighter: 550000
      };
      const expected2024 = {
        general: 350000,
        female: 400000,
        senior: 400000,
        disabled: 475000,
        third_gender: 475000,
        freedom_fighter: 500000
      };

      Object.entries(expected2025And2026).forEach(([category, expected]) => {
        const age = category === 'senior' ? 66 : 35;

        // FY 2025-26 without and with parentOfDisabled
        store.commit('setCurrentYear', '2025-26');
        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: false });
        expect(store.getters.taxFreeThreshold).toBe(expected);
        expect(store.getters.taxFreeThreshold2025).toBe(expected);
        expect(store.getters.taxFreeThreshold2026).toBe(expected);

        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: true });
        expect(store.getters.taxFreeThreshold).toBe(expected + 50000);
        expect(store.getters.taxFreeThreshold2025).toBe(expected + 50000);
        expect(store.getters.taxFreeThreshold2026).toBe(expected + 50000);

        // FY 2026-27 shared getter preservation (without and with parentOfDisabled)
        store.commit('setCurrentYear', '2026-27');
        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: false });
        expect(store.getters.taxFreeThreshold).toBe(expected);
        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: true });
        expect(store.getters.taxFreeThreshold).toBe(expected + 50000);

        // FY 2024-25 shared getter preservation (without and with parentOfDisabled)
        store.commit('setCurrentYear', '2024-25');
        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: false });
        expect(store.getters.taxFreeThreshold).toBe(expected2024[category]);
        store.commit('updateTaxpayerProfile', { category, age, location: 'dhaka', parentOfDisabled: true });
        expect(store.getters.taxFreeThreshold).toBe(expected2024[category] + 50000);
      });

      // Age-detected senior parity on FY 2025-26 (64 vs 65, additive parent allowance, legacy parent_disabled, protected higher categories)
      store.commit('setCurrentYear', '2025-26');
      store.commit('updateTaxpayerProfile', { category: 'general', age: 64, location: 'dhaka', parentOfDisabled: false });
      expect(store.getters.taxFreeThreshold).toBe(400000);
      expect(store.getters.taxFreeThreshold2025).toBe(400000);

      store.commit('updateTaxpayerProfile', { category: 'general', age: 65, location: 'dhaka', parentOfDisabled: false });
      expect(store.getters.taxFreeThreshold).toBe(450000);
      expect(store.getters.taxFreeThreshold2025).toBe(450000);

      store.commit('updateTaxpayerProfile', { category: 'general', age: 65, location: 'dhaka', parentOfDisabled: true });
      expect(store.getters.taxFreeThreshold).toBe(500000);
      expect(store.getters.taxFreeThreshold2025).toBe(500000);

      store.commit('updateTaxpayerProfile', { category: 'parent_disabled', age: 65, location: 'dhaka' });
      expect(store.getters.taxFreeThreshold).toBe(500000);
      expect(store.getters.taxFreeThreshold2025).toBe(500000);

      [
        ['disabled', 525000],
        ['third_gender', 525000],
        ['freedom_fighter', 550000]
      ].forEach(([cat, expected]) => {
        store.commit('updateTaxpayerProfile', { category: cat, age: 70, location: 'dhaka', parentOfDisabled: false });
        expect(store.getters.taxFreeThreshold).toBe(expected);
        expect(store.getters.taxFreeThreshold2025).toBe(expected);
      });

      // Explicit investment rebate formula preservation across all three getters
      store.commit('changeSubsequentSalaries', { index: 0, value: 300000 }); // 3.6M taxable
      store.commit('changeInvestment', { index: 0, value: 500000 }); // 5L investment
      expect(store.getters.investmentRebate).toBe(75000);     // min(108k, 15% of 5L = 75k, 10L)
      expect(store.getters.investmentRebate2025).toBe(75000); // min(108k, 15% of 5L = 75k, 10L)
      expect(store.getters.investmentRebate2026).toBe(50000); // min(108k, 10% of 5L = 50k, 7.5L)
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
      expect(slabs[0]).toEqual(['First Tk4 lakh [0-4 lakh]', 0, 400000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4-7 lakh]', 400000, 700000, 10]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [7-11 lakh]', 700000, 1100000, 15]);
      expect(slabs[3]).toEqual(['Next Tk5 lakh [11-16 lakh]', 1100000, 1600000, 20]);
      expect(slabs[4]).toEqual(['Next Tk20 lakh [16-36 lakh]', 1600000, 3600000, 25]);
      expect(slabs[5]).toEqual(['Above [36-UP lakh]', 3600000, Infinity, 30]);
    });

    test('should generate correct tax slabs for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      const slabs = store.getters.taxSlabs2025;
      
      expect(slabs[0]).toEqual(['First Tk4.5 lakh [0-4.5 lakh]', 0, 450000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4.5-7.5 lakh]', 450000, 750000, 10]);
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

      expect(threshold2025).toBe(400000);
      expect(threshold2026).toBe(400000);
      expect(threshold2026).toBe(threshold2025); // Both AY 2026-27 and AY 2027-28 share 400k-family thresholds
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
      expect(threshold).toBe(400000); // Should default to general
    });
  });
});