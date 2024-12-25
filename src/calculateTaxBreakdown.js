export default function calculateTaxBreakdown(taxableSalary, slabs) {
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
    const id = `slab-${index}-${slabLower}-${slabUpper}-${slabPercentage}`;

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
