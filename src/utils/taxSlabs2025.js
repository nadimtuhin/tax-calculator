const LAKH = 100000;

// Bangladesh Tax Slab Structure FY 2025-2026 (amounts in lakh)
// Per Finance Ordinance 2025 (Artho Adhyadesh 2025) / NBR Paripatra 2025-2026 Section 1.1.
// The 5% bracket has been removed; second slab starts at 10% on next 3 lakh.
const TAX_SLAB_AMOUNTS_2025 = [3, 4, 5, 20]; // After threshold: 3L, 4L, 5L, 20L
const TAX_RATES_2025 = [0, 10, 15, 20, 25, 30]; // 0% for threshold, then 10%, 15%, etc.

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
 * Tax-free thresholds for FY 2025-2026
 * Per Finance Ordinance 2025 / NBR Paripatra 2025-2026 Section 1.1.
 * Increased by BDT 25,000 across all categories vs FY 2024-2025.
 * Includes new "July Warrior" category (gazetted wounded in July 2024 uprising).
 */
export const TAX_FREE_THRESHOLDS_2025 = {
  general: 375000,
  female: 425000,
  senior: 425000,
  disabled: 500000,
  third_gender: 500000,
  freedom_fighter: 525000,
  // july_warrior (525000) applies from FY 2026-27 per Finance Ordinance 2025
  parent_disabled: 425000    // 375K base + 50K additional
};

/**
 * Minimum tax amounts for FY 2025-2026
 * Flat BDT 5,000 for all locations per Finance Ordinance 2025.
 * The old three-tier structure (5k/4k/3k) applied only in FY 2024-2025.
 * First-time taxpayers: BDT 1,000 (handled separately in UI).
 */
export const MINIMUM_TAX_2025 = {
  dhaka: 5000,
  chittagong: 5000,
  other_city: 5000,
  district: 5000
};

/**
 * Calculate tax-free threshold for FY 2025-2026 based on taxpayer profile
 * @param {Object} taxpayerProfile - Profile containing category, age, location
 * @returns {number} Tax-free threshold in BDT
 */
export function getTaxFreeThreshold2025(taxpayerProfile) {
  const { category, age } = taxpayerProfile;

  // Handle age-based senior citizen detection
  if (age >= 65 && category !== 'disabled' && category !== 'freedom_fighter' && category !== 'third_gender') {
    return TAX_FREE_THRESHOLDS_2025.senior;
  }

  return TAX_FREE_THRESHOLDS_2025[category] || TAX_FREE_THRESHOLDS_2025.general;
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
 * Calculate investment rebate for FY 2025-2026
 * Per Finance Ordinance 2025 Section 78 / NBR Paripatra 2025-2026 Section 19.
 * Rebate = lowest of: (a) 3% of total income, (b) 15% of qualifying investment, (c) BDT 10,00,000
 * @param {number} taxableIncome - Taxable income in BDT
 * @param {number} totalInvestment - Total qualifying investment in BDT
 * @returns {number} Investment rebate in BDT
 */
export function calculateInvestmentRebate2025FromIncome(taxableIncome, totalInvestment) {
  const threePercentOfIncome = taxableIncome * 0.03;
  const fifteenPercentOfInvestment = totalInvestment * 0.15;
  const cap = 1000000; // 10 lakh BDT
  return Math.round(Math.min(threePercentOfIncome, fifteenPercentOfInvestment, cap));
}
