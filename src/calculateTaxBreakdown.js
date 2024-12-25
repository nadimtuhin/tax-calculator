export default function calculateTaxBreakdown(taxableSalary, slabs) {
  // Ensure taxableSalary is a positive number
  taxableSalary = Math.max(0, Number(taxableSalary) || 0);

  function getPercentage(num, per) {
    // Ensure both inputs are numbers and handle edge cases
    num = Number(num) || 0;
    per = Number(per) || 0;
    return Math.max(0, (num / 100) * per);
  }

  const breakdown = slabs.map((slab, index) => {
    const slabTitle = slab[0];
    const slabUpper = Number(slab[2]) || 0;
    const slabLower = Number(slab[1]) || 0;
    const slabPercentage = Number(slab[3]) || 0;
    let slabCut = 0;
    let slabAmount = 0;

    // Handle edge cases for slab calculations
    if (taxableSalary >= slabLower && taxableSalary <= slabUpper) {
      slabAmount = Math.max(0, taxableSalary - slabLower);
    } else if (taxableSalary >= slabLower && taxableSalary >= slabUpper) {
      slabAmount = Math.max(0, slabUpper - slabLower);
    }

    // Round to nearest integer to avoid floating point issues
    slabCut = Math.round(getPercentage(slabAmount, slabPercentage));
    const id = `slab-${index}-${slabLower}-${slabUpper}-${slabPercentage}`;

    return {
      id,
      slabTitle,
      slabUpper,
      slabLower,
      slabPercentage,
      slabAmount: Math.round(slabAmount),
      slabCut
    };
  });

  return breakdown;
}
