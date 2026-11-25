import { calculateTaxForYear } from '@/utils/taxEngine';

// Table-driven boundary tests for every supported fiscal year and taxpayer category.
// Each rule is checked exactly on its threshold and 1 taka above it.
//
// Expected taka amounts below are hand-checked literals. They are not produced by calling the
// engine, and they are not produced by a second copy of the slab or rebate formula. A change to
// a rule constant in src/utils/ fails a test. The literals pin the rules as taxEngine.js states
// them today (2025-26 and 2026-27 stay separate rows even where the numbers match). PR #104
// lists which source documents were re-checked and the open FY 2025-26 threshold question.

const LAKH = 100000;

// Tax-free thresholds by category, before the parent-of-disabled allowance.
const PRE_FA2026_THRESHOLDS = {
  general: 3.5 * LAKH,
  female: 4 * LAKH,
  senior: 4 * LAKH,
  disabled: 4.75 * LAKH,
  third_gender: 4.75 * LAKH,
  freedom_fighter: 5 * LAKH,
};
const FA2026_THRESHOLDS = {
  general: 4 * LAKH,
  female: 4.5 * LAKH,
  senior: 4.5 * LAKH,
  disabled: 5.25 * LAKH,
  third_gender: 5.25 * LAKH,
  freedom_fighter: 5.5 * LAKH,
};

const PRE_FA2026_MINIMUM_TAX = { dhaka: 5000, chittagong: 5000, other_city: 4000, district: 3000 };
const FA2026_MINIMUM_TAX = { dhaka: 5000, chittagong: 5000, other_city: 5000, district: 5000 };

const YEARS = {
  '2023-24': {
    thresholds: PRE_FA2026_THRESHOLDS,
    parentAllowance: 50000,
    // Width of each band above the threshold, then the rate on the rest.
    bands: [[1 * LAKH, 5], [3 * LAKH, 10], [4 * LAKH, 15], [5 * LAKH, 20]],
    topRate: 25,
    minimumTax: PRE_FA2026_MINIMUM_TAX,
    ageAutoSenior: false,
  },
  '2024-25': {
    thresholds: PRE_FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[1 * LAKH, 5], [4 * LAKH, 10], [5 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: PRE_FA2026_MINIMUM_TAX,
    ageAutoSenior: false,
  },
  '2025-26': {
    thresholds: FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[3 * LAKH, 10], [4 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: FA2026_MINIMUM_TAX,
    ageAutoSenior: true,
  },
  '2026-27': {
    thresholds: FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[3 * LAKH, 10], [4 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: FA2026_MINIMUM_TAX,
    ageAutoSenior: true,
  },
};

const CATEGORIES = Object.keys(PRE_FA2026_THRESHOLDS);

const calc = (args) => calculateTaxForYear({ location: 'dhaka', ...args });

// Cumulative slab tax at the end of each taxable band, in band order.
// The 0% threshold band adds nothing, so the figure does not depend on category.
// Worked for a general taxpayer; other categories land on the same tax because only the
// 0% band moves. Each band is rounded on its own, the way calculateSlabBreakdown does:
//   2023-24: 1L×5%=5,000; +3L×10%=35,000; +4L×15%=95,000; +5L×20%=195,000
//   2024-25: 1L×5%=5,000; +4L×10%=45,000; +5L×15%=120,000; +5L×20%=220,000; +20L×25%=720,000
//   2025-26 and 2026-27: 3L×10%=30,000; +4L×15%=90,000; +5L×20%=190,000; +20L×25%=690,000
// One further taka is 1×(5%..30%) = 0.05..0.30, which rounds to 0, so gross tax stays put.
const BAND_END_TAX = {
  '2023-24': [5000, 35000, 95000, 195000],
  '2024-25': [5000, 45000, 120000, 220000, 720000],
  '2025-26': [30000, 90000, 190000, 690000],
  '2026-27': [30000, 90000, 190000, 690000],
};

// Taka above the general threshold where rounded slab tax first exceeds that area's minimum.
// One taka earlier the rounded slab tax is exactly the minimum (so the floor is not "applied":
// the engine uses a strict less-than). Checked by hand from per-band rounding:
//   5% band, floor 4,000: 80,010 × 5% = 4,000.50 → 4,001; 80,009 × 5% = 4,000.45 → 4,000
//   5% band, floor 3,000: 60,010 × 5% = 3,000.50 → 3,001
//   floor 5,000 sits exactly at the end of a 1L×5% band, so the next 5 taka at 10%
//   (round(0.50)=1) is the first taka over: offset 100,005
//   2025-26 / 2026-27 first band is 10%: 50,005 × 10% = 5,000.50 → 5,001
const MINIMUM_LIFTOFF_ABOVE_THRESHOLD = {
  '2023-24': { dhaka: 100005, chittagong: 100005, other_city: 80010, district: 60010 },
  '2024-25': { dhaka: 100005, chittagong: 100005, other_city: 80010, district: 60010 },
  '2025-26': { dhaka: 50005, chittagong: 50005, other_city: 50005, district: 50005 },
  '2026-27': { dhaka: 50005, chittagong: 50005, other_city: 50005, district: 50005 },
};

// The rate of the band that the last taka of `income` falls in.
function marginalRate(result) {
  const band = result.slab_breakdown.find(
    (slab) => result.taxable_income_bdt > slab.lower_bdt &&
      (slab.unbounded || result.taxable_income_bdt <= slab.upper_bdt)
  );
  return band.rate_percent;
}

const thresholdRows = [];
const parentRows = [];
const bandRows = [];
const minimumTaxRows = [];
for (const [year, rules] of Object.entries(YEARS)) {
  for (const category of CATEGORIES) {
    thresholdRows.push([year, category, rules.thresholds[category], rules]);
    parentRows.push([year, category, rules.thresholds[category] + rules.parentAllowance, rules]);

    let upper = rules.thresholds[category];
    for (const [index, [width, rate]] of rules.bands.entries()) {
      upper += width;
      const nextRate = rules.bands[index + 1]?.[1] ?? rules.topRate;
      bandRows.push([year, category, upper, rate, nextRate, rules, index]);
    }
  }
  for (const [location, amount] of Object.entries(rules.minimumTax)) {
    minimumTaxRows.push([year, location, amount, rules]);
  }
}

describe('tax-free threshold by year and category', () => {
  test.each(thresholdRows)('%s %s: no tax at exactly %d', (year, category, threshold) => {
    const result = calc({ year, category, taxable_income: threshold });
    expect(result.tax_free_threshold_bdt).toBe(threshold);
    expect(result.below_tax_free_threshold).toBe(true);
    expect(result.gross_tax_bdt).toBe(0);
    expect(result.total_tax_bdt).toBe(0);
  });

  test.each(thresholdRows)('%s %s: minimum tax applies 1 taka above %d', (year, category, threshold, rules) => {
    const result = calc({ year, category, taxable_income: threshold + 1 });
    expect(result.below_tax_free_threshold).toBe(false);
    expect(marginalRate(result)).toBe(rules.bands[0][1]);
    expect(result.total_tax_bdt).toBe(rules.minimumTax.dhaka);
  });
});

describe('parent of a disabled child adds the allowance to the own-category threshold', () => {
  test.each(parentRows)('%s %s parent: no tax at exactly %d', (year, category, threshold) => {
    const result = calc({ year, category, parent_of_disabled: true, taxable_income: threshold });
    expect(result.tax_free_threshold_bdt).toBe(threshold);
    expect(result.total_tax_bdt).toBe(0);
  });

  test.each(parentRows)('%s %s parent: taxed 1 taka above %d', (year, category, threshold, rules) => {
    const result = calc({ year, category, parent_of_disabled: true, taxable_income: threshold + 1 });
    expect(result.below_tax_free_threshold).toBe(false);
    expect(result.total_tax_bdt).toBe(rules.minimumTax.dhaka);
  });
});

describe('slab band edges by year and category', () => {
  test.each(bandRows)(
    '%s %s: band ends at %d (%d%%), next taka at %d%%',
    (year, category, upper, rate, nextRate, rules, index) => {
      const onEdge = calc({ year, category, taxable_income: upper });
      expect(marginalRate(onEdge)).toBe(rate);
      expect(onEdge.gross_tax_bdt).toBe(BAND_END_TAX[year][index]);

      const above = calc({ year, category, taxable_income: upper + 1 });
      expect(marginalRate(above)).toBe(nextRate);
      expect(above.gross_tax_bdt).toBe(BAND_END_TAX[year][index]);
    }
  );
});

describe('minimum tax by area', () => {
  test.each(minimumTaxRows)('%s %s: Tk %d from 1 taka above the threshold', (year, location, amount, rules) => {
    const threshold = rules.thresholds.general;
    expect(calc({ year, location, taxable_income: threshold }).total_tax_bdt).toBe(0);
    const above = calc({ year, location, taxable_income: threshold + 1 });
    expect(above.statutory_minimum_tax_bdt).toBe(amount);
    expect(above.total_tax_bdt).toBe(amount);
    expect(above.is_minimum_tax_applied).toBe(true);
  });

  test.each(Object.entries(YEARS))(
    '%s slab tax passes the area minimum exactly one taka after the liftoff offset',
    (year, rules) => {
      const threshold = rules.thresholds.general;
      for (const [location, minimum] of Object.entries(rules.minimumTax)) {
        const liftoff = threshold + MINIMUM_LIFTOFF_ABOVE_THRESHOLD[year][location];
        const stillFloor = calc({ year, location, taxable_income: liftoff - 1 });
        expect(stillFloor.gross_tax_bdt).toBe(minimum);
        expect(stillFloor.total_tax_bdt).toBe(minimum);
        expect(stillFloor.is_minimum_tax_applied).toBe(false);

        const over = calc({ year, location, taxable_income: liftoff });
        expect(over.gross_tax_bdt).toBe(minimum + 1);
        expect(over.total_tax_bdt).toBe(minimum + 1);
        expect(over.is_minimum_tax_applied).toBe(false);
      }
    }
  );

  // Years before FY 2025-26 have no first-time rate. getMinimumTaxForYear ignores the flag,
  // so a district filer stays on the area floor of 3,000 with or without it.
  test.each(['2023-24', '2024-25'])(
    '%s first-time flag does not change the district minimum of 3000',
    (year) => {
      const income = YEARS[year].thresholds.general + 1;
      const ordinary = calc({ year, location: 'district', taxable_income: income });
      const firstTime = calc({
        year,
        location: 'district',
        first_time_filer: true,
        taxable_income: income,
      });
      expect(ordinary.total_tax_bdt).toBe(3000);
      expect(firstTime.total_tax_bdt).toBe(3000);
      expect(firstTime.statutory_minimum_tax_bdt).toBe(3000);
    }
  );

  test.each(['2025-26', '2026-27'])(
    '%s first-time filer minimum is 1000 in every area',
    (year) => {
      const income = YEARS[year].thresholds.general + 1;
      for (const location of Object.keys(FA2026_MINIMUM_TAX)) {
        const firstTime = calc({
          year,
          location,
          first_time_filer: true,
          taxable_income: income,
        });
        expect(firstTime.statutory_minimum_tax_bdt).toBe(1000);
        expect(firstTime.total_tax_bdt).toBe(1000);
      }
    }
  );
});

describe('age 65 senior threshold', () => {
  test.each(Object.entries(YEARS))('%s general taxpayer aged 64 vs 65', (year, rules) => {
    const at64 = calc({ year, category: 'general', age: 64, taxable_income: rules.thresholds.general + 1 });
    expect(at64.tax_free_threshold_bdt).toBe(rules.thresholds.general);

    const at65 = calc({ year, category: 'general', age: 65, taxable_income: rules.thresholds.general + 1 });
    expect(at65.tax_free_threshold_bdt).toBe(
      rules.ageAutoSenior ? rules.thresholds.senior : rules.thresholds.general
    );
  });

  test.each(Object.entries(YEARS))('%s higher categories are not lowered to senior at 65', (year, rules) => {
    for (const category of ['disabled', 'third_gender', 'freedom_fighter']) {
      const result = calc({ year, category, age: 65, taxable_income: 0 });
      expect(result.tax_free_threshold_bdt).toBe(rules.thresholds[category]);
    }
  });
});

describe('Section 78 investment rebate limbs', () => {
  // 50 lakh keeps 3% at exactly 150,000, under both absolute caps, and gross tax above that.
  // The investment limb meets 150,000 at 1,000,000 (15%) or 1,500,000 (10%).
  // Ten taka under: 999,990 × 15% = 149,998.50 → 149,999, and 1,499,990 × 10% = 149,999.
  const INCOME = 50 * LAKH;
  const investmentLimbRows = [
    ['2023-24', 1000000, 149999, 150000],
    ['2024-25', 1000000, 149999, 150000],
    ['2025-26', 1500000, 149999, 150000],
    ['2026-27', 1500000, 149999, 150000],
  ];

  test.each(investmentLimbRows)(
    '%s investment limb meets the 3% limb at %d',
    (year, crossover, belowRebate, onRebate) => {
      const below = calc({ year, taxable_income: INCOME, investments: crossover - 10 });
      expect(below.rebate_bdt).toBe(belowRebate);

      const onEdge = calc({ year, taxable_income: INCOME, investments: crossover });
      expect(onEdge.rebate_bdt).toBe(onRebate);

      const above = calc({ year, taxable_income: INCOME, investments: crossover + 10 });
      expect(above.rebate_bdt).toBe(onRebate);
    }
  );

  // Cap binds once 3% of income reaches it. Investment is 2 crore so the investment limb
  // (15% = 3,000,000, 10% = 2,000,000) is above either cap.
  // 2023-24 / 2024-25 cap 1,000,000: 1,000,000 / 3% = 33,333,333.333..., so 33,333,334 is the
  // first income at the cap. 33,333,233 is 100 below the last income still under it, and
  // 33,333,233 × 3% = 999,996.99 → 999,997.
  // 2025-26 / 2026-27 cap 750,000: 750,000 / 3% = 25,000,000 exactly.
  // 24,999,900 × 3% = 749,997.
  const capRows = [
    ['2023-24', 33333334, 33333233, 1000000, 999997],
    ['2024-25', 33333334, 33333233, 1000000, 999997],
    ['2025-26', 25000000, 24999900, 750000, 749997],
    ['2026-27', 25000000, 24999900, 750000, 749997],
  ];

  test.each(capRows)(
    '%s absolute cap',
    (year, onIncome, belowIncome, cap, belowRebate) => {
      const investments = 20000000;
      expect(calc({ year, taxable_income: onIncome, investments }).rebate_bdt).toBe(cap);
      expect(calc({ year, taxable_income: onIncome + 1, investments }).rebate_bdt).toBe(cap);
      expect(calc({ year, taxable_income: belowIncome, investments }).rebate_bdt).toBe(belowRebate);
    }
  );
});
