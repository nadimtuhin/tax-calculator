import {
  calculateTaxSlabs2025,
  getTaxFreeThreshold2025,
  getMinimumTax2025,
  getRebatePercentage2025,
  getMaxRebateableInvestment2025,
  TAX_FREE_THRESHOLDS_2025,
  PARENT_OF_DISABLED_ALLOWANCE_2025,
  MINIMUM_TAX_2025
} from '@/utils/taxSlabs2025';

describe('Tax Slabs 2025 Utility Functions', () => {
  describe('TAX_FREE_THRESHOLDS_2025 Constants', () => {
    test('should have correct thresholds for all categories', () => {
      expect(TAX_FREE_THRESHOLDS_2025.general).toBe(400000);
      expect(TAX_FREE_THRESHOLDS_2025.female).toBe(450000);
      expect(TAX_FREE_THRESHOLDS_2025.senior).toBe(450000);
      expect(TAX_FREE_THRESHOLDS_2025.disabled).toBe(525000);
      expect(TAX_FREE_THRESHOLDS_2025.third_gender).toBe(525000);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter).toBe(550000);
      expect(PARENT_OF_DISABLED_ALLOWANCE_2025).toBe(50000);
    });

    test('should show correct +50,000 increase from 2024-25 thresholds (Finance Act 2026 Schedule 1)', () => {
      // Enacted Finance Act 2026 Schedule 1 sets AY 2026-27 (Income Year 2025-26) +50,000 BDT vs FY 2024-25
      expect(TAX_FREE_THRESHOLDS_2025.general - 350000).toBe(50000);
      expect(TAX_FREE_THRESHOLDS_2025.female - 400000).toBe(50000);
      expect(TAX_FREE_THRESHOLDS_2025.disabled - 475000).toBe(50000);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter - 500000).toBe(50000);
    });
  });

  describe('MINIMUM_TAX_2025 Constants', () => {
    test('should have unified minimum tax of 5000 for all locations', () => {
      expect(MINIMUM_TAX_2025.dhaka).toBe(5000);
      expect(MINIMUM_TAX_2025.chittagong).toBe(5000);
      expect(MINIMUM_TAX_2025.other_city).toBe(5000);
      expect(MINIMUM_TAX_2025.district).toBe(5000);
    });
  });

  describe('getTaxFreeThreshold2025', () => {
    test('should return correct threshold for general taxpayer', () => {
      const profile = { category: 'general', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(400000);
    });

    test('should return correct threshold for female taxpayer', () => {
      const profile = { category: 'female', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(450000);
    });

    test('should return correct threshold for disabled person', () => {
      const profile = { category: 'disabled', age: 35 };
      expect(getTaxFreeThreshold2025(profile)).toBe(525000);
    });

    test('should return correct threshold for freedom fighter', () => {
      const profile = { category: 'freedom_fighter', age: 35 };
      expect(getTaxFreeThreshold2025(profile)).toBe(550000);
    });

    test('should return correct threshold for third gender', () => {
      const profile = { category: 'third_gender', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(525000);
    });

    test('should auto-detect senior citizen based on age', () => {
      const profile = { category: 'general', age: 67 };
      expect(getTaxFreeThreshold2025(profile)).toBe(450000);
    });

    test('should not override higher threshold categories with senior detection', () => {
      const disabledSenior = { category: 'disabled', age: 70 };
      expect(getTaxFreeThreshold2025(disabledSenior)).toBe(525000); // Should remain disabled threshold
      
      const freedomFighterSenior = { category: 'freedom_fighter', age: 70 };
      expect(getTaxFreeThreshold2025(freedomFighterSenior)).toBe(550000); // Should remain freedom fighter threshold
    });

    test('should default to general threshold for unknown categories', () => {
      const profile = { category: 'unknown', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(400000);
    });

    test('legacy parent_disabled category returns general + 50k', () => {
      expect(getTaxFreeThreshold2025({ category: 'parent_disabled', age: 40 })).toBe(450000);
    });

    test.each([
      ['general', 40, 450000],
      ['female', 40, 500000],
      ['senior', 66, 500000],
      ['general', 66, 500000], // age-detected senior
      ['disabled', 40, 575000],
      ['third_gender', 40, 575000],
      ['freedom_fighter', 40, 600000],
    ])('parent of disabled allowance adds 50k on top of %s (age %i) → %i', (category, age, expected) => {
      expect(getTaxFreeThreshold2025({ category, age, parentOfDisabled: true })).toBe(expected);
    });
  });

  describe('getMinimumTax2025', () => {
    test('should return 5000 for all known locations', () => {
      expect(getMinimumTax2025('dhaka')).toBe(5000);
      expect(getMinimumTax2025('chittagong')).toBe(5000);
      expect(getMinimumTax2025('other_city')).toBe(5000);
      expect(getMinimumTax2025('district')).toBe(5000);
    });

    test('should default to district minimum for unknown locations', () => {
      expect(getMinimumTax2025('unknown')).toBe(5000);
    });
  });

  describe('calculateTaxSlabs2025', () => {
    test('should generate correct tax slabs for general taxpayer (400k threshold)', () => {
      const slabs = calculateTaxSlabs2025(400000);
      
      expect(slabs).toHaveLength(6); // 6 slabs total (removed 5% bracket)
      
      // First slab (tax-free)
      expect(slabs[0]).toEqual(['First Tk4 lakh [0-4 lakh]', 0, 400000, 0]);
      
      // Second slab (10%)
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4-7 lakh]', 400000, 700000, 10]);
      
      // Third slab (15%)
      expect(slabs[2]).toEqual(['Next Tk4 lakh [7-11 lakh]', 700000, 1100000, 15]);
      
      // Fourth slab (20%)
      expect(slabs[3]).toEqual(['Next Tk5 lakh [11-16 lakh]', 1100000, 1600000, 20]);
      
      // Fifth slab (25%)
      expect(slabs[4]).toEqual(['Next Tk20 lakh [16-36 lakh]', 1600000, 3600000, 25]);
      
      // Sixth slab (30%)
      expect(slabs[5]).toEqual(['Above [36-UP lakh]', 3600000, Infinity, 30]);
    });

    test('should generate correct tax slabs for female taxpayer (450k threshold)', () => {
      const slabs = calculateTaxSlabs2025(450000);
      
      expect(slabs).toHaveLength(6);
      
      // First slab should reflect higher threshold
      expect(slabs[0]).toEqual(['First Tk4.5 lakh [0-4.5 lakh]', 0, 450000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4.5-7.5 lakh]', 450000, 750000, 10]);
    });

    test('should generate correct tax slabs for disabled person (525k threshold)', () => {
      const slabs = calculateTaxSlabs2025(525000);
      
      expect(slabs).toHaveLength(6);
      
      // First slab should reflect higher threshold
      expect(slabs[0]).toEqual(['First Tk5.3 lakh [0-5.3 lakh]', 0, 525000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [5.3-8.3 lakh]', 525000, 825000, 10]);
    });

    test('should generate correct tax slabs for freedom fighter (550k threshold)', () => {
      const slabs = calculateTaxSlabs2025(550000);
      
      expect(slabs).toHaveLength(6);
      
      // First slab should reflect highest threshold
      expect(slabs[0]).toEqual(['First Tk5.5 lakh [0-5.5 lakh]', 0, 550000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [5.5-8.5 lakh]', 550000, 850000, 10]);
    });

    test('should have correct tax rates in order', () => {
      const slabs = calculateTaxSlabs2025(400000);
      const rates = slabs.map(slab => slab[3]);
      
      expect(rates).toEqual([0, 10, 15, 20, 25, 30]);
    });

    test('should have no 5% bracket (removed in 2025-26)', () => {
      const slabs = calculateTaxSlabs2025(400000);
      const rates = slabs.map(slab => slab[3]);
      
      expect(rates).not.toContain(5);
    });
  });

  describe('getRebatePercentage2025', () => {
    test('should return correct rebate percentages for different income levels', () => {
      expect(getRebatePercentage2025(400000)).toBe(10);   // <= 500k
      expect(getRebatePercentage2025(600000)).toBe(12.5); // <= 700k
      expect(getRebatePercentage2025(900000)).toBe(15);   // <= 1100k
      expect(getRebatePercentage2025(1400000)).toBe(17.5); // <= 1600k
      expect(getRebatePercentage2025(2000000)).toBe(20);  // > 1600k
    });

    test('should handle boundary values correctly', () => {
      expect(getRebatePercentage2025(500000)).toBe(10);   // exactly 500k
      expect(getRebatePercentage2025(500001)).toBe(12.5); // just above 500k
      expect(getRebatePercentage2025(700000)).toBe(12.5); // exactly 700k
      expect(getRebatePercentage2025(700001)).toBe(15);   // just above 700k
      expect(getRebatePercentage2025(1100000)).toBe(15);  // exactly 1100k
      expect(getRebatePercentage2025(1100001)).toBe(17.5); // just above 1100k
      expect(getRebatePercentage2025(1600000)).toBe(17.5); // exactly 1600k
      expect(getRebatePercentage2025(1600001)).toBe(20);  // just above 1600k
    });
  });

  describe('getMaxRebateableInvestment2025', () => {
    test('should return 20% of taxable income', () => {
      expect(getMaxRebateableInvestment2025(500000)).toBe(100000);
      expect(getMaxRebateableInvestment2025(1000000)).toBe(200000);
      expect(getMaxRebateableInvestment2025(2000000)).toBe(400000);
    });

    test('should be capped at 10 lakh BDT', () => {
      expect(getMaxRebateableInvestment2025(6000000)).toBe(1000000); // 20% would be 1.2M, but capped at 1M
      expect(getMaxRebateableInvestment2025(10000000)).toBe(1000000); // 20% would be 2M, but capped at 1M
    });

    test('should handle edge cases', () => {
      expect(getMaxRebateableInvestment2025(0)).toBe(0);
      expect(getMaxRebateableInvestment2025(100000)).toBe(20000);
    });

    test('should round correctly', () => {
      expect(getMaxRebateableInvestment2025(333333)).toBe(66667); // 333333/5 = 66666.6, rounded to 66667
    });
  });

  describe('Integration Tests', () => {
    test('should work correctly with different taxpayer profiles', () => {
      const profiles = [
        { category: 'general', age: 30 },
        { category: 'female', age: 40 },
        { category: 'disabled', age: 35 },
        { category: 'freedom_fighter', age: 60 },
        { category: 'third_gender', age: 25 }
      ];

      profiles.forEach(profile => {
        const threshold = getTaxFreeThreshold2025(profile);
        const slabs = calculateTaxSlabs2025(threshold);
        
        expect(threshold).toBeGreaterThan(0);
        expect(slabs).toHaveLength(6);
        expect(slabs[0][2]).toBe(threshold); // First slab upper limit should match threshold
        expect(slabs[0][3]).toBe(0); // First slab should be tax-free
      });
    });

    test('should maintain slab progression', () => {
      const slabs = calculateTaxSlabs2025(400000);
      
      for (let i = 1; i < slabs.length; i++) {
        if (slabs[i][2] !== Infinity) {
          expect(slabs[i][1]).toBe(slabs[i-1][2]); // Each slab should start where previous ends
        }
        expect(slabs[i][3]).toBeGreaterThanOrEqual(slabs[i-1][3]); // Tax rates should be progressive
      }
    });

    test('should handle all threshold values correctly', () => {
      Object.values(TAX_FREE_THRESHOLDS_2025).forEach(threshold => {
        const slabs = calculateTaxSlabs2025(threshold);
        expect(slabs).toHaveLength(6);
        expect(slabs[0][2]).toBe(threshold);
      });
    });
  });

  describe('Comparison with 2024-25 Rules', () => {
    test('should have higher thresholds than 2024-25', () => {
      const oldThresholds = {
        general: 350000,
        female: 400000,
        disabled: 475000,
        freedom_fighter: 500000
      };

      expect(TAX_FREE_THRESHOLDS_2025.general).toBeGreaterThan(oldThresholds.general);
      expect(TAX_FREE_THRESHOLDS_2025.female).toBeGreaterThan(oldThresholds.female);
      expect(TAX_FREE_THRESHOLDS_2025.disabled).toBeGreaterThan(oldThresholds.disabled);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter).toBeGreaterThan(oldThresholds.freedom_fighter);
    });

    test('should have fewer slabs than 2024-25 (6 vs 7)', () => {
      const slabs = calculateTaxSlabs2025(400000);
      expect(slabs).toHaveLength(6); // 2025-26 has 6 slabs, 2024-25 had 7
    });

    test('should not have 5% tax bracket', () => {
      const slabs = calculateTaxSlabs2025(400000);
      const rates = slabs.map(slab => slab[3]);
      expect(rates).not.toContain(5); // 5% bracket removed in 2025-26
    });
  });
});