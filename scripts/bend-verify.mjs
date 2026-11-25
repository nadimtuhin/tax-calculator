#!/usr/bin/env node
/**
 * Runs HigherOrderCO Bend slab batch in parallel (bend run-c) and compares
 * gross slab tax to the JS tax engine for the same taxable incomes.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calculateTaxForYear,
  calculateSlabBreakdown,
  sumSlabTax,
} from '../src/utils/taxEngine.js'
import { calculateTaxSlabs2026, getTaxFreeThreshold2026 } from '../src/utils/taxSlabs2026.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const bendDir = path.join(root, '..', 'verify')
const bendExceptions = path.join(bendDir, 'js_slab_exceptions.bend')
const bendBatch = path.join(bendDir, 'slab_batch.bend')

/** Bend 0.2.x uses U24 ints — verify in-range only (see .agent-run/stack.md). */
const TAXABLES = [0, 250000, 400000, 400006, 500000, 680000, 700410, 750000, 974000, 1252000, 1724000]
const JS_ONLY_HIGH = [2500000, 5000000]

function bendOnPath() {
  const env = { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:/usr/local/cargo/bin:${process.env.PATH || ''}` }
  const which = spawnSync('which', ['bend'], { encoding: 'utf8', env })
  return which.status === 0
}

function jsGrossSlabTax(taxable) {
  const threshold = getTaxFreeThreshold2026({ category: 'general', age: null, parentOfDisabled: false })
  const slabs = calculateTaxSlabs2026(threshold)
  const breakdown = calculateSlabBreakdown(taxable, slabs, 'slab-2026')
  return sumSlabTax(breakdown)
}

function runBend() {
  if (!fs.existsSync(bendExceptions)) {
    throw new Error('Missing verify/js_slab_exceptions.bend — run: node scripts/gen-bend-slab-cut.mjs')
  }
  const bendSource = fs.readFileSync(bendExceptions, 'utf8') + '\n' + fs.readFileSync(bendBatch, 'utf8')
  const bendFile = path.join(bendDir, '.slab_batch_combined.bend')
  fs.writeFileSync(bendFile, bendSource)
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
  console.log('SKIP: bend not on PATH (install: cargo install hvm bend-lang)')
  process.exit(0)
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

let spotFailed = 0
for (const annual of [500000, 1020000, 1461000]) {
  const r = calculateTaxForYear({
    year: '2026-27',
    income: { gross_salary: annual, period: 'annual' },
  })
  const slabOnly = jsGrossSlabTax(r.taxable_income_bdt)
  const ok = r.gross_tax_bdt === slabOnly
  console.log(`${ok ? 'OK' : 'FAIL'} engine annual=${annual} taxable=${r.taxable_income_bdt} gross_tax=${r.gross_tax_bdt} slab-only=${slabOnly}`)
  if (!ok) spotFailed += 1
}

for (const taxable of JS_ONLY_HIGH) {
  const js = jsGrossSlabTax(taxable)
  console.log(`JS-only (excluded from Bend U24 batch): taxable=${taxable} gross_slab=${js}`)
}

if (failed || spotFailed) {
  console.error(`\n${failed} Bend slab mismatches; ${spotFailed} full-engine spot check failures.`)
  process.exit(1)
}
console.log(
  '\nBend batch verifier: all in-range slab cases match JS engine (js_slab_exceptions.bend emulates IEEE float slab cuts); spot checks passed.',
)