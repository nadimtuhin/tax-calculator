/**
 * Tax Slab Utilities for FY 2026-2027
 * Per Finance Ordinance 2025 (Artho Adhyadesh 2025).
 *
 * Key changes vs FY 2025-26:
 * - Slab structure identical to 2025-26 (no 5% bracket)
 * - Thresholds identical to 2025-26
 * - NEW: july_warrior category (525,000 BDT) added
 * - Minimum tax: flat 5,000 all locations (same as 2025-26)
 * - Investment rebate formula: same as 2025-26
 */

/**
 * Tax-free thresholds for FY 2026-2027
 * Same as 2025-26 plus the new july_warrior category.
 */
export const TAX_FREE_THRESHOLDS_2026 = {
  general: 375000,
  female: 425000,
  senior: 425000,
  disabled: 500000,
  third_gender: 500000,
  freedom_fighter: 525000,
  july_warrior: 525000,   // New in FY 2026-27 per Finance Ordinance 2025
  parent_disabled: 425000 // 375K base + 50K additional
};

/**
 * Minimum tax amounts for FY 2026-2027
 * Flat BDT 5,000 for all locations (same as 2025-26).
 */
export const MINIMUM_TAX_2026 = {
  dhaka: 5000,
  chittagong: 5000,
  other_city: 5000,
  district: 5000
};

/**
 * Calculate tax-free threshold for FY 2026-2027 based on taxpayer profile
 * @param {Object} taxpayerProfile - Profile containing category, age, location
 * @returns {number} Tax-free threshold in BDT
 */
export function getTaxFreeThreshold2026(taxpayerProfile) {
  const { category, age } = taxpayerProfile;

  // Handle age-based senior citizen detection
  if (
    age >= 65 &&
    category !== 'disabled' &&
    category !== 'freedom_fighter' &&
    category !== 'third_gender' &&
    category !== 'july_warrior'
  ) {
    return TAX_FREE_THRESHOLDS_2026.senior;
  }

  return TAX_FREE_THRESHOLDS_2026[category] || TAX_FREE_THRESHOLDS_2026.general;
}

/**
 * Get minimum tax amount for FY 2026-2027 based on location
 * @param {string} location - Taxpayer location
 * @returns {number} Minimum tax amount in BDT
 */
export function getMinimumTax2026(location) {
  return MINIMUM_TAX_2026[location] || MINIMUM_TAX_2026.district;
}

/**
 * Calculate investment rebate for FY 2026-2027
 * Same formula as FY 2025-26:
 * Rebate = lowest of: (a) 3% of total income, (b) 15% of qualifying investment, (c) BDT 10,00,000
 * @param {number} taxableIncome - Taxable income in BDT
 * @param {number} totalInvestment - Total qualifying investment in BDT
 * @returns {number} Investment rebate in BDT
 */
export function calculateInvestmentRebate2026FromIncome(taxableIncome, totalInvestment) {
  const threePercentOfIncome = taxableIncome * 0.03;
  const fifteenPercentOfInvestment = totalInvestment * 0.15;
  const cap = 1000000; // 10 lakh BDT
  return Math.round(Math.min(threePercentOfIncome, fifteenPercentOfInvestment, cap));
}
