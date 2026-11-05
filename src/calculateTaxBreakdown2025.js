import { calculateSlabBreakdown, calculateFinalTaxSummary } from './utils/taxEngine.js';

/**
 * Calculate tax breakdown for FY 2025-2026 tax slabs
 */
export default function calculateTaxBreakdown2025(taxableSalary, slabs) {
  return calculateSlabBreakdown(taxableSalary, slabs, 'slab-2025');
}

/**
 * Calculate investment rebate for FY 2025-2026
 * @param {number} totalRebateableInvestment - Total qualifying investments
 * @param {number} rebatePercentage - Applicable rebate percentage
 * @param {number} maxRebateableInvestment - Maximum rebateable investment limit
 * @returns {number} Investment rebate amount
 */
export function calculateInvestmentRebate2025(totalRebateableInvestment, rebatePercentage, maxRebateableInvestment) {
  const qualifyingInvestment = Math.min(totalRebateableInvestment, maxRebateableInvestment);
  return Math.round((qualifyingInvestment * rebatePercentage) / 100);
}

/**
 * Calculate final payable tax for FY 2025-2026
 */
export function calculateFinalTax2025(calculatedTax, minimumTax, totalTds, investmentRebate) {
  return calculateFinalTaxSummary(calculatedTax, minimumTax, totalTds, investmentRebate);
}
