const LAKH = 100000;

// Bangladesh Tax Slab Structure FY 2025-2026 (amounts in lakh)
// Note: 5% bracket has been removed, structure simplified to 6 slabs
const TAX_SLAB_AMOUNTS_2025 = [3, 4, 5, 20]; // After threshold: 3L, 4L, 5L, 20L
const TAX_RATES_2025 = [0, 10, 15, 20, 25, 30]; // 0% for threshold, then 10%, 15%, etc. (no 5%)

const formatLakh = (lakhs) => {
  return lakhs === Math.floor(lakhs) ? `${lakhs}` : `${lakhs.toFixed(1)}`;
};

const formatRange = (from, to) => {
  const fromLakh = formatLakh(from / LAKH);
  const toLakh = to === Infinity ? 'UP' : formatLakh(to / LAKH);
  return `[${fromLakh}-${toLakh} lakh]`;
};

/**
 * Calculate tax slabs for FY 2025-2026 based on taxpayer's threshold
 * @param {number} taxFreeThreshold - Tax-free threshold in BDT for 2025-2026
 * @returns {Array} Array of slab definitions [description, from, to, rate]
 */
export function calculateTaxSlabs2025(taxFreeThreshold) {
  const thresholdInLakh = taxFreeThreshold / LAKH;
  
  // Build all slab amounts including threshold
  const allSlabAmounts = [thresholdInLakh, ...TAX_SLAB_AMOUNTS_2025];
  
  let cumulative = 0;
  const slabs = [];
  
  // Create each slab progressively
  allSlabAmounts.forEach((amount, index) => {
    const from = cumulative * LAKH;
    const to = (cumulative + amount) * LAKH;
    const slabType = index === 0 ? 'First' : 'Next';
    const description = `${slabType} Tk${formatLakh(amount)} lakh ${formatRange(from, to)}`;
    
    slabs.push([description, from, to, TAX_RATES_2025[index]]);
    cumulative += amount;
  });
  
  // Add final "Above" slab
  const finalFrom = cumulative * LAKH;
  slabs.push([
    `Above ${formatRange(finalFrom, Infinity)}`,
    finalFrom,
    Infinity,
    TAX_RATES_2025[TAX_RATES_2025.length - 1]
  ]);
  
  return slabs;
}

/**
 * Tax-free thresholds for FY 2025-2026 (Income Year 2025-26 / Assessment Year 2026-27).
 * Enacted Finance Act 2026 (Schedule 1, passed 29 June 2026, effective 1 July 2026)
 * superseded Finance Ordinance 2025's prospective 375K-family proposal and set the
 * 400K-family thresholds for both AY 2026-27 and AY 2027-28 (+50,000 BDT vs FY 2024-25).
 */
export const TAX_FREE_THRESHOLDS_2025 = {
  general: 400000,         // +50K from FY 2024-25 (350K); supersedes FO 2025 proposed 375K
  female: 450000,          // +50K from FY 2024-25 (400K)
  senior: 450000,          // +50K from FY 2024-25 (400K, 65+ years)
  disabled: 525000,        // +50K from FY 2024-25 (475K)
  third_gender: 525000,    // +50K from FY 2024-25 (475K)
  freedom_fighter: 550000  // +50K from FY 2024-25 (500K; war-wounded FF & gazetted July Warriors)
};

/**
 * Additional allowance for a parent / legal guardian of a person with disability.
 * Added ON TOP of the taxpayer's own category threshold (one parent only),
 * e.g. general 400K -> 450K, female/65+ 450K -> 500K, freedom fighter 550K -> 600K.
 */
export const PARENT_OF_DISABLED_ALLOWANCE_2025 = 50000;

/**
 * Get minimum tax amounts for FY 2025-2026
 * Unified minimum tax of 5,000 BDT across all locations
 */
export const MINIMUM_TAX_2025 = {
  dhaka: 5000,
  chittagong: 5000,
  other_city: 5000,
  district: 5000
};

/**
 * Calculate tax-free threshold for FY 2025-2026 based on taxpayer profile.
 * The parent-of-disabled allowance is additive to the taxpayer's own category.
 * Legacy profiles with category 'parent_disabled' are treated as general + allowance.
 * @param {Object} taxpayerProfile - Profile containing category, age, location, parentOfDisabled
 * @returns {number} Tax-free threshold in BDT
 */
export function getTaxFreeThreshold2025(taxpayerProfile) {
  const { category, age, parentOfDisabled } = taxpayerProfile;
  const isLegacyParent = category === 'parent_disabled';
  const baseCategory = isLegacyParent ? 'general' : category;

  let threshold = TAX_FREE_THRESHOLDS_2025[baseCategory] || TAX_FREE_THRESHOLDS_2025.general;

  // Handle age-based senior citizen detection
  if (age >= 65 && baseCategory !== 'disabled' && baseCategory !== 'freedom_fighter' && baseCategory !== 'third_gender') {
    threshold = TAX_FREE_THRESHOLDS_2025.senior;
  }

  if (parentOfDisabled || isLegacyParent) {
    threshold += PARENT_OF_DISABLED_ALLOWANCE_2025;
  }

  return threshold;
}

/**
 * Get minimum tax amount for FY 2025-2026 based on location
 * @param {string} location - Taxpayer location
 * @returns {number} Minimum tax amount in BDT
 */
export function getMinimumTax2025(location) {
  return MINIMUM_TAX_2025[location] || MINIMUM_TAX_2025.district;
}

/**
 * Get rebate percentage for investments in FY 2025-2026
 * Investment rebate rates remain same as FY 2024-2025
 * @param {number} taxableIncome - Taxable income in BDT
 * @returns {number} Rebate percentage
 */
export function getRebatePercentage2025(taxableIncome) {
  if (taxableIncome <= 500000) return 10;
  if (taxableIncome <= 700000) return 12.5;
  if (taxableIncome <= 1100000) return 15;
  if (taxableIncome <= 1600000) return 17.5;
  return 20;
}

/**
 * Calculate maximum rebateable investment for FY 2025-2026
 * Remains 20% of taxable income or BDT 10 lakh, whichever is lower
 * @param {number} taxableIncome - Taxable income in BDT
 * @returns {number} Maximum rebateable investment in BDT
 */
export function getMaxRebateableInvestment2025(taxableIncome) {
  const twentyPercentOfIncome = Math.round(taxableIncome / 5);
  const maxCap = 1000000; // 10 lakh BDT
  return Math.min(twentyPercentOfIncome, maxCap);
}