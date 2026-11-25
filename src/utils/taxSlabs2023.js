const LAKH = 100000;

// Bangladesh Tax Slab Structure FY 2023-2024 (Finance Act 2023, amounts in lakh)
// After threshold: 1L @5%, 3L @10%, 4L @15%, 5L @20%, rest @25%. The 30% band arrived with Finance Act 2024.
// Source: Deloitte Tax Highlights, Finance Bill 2024, p.18 ("Existing" column):
//   https://ukpages.deloitte.com/rs/676-RGI-700/images/Tax-Highlights-Bangladesh-Finance-Bill-2024.pdf
const TAX_SLAB_AMOUNTS_2023 = [1, 3, 4, 5];
const TAX_RATES_2023 = [0, 5, 10, 15, 20, 25];

const formatLakh = (lakhs) => {
  return Number(lakhs.toFixed(2)).toString();
};

const formatRange = (from, to) => {
  const fromLakh = formatLakh(from / LAKH);
  const toLakh = to === Infinity ? 'UP' : formatLakh(to / LAKH);
  return `[${fromLakh}-${toLakh} lakh]`;
};

/**
 * Calculate tax slabs for FY 2023-2024 based on taxpayer's threshold
 * @param {number} taxFreeThreshold - Tax-free threshold in BDT for 2023-2024
 * @returns {Array} Array of slab definitions [description, from, to, rate]
 */
export function calculateTaxSlabs2023(taxFreeThreshold) {
  // Keep every bound in taka. Dividing by 1 lakh and multiplying back drifts
  // by a fraction of a taka when the threshold is not an exact lakh value.
  const widthsBdt = [+taxFreeThreshold, ...TAX_SLAB_AMOUNTS_2023.map((lakhs) => lakhs * LAKH)];

  let cumulative = 0;
  const slabs = [];

  widthsBdt.forEach((width, index) => {
    const from = cumulative;
    const to = cumulative + width;
    const slabType = index === 0 ? 'First' : 'Next';
    const description = `${slabType} Tk${formatLakh(width / LAKH)} lakh ${formatRange(from, to)}`;

    slabs.push([description, from, to, TAX_RATES_2023[index]]);
    cumulative = to;
  });

  slabs.push([
    `Above ${formatRange(cumulative, Infinity)}`,
    cumulative,
    Infinity,
    TAX_RATES_2023[TAX_RATES_2023.length - 1]
  ]);

  return slabs;
}
