import {
  calculateTaxSlabs2026,
  getTaxFreeThreshold2026,
  getMinimumTax2026,
  calculateInvestmentRebate2026,
  TAX_FREE_THRESHOLDS_2026,
  MINIMUM_TAX_2026,
  MINIMUM_TAX_FIRST_TIME_2026
} from '@/utils/taxSlabs2026';

// ─── Sources ───────────────────────────────────────────────────────────────
// PwC Finance Act 2026: https://www.pwc.com/bd/en/assets/pdfs/budget/finance-act-2026-key-amendments.pdf
// PwC Tax Summaries BD: https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income
// KPMG Finance Bill 2026: https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Salient_features_of_Finance_Bill_2026(Tax-and_VAT).pdf
// Daily Star Finance Bill passed: https://www.thedailystar.net/business/bangladesh-budget-2025-26/news/finance-bill-passed-tax-free-income-threshold-set-tk-4-lakh-fy2026-27-4211511

describe('Tax Slabs 2026-27 Utility Functions', () => {
  // ─── Thresholds ──────────────────────────────────────────────────────────
  describe('TAX_FREE_THRESHOLDS_2026 Constants', () => {
    test('general taxpayer: Tk 4,00,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.general).toBe(400000);
    });

    test('female taxpayer: Tk 4,50,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.female).toBe(450000);
    });

    test('senior citizen (65+): Tk 4,50,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.senior).toBe(450000);
    });

    test('disabled person: Tk 5,25,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.disabled).toBe(525000);
    });

    test('third gender: Tk 5,25,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.third_gender).toBe(525000);
    });

    test('gazetted war-wounded freedom fighter / July Warrior: Tk 5,50,000', () => {
      expect(TAX_FREE_THRESHOLDS_2026.freedom_fighter).toBe(550000);
    });

    test('parent of disabled child: Tk 4,50,000 (general + Tk 50k)', () => {
      expect(TAX_FREE_THRESHOLDS_2026.parent_disabled).toBe(450000);
    });

    test('each category is +25,000 vs FY 2025-26', () => {
      const prev = {
        general: 375000, female: 425000, senior: 425000,
        disabled: 500000, third_gender: 500000,
        freedom_fighter: 525000, parent_disabled: 425000
      };
      Object.keys(prev).forEach(key => {
        expect(TAX_FREE_THRESHOLDS_2026[key] - prev[key]).toBe(25000);
      });
    });
  });

  // ─── Minimum tax ─────────────────────────────────────────────────────────
  describe('MINIMUM_TAX_2026 Constants', () => {
    test('flat Tk 5,000 for all locations', () => {
      expect(MINIMUM_TAX_2026.dhaka).toBe(5000);
      expect(MINIMUM_TAX_2026.chittagong).toBe(5000);
      expect(MINIMUM_TAX_2026.other_city).toBe(5000);
      expect(MINIMUM_TAX_2026.district).toBe(5000);
    });

    test('first-time filer minimum is Tk 1,000', () => {
      expect(MINIMUM_TAX_FIRST_TIME_2026).toBe(1000);
    });
  });

  // ─── getTaxFreeThreshold2026 ─────────────────────────────────────────────
  describe('getTaxFreeThreshold2026', () => {
    test('general taxpayer returns 400000', () => {
      expect(getTaxFreeThreshold2026({ category: 'general', age: 30 })).toBe(400000);
    });

    test('female taxpayer returns 450000', () => {
      expect(getTaxFreeThreshold2026({ category: 'female', age: 30 })).toBe(450000);
    });

    test('disabled returns 525000', () => {
      expect(getTaxFreeThreshold2026({ category: 'disabled', age: 35 })).toBe(525000);
    });

    test('freedom_fighter returns 550000', () => {
      expect(getTaxFreeThreshold2026({ category: 'freedom_fighter', age: 35 })).toBe(550000);
    });

    test('third_gender returns 525000', () => {
      expect(getTaxFreeThreshold2026({ category: 'third_gender', age: 30 })).toBe(525000);
    });

    test('parent_disabled returns 450000 (400k + 50k)', () => {
      expect(getTaxFreeThreshold2026({ category: 'parent_disabled', age: 40 })).toBe(450000);
    });

    test('age 65+ general auto-detected as senior → 450000', () => {
      expect(getTaxFreeThreshold2026({ category: 'general', age: 67 })).toBe(450000);
    });

    test('age 65+ disabled keeps disabled threshold 525000', () => {
      expect(getTaxFreeThreshold2026({ category: 'disabled', age: 70 })).toBe(525000);
    });

    test('age 65+ freedom_fighter keeps 550000', () => {
      expect(getTaxFreeThreshold2026({ category: 'freedom_fighter', age: 70 })).toBe(550000);
    });

    test('unknown category falls back to general 400000', () => {
      expect(getTaxFreeThreshold2026({ category: 'alien', age: 30 })).toBe(400000);
    });
  });

  // ─── getMinimumTax2026 ───────────────────────────────────────────────────
  describe('getMinimumTax2026', () => {
    test.each(['dhaka', 'chittagong', 'other_city', 'district', 'unknown'])(
      'returns 5000 for location %s',
      (loc) => {
        expect(getMinimumTax2026(loc)).toBe(5000);
      }
    );

    test('returns 1000 for first-time filer', () => {
      expect(getMinimumTax2026('dhaka', true)).toBe(1000);
      expect(getMinimumTax2026('district', true)).toBe(1000);
    });
  });

  // ─── calculateTaxSlabs2026 ───────────────────────────────────────────────
  describe('calculateTaxSlabs2026', () => {
    test('general taxpayer (400k): 6 slabs', () => {
      const slabs = calculateTaxSlabs2026(400000);
      expect(slabs).toHaveLength(6);
    });

    test('general: slab boundaries and rates correct', () => {
      const slabs = calculateTaxSlabs2026(400000);

      // [0] threshold at 0%
      expect(slabs[0][1]).toBe(0);
      expect(slabs[0][2]).toBe(400000);
      expect(slabs[0][3]).toBe(0);

      // [1] next 3L at 10%
      expect(slabs[1][1]).toBe(400000);
      expect(slabs[1][2]).toBe(700000);
      expect(slabs[1][3]).toBe(10);

      // [2] next 4L at 15%
      expect(slabs[2][1]).toBe(700000);
      expect(slabs[2][2]).toBe(1100000);
      expect(slabs[2][3]).toBe(15);

      // [3] next 5L at 20%
      expect(slabs[3][1]).toBe(1100000);
      expect(slabs[3][2]).toBe(1600000);
      expect(slabs[3][3]).toBe(20);

      // [4] next 20L at 25%
      expect(slabs[4][1]).toBe(1600000);
      expect(slabs[4][2]).toBe(3600000);
      expect(slabs[4][3]).toBe(25);

      // [5] above at 30%
      expect(slabs[5][1]).toBe(3600000);
      expect(slabs[5][2]).toBe(Infinity);
      expect(slabs[5][3]).toBe(30);
    });

    test('no 5% bracket', () => {
      const slabs = calculateTaxSlabs2026(400000);
      expect(slabs.map(s => s[3])).not.toContain(5);
    });

    test('rates are progressive: 0,10,15,20,25,30', () => {
      const slabs = calculateTaxSlabs2026(400000);
      expect(slabs.map(s => s[3])).toEqual([0, 10, 15, 20, 25, 30]);
    });

    test('contiguous slabs — upper of [n] equals lower of [n+1]', () => {
      const slabs = calculateTaxSlabs2026(400000);
      for (let i = 0; i < slabs.length - 1; i++) {
        if (slabs[i + 1][2] !== Infinity) {
          expect(slabs[i + 1][1]).toBe(slabs[i][2]);
        }
      }
    });

    test.each([
      [400000, 'general'],
      [450000, 'female/senior'],
      [525000, 'disabled/third_gender'],
      [550000, 'freedom_fighter']
    ])('threshold %i (%s): first slab upper matches threshold', (threshold) => {
      const slabs = calculateTaxSlabs2026(threshold);
      expect(slabs[0][2]).toBe(threshold);
    });
  });

  // ─── calculateInvestmentRebate2026 ───────────────────────────────────────
  describe('calculateInvestmentRebate2026', () => {
    // FY 2026-27: lowest of (3% income, 10% investment, Tk 7.5L)

    test('limited by 3% of income when that is smallest', () => {
      // 3% of 1,000,000 = 30,000
      // 10% of 500,000 = 50,000
      // cap 750,000
      expect(calculateInvestmentRebate2026(1000000, 500000)).toBe(30000);
    });

    test('limited by 10% of investment when that is smallest', () => {
      // 3% of 2,000,000 = 60,000
      // 10% of 400,000 = 40,000  ← smallest
      // cap 750,000
      expect(calculateInvestmentRebate2026(2000000, 400000)).toBe(40000);
    });

    test('capped at Tk 7,50,000', () => {
      // 3% of 50,000,000 = 1,500,000
      // 10% of 50,000,000 = 5,000,000
      // cap 750,000  ← smallest
      expect(calculateInvestmentRebate2026(50000000, 50000000)).toBe(750000);
    });

    test('zero investment → zero rebate', () => {
      expect(calculateInvestmentRebate2026(1000000, 0)).toBe(0);
    });

    test('rounds correctly', () => {
      // 3% of 333334 = 10000.02 → 10000
      // 10% of 500000 = 50000
      expect(calculateInvestmentRebate2026(333334, 500000)).toBe(10000);
    });

    // Key difference from FY 2025-26: cap is 7.5L not 10L, rate 10% not 15%
    test('rebate is LOWER than FY 2025-26 for same input (10% vs 15%, 7.5L vs 10L cap)', () => {
      const income = 5000000;
      const investment = 3000000;

      // FY 2025-26: min(3%*5M=150k, 15%*3M=450k, 10L) = 150k
      const rebate2025 = Math.min(income * 0.03, investment * 0.15, 1000000);

      // FY 2026-27: min(3%*5M=150k, 10%*3M=300k, 7.5L) = 150k
      const rebate2026 = calculateInvestmentRebate2026(income, investment);

      // Both hit the 3% floor here; show that for investment-bound cases 2026 is less
      const investBound = 500000; // small investment
      const r2025inv = Math.min(income * 0.03, investBound * 0.15, 1000000); // 75000
      const r2026inv = calculateInvestmentRebate2026(income, investBound);    // 50000
      expect(r2026inv).toBeLessThan(r2025inv);
    });
  });

  // ─── Worked salary examples ───────────────────────────────────────────────
  describe('Worked salary examples (FY 2026-27, general taxpayer)', () => {
    // Example 1: annual taxable salary = Tk 7,00,000
    // Threshold = 4,00,000; taxable above threshold = 3,00,000
    // Slab: 3,00,000 @10% = 30,000
    // No investment → rebate = 0; minimum tax = 5,000
    // Total tax = max(30,000, 5,000) = 30,000
    test('taxable income 7L (general): tax = 30,000', () => {
      const slabs = calculateTaxSlabs2026(400000);
      const taxable = 700000;
      let tax = 0;
      slabs.forEach(([, low, high, rate]) => {
        if (taxable > low) {
          const portion = Math.min(taxable, high === Infinity ? taxable : high) - low;
          tax += Math.round((portion * rate) / 100);
        }
      });
      tax = Math.max(tax, 5000);
      expect(tax).toBe(30000);
    });

    // Example 2: annual taxable salary = Tk 15,00,000 (general)
    // 4L @0% = 0
    // 3L @10% = 30,000
    // 4L @15% = 60,000
    // 4L @20% = 80,000
    // Total slab tax = 1,70,000
    // Investment 2L → rebate = min(3%*15L=45k, 10%*2L=20k, 7.5L) = 20,000
    // Payable = 170,000 - 20,000 = 1,50,000
    test('taxable income 15L (general), investment 2L: payable = 1,50,000', () => {
      const slabs = calculateTaxSlabs2026(400000);
      const taxable = 1500000;
      let tax = 0;
      slabs.forEach(([, low, high, rate]) => {
        if (taxable > low) {
          const portion = Math.min(taxable, high === Infinity ? taxable : high) - low;
          tax += Math.round((portion * rate) / 100);
        }
      });
      tax = Math.max(tax, 5000);
      const rebate = calculateInvestmentRebate2026(taxable, 200000);
      expect(tax).toBe(170000);
      expect(rebate).toBe(20000);
      expect(tax - rebate).toBe(150000);
    });

    // Example 3: income below threshold → minimum tax applies
    test('income below threshold (3L): minimum tax Tk 5,000 applies', () => {
      const slabs = calculateTaxSlabs2026(400000);
      const taxable = 300000;
      let tax = 0;
      slabs.forEach(([, low, high, rate]) => {
        if (taxable > low) {
          const portion = Math.min(taxable, high === Infinity ? taxable : high) - low;
          tax += Math.round((portion * rate) / 100);
        }
      });
      expect(Math.max(tax, 5000)).toBe(5000);
    });

    // Example 4: first-time filer, income 5L (general)
    // 1L @10% = 10,000 → less than 5000? No, 10,000 > 1,000. Apply calculated tax.
    // Wait: first-time minimum is 1,000 not 5,000
    test('first-time filer, income 5L: minimum tax 1,000, calculated tax 10,000 wins', () => {
      const slabs = calculateTaxSlabs2026(400000);
      const taxable = 500000;
      let tax = 0;
      slabs.forEach(([, low, high, rate]) => {
        if (taxable > low) {
          const portion = Math.min(taxable, high === Infinity ? taxable : high) - low;
          tax += Math.round((portion * rate) / 100);
        }
      });
      const minTax = getMinimumTax2026('dhaka', true); // 1000
      expect(Math.max(tax, minTax)).toBe(10000);
    });
  });

  // ─── Comparison vs FY 2025-26 ─────────────────────────────────────────────
  describe('vs FY 2025-26', () => {
    test('all thresholds are higher', () => {
      const thresholds2025 = {
        general: 375000, female: 425000, senior: 425000,
        disabled: 500000, third_gender: 500000,
        freedom_fighter: 525000, parent_disabled: 425000
      };
      Object.entries(thresholds2025).forEach(([key, old]) => {
        expect(TAX_FREE_THRESHOLDS_2026[key]).toBeGreaterThan(old);
      });
    });

    test('slab structure identical (same bands, same rates)', () => {
      // Both have [3L@10%, 4L@15%, 5L@20%, 20L@25%, rest@30%]
      const slabs = calculateTaxSlabs2026(400000);
      const bandWidths = slabs.slice(1, 5).map(s =>
        s[2] === Infinity ? Infinity : s[2] - s[1]
      );
      expect(bandWidths).toEqual([300000, 400000, 500000, 2000000]);
    });
  });
});
