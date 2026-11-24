import { calculateTaxForYear } from '@/utils/taxEngine';

// Table-driven boundary tests for every supported fiscal year and taxpayer category.
// Each rule is checked exactly on its threshold and 1 taka above it.
//
// The expected values are written out here as literals, not read from the engine, so a change
// to a rule constant fails a test. They pin the rules as the engine states them today. Each rule
// constant has a one-line source comment next to it in src/utils/ (taxSlabs*.js, taxEngine.js,
// fa2026Rules.js). PR #104 lists which values were re-checked and the open FY 2025-26 question.

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
    firstTimeMinimumTax: 5000,
    rebate: { incomeRate: 0.03, investmentRate: 0.15, cap: 1000000 },
    ageAutoSenior: false,
  },
  '2024-25': {
    thresholds: PRE_FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[1 * LAKH, 5], [4 * LAKH, 10], [5 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: PRE_FA2026_MINIMUM_TAX,
    firstTimeMinimumTax: 5000,
    rebate: { incomeRate: 0.03, investmentRate: 0.15, cap: 1000000 },
    ageAutoSenior: false,
  },
  '2025-26': {
    thresholds: FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[3 * LAKH, 10], [4 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: FA2026_MINIMUM_TAX,
    firstTimeMinimumTax: 1000,
    rebate: { incomeRate: 0.03, investmentRate: 0.10, cap: 750000 },
    ageAutoSenior: true,
  },
  '2026-27': {
    thresholds: FA2026_THRESHOLDS,
    parentAllowance: 50000,
    bands: [[3 * LAKH, 10], [4 * LAKH, 15], [5 * LAKH, 20], [20 * LAKH, 25]],
    topRate: 30,
    minimumTax: FA2026_MINIMUM_TAX,
    firstTimeMinimumTax: 1000,
    rebate: { incomeRate: 0.03, investmentRate: 0.10, cap: 750000 },
    ageAutoSenior: true,
  },
};

const CATEGORIES = Object.keys(PRE_FA2026_THRESHOLDS);

const calc = (args) => calculateTaxForYear({ location: 'dhaka', ...args });

// Slab tax at an income, computed from the literal band table above.
function referenceSlabTax(income, threshold, { bands, topRate }) {
  let tax = 0;
  let lower = threshold;
  for (const [width, rate] of [...bands, [Infinity, topRate]]) {
    const inBand = Math.min(Math.max(income - lower, 0), width);
    tax += Math.round((inBand * rate) / 100);
    lower += width;
  }
  return tax;
}

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
      bandRows.push([year, category, upper, rate, nextRate, rules]);
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
    (year, category, upper, rate, nextRate, rules) => {
      const threshold = rules.thresholds[category];
      const onEdge = calc({ year, category, taxable_income: upper });
      expect(marginalRate(onEdge)).toBe(rate);
      expect(onEdge.gross_tax_bdt).toBe(referenceSlabTax(upper, threshold, rules));

      const above = calc({ year, category, taxable_income: upper + 1 });
      expect(marginalRate(above)).toBe(nextRate);
      expect(above.gross_tax_bdt).toBe(referenceSlabTax(upper + 1, threshold, rules));
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

  test.each(Object.entries(YEARS))('%s first-time filer minimum tax', (year, rules) => {
    const above = calc({ year, first_time_filer: true, taxable_income: rules.thresholds.general + 1 });
    expect(above.total_tax_bdt).toBe(rules.firstTimeMinimumTax);
  });
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
  // Pick an income high enough that gross tax always exceeds the rebate.
  const income = 50 * LAKH;

  test.each(Object.entries(YEARS))('%s investment limb: rebate rate on the last taka', (year, rules) => {
    // Where the investment limb and the income limb meet.
    const crossover = (rules.rebate.incomeRate * income) / rules.rebate.investmentRate;
    const below = calc({ year, taxable_income: income, investments: crossover - 10 });
    expect(below.rebate_bdt).toBe(Math.round((crossover - 10) * rules.rebate.investmentRate));

    const onEdge = calc({ year, taxable_income: income, investments: crossover });
    expect(onEdge.rebate_bdt).toBe(Math.round(rules.rebate.incomeRate * income));

    const above = calc({ year, taxable_income: income, investments: crossover + 10 });
    expect(above.rebate_bdt).toBe(Math.round(rules.rebate.incomeRate * income));
  });

  test.each(Object.entries(YEARS))('%s absolute cap', (year, rules) => {
    const capIncome = rules.rebate.cap / rules.rebate.incomeRate;
    const bigInvestment = 10 * rules.rebate.cap / rules.rebate.investmentRate;

    const onCap = calc({ year, taxable_income: Math.ceil(capIncome), investments: bigInvestment });
    expect(onCap.rebate_bdt).toBe(rules.rebate.cap);

    const aboveCap = calc({ year, taxable_income: Math.ceil(capIncome) + 1, investments: bigInvestment });
    expect(aboveCap.rebate_bdt).toBe(rules.rebate.cap);

    const belowCap = calc({ year, taxable_income: Math.floor(capIncome) - 100, investments: bigInvestment });
    expect(belowCap.rebate_bdt).toBe(Math.round(rules.rebate.incomeRate * (Math.floor(capIncome) - 100)));
  });
});
