const LAKH = 100000;

// Bangladesh Tax Slab Structure (amounts in lakh)
const TAX_SLAB_AMOUNTS = [1, 4, 5, 5, 20]; // After threshold: 1L, 4L, 5L, 5L, 20L
const TAX_RATES = [0, 5, 10, 15, 20, 25, 30]; // 0% for threshold, then 5%, 10%, etc.

const formatLakh = (lakhs) => {
  return lakhs === Math.floor(lakhs) ? `${lakhs}` : `${lakhs.toFixed(1)}`;
};

const formatRange = (from, to) => {
  const fromLakh = formatLakh(from / LAKH);
  const toLakh = to === Infinity ? 'UP' : formatLakh(to / LAKH);
  return `[${fromLakh}-${toLakh} lakh]`;
};

/**
 * Calculate tax slabs based on taxpayer's threshold
 * @param {number} taxFreeThreshold - Tax-free threshold in BDT
 * @returns {Array} Array of slab definitions [description, from, to, rate]
 */
export function calculateTaxSlabs(taxFreeThreshold) {
  const thresholdInLakh = taxFreeThreshold / LAKH;
  
  // Build all slab amounts including threshold
  const allSlabAmounts = [thresholdInLakh, ...TAX_SLAB_AMOUNTS];
  
  let cumulative = 0;
  const slabs = [];
  
  // Create each slab progressively
  allSlabAmounts.forEach((amount, index) => {
    const from = cumulative * LAKH;
    const to = (cumulative + amount) * LAKH;
    const slabType = index === 0 ? 'First' : 'Next';
    const description = `${slabType} Tk${formatLakh(amount)} lakh ${formatRange(from, to)}`;
    
    slabs.push([description, from, to, TAX_RATES[index]]);
    cumulative += amount;
  });
  
  // Add final "Above" slab
  const finalFrom = cumulative * LAKH;
  slabs.push([
    `Above ${formatRange(finalFrom, Infinity)}`,
    finalFrom,
    Infinity,
    TAX_RATES[TAX_RATES.length - 1]
  ]);
  
  return slabs;
}