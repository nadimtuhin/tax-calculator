import { calculateTaxSlabs } from '@/utils/taxSlabs';
import { calculateTaxSlabs2023 } from '@/utils/taxSlabs2023';
import { calculateTaxSlabs2025 } from '@/utils/taxSlabs2025';
import { calculateTaxSlabs2026 } from '@/utils/taxSlabs2026';
import {
  calculateSlabBreakdown,
  calculateTaxForYear,
  calculateTaxSlabsForYear,
  getTaxFreeThresholdForYear,
  sumSlabTax,
} from '@/utils/taxEngine';

// Locks the slab schedules the calculator implements today.
// Finance Ordinance 2025's 375,000 general threshold is not applied here:
// the 400,000 vs 375,000 choice is pending the owner and is left unchanged.

const LATER_WIDTHS = {
  '2023-24': [100000, 300000, 400000, 500000],
  '2024-25': [100000, 400000, 500000, 500000, 2000000],
  '2025-26': [300000, 400000, 500000, 2000000],
  '2026-27': [300000, 400000, 500000, 2000000],
};

const RATES = {
  '2023-24': [0, 5, 10, 15, 20, 25],
  '2024-25': [0, 5, 10, 15, 20, 25, 30],
  '2025-26': [0, 10, 15, 20, 25, 30],
  '2026-27': [0, 10, 15, 20, 25, 30],
};

const THRESHOLDS = {
  '2023-24': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    third_gender: 475000,
    freedom_fighter: 500000,
  },
  '2024-25': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    third_gender: 475000,
    freedom_fighter: 500000,
  },
  '2025-26': {
    general: 400000,
    female: 450000,
    senior: 450000,
    disabled: 525000,
    third_gender: 525000,
    freedom_fighter: 550000,
  },
  '2026-27': {
    general: 400000,
    female: 450000,
    senior: 450000,
    disabled: 525000,
    third_gender: 525000,
    freedom_fighter: 550000,
  },
};

const LOCATION_MINIMUM = {
  '2023-24': { dhaka: 5000, chittagong: 5000, other_city: 4000, district: 3000 },
  '2024-25': { dhaka: 5000, chittagong: 5000, other_city: 4000, district: 3000 },
  '2025-26': { dhaka: 5000, chittagong: 5000, other_city: 5000, district: 5000 },
  '2026-27': { dhaka: 5000, chittagong: 5000, other_city: 5000, district: 5000 },
};

const YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];
const CATEGORIES = ['general', 'female', 'senior', 'disabled', 'third_gender', 'freedom_fighter'];

function boundsFor(year, threshold) {
  const widths = [threshold, ...LATER_WIDTHS[year]];
  const bounds = [];
  let cursor = 0;
  widths.forEach((width) => {
    bounds.push([cursor, cursor + width]);
    cursor += width;
  });
  bounds.push([cursor, Infinity]);
  return bounds;
}

function sliceTax(amount, rate) {
  return Math.round((amount / 100) * rate);
}

function expectedGross(year, threshold, income) {
  const rates = RATES[year];
  const bounds = boundsFor(year, threshold);
  return bounds.reduce((tax, [low, high], index) => {
    const cap = high === Infinity ? income : high;
    const amount = Math.max(0, Math.min(income, cap) - low);
    return tax + sliceTax(amount, rates[index]);
  }, 0);
}

function taxAt(year, income, extra = {}) {
  return calculateTaxForYear({
    year,
    category: 'general',
    age: 30,
    location: 'dhaka',
    taxable_income: income,
    ...extra,
  });
}

describe('Bangladesh tax slab edge cases', () => {
  describe('slab geometry', () => {
    test.each(YEARS)('%s bands stay contiguous and use the year rates for every category', (year) => {
      CATEGORIES.forEach((category) => {
        const threshold = THRESHOLDS[year][category];
        const slabs = calculateTaxSlabsForYear(year, threshold);
        const bounds = boundsFor(year, threshold);

        expect(slabs).toHaveLength(RATES[year].length);
        slabs.forEach((slab, index) => {
          expect(slab[1]).toBe(bounds[index][0]);
          expect(slab[2]).toBe(bounds[index][1]);
          expect(slab[3]).toBe(RATES[year][index]);
          if (index > 0) {
            expect(slab[1]).toBe(slabs[index - 1][2]);
          }
        });
        expect(slabs[0][1]).toBe(0);
        expect(slabs[0][2]).toBe(threshold);
        expect(slabs[0][3]).toBe(0);
        expect(slabs[slabs.length - 1][2]).toBe(Infinity);

        const laterWidths = slabs.slice(1, -1).map((slab) => slab[2] - slab[1]);
        expect(laterWidths).toEqual(LATER_WIDTHS[year]);
      });
    });

    test('an odd taka threshold does not drift off an integer boundary', () => {
      const threshold = 400001;
      [calculateTaxSlabs, calculateTaxSlabs2023, calculateTaxSlabs2025, calculateTaxSlabs2026].forEach((build) => {
        const slabs = build(threshold);
        expect(slabs[0][1]).toBe(0);
        expect(slabs[0][2]).toBe(threshold);
        expect(Number.isInteger(slabs[0][2])).toBe(true);
        for (let index = 1; index < slabs.length - 1; index += 1) {
          expect(slabs[index][1]).toBe(slabs[index - 1][2]);
          expect(Number.isInteger(slabs[index][1])).toBe(true);
          expect(Number.isInteger(slabs[index][2])).toBe(true);
        }
        expect(slabs[slabs.length - 1][1]).toBe(slabs[slabs.length - 2][2]);
        expect(slabs[slabs.length - 1][2]).toBe(Infinity);
      });
    });

    test('a zero threshold still opens the first taxable band at taka 0', () => {
      const slabs = calculateTaxSlabs(0);
      expect(slabs[0]).toEqual(['First Tk0 lakh [0-0 lakh]', 0, 0, 0]);
      expect(slabs[1][1]).toBe(0);
      expect(slabs[1][2]).toBe(100000);
      expect(slabs[1][3]).toBe(5);

      const breakdown = calculateSlabBreakdown(100000, slabs);
      expect(breakdown[1].slabAmount).toBe(100000);
      expect(breakdown[1].slabCut).toBe(5000);
      expect(sumSlabTax(breakdown)).toBe(5000);
    });
  });

  describe('per-slice rounding', () => {
    const slabs = [
      ['zero', 0, 100, 0],
      ['five', 100, 200, 5],
      ['ten', 200, 300, 10],
      ['fifteen', 300, 400, 15],
      ['thirty', 400, Infinity, 30],
    ];

    test.each([
      [110, 1, 1, '10 taka at 5% rounds half up to 1'],
      [205, 2, 1, '5 taka at 10% rounds half up to 1'],
      [310, 3, 2, '10 taka at 15% rounds 1.5 up to 2'],
      [401, 4, 0, '1 taka at 30% rounds 0.3 down to 0'],
      [402, 4, 1, '2 taka at 30% rounds 0.6 up to 1'],
      [200, 1, 5, 'a closed 5% band of 100 is taxed in full'],
    ])('income %i, slab %i cut %i — %s', (income, slabIndex, sliceTax) => {
      const breakdown = calculateSlabBreakdown(income, slabs);
      expect(breakdown[slabIndex].slabCut).toBe(sliceTax);
      expect(breakdown.reduce((sum, slab) => sum + slab.slabAmount, 0)).toBe(income);
    });

    test('income exactly on a boundary does not tax the same taka twice', () => {
      const breakdown = calculateSlabBreakdown(200, slabs);
      expect(breakdown[1].slabAmount).toBe(100);
      expect(breakdown[1].slabCut).toBe(5);
      expect(breakdown[2].slabAmount).toBe(0);
      expect(breakdown[2].slabCut).toBe(0);
    });
  });

  describe('threshold, one-taka, and top-band edges', () => {
    const probes = [0, 1, 10];

    test.each(YEARS)('%s charges nothing at or below the threshold, including TDS', (year) => {
      const threshold = THRESHOLDS[year].general;
      [0, threshold - 1, threshold].forEach((income) => {
        const result = taxAt(year, income, { tds: 1500 });
        expect(result.tax_free_threshold_bdt).toBe(threshold);
        expect(result.gross_tax_bdt).toBe(0);
        expect(result.total_tax_bdt).toBe(0);
        expect(result.minimum_tax_bdt).toBe(0);
        expect(result.is_minimum_tax_applied).toBe(false);
        expect(result.below_tax_free_threshold).toBe(true);
        expect(result.payable_tax_bdt).toBe(0);
        expect(result.excess_tds_bdt).toBe(1500);
      });
    });

    test.each(YEARS)('%s applies location minimum tax on the first taka above the threshold', (year) => {
      const threshold = THRESHOLDS[year].general;
      Object.entries(LOCATION_MINIMUM[year]).forEach(([location, minimum]) => {
        const result = taxAt(year, threshold + 1, { location });
        expect(result.gross_tax_bdt).toBe(0);
        expect(result.statutory_minimum_tax_bdt).toBe(minimum);
        expect(result.minimum_tax_bdt).toBe(minimum);
        expect(result.is_minimum_tax_applied).toBe(true);
        expect(result.total_tax_bdt).toBe(minimum);
        expect(result.payable_tax_bdt).toBe(minimum);
        expect(result.below_tax_free_threshold).toBe(false);
      });
    });

    test('FY 2024-25 and earlier ignore the first-time filer minimum', () => {
      ['2023-24', '2024-25'].forEach((year) => {
        const result = taxAt(year, THRESHOLDS[year].general + 1, { first_time_filer: true });
        expect(result.total_tax_bdt).toBe(5000);
        expect(result.profile.first_time_filer).toBe(true);
      });
    });

    test('FY 2025-26 and FY 2026-27 use Tk 1,000 for a first-time filer until slab tax is higher', () => {
      ['2025-26', '2026-27'].forEach((year) => {
        const justOver = taxAt(year, 400001, { first_time_filer: true });
        expect(justOver.gross_tax_bdt).toBe(0);
        expect(justOver.total_tax_bdt).toBe(1000);
        expect(justOver.is_minimum_tax_applied).toBe(true);

        // 5 taka into the 10% band rounds to Tk 1, still under the Tk 1,000 floor.
        const fiveTaka = taxAt(year, 400005, { first_time_filer: true });
        expect(fiveTaka.gross_tax_bdt).toBe(1);
        expect(fiveTaka.total_tax_bdt).toBe(1000);

        // Tk 1,00,000 in the 10% band is Tk 10,000, so the floor does not apply.
        const fiveLakh = taxAt(year, 500000, { first_time_filer: true });
        expect(fiveLakh.gross_tax_bdt).toBe(10000);
        expect(fiveLakh.total_tax_bdt).toBe(10000);
        expect(fiveLakh.is_minimum_tax_applied).toBe(false);
      });
    });

    test.each(YEARS)('%s gross tax matches the band table at every boundary', (year) => {
      const threshold = THRESHOLDS[year].general;
      const bounds = boundsFor(year, threshold);
      const samples = new Set([0, threshold]);

      bounds.forEach(([low, high]) => {
        if (high === Infinity) {
          samples.add(low);
          samples.add(low + 1);
          samples.add(low + 2);
          samples.add(low + 1400000);
          return;
        }
        probes.forEach((offset) => {
          if (low + offset <= high) samples.add(low + offset);
          if (high - offset >= low) samples.add(high - offset);
        });
        samples.add(high);
      });

      samples.forEach((income) => {
        const result = taxAt(year, income);
        const gross = expectedGross(year, threshold, income);
        expect(result.gross_tax_bdt).toBe(gross);
        expect(result.slab_breakdown.reduce((sum, slab) => sum + slab.taxable_amount_bdt, 0)).toBe(income);

        result.slab_breakdown.forEach((slab, index) => {
          if (index === 0) return;
          expect(slab.lower_bdt).toBe(result.slab_breakdown[index - 1].upper_bdt);
        });
        const top = result.slab_breakdown[result.slab_breakdown.length - 1];
        expect(top.unbounded).toBe(true);
        expect(top.upper_bdt).toBeNull();
        expect(top.rate_percent).toBe(RATES[year][RATES[year].length - 1]);
      });
    });

    test('published landmarks', () => {
      expect(taxAt('2023-24', 1000000).gross_tax_bdt).toBe(72500);
      expect(taxAt('2023-24', 1650000).gross_tax_bdt).toBe(195000);
      expect(taxAt('2023-24', 2000000).gross_tax_bdt).toBe(282500);
      expect(taxAt('2023-24', 50000000).gross_tax_bdt).toBe(12282500);
      expect(taxAt('2023-24', 50000000).slab_breakdown.at(-1).rate_percent).toBe(25);

      expect(taxAt('2024-25', 450000).gross_tax_bdt).toBe(5000);
      expect(taxAt('2024-25', 850000).gross_tax_bdt).toBe(45000);
      expect(taxAt('2024-25', 1000000).gross_tax_bdt).toBe(67500);
      expect(taxAt('2024-25', 3850000).gross_tax_bdt).toBe(720000);
      expect(taxAt('2024-25', 5000000).gross_tax_bdt).toBe(1065000);
      expect(taxAt('2024-25', 350010).gross_tax_bdt).toBe(1);
      expect(taxAt('2024-25', 350010).total_tax_bdt).toBe(5000);

      ['2025-26', '2026-27'].forEach((year) => {
        expect(taxAt(year, 700000).gross_tax_bdt).toBe(30000);
        expect(taxAt(year, 700010).gross_tax_bdt).toBe(30002);
        expect(taxAt(year, 1100000).gross_tax_bdt).toBe(90000);
        expect(taxAt(year, 1500000).gross_tax_bdt).toBe(170000);
        expect(taxAt(year, 1600000).gross_tax_bdt).toBe(190000);
        expect(taxAt(year, 3600000).gross_tax_bdt).toBe(690000);
        expect(taxAt(year, 5000000).gross_tax_bdt).toBe(1110000);
        expect(taxAt(year, 400005).gross_tax_bdt).toBe(1);
        expect(taxAt(year, 400005).total_tax_bdt).toBe(5000);
      });
    });
  });

  describe('category, age, and dependent edges', () => {
    test('age 64 stays on the base category and age 65 promotes only from FY 2025-26', () => {
      expect(taxAt('2024-25', 700000, { age: 64 }).tax_free_threshold_bdt).toBe(350000);
      expect(taxAt('2024-25', 700000, { age: 65 }).tax_free_threshold_bdt).toBe(350000);
      expect(taxAt('2024-25', 700000, { age: 65 }).gross_tax_bdt).toBe(30000);

      expect(taxAt('2024-25', 700000, { category: 'senior', age: 65 }).tax_free_threshold_bdt).toBe(400000);
      expect(taxAt('2024-25', 700000, { category: 'senior', age: 65 }).gross_tax_bdt).toBe(25000);

      ['2025-26', '2026-27'].forEach((year) => {
        expect(taxAt(year, 700000, { age: 64 }).tax_free_threshold_bdt).toBe(400000);
        expect(taxAt(year, 700000, { age: 64 }).gross_tax_bdt).toBe(30000);
        expect(taxAt(year, 700000, { age: 65 }).tax_free_threshold_bdt).toBe(450000);
        expect(taxAt(year, 700000, { age: 65 }).gross_tax_bdt).toBe(25000);
        expect(taxAt(year, 700000, { category: 'disabled', age: 70 }).tax_free_threshold_bdt).toBe(525000);
        expect(taxAt(year, 700000, { category: 'third_gender', age: 70 }).tax_free_threshold_bdt).toBe(525000);
        expect(taxAt(year, 700000, { category: 'freedom_fighter', age: 70 }).tax_free_threshold_bdt).toBe(550000);
      });
    });

    test('a higher category threshold shifts the zero band and leaves later widths unchanged', () => {
      const female = taxAt('2025-26', 900000, { category: 'female', age: 40 });
      expect(female.tax_free_threshold_bdt).toBe(450000);
      // 3L at 10% + 1.5L at 15%
      expect(female.gross_tax_bdt).toBe(52500);

      const fighter = taxAt('2026-27', 900000, { category: 'freedom_fighter', age: 40, parent_of_disabled: true });
      expect(fighter.tax_free_threshold_bdt).toBe(600000);
      expect(fighter.gross_tax_bdt).toBe(30000);
      expect(fighter.slab_breakdown[0].taxable_amount_bdt).toBe(600000);
      expect(fighter.slab_breakdown[1].taxable_amount_bdt).toBe(300000);
      expect(fighter.slab_breakdown[2].taxable_amount_bdt).toBe(0);
    });

    test('FY 2025-26 onward adds Tk 50,000 per disabled dependent, earlier years add it once', () => {
      const threeChildren = { category: 'general', age: 40, disabledDependentCount: 3 };
      expect(getTaxFreeThresholdForYear('2025-26', threeChildren)).toBe(550000);
      expect(getTaxFreeThresholdForYear('2026-27', threeChildren)).toBe(550000);
      expect(calculateTaxSlabsForYear('2025-26', 550000)[0][2]).toBe(550000);

      const shifted = calculateSlabBreakdown(850000, calculateTaxSlabsForYear('2026-27', 550000));
      expect(shifted[0].slabAmount).toBe(550000);
      expect(shifted[1].slabAmount).toBe(300000);
      expect(shifted[1].slabCut).toBe(30000);
      expect(sumSlabTax(shifted)).toBe(30000);

      expect(getTaxFreeThresholdForYear('2024-25', threeChildren)).toBe(400000);
      expect(getTaxFreeThresholdForYear('2023-24', threeChildren)).toBe(400000);
      expect(getTaxFreeThresholdForYear('2024-25', { category: 'female', age: 40, disabledDependentCount: 3 })).toBe(450000);
    });

    test('same general income across years follows each implemented schedule', () => {
      const income = 1000000;
      expect(taxAt('2023-24', income).gross_tax_bdt).toBe(72500);
      expect(taxAt('2024-25', income).gross_tax_bdt).toBe(67500);
      expect(taxAt('2025-26', income).gross_tax_bdt).toBe(75000);
      expect(taxAt('2026-27', income).gross_tax_bdt).toBe(75000);
      expect(taxAt('2025-26', income).tax_free_threshold_bdt).toBe(400000);
      expect(taxAt('2026-27', income).tax_free_threshold_bdt).toBe(400000);
    });
  });

  describe('rebate floor and rejected inputs', () => {
    test('a Section 78 rebate cannot reduce liability below minimum tax once income exceeds the threshold', () => {
      ['2025-26', '2026-27'].forEach((year) => {
        const result = taxAt(year, 500000, { investments: 200000 });
        expect(result.gross_tax_bdt).toBe(10000);
        expect(result.rebate_bdt).toBe(15000);
        expect(result.tax_after_rebate_bdt).toBe(0);
        expect(result.total_tax_bdt).toBe(5000);
        expect(result.is_minimum_tax_applied).toBe(true);
        expect(result.payable_tax_bdt).toBe(5000);
      });
    });

    test.each([
      [{ taxable_income: -1 }, 'negative income'],
      [{ taxable_income: Number.NaN }, 'NaN income'],
      [{ taxable_income: Number.POSITIVE_INFINITY }, 'infinite income'],
      [{ year: 'AY 2026-27', taxable_income: 500000 }, 'assessment year'],
      [{ year: '2019-20', taxable_income: 500000 }, 'unsupported year'],
      [{ category: 'alien', taxable_income: 500000 }, 'unknown category'],
      [{ age: 64.5, taxable_income: 500000 }, 'fractional age'],
      [{ age: -1, taxable_income: 500000 }, 'negative age'],
      [{ age: 151, taxable_income: 500000 }, 'age above 150'],
      [{ location: 'sylhet', taxable_income: 500000 }, 'unknown location'],
      [{ taxable_income: 500000, income: { gross_salary: 500000 } }, 'both income forms'],
    ])('rejects %s', (input) => {
      expect(() => calculateTaxForYear({ year: '2025-26', ...input })).toThrow();
    });
  });
});
