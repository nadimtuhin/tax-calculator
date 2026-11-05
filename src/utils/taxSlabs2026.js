const LAKH = 100000;

// Bangladesh Tax Slab Structure FY 2026-2027 (Finance Act 2026, enacted 6 July 2026)
// Slabs after threshold: 3L @10%, 4L @15%, 5L @20%, 20L @25%, rest @30%
// Same slab bands as FY 2025-26; thresholds raised by Tk 25,000 each.
// Sources:
//   PwC Finance Act 2026 Key Amendments: https://www.pwc.com/bd/en/assets/pdfs/budget/finance-act-2026-key-amendments.pdf
//   PwC Tax Summaries Bangladesh: https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income
//   KPMG Salient Features Finance Bill 2026: https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Salient_features_of_Finance_Bill_2026(Tax-and_VAT).pdf
//   The Daily Star Finance Bill passed: https://www.thedailystar.net/business/bangladesh-budget-2025-26/news/finance-bill-passed-tax-free-income-threshold-set-tk-4-lakh-fy2026-27-4211511

const TAX_SLAB_AMOUNTS_2026 = [3, 4, 5, 20]; // 3L, 4L, 5L, 20L
const TAX_RATES_2026 = [0, 10, 15, 20, 25, 30];

const formatLakh = (lakhs) => {
  return lakhs === Math.floor(lakhs) ? `${lakhs}` : `${lakhs.toFixed(1)}`;
};

const formatRange = (from, to) => {
  const fromLakh = formatLakh(from / LAKH);
  const toLakh = to === Infinity ? 'UP' : formatLakh(to / LAKH);
  return `[${fromLakh}-${toLakh} lakh]`;
};

/**
 * Calculate tax slabs for FY 2026-2027 based on taxpayer's threshold
 * @param {number} taxFreeThreshold - Tax-free threshold in BDT for 2026-2027
 * @returns {Array} Array of slab definitions [description, from, to, rate]
 */
export function calculateTaxSlabs2026(taxFreeThreshold) {
  const thresholdInLakh = taxFreeThreshold / LAKH;

  const allSlabAmounts = [thresholdInLakh, ...TAX_SLAB_AMOUNTS_2026];

  let cumulative = 0;
  const slabs = [];

  allSlabAmounts.forEach((amount, index) => {
    const from = cumulative * LAKH;
    const to = (cumulative + amount) * LAKH;
    const slabType = index === 0 ? 'First' : 'Next';
    const description = `${slabType} Tk${formatLakh(amount)} lakh ${formatRange(from, to)}`;

    slabs.push([description, from, to, TAX_RATES_2026[index]]);
    cumulative += amount;
  });

  const finalFrom = cumulative * LAKH;
  slabs.push([
    `Above ${formatRange(finalFrom, Infinity)}`,
    finalFrom,
    Infinity,
    TAX_RATES_2026[TAX_RATES_2026.length - 1]
  ]);

  return slabs;
}

/**
 * Tax-free thresholds for FY 2026-2027 (AY 2027-28)
 * Each category raised by Tk 25,000 vs FY 2025-26.
 * Sources: PwC Finance Act 2026, KPMG Finance Bill 2026, Daily Star 2026 budget coverage.
 */
export const TAX_FREE_THRESHOLDS_2026 = {
  general: 400000,         // +25K from 375K
  female: 450000,          // +25K from 425K
  senior: 450000,          // +25K from 425K (65+ years)
  disabled: 525000,        // +25K from 500K
  third_gender: 525000,    // +25K from 500K
  freedom_fighter: 550000  // +25K from 525K (gazetted war-wounded freedom fighter / July Warrior)
};

/**
 * Additional allowance for a parent / legal guardian of a person with disability.
 * Added ON TOP of the taxpayer's own category threshold (one parent only),
 * e.g. general 400K -> 450K, female/65+ 450K -> 500K, freedom fighter 550K -> 600K.
 */
export const PARENT_OF_DISABLED_ALLOWANCE_2026 = 50000;

/**
 * Minimum tax for FY 2026-2027: flat Tk 5,000 regardless of location.
 * Tk 1,000 for first-time filers (tracked separately in UI).
 * Source: PwC Finance Act 2026 Key Amendments; KPMG Finance Bill 2026.
 */
export const MINIMUM_TAX_2026 = {
  dhaka: 5000,
  chittagong: 5000,
  other_city: 5000,
  district: 5000
};

export const MINIMUM_TAX_FIRST_TIME_2026 = 1000;

/**
 * Calculate tax-free threshold for FY 2026-2027 based on taxpayer profile.
 * The parent-of-disabled allowance is additive to the taxpayer's own category.
 * Legacy profiles with category 'parent_disabled' are treated as general + allowance.
 * @param {Object} taxpayerProfile - { category, age, parentOfDisabled }
 * @returns {number} Tax-free threshold in BDT
 */
export function getTaxFreeThreshold2026(taxpayerProfile) {
  const { category, age, parentOfDisabled } = taxpayerProfile;
  const isLegacyParent = category === 'parent_disabled';
  const baseCategory = isLegacyParent ? 'general' : category;

  let threshold = TAX_FREE_THRESHOLDS_2026[baseCategory] || TAX_FREE_THRESHOLDS_2026.general;

  // Age-based senior detection: only applies when no higher category set
  if (
    age >= 65 &&
    baseCategory !== 'disabled' &&
    baseCategory !== 'freedom_fighter' &&
    baseCategory !== 'third_gender'
  ) {
    threshold = TAX_FREE_THRESHOLDS_2026.senior;
  }

  if (parentOfDisabled || isLegacyParent) {
    threshold += PARENT_OF_DISABLED_ALLOWANCE_2026;
  }

  return threshold;
}

/**
 * Minimum tax for FY 2026-2027.
 * @param {string} location - Taxpayer location (all same in 2026-27)
 * @param {boolean} isFirstTime - Whether this is the taxpayer's first return
 * @returns {number} Minimum tax amount in BDT
 */
export function getMinimumTax2026(location, isFirstTime = false) {
  if (isFirstTime) return MINIMUM_TAX_FIRST_TIME_2026;
  return MINIMUM_TAX_2026[location] || MINIMUM_TAX_2026.district;
}

/**
 * Calculate investment rebate for FY 2026-2027.
 * Rebate = lowest of:
 *   (a) 3% of taxable income
 *   (b) 10% of eligible investment (reduced from 15% in 2025-26)
 *   (c) Tk 7,50,000 (reduced from Tk 10,00,000 in 2025-26)
 * Sources: PwC Finance Act 2026 Key Amendments; KPMG Finance Bill 2026.
 *
 * @param {number} taxableIncome - Taxable income in BDT
 * @param {number} totalEligibleInvestment - Total qualifying investment in BDT
 * @returns {number} Rebate amount in BDT
 */
export function calculateInvestmentRebate2026(taxableIncome, totalEligibleInvestment) {
  const threePercentOfIncome = taxableIncome * 0.03;
  const tenPercentOfInvestment = totalEligibleInvestment * 0.10;
  const capTk750000 = 750000;

  return Math.round(Math.max(0, Math.min(threePercentOfIncome, tenPercentOfInvestment, capTk750000)));
}
