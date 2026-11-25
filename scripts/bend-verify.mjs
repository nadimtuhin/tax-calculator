#!/usr/bin/env node
/**
 * Runs HigherOrderCO Bend slab batch in parallel (bend run-c) and compares
 * gross slab tax to the same integer half-up slice formula in JS:
 *   Math.round((amount * rate) / 100)  ≡  ((amount * rate) + 50) / 100 in Bend
 *
 * The production tax engine uses Math.round((amount/100)*rate), which differs from
 * integer half-up at 2,567 (amount, rate) slice pairs across taxables 0..1_800_000
 * (e.g. taxable 700,410 → engine 30,061 vs integer 30,062). This harness does NOT
 * compare Bend to the engine float form; see tests/v2/slabRoundingDrift.test.js.
 *
 * CI does not install bend-lang; this script exits 0 with SKIP when bend is missing.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { calculateTaxForYear, calculateSlabBreakdown, sumSlabTax } from '../src/utils/taxEngine.js'
import { calculateTaxSlabs2026, getTaxFreeThreshold2026 } from '../src/utils/taxSlabs2026.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const bendFile = path.join(root, '..', 'verify', 'slab_batch.bend')

/** Bend 0.2.x uses U24 ints — verify in-range only (see .agent-run/stack.md). */
const TAXABLES = [0, 250000, 400000, 400006, 500000, 680000, 700410, 750000, 974000, 1252000, 1724000]
const JS_ONLY_HIGH = [2500000, 5000000]

export function integerSlabCut(amount, rate) {
  return Math.round((amount * rate) / 100)
}

export function integerGrossSlabTax(taxable) {
  const threshold = getTaxFreeThreshold2026({ category: 'general', age: null, parentOfDisabled: false })
  const slabs = calculateTaxSlabs2026(threshold)
  const breakdown = calculateSlabBreakdown(taxable, slabs, 'slab-2026-int')
  let total = 0
  for (const row of breakdown) {
    if (row.slabAmount > 0 && row.slabPercentage > 0) {
      total += integerSlabCut(row.slabAmount, row.slabPercentage)
    }
  }
  return total
}

function engineGrossSlabTax(taxable) {
  const threshold = getTaxFreeThreshold2026({ category: 'general', age: null, parentOfDisabled: false })
  const slabs = calculateTaxSlabs2026(threshold)
  const breakdown = calculateSlabBreakdown(taxable, slabs, 'slab-2026')
  return sumSlabTax(breakdown)
}

function bendOnPath() {
  const env = { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:/usr/local/cargo/bin:${process.env.PATH || ''}` }
  const which = spawnSync('which', ['bend'], { encoding: 'utf8', env })
  return which.status === 0
}

function runBend() {
  const env = { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:/usr/local/cargo/bin:${process.env.PATH || ''}` }
  let out = spawnSync('bend', ['run-c', bendFile], { encoding: 'utf8', env })
  if (out.status !== 0) {
    out = spawnSync('bend', ['run', bendFile], { encoding: 'utf8', env })
  }
  if (out.status !== 0) {
    throw new Error(out.stderr || out.stdout || 'bend failed')
  }
  const m = out.stdout.match(/Result:\s*(\[[\d,\s]+\])/)
  if (!m) throw new Error('Could not parse Bend output:\n' + out.stdout)
  return JSON.parse(m[1])
}

if (!bendOnPath()) {
  console.log('SKIP: bend not on PATH (install: cargo install hvm bend-lang). CI does not install bend; this step always skips on GitHub Actions.')
  process.exit(0)
}

const bendTaxes = runBend()
let failed = 0
TAXABLES.forEach((taxable, i) => {
  const integerJs = integerGrossSlabTax(taxable)
  const bend = bendTaxes[i]
  const ok = integerJs === bend
  console.log(`${ok ? 'OK' : 'FAIL'} taxable=${taxable} integer_js=${integerJs} bend=${bend}`)
  if (!ok) failed += 1
})

let spotFailed = 0
for (const annual of [500000, 1020000, 1461000]) {
  const r = calculateTaxForYear({
    year: '2026-27',
    income: { gross_salary: annual, period: 'annual' },
  })
  const slabOnly = engineGrossSlabTax(r.taxable_income_bdt)
  const ok = r.gross_tax_bdt === slabOnly
  console.log(`${ok ? 'OK' : 'FAIL'} engine annual=${annual} taxable=${r.taxable_income_bdt} gross_tax=${r.gross_tax_bdt} engine-slab=${slabOnly}`)
  if (!ok) spotFailed += 1
}

for (const taxable of JS_ONLY_HIGH) {
  console.log(`JS-only (excluded from Bend U24 batch): taxable=${taxable} integer=${integerGrossSlabTax(taxable)} engine=${engineGrossSlabTax(taxable)}`)
}

if (failed || spotFailed) {
  console.error(`\n${failed} Bend vs integer-JS mismatches; ${spotFailed} engine spot check failures.`)
  process.exit(1)
}
console.log('\nBend batch verifier: Bend matches integer half-up JS; engine float spot checks passed.')