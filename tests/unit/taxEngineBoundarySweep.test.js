/**
 * Boundary and golden cases for calculateTaxForYear, salvaged from the parity sweep that was
 * built for the (stopped) Go port. JS only: these lock the current engine output so a future
 * refactor or port has a fixed target.
 *
 * Two kinds of checks:
 *  1. Hand-verified golden cases. Each expected figure is worked out in the comment next to it
 *     from the statutory slab table, rebate formula and minimum tax that the engine already uses.
 *  2. A sweep over every year x category x dependent flag, at every slab boundary b and at
 *     b-100, b-1, b-0.5, b+0.5, b+1, b+100. The expected gross tax comes from the slab tables
 *     written out below (not from the engine's slab builder), cut per slice the same way the
 *     engine does: Math.round((amount / 100) * rate). That float form can differ from integer
 *     half-up by 1 taka on some slices; see tests/v2/slabRoundingDrift.test.js and the 700,410
 *     case below.
 *
 * No tax rule is introduced here. The tables restate src/utils/taxSlabs*.js and taxEngine.js.
 */
import { calculateTaxForYear } from '../../src/utils/taxEngine.js'

const LAKH = 100000

// Widths (taka) of each band above the tax-free threshold, the band rates, and the top rate.
const SLABS = {
  '2023-24': { widths: [1, 3, 4, 5].map((l) => l * LAKH), rates: [5, 10, 15, 20], top: 25 },
  '2024-25': { widths: [1, 4, 5, 5, 20].map((l) => l * LAKH), rates: [5, 10, 15, 20, 25], top: 30 },
  '2025-26': { widths: [3, 4, 5, 20].map((l) => l * LAKH), rates: [10, 15, 20, 25], top: 30 },
  '2026-27': { widths: [3, 4, 5, 20].map((l) => l * LAKH), rates: [10, 15, 20, 25], top: 30 },
}

const PRE_FA2026 = {
  general: 350000, female: 400000, senior: 400000, disabled: 475000, third_gender: 475000, freedom_fighter: 500000,
}
const FA2026 = {
  general: 400000, female: 450000, senior: 450000, disabled: 525000, third_gender: 525000, freedom_fighter: 550000,
}
const THRESHOLDS = { '2023-24': PRE_FA2026, '2024-25': PRE_FA2026, '2025-26': FA2026, '2026-27': FA2026 }
const PARENT_ALLOWANCE = 50000
const YEARS = Object.keys(SLABS)
const CATEGORIES = Object.keys(FA2026)

function referenceGrossTax(year, threshold, taxable) {
  const { widths, rates, top } = SLABS[year]
  let lower = threshold
  let total = 0
  const cut = (amount, rate) => Math.round((amount / 100) * rate)
  for (let i = 0; i < widths.length; i++) {
    const upper = lower + widths[i]
    if (taxable > lower) total += cut(Math.min(taxable, upper) - lower, rates[i])
    lower = upper
  }
  if (taxable > lower) total += cut(taxable - lower, top)
  return Math.round(total)
}

function boundaries(year, threshold) {
  const out = [threshold]
  let b = threshold
  for (const w of SLABS[year].widths) {
    b += w
    out.push(b)
  }
  return out
}

const run = (args) => calculateTaxForYear({ category: 'general', location: 'dhaka', ...args })

describe('slab boundary sweep: every year, category and dependent flag', () => {
  for (const year of YEARS) {
    for (const category of CATEGORIES) {
      for (const parent of [false, true]) {
        const threshold = THRESHOLDS[year][category] + (parent ? PARENT_ALLOWANCE : 0)
        test(`${year} ${category}${parent ? ' + disabled dependent' : ''} (threshold ${threshold})`, () => {
          const age = category === 'senior' ? 65 : null
          const first = run({ year, category, age, parent_of_disabled: parent, taxable_income: 1 })
          expect(first.tax_free_threshold_bdt).toBe(threshold)
          for (const b of boundaries(year, threshold)) {
            for (const delta of [-100, -1, -0.5, 0, 0.5, 1, 100]) {
              const taxable = b + delta
              const result = run({ year, category, age, parent_of_disabled: parent, taxable_income: taxable })
              expect({ taxable, gross: result.gross_tax_bdt }).toEqual({
                taxable,
                gross: referenceGrossTax(year, threshold, taxable),
              })
            }
          }
        })
      }
    }
  }
})

describe('hand-verified gross tax at the general slab boundaries', () => {
  // FY 2025-26 and FY 2026-27 share one table: 4L free, then 3L@10, 4L@15, 5L@20, 20L@25, rest 30.
  //   700,000: 300,000 x 10% = 30,000
  // 1,100,000: 30,000 + 400,000 x 15% = 90,000
  // 1,600,000: 90,000 + 500,000 x 20% = 190,000
  // 3,600,000: 190,000 + 2,000,000 x 25% = 690,000
  // 3,600,100: 690,000 + 100 x 30% = 690,030
  // FY 2024-25: 3.5L free, then 1L@5, 4L@10, 5L@15, 5L@20, 20L@25, rest 30.
  //   450,000: 5,000;  850,000: 5,000 + 40,000 = 45,000;  1,350,000: 45,000 + 75,000 = 120,000
  // 1,850,000: 120,000 + 100,000 = 220,000;  3,850,000: 220,000 + 500,000 = 720,000
  // FY 2023-24: 3.5L free, then 1L@5, 3L@10, 4L@15, 5L@20, rest 25.
  //   450,000: 5,000;  750,000: 35,000;  1,150,000: 95,000;  1,650,000: 195,000
  // 1,650,100: 195,000 + 100 x 25% = 195,025
  const cases = [
    ['2025-26', 400000, 0],
    ['2025-26', 699900, 29990],
    ['2025-26', 700000, 30000],
    ['2025-26', 700100, 30015],
    ['2025-26', 1100000, 90000],
    ['2025-26', 1600000, 190000],
    ['2025-26', 3600000, 690000],
    ['2025-26', 3600100, 690030],
    ['2026-27', 700000, 30000],
    ['2026-27', 1100000, 90000],
    ['2026-27', 1600000, 190000],
    ['2026-27', 3600000, 690000],
    ['2024-25', 450000, 5000],
    ['2024-25', 850000, 45000],
    ['2024-25', 1350000, 120000],
    ['2024-25', 1850000, 220000],
    ['2024-25', 3850000, 720000],
    ['2023-24', 450000, 5000],
    ['2023-24', 750000, 35000],
    ['2023-24', 1150000, 95000],
    ['2023-24', 1650000, 195000],
    ['2023-24', 1650100, 195025],
  ]
  test.each(cases)('%s taxable %d -> gross %d', (year, taxable, gross) => {
    expect(run({ year, taxable_income: taxable }).gross_tax_bdt).toBe(gross)
  })

  test('FY 2025-26 and FY 2026-27 stay separate options with the same general figures', () => {
    const a = run({ year: '2025-26', taxable_income: 1000000 })
    const b = run({ year: '2026-27', taxable_income: 1000000 })
    expect(a.fiscal_year).toBe('2025-26')
    expect(b.fiscal_year).toBe('2026-27')
    // 30,000 + 300,000 x 15% = 75,000
    expect(a.gross_tax_bdt).toBe(75000)
    expect(b.gross_tax_bdt).toBe(75000)
  })
})

describe('slab rounding drift: taxable 700,410', () => {
  // 10% band: 300,000 -> 30,000. 15% band: 410 taka. (410 / 100) * 15 = 61.49999999999999 in
  // floating point, so Math.round gives 61 (integer half-up of 6,150 / 100 = 61.5 would be 62).
  // The engine keeps the float form: gross 30,061. tests/v2/slabRoundingDrift.test.js documents
  // the integer (Bend) form, 30,062.
  test.each(['2025-26', '2026-27'])('%s general gross tax is 30,061', (year) => {
    const result = run({ year, taxable_income: 700410 })
    expect(result.slab_breakdown[2].taxable_amount_bdt).toBe(410)
    expect(result.slab_breakdown[2].tax_bdt).toBe(61)
    expect(result.gross_tax_bdt).toBe(30061)
  })
})

describe('investment rebate boundaries (hand-verified)', () => {
  // FY 2025-26: rebate = min(3% of taxable, 10% of eligible investment, 750,000), rounded.
  // Taxable 1,000,000: gross 75,000; 3% cap 30,000, met by investment 300,000.
  test.each([
    [299990, 29999, 45001],
    [299999, 30000, 45000], // 29,999.9 rounds to 30,000
    [300000, 30000, 45000],
    [300010, 30000, 45000], // 3% income cap binds
    [0, 0, 75000],
  ])('FY 2025-26 taxable 1,000,000, investment %d -> rebate %d, tax %d', (investments, rebate, tax) => {
    const r = run({ year: '2025-26', taxable_income: 1000000, investments })
    expect(r.gross_tax_bdt).toBe(75000)
    expect(r.rebate_bdt).toBe(rebate)
    expect(r.tax_after_rebate_bdt).toBe(tax)
  })

  test('FY 2026-27 statutory cap: 750,000 at taxable 2.5 crore', () => {
    // Gross: 690,000 + (25,000,000 - 3,600,000) x 30% = 7,110,000.
    // 3% of 2.5 crore = 750,000 = cap = 10% of 7,500,000.
    for (const investments of [7500000, 7500010, 20000000]) {
      const r = run({ year: '2026-27', taxable_income: 25000000, investments })
      expect(r.gross_tax_bdt).toBe(7110000)
      expect(r.rebate_bdt).toBe(750000)
      expect(r.total_tax_bdt).toBe(6360000)
    }
  })

  test('FY 2024-25 uses 15% of investment: taxable 1,000,000, investment 200,000', () => {
    // Gross: 45,000 + 150,000 x 15% = 67,500. Rebate min(30,000, 30,000, 1,000,000) = 30,000.
    const r = run({ year: '2024-25', taxable_income: 1000000, investments: 200000 })
    expect(r.gross_tax_bdt).toBe(67500)
    expect(r.rebate_bdt).toBe(30000)
    expect(r.total_tax_bdt).toBe(37500)
  })
})

describe('minimum tax boundaries (hand-verified)', () => {
  // FY 2025-26 general, Dhaka: minimum 5,000 (1,000 for a first-time filer), only above the threshold.
  test.each([
    [400000, false, 0, 0, false],
    [400001, false, 0, 5000, true],
    [400001, true, 0, 1000, true],
    [449990, false, 4999, 5000, true],
    [450000, false, 5000, 5000, false], // slab tax equals the minimum, floor not "applied"
    [450010, false, 5001, 5001, false],
  ])('FY 2025-26 taxable %d first-time %s -> gross %d, total %d, floor %s', (taxable, firstTime, gross, total, applied) => {
    const r = run({ year: '2025-26', taxable_income: taxable, first_time_filer: firstTime })
    expect(r.gross_tax_bdt).toBe(gross)
    expect(r.total_tax_bdt).toBe(total)
    expect(r.is_minimum_tax_applied).toBe(applied)
  })

  test.each([
    ['2024-25', 'district', 3000],
    ['2024-25', 'other_city', 4000],
    ['2024-25', 'chittagong', 5000],
    ['2023-24', 'district', 3000],
    ['2026-27', 'district', 5000],
  ])('%s %s minimum tax just above the threshold is %d', (year, location, minimum) => {
    const threshold = THRESHOLDS[year].general
    const r = run({ year, location, taxable_income: threshold + 1 })
    expect(r.total_tax_bdt).toBe(minimum)
    expect(r.is_minimum_tax_applied).toBe(true)
  })
})

describe('UI golden case', () => {
  test('FY 2025-26 general, basic 1,00,000/month -> 45,000 payable', () => {
    // Gross 1,200,000; exemption min(1/3 = 400,000, 500,000) = 400,000; taxable 800,000;
    // tax 30,000 + 100,000 x 15% = 45,000.
    const r = run({ year: '2025-26', income: { period: 'monthly', basic: 100000 } })
    expect(r.taxable_income_bdt).toBe(800000)
    expect(r.gross_tax_bdt).toBe(45000)
    expect(r.payable_tax_bdt).toBe(45000)
  })
})
