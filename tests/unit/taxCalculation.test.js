import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import calculateTaxBreakdown from '@/calculateTaxBreakdown';

describe('Tax Calculation Tests', () => {
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
    // These tests cover FY 2024-25 rules via the shared taxFreeThreshold getter
    store.commit('setCurrentYear', '2024-25');
  });

  describe('Tax-Free Threshold Calculations', () => {
    test('should calculate correct threshold for general male taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(350000);
    });

    test('should calculate correct threshold for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(400000);
    });

    test('should calculate correct threshold for senior citizen', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'senior',
        age: 70,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(400000);
    });

    test('should calculate correct threshold for disabled person', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(475000);
    });

    test('should calculate correct threshold for parent of disabled child', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'parent_disabled',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(400000); // 350000 + 50000
    });

    test('should add parent of disabled allowance on top of own category', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 35,
        location: 'dhaka',
        parentOfDisabled: true
      });
      
      expect(store.getters.taxFreeThreshold).toBe(450000); // 400000 + 50000
    });

    test('should calculate correct threshold for freedom fighter', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(500000);
    });

    test('should calculate correct threshold for third gender', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 35,
        location: 'dhaka'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(475000);
    });
  });

  describe('Minimum Tax Calculations', () => {
    test('should calculate correct minimum tax for Dhaka', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(5000);
    });

    test('should calculate correct minimum tax for Chittagong', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'chittagong'
      });
      
      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(5000);
    });

    test('should calculate correct minimum tax for other city corporations', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'other_city'
      });
      
      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(4000);
    });

    test('should calculate correct minimum tax for district towns', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district'
      });
      
      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(3000);
    });
  });

  describe('Tax Slab Calculations', () => {
    test('should calculate tax correctly for income below threshold (general)', () => {
      // Set up taxpayer profile
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set up salary of 300,000 (below 350,000 threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 25000 }); // Monthly 25k = Annual 300k
      
      const taxableSalary = store.getters.taxableSalary;
      const threshold = store.getters.taxFreeThreshold;
      
      // Create tax slabs
      const slabs = [
        [`First Tk3.5 lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 100000, 5],
        ['Next Tk4 lakh', threshold + 100000, threshold + 500000, 10],
        ['Next Tk5 lakh', threshold + 500000, threshold + 1000000, 15],
        ['Next Tk5 lakh', threshold + 1000000, threshold + 1500000, 20],
        ['Next Tk20 lakh', threshold + 1500000, threshold + 3500000, 25],
        ['Above', threshold + 3500000, Infinity, 30],
      ];
      
      const taxBreakdown = calculateTaxBreakdown(taxableSalary, slabs);
      const totalTax = Math.round(taxBreakdown.reduce((sum, slab) => sum + parseFloat(slab.slabCut), 0));
      
      expect(totalTax).toBe(0); // No tax below threshold
    });

    test('should calculate tax correctly for income in first tax bracket', () => {
      // Set up taxpayer profile
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Gross 600,000 -> Para 27 single-pool exempt 200,000 -> 400,000 taxable (50k above 350k threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      
      const taxableSalary = store.getters.taxableSalary;
      const threshold = store.getters.taxFreeThreshold;
      
      // Create tax slabs
      const slabs = [
        [`First Tk3.5 lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 100000, 5],
        ['Next Tk4 lakh', threshold + 100000, threshold + 500000, 10],
        ['Next Tk5 lakh', threshold + 500000, threshold + 1000000, 15],
        ['Next Tk5 lakh', threshold + 1000000, threshold + 1500000, 20],
        ['Next Tk20 lakh', threshold + 1500000, threshold + 3500000, 25],
        ['Above', threshold + 3500000, Infinity, 30],
      ];
      
      const taxBreakdown = calculateTaxBreakdown(taxableSalary, slabs);
      const totalTax = Math.round(taxBreakdown.reduce((sum, slab) => sum + parseFloat(slab.slabCut), 0));
      
      // 50,000 at 5% = 2,500
      expect(totalTax).toBe(2500);
    });

    test('should apply minimum tax when calculated tax is lower', () => {
      // Set up taxpayer profile for Dhaka (minimum tax 5000)
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Gross 540,000 -> Para 27 exempt 180,000 -> 360,000 taxable (10k above 350k threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 45000 });
      
      const taxableSalary = store.getters.taxableSalary;
      const threshold = store.getters.taxFreeThreshold;
      const minimumTax = store.getters.minimumTaxAmount;
      
      // Create tax slabs
      const slabs = [
        [`First Tk3.5 lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 100000, 5],
        ['Next Tk4 lakh', threshold + 100000, threshold + 500000, 10],
        ['Next Tk5 lakh', threshold + 500000, threshold + 1000000, 15],
        ['Next Tk5 lakh', threshold + 1000000, threshold + 1500000, 20],
        ['Next Tk20 lakh', threshold + 1500000, threshold + 3500000, 25],
        ['Above', threshold + 3500000, Infinity, 30],
      ];
      
      const taxBreakdown = calculateTaxBreakdown(taxableSalary, slabs);
      const calculatedTax = Math.round(taxBreakdown.reduce((sum, slab) => sum + parseFloat(slab.slabCut), 0));
      const finalTax = Math.max(calculatedTax, minimumTax);
      
      expect(finalTax).toBe(5000); // Minimum tax applied
      expect(calculatedTax).toBeLessThan(minimumTax);
    });
  });

  describe('Investment Rebate Calculations', () => {
    test('should calculate investment rebate correctly', () => {
      // Set up taxpayer with sufficient income
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set up annual salary of 1,000,000
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 });
      
      // Set up investments
      store.commit('changeInvestment', { index: 0, value: 120000 }); // DPS full
      store.commit('changeInvestment', { index: 1, value: 100000 }); // Life insurance
      
      const totalRebateableInvestment = store.getters.totalRebateableInvestment;
      const investmentRebate = store.getters.investmentRebate;
      const rebatePercentage = store.getters.rebatePercentage;
      
      // FY 2024-25 Section 78: min(3% of taxableSalary, 15% of eligibleInvestment, 10L)
      expect(rebatePercentage).toBe(15);
      expect(investmentRebate).toBe(
        Math.round(Math.min(store.getters.taxableSalary * 0.03, store.getters.eligibleInvestment * 0.15, 1000000))
      );
    });

    test('should limit investment rebate to 20% of taxable income', () => {
      // Set up taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set up salary of 500,000
      store.commit('changeSubsequentSalaries', { index: 0, value: 41667 });
      
      // Set up large investments (more than 20% of taxable income)
      store.commit('changeInvestment', { index: 0, value: 120000 }); // DPS
      store.commit('changeInvestment', { index: 1, value: 200000 }); // Life insurance
      
      const taxableSalary = store.getters.taxableSalary;
      const maxRebateableInvestment = store.getters.maxRebateableInvestment;
      const totalRebateableInvestment = store.getters.totalRebateableInvestment;
      
      expect(maxRebateableInvestment).toBe(Math.round(taxableSalary / 5)); // 20% of taxable income
      expect(totalRebateableInvestment).toBeLessThanOrEqual(maxRebateableInvestment);
    });
  });

  describe('Salary Exemption Calculations (ITA 2023 Sixth Schedule Part 1 Para 27)', () => {
    test('replaces repealed component caps with single-pool min(1/3 gross, 500,000)', () => {
      store.commit('changeParts', { part: 'basic', index: 0, value: 50000 });
      store.commit('changeParts', { part: 'house', index: 0, value: 30000 });
      store.commit('changeParts', { part: 'medical', index: 0, value: 10000 });
      store.commit('changeParts', { part: 'transport', index: 0, value: 10000 });

      // Gross = 100k * 12 = 1,200,000 -> single pool exempt = 400,000 -> taxable = 800,000
      expect(store.getters.houseExempt).toBe(0);
      expect(store.getters.medicalExempt).toBe(0);
      expect(store.getters.transportExempt).toBe(0);
      expect(store.getters.lfaExempt).toBe(0);
      expect(store.getters.totalSalary).toBe(1200000);
      expect(store.getters.totalExempt).toBe(400000);
      expect(store.getters.taxableSalary).toBe(800000);
    });

    test('caps single-pool exemption at 500,000 in FY 2024-25+ and 450,000 in FY 2023-24', () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 150000 }); // 1.8M gross
      expect(store.getters.totalExempt).toBe(500000);
      expect(store.getters.taxableSalary).toBe(1300000);

      store.commit('setCurrentYear', '2023-24');
      expect(store.getters.totalExempt).toBe(450000);
      expect(store.getters.taxableSalary).toBe(1350000);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle female taxpayer with higher threshold correctly', () => {
      // Set up female taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      // Gross 675,000 -> Para 27 exempt 225,000 -> 450,000 taxable (50k above 400k female threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 56250 });
      
      const taxableSalary = store.getters.taxableSalary;
      const threshold = store.getters.taxFreeThreshold;
      
      expect(threshold).toBe(400000);
      
      // Create tax slabs
      const slabs = [
        [`First Tk4.0 lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 100000, 5],
        ['Next Tk4 lakh', threshold + 100000, threshold + 500000, 10],
        ['Next Tk5 lakh', threshold + 500000, threshold + 1000000, 15],
        ['Next Tk5 lakh', threshold + 1000000, threshold + 1500000, 20],
        ['Next Tk20 lakh', threshold + 1500000, threshold + 3500000, 25],
        ['Above', threshold + 3500000, Infinity, 30],
      ];
      
      const taxBreakdown = calculateTaxBreakdown(taxableSalary, slabs);
      const totalTax = Math.round(taxBreakdown.reduce((sum, slab) => sum + parseFloat(slab.slabCut), 0));
      
      // 50,000 at 5% = 2,500
      expect(totalTax).toBe(2500);
    });

    test('should handle senior citizen with automatic category detection', () => {
      // Set up senior citizen (age 70)
      store.commit('updateTaxpayerProfile', {
        category: 'senior',
        age: 70,
        location: 'district'
      });
      
      const threshold = store.getters.taxFreeThreshold;
      const minimumTax = store.getters.minimumTaxAmount;
      
      expect(threshold).toBe(400000); // Senior citizen threshold
      expect(minimumTax).toBe(3000); // District minimum tax
    });

    test('should handle complete tax calculation with all components', () => {
      // Set up taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set up comprehensive salary structure
      store.commit('changeParts', { part: 'basic', index: 0, value: 60000 });
      store.commit('changeParts', { part: 'house', index: 0, value: 25000 });
      store.commit('changeParts', { part: 'medical', index: 0, value: 8000 });
      store.commit('changeParts', { part: 'transport', index: 0, value: 5000 });
      
      // Add bonus and others
      store.commit('changeBonus', 100000);
      store.commit('changeOthers', 50000);
      
      // Set up investments
      store.commit('changeInvestment', { index: 0, value: 120000 }); // DPS
      store.commit('changeInvestment', { index: 1, value: 80000 }); // Life insurance
      
      // Set up TDS
      store.commit('changeSubsequentTds', { index: 0, value: 5000 });
      
      const totalSalary = store.getters.totalSalary;
      const totalExempt = store.getters.totalExempt;
      const taxableSalary = store.getters.taxableSalary;
      const investmentRebate = store.getters.investmentRebate;
      const totalTds = store.getters.totalTds;
      
      expect(totalSalary).toBeGreaterThan(0);
      expect(taxableSalary).toBe(totalSalary - totalExempt);
      expect(investmentRebate).toBeGreaterThan(0);
      expect(totalTds).toBe(60000); // 12 months * 5000
    });
  });
  describe('FY 2023-24 parent-of-disabled regressions', () => {
    beforeEach(() => {
      store.commit('setCurrentYear', '2023-24');
    });

    test('legacy parent_disabled category is general + 50k', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'parent_disabled',
        age: 35,
        location: 'dhaka',
      });
      expect(store.getters.taxFreeThreshold).toBe(400000); // 350000 + 50000
    });

    test('parentOfDisabled flag is additive on female', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 35,
        location: 'dhaka',
        parentOfDisabled: true,
      });
      expect(store.getters.taxFreeThreshold).toBe(450000); // 400000 + 50000
    });

    test('parentOfDisabled flag is additive on general', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 35,
        location: 'dhaka',
        parentOfDisabled: true,
      });
      expect(store.getters.taxFreeThreshold).toBe(400000);
    });

    test('threshold stays numeric when parent flag set', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 40,
        location: 'dhaka',
        parentOfDisabled: true,
      });
      const t = store.getters.taxFreeThreshold;
      expect(Number.isFinite(t)).toBe(true);
      expect(t).toBe(550000); // 500000 + 50000
    });
  });
});
