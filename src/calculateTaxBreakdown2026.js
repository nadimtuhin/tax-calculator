/**
 * Calculate tax breakdown for FY 2026-2027 tax slabs.
 * Mirrors calculateTaxBreakdown2025 structure but tagged with 2026.
 */
export default function calculateTaxBreakdown2026(taxableSalary, slabs) {
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
    const id = `slab-2026-${index}-${slabLower}-${slabUpper}-${slabPercentage}`;

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
 * Calculate final payable tax for FY 2026-2027.
 * @param {number} calculatedTax - Tax from slabs
 * @param {number} minimumTax - Minimum tax amount
 * @param {number} totalTds - TDS paid
 * @param {number} investmentRebate - Investment rebate
 * @returns {Object}
 */
export function calculateFinalTax2026(calculatedTax, minimumTax, totalTds, investmentRebate) {
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
