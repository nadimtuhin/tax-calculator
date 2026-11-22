#!/usr/bin/env node
/**
 * Runs HigherOrderCO Bend slab batch in parallel (bend run-c) and compares
 * gross slab tax to the JS tax engine for the same taxable incomes.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calculateTaxForYear,
  calculateSlabBreakdown,
  sumSlabTax,
} from '../src/utils/taxEngine.js'
import { calculateTaxSlabs2026 } from '../src/utils/taxSlabs2026.js'
import { getTaxFreeThreshold2026 } from '../src/utils/taxSlabs2026.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const bendFile = path.join(root, '..', 'verify', 'slab_batch.bend')

/** Bend 0.2.x uses U24 ints; stay ≤ ~1.7M BDT in Bend (see .agent-run/stack.md). */
const TAXABLES = [0, 250000, 400000, 500000, 680000, 750000, 974000, 1252000, 1724000]
const JS_ONLY_HIGH = [2500000, 5000000]

function jsGrossSlabTax(taxable) {
  const threshold = getTaxFreeThreshold2026({ category: 'general', age: null, parentOfDisabled: false })
  const slabs = calculateTaxSlabs2026(threshold)
  const breakdown = calculateSlabBreakdown(taxable, slabs, 'slab-2026')
  return sumSlabTax(breakdown)
}

function runBend() {
  const env = { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:/usr/local/cargo/bin:${process.env.PATH || ''}` }
  let out = spawnSync('bend', ['run-c', bendFile], { encoding: 'utf8', env })
  if (out.status !== 0) {
    out = spawnSync('bend', ['run', bendFile], { encoding: 'utf8', env })
  }
  if (out.status !== 0) {
    console.error(out.stderr || out.stdout)
    process.exit(out.status || 1)
  }
  const m = out.stdout.match(/Result:\s*(\[[\d,\s]+\])/)
  if (!m) {
    console.error('Could not parse Bend output:\n' + out.stdout)
    process.exit(1)
  }
  return JSON.parse(m[1])
}

const bendTaxes = runBend()
let failed = 0
TAXABLES.forEach((taxable, i) => {
  const js = jsGrossSlabTax(taxable)
  const bend = bendTaxes[i]
  const ok = js === bend
  console.log(`${ok ? 'OK' : 'FAIL'} taxable=${taxable} js=${js} bend=${bend}`)
  if (!ok) failed += 1
})

// Full-engine spot check: salary-only annual incomes (exemption inside engine)
for (const annual of [500000, 1020000, 1461000]) {
  const r = calculateTaxForYear({
    year: '2026-27',
    income: { gross_salary: annual, period: 'annual' },
  })
  const slabOnly = jsGrossSlabTax(r.taxable_income_bdt)
  console.log(`engine taxable ${r.taxable_income_bdt} gross_tax ${r.gross_tax_bdt} slab-only ${slabOnly}`)
}

for (const taxable of JS_ONLY_HIGH) {
  const js = jsGrossSlabTax(taxable)
  console.log(`JS-only (above Bend U24 safe band) taxable=${taxable} gross_slab=${js}`)
}

if (failed) {
  console.error(`\n${failed} Bend slab mismatches (Bend program may need repair).`)
  process.exit(1)
}
console.log('\nBend batch verifier: all in-range slab cases match JS engine.')