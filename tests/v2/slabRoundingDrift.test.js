/**
 * Documents slab-cut rounding: engine float vs integer half-up (Bend verifier path).
 */
import { calculateSlabBreakdown } from '../../src/utils/taxEngine.js'
import { calculateTaxSlabs2026, getTaxFreeThreshold2026 } from '../../src/utils/taxSlabs2026.js'
const threshold = getTaxFreeThreshold2026({ category: 'general', age: null, parentOfDisabled: false })
const slabs = calculateTaxSlabs2026(threshold)

const engineSlabCut = (amount, rate) => Math.round((amount / 100) * rate)
const integerSlabCut = (amount, rate) => Math.round((amount * rate) / 100)

function integerGrossSlabTax(taxable) {
  const breakdown = calculateSlabBreakdown(taxable, slabs, 'slab-2026-int')
  let total = 0
  for (const row of breakdown) {
    if (row.slabAmount > 0 && row.slabPercentage > 0) {
      total += integerSlabCut(row.slabAmount, row.slabPercentage)
    }
  }
  return total
}

describe('slab rounding: engine float vs integer half-up (Bend)', () => {
  test('2,567 slice pairs differ in 0..1,800,000 taxables', () => {
    const special = new Set()
    for (let taxable = 0; taxable <= 1_800_000; taxable++) {
      const breakdown = calculateSlabBreakdown(taxable, slabs, 'drift')
      for (const row of breakdown) {
        const amount = row.slabAmount
        const rate = row.slabPercentage
        if (amount <= 0 || rate <= 0) continue
        if (engineSlabCut(amount, rate) !== integerSlabCut(amount, rate)) {
          special.add(`${amount}:${rate}`)
        }
      }
    }
    expect(special.size).toBe(2567)
  })

  test('taxable 700,410: engine 30,061 vs integer 30,062', () => {
    const taxable = 700_410
    let engineTotal = 0
    const breakdown = calculateSlabBreakdown(taxable, slabs, 'drift')
    for (const row of breakdown) {
      if (row.slabAmount > 0 && row.slabPercentage > 0) {
        engineTotal += engineSlabCut(row.slabAmount, row.slabPercentage)
      }
    }
    expect(engineTotal).toBe(30_061)
    expect(integerGrossSlabTax(taxable)).toBe(30_062)
  })
})