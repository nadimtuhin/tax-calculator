import { calculateSlabBreakdown, calculateFinalTaxSummary } from './utils/taxEngine.js';

/**
 * Calculate tax breakdown for FY 2026-2027 tax slabs.
 */
export default function calculateTaxBreakdown2026(taxableSalary, slabs) {
  return calculateSlabBreakdown(taxableSalary, slabs, 'slab-2026');
}

/**
 * Calculate final payable tax for FY 2026-2027.
 */
export function calculateFinalTax2026(calculatedTax, minimumTax, totalTds, investmentRebate) {
  return calculateFinalTaxSummary(calculatedTax, minimumTax, totalTds, investmentRebate);
}
