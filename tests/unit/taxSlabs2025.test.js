import {
  calculateTaxSlabs2025,
  getTaxFreeThreshold2025,
  getMinimumTax2025,
  TAX_FREE_THRESHOLDS_2025,
  MINIMUM_TAX_2025
} from '@/utils/taxSlabs2025';

describe('Tax Slabs 2025 Utility Functions', () => {
  describe('TAX_FREE_THRESHOLDS_2025 Constants', () => {
    test('should have correct thresholds for all categories', () => {
      expect(TAX_FREE_THRESHOLDS_2025.general).toBe(375000);
      expect(TAX_FREE_THRESHOLDS_2025.female).toBe(425000);
      expect(TAX_FREE_THRESHOLDS_2025.senior).toBe(425000);
      expect(TAX_FREE_THRESHOLDS_2025.disabled).toBe(500000);
      expect(TAX_FREE_THRESHOLDS_2025.third_gender).toBe(500000);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter).toBe(525000);
      // july_warrior applies from FY 2026-27, not present in FY 2025-26
      expect(TAX_FREE_THRESHOLDS_2025.july_warrior).toBeUndefined();
      expect(TAX_FREE_THRESHOLDS_2025.parent_disabled).toBe(425000);
    });

    test('should show increased thresholds vs 2024-25 (Finance Ordinance 2025)', () => {
      // Thresholds increased by BDT 25,000 across all categories
      expect(TAX_FREE_THRESHOLDS_2025.general).toBe(375000);
      expect(TAX_FREE_THRESHOLDS_2025.female).toBe(425000);
      expect(TAX_FREE_THRESHOLDS_2025.disabled).toBe(500000);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter).toBe(525000);
    });
  });

  describe('MINIMUM_TAX_2025 Constants', () => {
    test('should have flat 5000 minimum tax for all locations', () => {
      expect(MINIMUM_TAX_2025.dhaka).toBe(5000);
      expect(MINIMUM_TAX_2025.chittagong).toBe(5000);
      expect(MINIMUM_TAX_2025.other_city).toBe(5000);
      expect(MINIMUM_TAX_2025.district).toBe(5000);
    });
  });

  describe('getTaxFreeThreshold2025', () => {
    test('should return correct threshold for general taxpayer', () => {
      const profile = { category: 'general', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(375000);
    });

    test('should return correct threshold for female taxpayer', () => {
      const profile = { category: 'female', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(425000);
    });

    test('should return correct threshold for disabled person', () => {
      const profile = { category: 'disabled', age: 35 };
      expect(getTaxFreeThreshold2025(profile)).toBe(500000);
    });

    test('should return correct threshold for freedom fighter', () => {
      const profile = { category: 'freedom_fighter', age: 35 };
      expect(getTaxFreeThreshold2025(profile)).toBe(525000);
    });

    test('should return correct threshold for third gender', () => {
      const profile = { category: 'third_gender', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(500000);
    });

    test('should return correct threshold for july warrior', () => {
      // july_warrior applies from FY 2026-27; falls back to general in FY 2025-26
      const profile = { category: 'july_warrior', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(375000);
    });

    test('should auto-detect senior citizen based on age', () => {
      const profile = { category: 'general', age: 67 };
      expect(getTaxFreeThreshold2025(profile)).toBe(425000);
    });

    test('should not override higher threshold categories with senior detection', () => {
      const disabledSenior = { category: 'disabled', age: 70 };
      expect(getTaxFreeThreshold2025(disabledSenior)).toBe(500000); // Should remain disabled threshold

      const freedomFighterSenior = { category: 'freedom_fighter', age: 70 };
      expect(getTaxFreeThreshold2025(freedomFighterSenior)).toBe(525000); // Should remain freedom fighter threshold
    });

    test('should default to general threshold for unknown categories', () => {
      const profile = { category: 'unknown', age: 30 };
      expect(getTaxFreeThreshold2025(profile)).toBe(375000);
    });
  });

  describe('getMinimumTax2025', () => {
    test('should return flat 5000 minimum tax for all locations', () => {
      expect(getMinimumTax2025('dhaka')).toBe(5000);
      expect(getMinimumTax2025('chittagong')).toBe(5000);
      expect(getMinimumTax2025('other_city')).toBe(5000);
      expect(getMinimumTax2025('district')).toBe(5000);
    });

    test('should default to 5000 for unknown locations', () => {
      expect(getMinimumTax2025('unknown')).toBe(5000);
    });
  });

  describe('calculateTaxSlabs2025', () => {
    test('should generate correct tax slabs for general taxpayer (375k threshold)', () => {
      const slabs = calculateTaxSlabs2025(375000);

      expect(slabs).toHaveLength(6); // 6 slabs total (threshold + 4 named + above)

      // First slab (tax-free)
      expect(slabs[0]).toEqual(['First Tk3.8 lakh [0-3.8 lakh]', 0, 375000, 0]);

      // Second slab (10%) — 5% bracket removed
      expect(slabs[1]).toEqual(['Next Tk3 lakh [3.8-6.8 lakh]', 375000, 675000, 10]);

      // Third slab (15%)
      expect(slabs[2]).toEqual(['Next Tk4 lakh [6.8-10.8 lakh]', 675000, 1075000, 15]);

      // Fourth slab (20%)
      expect(slabs[3]).toEqual(['Next Tk5 lakh [10.8-15.8 lakh]', 1075000, 1575000, 20]);

      // Fifth slab (25%)
      expect(slabs[4]).toEqual(['Next Tk20 lakh [15.8-35.8 lakh]', 1575000, 3575000, 25]);

      // Sixth slab (30%)
      expect(slabs[5]).toEqual(['Above [35.8-UP lakh]', 3575000, Infinity, 30]);
    });

    test('should generate correct tax slabs for female taxpayer (425k threshold)', () => {
      const slabs = calculateTaxSlabs2025(425000);

      expect(slabs).toHaveLength(6);

      // First slab should reflect higher threshold
      expect(slabs[0]).toEqual(['First Tk4.3 lakh [0-4.3 lakh]', 0, 425000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [4.3-7.3 lakh]', 425000, 725000, 10]);
    });

    test('should generate correct tax slabs for disabled person (500k threshold)', () => {
      const slabs = calculateTaxSlabs2025(500000);

      expect(slabs).toHaveLength(6);

      // First slab should reflect higher threshold
      expect(slabs[0]).toEqual(['First Tk5 lakh [0-5 lakh]', 0, 500000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [5-8 lakh]', 500000, 800000, 10]);
    });

    test('should generate correct tax slabs for freedom fighter (525k threshold)', () => {
      const slabs = calculateTaxSlabs2025(525000);

      expect(slabs).toHaveLength(6);

      // First slab should reflect highest threshold
      expect(slabs[0]).toEqual(['First Tk5.3 lakh [0-5.3 lakh]', 0, 525000, 0]);
      expect(slabs[1]).toEqual(['Next Tk3 lakh [5.3-8.3 lakh]', 525000, 825000, 10]);
    });

    test('should have correct tax rates in order (5% bracket removed)', () => {
      const slabs = calculateTaxSlabs2025(375000);
      const rates = slabs.map(slab => slab[3]);

      expect(rates).toEqual([0, 10, 15, 20, 25, 30]);
    });

    test('should NOT include 5% bracket (removed in Finance Ordinance 2025)', () => {
      const slabs = calculateTaxSlabs2025(375000);
      const rates = slabs.map(slab => slab[3]);

      expect(rates).not.toContain(5);
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
      const slabs = calculateTaxSlabs2025(375000);

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
    test('should have higher thresholds than 2024-25 (increased by 25,000)', () => {
      const thresholds2024 = {
        general: 350000,
        female: 400000,
        disabled: 475000,
        freedom_fighter: 500000
      };

      expect(TAX_FREE_THRESHOLDS_2025.general).toBe(thresholds2024.general + 25000);
      expect(TAX_FREE_THRESHOLDS_2025.female).toBe(thresholds2024.female + 25000);
      expect(TAX_FREE_THRESHOLDS_2025.disabled).toBe(thresholds2024.disabled + 25000);
      expect(TAX_FREE_THRESHOLDS_2025.freedom_fighter).toBe(thresholds2024.freedom_fighter + 25000);
    });

    test('should have 6 slabs (one fewer than 2024-25 due to 5% bracket removal)', () => {
      const slabs = calculateTaxSlabs2025(375000);
      expect(slabs).toHaveLength(6); // 2025-26 has 6 slabs (5% removed)
    });

    test('should NOT retain 5% tax bracket (removed in 2025-26)', () => {
      const slabs = calculateTaxSlabs2025(375000);
      const rates = slabs.map(slab => slab[3]);
      expect(rates).not.toContain(5); // 5% bracket removed in 2025-26
    });
  });
});
