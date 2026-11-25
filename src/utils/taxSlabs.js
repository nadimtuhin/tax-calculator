const LAKH = 100000;

// Bangladesh Tax Slab Structure FY 2024-25 / AY 2025-26 (Finance Act 2024, amounts in lakh)
// Source: PwC "Navigating the complexity: Finance Act, 2024 Bangladesh" (Jul 2024), individual tax rates: https://www.pwc.com/jp/en/services/globalization/news/assets/pdf/bangladesh-finance-act-2024.pdf
const TAX_SLAB_AMOUNTS = [1, 4, 5, 5, 20]; // After threshold: 1L, 4L, 5L, 5L, 20L
const TAX_RATES = [0, 5, 10, 15, 20, 25, 30]; // 0% for threshold, then 5%, 10%, 15%, 20%, 25%, 30%

const formatLakh = (lakhs) => {
  return Number(lakhs.toFixed(2)).toString();
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
  // Keep every bound in taka. Dividing by 1 lakh and multiplying back drifts
  // by a fraction of a taka when the threshold is not an exact lakh value.
  const widthsBdt = [+taxFreeThreshold, ...TAX_SLAB_AMOUNTS.map((lakhs) => lakhs * LAKH)];

  let cumulative = 0;
  const slabs = [];

  widthsBdt.forEach((width, index) => {
    const from = cumulative;
    const to = cumulative + width;
    const slabType = index === 0 ? 'First' : 'Next';
    const description = `${slabType} Tk${formatLakh(width / LAKH)} lakh ${formatRange(from, to)}`;

    slabs.push([description, from, to, TAX_RATES[index]]);
    cumulative = to;
  });

  slabs.push([
    `Above ${formatRange(cumulative, Infinity)}`,
    cumulative,
    Infinity,
    TAX_RATES[TAX_RATES.length - 1]
  ]);

  return slabs;
}