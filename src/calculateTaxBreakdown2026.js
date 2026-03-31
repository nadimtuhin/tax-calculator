/**
 * Calculate tax breakdown for FY 2026-2027 tax slabs.
 * The slab structure for 2026-27 is identical to 2025-26
 * (same rates, no 5% bracket), so this mirrors calculateTaxBreakdown2025.js.
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
