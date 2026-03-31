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
  });

  describe('Tax-Free Threshold Calculations', () => {
    test('should calculate correct threshold for general male taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // FY 2025-26 thresholds (increased by BDT 25,000 vs 2024-25)
      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(375000);
    });

    test('should calculate correct threshold for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(425000);
    });

    test('should calculate correct threshold for senior citizen', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'senior',
        age: 70,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(425000);
    });

    test('should calculate correct threshold for disabled person', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(500000);
    });

    test('should calculate correct threshold for parent of disabled child', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'parent_disabled',
        age: 35,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(425000); // 375000 + 50000
    });

    test('should calculate correct threshold for freedom fighter', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 35,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(525000);
    });

    test('should calculate correct threshold for third gender', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 35,
        location: 'dhaka'
      });

      const threshold = store.getters.taxFreeThreshold;
      expect(threshold).toBe(500000);
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
      
      // FY 2025-26: unified minimum tax of BDT 5,000 across all locations
      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(5000);
    });

    test('should calculate correct minimum tax for district towns', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district'
      });

      const minimumTax = store.getters.minimumTaxAmount;
      expect(minimumTax).toBe(5000);
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
      
      // Set up salary of 400,000 (50k above 350k threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 33334 }); // Monthly ~33k = Annual 400k
      
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
      
      // threshold is 375,000; income ~400k → 25,000 taxable at 5% = 1,250
      expect(totalTax).toBe(1250);
    });

    test('should apply minimum tax when calculated tax is lower', () => {
      // Set up taxpayer profile for Dhaka (minimum tax 5000)
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set up low salary that results in tax less than minimum
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 }); // Monthly 30k = Annual 360k
      
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
      
      expect(rebatePercentage).toBe(15);
      expect(investmentRebate).toBe(Math.round(totalRebateableInvestment * 0.15));
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
      
      expect(maxRebateableInvestment).toBe(Math.round(taxableSalary / 5)); // 20% of taxable income per Finance Act 2024
      expect(totalRebateableInvestment).toBeLessThanOrEqual(maxRebateableInvestment);
    });
  });

  describe('Salary Exemption Calculations', () => {
    test('should calculate house rent exemption correctly', () => {
      // Set up basic salary components
      store.commit('changeParts', { part: 'basic', index: 0, value: 50000 });
      store.commit('changeParts', { part: 'house', index: 0, value: 30000 });

      const totalHouse = store.getters.totalHouse;
      const totalMedical = store.getters.totalMedical;
      const totalTransport = store.getters.totalTransport;
      const totalSalary = store.getters.totalSalary;
      const houseExempt = store.getters.houseExempt;

      // Under ITA 2023: consolidated exemption = min(allowances, salary/3, cap)
      // houseExempt = proportional share of consolidated exemption
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      const cap = 500000; // FY 2025-26 cap
      const totalExempt = Math.min(totalAllowances, Math.round(totalSalary / 3), cap);
      const expectedExemption = totalAllowances === 0 ? 0 : Math.round(totalExempt * totalHouse / totalAllowances);
      expect(houseExempt).toBe(expectedExemption);
    });

    test('should calculate medical exemption correctly', () => {
      // Set up basic salary and medical allowance
      store.commit('changeParts', { part: 'basic', index: 0, value: 50000 });
      store.commit('changeParts', { part: 'medical', index: 0, value: 10000 });

      const totalHouse = store.getters.totalHouse;
      const totalMedical = store.getters.totalMedical;
      const totalTransport = store.getters.totalTransport;
      const totalSalary = store.getters.totalSalary;
      const medicalExempt = store.getters.medicalExempt;

      // Under ITA 2023: consolidated exemption = min(allowances, salary/3, cap)
      // medicalExempt = proportional share of consolidated exemption
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      const cap = 500000; // FY 2025-26 cap
      const totalExempt = Math.min(totalAllowances, Math.round(totalSalary / 3), cap);
      const expectedExemption = totalAllowances === 0 ? 0 : Math.round(totalExempt * totalMedical / totalAllowances);
      expect(medicalExempt).toBe(expectedExemption);
    });

    test('should calculate transport exemption correctly', () => {
      // Set up transport allowance
      store.commit('changeParts', { part: 'transport', index: 0, value: 25000 });

      const totalHouse = store.getters.totalHouse;
      const totalMedical = store.getters.totalMedical;
      const totalTransport = store.getters.totalTransport;
      const totalSalary = store.getters.totalSalary;
      const transportExempt = store.getters.transportExempt;

      // Under ITA 2023: consolidated exemption = min(allowances, salary/3, cap)
      // transportExempt = proportional share of consolidated exemption
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      const cap = 500000; // FY 2025-26 cap
      const totalExempt = Math.min(totalAllowances, Math.round(totalSalary / 3), cap);
      const expectedExemption = totalAllowances === 0 ? 0 : Math.round(totalExempt * totalTransport / totalAllowances);
      expect(transportExempt).toBe(expectedExemption);
    });

    test('should not provide exemption for LFA', () => {
      // Set up LFA
      store.commit('changeParts', { part: 'lfa', index: 0, value: 10000 });
      
      const lfaExempt = store.getters.lfaExempt;
      expect(lfaExempt).toBe(0); // No exemption for LFA
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
      
      // Set up salary of 450,000 (50k above female threshold of 400k)
      store.commit('changeSubsequentSalaries', { index: 0, value: 37500 });
      
      const taxableSalary = store.getters.taxableSalary;
      const threshold = store.getters.taxFreeThreshold;
      
      expect(threshold).toBe(425000);

      // Create tax slabs
      const slabs = [
        [`First Tk4.25 lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 100000, 5],
        ['Next Tk4 lakh', threshold + 100000, threshold + 500000, 10],
        ['Next Tk5 lakh', threshold + 500000, threshold + 1000000, 15],
        ['Next Tk5 lakh', threshold + 1000000, threshold + 1500000, 20],
        ['Next Tk20 lakh', threshold + 1500000, threshold + 3500000, 25],
        ['Above', threshold + 3500000, Infinity, 30],
      ];
      
      const taxBreakdown = calculateTaxBreakdown(taxableSalary, slabs);
      const totalTax = Math.round(taxBreakdown.reduce((sum, slab) => sum + parseFloat(slab.slabCut), 0));
      
      // threshold is 425,000; income 450k → 25,000 taxable at 5% = 1,250
      expect(totalTax).toBe(1250);
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
      
      expect(threshold).toBe(425000); // Senior citizen threshold (FY 2025-26)
      expect(minimumTax).toBe(5000); // Unified minimum tax (FY 2025-26)
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
});