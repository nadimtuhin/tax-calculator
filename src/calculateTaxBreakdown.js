export default function calculateTaxBreakdown(taxableSalary, slabs) {
  function getPercentage(num, per) {
    return (num / 100) * per;
  }

  const breakdown = slabs.map(slab => {
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

    return {
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
