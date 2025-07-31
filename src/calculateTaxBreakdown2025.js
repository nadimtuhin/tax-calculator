/**
 * Calculate tax breakdown for FY 2025-2026 tax slabs
 * This is identical to the existing calculateTaxBreakdown.js but kept separate
 * to maintain non-breaking compatibility and allow for future customizations
 */
export default function calculateTaxBreakdown2025(taxableSalary, slabs) {
  function getPercentage(num, per) {
    return (num / 100) * per;
  }

  const breakdown = slabs.map((slab, index) => {
    const slabTitle = slab[0];
    const slabUpper = slab[2];
    const slabLower = slab[1];
    const slabPercentage = slab[3];
    let slabCut = 0;
    let slabAmount = 0;

    if (taxableSalary >= slabLower && taxableSalary <= slabUpper) {
      slabAmount = taxableSalary - slabLower;
    } else if (taxableSalary >= slabLower && taxableSalary >= slabUpper) {
      slabAmount = slabUpper - slabLower;
    }

    slabCut = Math.round(getPercentage(slabAmount, slabPercentage));
    const id = `slab-2025-${index}-${slabLower}-${slabUpper}-${slabPercentage}`;

    return {
      id,
      slabTitle,
      slabUpper,
      slabLower,
      slabPercentage,
      slabAmount,
      slabCut
    };
  });

  return breakdown;
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
 * @param {number} calculatedTax - Tax calculated from slabs
 * @param {number} minimumTax - Minimum tax amount
 * @param {number} totalTds - Total TDS paid
 * @param {number} investmentRebate - Investment rebate amount
 * @returns {Object} Final tax calculation details
 */
export function calculateFinalTax2025(calculatedTax, minimumTax, totalTds, investmentRebate) {
  const totalTax = Math.max(calculatedTax, minimumTax);
  const isMinimumTaxApplied = calculatedTax < minimumTax;
  const payable = Math.max(0, totalTax - totalTds - investmentRebate);
  
  return {
    totalTax,
    isMinimumTaxApplied,
    minimumTaxAmount: minimumTax,
    payable,
    totalTds,
    investmentRebate
  };
}