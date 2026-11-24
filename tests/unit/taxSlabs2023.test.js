import { calculateTaxSlabs2023 } from '@/utils/taxSlabs2023';
import {
  calculateTaxSlabsForYear,
  calculateTaxForYear,
  FISCAL_YEAR_METADATA,
} from '@/utils/taxEngine';

// ─── Sources ───────────────────────────────────────────────────────────────
// Deloitte Tax Highlights, Finance Bill 2024, p.18, "Existing" column (income year 2023-24):
//   https://ukpages.deloitte.com/rs/676-RGI-700/images/Tax-Highlights-Bangladesh-Finance-Bill-2024.pdf
//   up to 350,000 nil; 350,001-450,000 5%; 450,001-750,000 10%; 750,001-1,150,000 15%;
//   1,150,001-1,650,000 20%; above 1,650,000 25%. The 30% band arrived with Finance Act 2024.

describe('Tax Slabs FY 2023-24', () => {
  test('uses the Finance Act 2023 bands (no 30% band)', () => {
    const slabs = calculateTaxSlabsForYear('2023-24', 350000);
    expect(slabs.map(([, from, to, rate]) => [from, to, rate])).toEqual([
      [0, 350000, 0],
      [350000, 450000, 5],
      [450000, 750000, 10],
      [750000, 1150000, 15],
      [1150000, 1650000, 20],
      [1650000, Infinity, 25],
    ]);
  });

  test('labels the bands', () => {
    expect(calculateTaxSlabs2023(350000).map(([title]) => title)).toEqual([
      'First Tk3.5 lakh [0-3.5 lakh]',
      'Next Tk1 lakh [3.5-4.5 lakh]',
      'Next Tk3 lakh [4.5-7.5 lakh]',
      'Next Tk4 lakh [7.5-11.5 lakh]',
      'Next Tk5 lakh [11.5-16.5 lakh]',
      'Above [16.5-UP lakh]',
    ]);
  });

  test('gross tax on taxable BDT 10 lakh is 72,500', () => {
    // 1L @5% = 5,000 + 3L @10% = 30,000 + 2.5L @15% = 37,500
    const result = calculateTaxForYear({ year: '2023-24', taxable_income: 1000000 });
    expect(result.gross_tax_bdt).toBe(72500);
  });

  test('top rate is 25% on income above BDT 16.5 lakh', () => {
    const result = calculateTaxForYear({ year: '2023-24', taxable_income: 50000000 });
    const top = result.slab_breakdown[result.slab_breakdown.length - 1];
    expect(top.rate_percent).toBe(25);
  });

  test('metadata lists the six FY 2023-24 rates', () => {
    expect(FISCAL_YEAR_METADATA['2023-24'].slabRatesPercent).toEqual([0, 5, 10, 15, 20, 25]);
  });
});
