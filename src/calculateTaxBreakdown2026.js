import { calculateSlabBreakdown, calculateFinalTaxSummary } from './utils/taxEngine.js';

/**
 * Calculate tax breakdown for FY 2026-2027 tax slabs.
 */
export default function calculateTaxBreakdown2026(taxableSalary, slabs) {
  return calculateSlabBreakdown(taxableSalary, slabs, 'slab-2026');
}

/**
 * Calculate final payable tax for FY 2026-2027 (IT-11GA2023 Lines 12-16 order).
 */
export function calculateFinalTax2026(calculatedTax, minimumTax, totalTds, investmentRebate, options) {
  return calculateFinalTaxSummary(calculatedTax, minimumTax, totalTds, investmentRebate, options);
}
