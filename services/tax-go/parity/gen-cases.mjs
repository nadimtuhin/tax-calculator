// Replays a broad set of inputs through the real JS tax engine and writes the expected outputs
// for the Go parity test (parity_test.go). Output is JSON Lines; special JS values are tagged as
// {"$js": "undefined" | "NaN" | "Infinity" | "-Infinity" | "-0"} so nothing is lost in JSON.
//
//   node services/tax-go/parity/gen-cases.mjs [out.jsonl]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../../../src/utils/taxEngine.js';
import { TEST_INPUTS } from './test-inputs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? path.join(here, 'testdata', 'cases.jsonl');

const YEARS = engine.SUPPORTED_FISCAL_YEARS;
const CATEGORIES = engine.ALL_ACCEPTED_CATEGORIES;
const LOCATIONS = engine.LOCATIONS;
const FUNCS = {
  listSupportedYears: () => engine.listSupportedYears(),
  getRulesForYear: (a) => engine.getRulesForYear(a),
  calculateTaxForYear: (a) => engine.calculateTaxForYear(a),
  compareTaxYears: (a) => engine.compareTaxYears(a),
};

function tag(v) {
  if (v === undefined) return { $js: 'undefined' };
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $js: 'NaN' };
    if (v === Infinity) return { $js: 'Infinity' };
    if (v === -Infinity) return { $js: '-Infinity' };
    if (Object.is(v, -0)) return { $js: '-0' };
    return v;
  }
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(tag);
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = tag(v[k]);
    return o;
  }
  throw new Error(`cannot tag ${typeof v}`);
}

// Deterministic PRNG (mulberry32) so random cases are identical on every run.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261126);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const randInt = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const cases = [];
const add = (fn, args, source) => cases.push({ fn, args, source });

// 1. Every input recorded from the existing JS tests.
for (const t of TEST_INPUTS) add(t.fn, t.args, t.source);

// 2. Rules for every year x category x age x dependent flag.
const AGES = [undefined, null, 0, 30, 64, 65, 66, 150];
const PARENT = [undefined, false, true, 0, 1, 2, 3, 2.7, -1, '2', 'x', null];
add('listSupportedYears', undefined, 'list');
for (const year of [...YEARS, undefined]) {
  for (const category of [...CATEGORIES, undefined]) {
    for (const age of AGES) {
      for (const parent of [undefined, false, true, 2]) {
        add('getRulesForYear', { year, category, age, parent_of_disabled: parent }, 'rules-grid');
      }
    }
  }
}

// 3. Profile grid: every year x category x location x first-time filer, incomes dense around
//    every slab boundary of that profile (exact, +-0.5, +-1) plus a coarse sweep to 2 crore.
const SWEEP = [];
for (let x = 0; x <= 20_000_000; x += 250_000) SWEEP.push(x);
for (const year of YEARS) {
  for (const category of CATEGORIES) {
    for (const location of LOCATIONS) {
      for (const first_time_filer of [false, true]) {
        const profile = { year, category, location, first_time_filer };
        const rules = engine.getRulesForYear({ year, category });
        const bounds = new Set();
        for (const s of rules.slabs) {
          for (const b of [s.lower_bdt, s.upper_bdt]) {
            if (b === null) continue;
            for (const d of [-1, -0.5, 0, 0.5, 1]) bounds.add(b + d);
          }
        }
        for (const t of [...bounds].filter((t) => t >= 0)) {
          add('calculateTaxForYear', { ...profile, taxable_income: t }, 'boundary');
        }
        for (const t of SWEEP) add('calculateTaxForYear', { ...profile, taxable_income: t }, 'sweep');
      }
    }
  }
}

// 4. Dense sweep for the default profile of each year.
for (const year of YEARS) {
  for (let x = 0; x <= 20_000_000; x += 20_000) add('calculateTaxForYear', { year, taxable_income: x }, 'dense');
}

// 5. Age / dependent / auto-promotion grid around the thresholds.
for (const year of YEARS) {
  for (const category of CATEGORIES) {
    for (const age of AGES) {
      for (const parent of PARENT) {
        for (const taxable_income of [0, 350_000, 375_000, 400_000, 425_000, 475_000, 525_000, 1_000_000]) {
          add('calculateTaxForYear', { year, category, age, parent_of_disabled: parent, taxable_income }, 'age-dependent');
        }
      }
    }
  }
}

// 6. Salary inputs: gross (monthly/annual, split or not, exemption on/off) and components,
//    including the exemption cap boundary (gross / 3 = cap).
const GROSS = [0, 1, 2, 3, 100_000, 300_000, 1_349_999, 1_350_000, 1_350_001, 1_500_000, 1_499_999.5, 2_000_000, 12_345_678.9];
for (const year of YEARS) {
  for (const period of [undefined, 'annual', 'monthly']) {
    for (const g of GROSS) {
      const gross_salary = period === 'monthly' ? g / 12 : g;
      for (const use_standard_breakdown of [undefined, true, false]) {
        for (const apply_exemption of [undefined, false, true]) {
          add('calculateTaxForYear', { year, income: { period, gross_salary, use_standard_breakdown, apply_exemption, bonus: g > 0 ? 50_000 : undefined } }, 'gross');
        }
      }
    }
  }
  add('calculateTaxForYear', { year, income: { period: 'monthly', basic: 100_000 } }, 'brief-example');
  for (let i = 0; i < 40; i++) {
    const income = { period: pick([undefined, 'annual', 'monthly']) };
    for (const k of ['basic', 'house', 'medical', 'transport', 'lfa', 'employer_rpf', 'others', 'bonus', 'bonus2', 'additional_income']) {
      if (rand() < 0.6) income[k] = randInt(0, 200_000) + pick([0, 0, 0.5, 0.25]);
    }
    if (rand() < 0.2) income.apply_exemption = false;
    add('calculateTaxForYear', { year, income }, 'components');
  }
}

// 7. Investments and rebates: number, total, itemized (with life insurance cap), at incomes
//    where each rebate term binds (3% of base, 10% of investment, the 750,000 cap).
const INCOMES = [0, 400_000, 1_000_000, 3_000_000, 10_000_000, 25_000_000, 25_000_001, 30_000_000];
for (const year of YEARS) {
  for (const taxable_income of INCOMES) {
    for (const inv of [0, 1, 100_000, 300_000, 0.3 * taxable_income, 0.3 * taxable_income + 1, 1_000_000, 7_500_000, 9_000_000]) {
      add('calculateTaxForYear', { year, taxable_income, investments: inv, tds: 0 }, 'rebate-number');
      add('calculateTaxForYear', { year, taxable_income, investments: { total: inv } }, 'rebate-total');
    }
    for (let i = 0; i < 6; i++) {
      const investments = {};
      for (const k of ['dps', 'savings_certificate', 'mutual_fund', 'stocks', 'others', 'philanthropic_donation', 'unknown_key']) {
        if (rand() < 0.5) investments[k] = randInt(0, 800_000);
      }
      if (rand() < 0.5) {
        investments.life_insurance = randInt(1, 300_000);
        investments.life_insurance_policy_value = randInt(0, 3_000_000);
      }
      add('calculateTaxForYear', { year, taxable_income, investments, tds: randInt(0, 200_000) }, 'rebate-itemized');
    }
  }
}

// 8. Seeded random cases across every input shape.
for (let i = 0; i < 4000; i++) {
  const args = {
    year: pick([...YEARS, undefined, 'FY 2025-26', '2025-2026', '2024/25', 'fiscal year 2023–24']),
    category: pick([...CATEGORIES, undefined]),
    age: pick([undefined, null, randInt(0, 100)]),
    parent_of_disabled: pick([undefined, false, true, randInt(0, 3)]),
    location: pick([...LOCATIONS, undefined]),
    first_time_filer: pick([undefined, false, true]),
    tds: pick([undefined, 0, randInt(0, 500_000)]),
  };
  const mode = randInt(0, 2);
  const income = randInt(0, 20_000_000) + pick([0, 0, 0.5]);
  if (mode === 0) args.taxable_income = income;
  else if (mode === 1) args.income = { period: pick(['annual', 'monthly']), gross_salary: pick([income, income / 12]), use_standard_breakdown: pick([undefined, true]) };
  else args.income = { basic: Math.round(income * 0.6), house: Math.round(income * 0.3), bonus: randInt(0, 300_000) };
  args.investments = pick([undefined, 0, randInt(0, 2_000_000), { total: randInt(0, 2_000_000) }, { dps: randInt(0, 200_000), savings_certificate: randInt(0, 900_000) }]);
  add('calculateTaxForYear', args, 'random');
  if (i % 8 === 0) {
    const { year, ...rest } = args;
    add('compareTaxYears', { ...rest, from_year: pick([...YEARS, undefined]), to_year: pick([...YEARS, undefined]) }, 'random-compare');
  }
}

// 9. Errors and edge inputs: every validation branch, odd year spellings, prototype keys.
const ODD_YEARS = [
  '', ' ', null, '2025-26', ' 2025-26 ', '2025-2026', '25-26', '2025/26', '2025–26', '2025—26', 'FY2025-26', 'fy: 2025-26',
  'Fiscal Year 2025-26', 'income year=2025-26', 'IY 2025-26', 'AY 2026-27', 'ay2026-27', 'Assessment Year 2026-27',
  'assessmentyear 2026', 'aye 2025-26', '2027-28', '2022-23', 'nonsense', 2025, 2025.26, true, ['2025-26'], {},
  'constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', 'FY constructor', 'ſy 2025-26', ' 2025-26　',
  '2025 - 26', 'FY-2025-26', 'fy=2025-26',
];
for (const year of ODD_YEARS) {
  add('calculateTaxForYear', { year, taxable_income: 1_000_000 }, 'odd-year');
  add('getRulesForYear', { year }, 'odd-year');
  add('compareTaxYears', { from_year: year, taxable_income: 1_000_000 }, 'odd-year');
  add('compareTaxYears', { to_year: year, taxable_income: 1_000_000 }, 'odd-year');
}
const BAD = [
  { taxable_income: 1_000_000, category: 'student' },
  { taxable_income: 1_000_000, category: null },
  { taxable_income: 1_000_000, category: 5 },
  { taxable_income: 1_000_000, location: 'sylhet' },
  { taxable_income: 1_000_000, location: null },
  { taxable_income: 1_000_000, age: -1 },
  { taxable_income: 1_000_000, age: 151 },
  { taxable_income: 1_000_000, age: 30.5 },
  { taxable_income: 1_000_000, age: '30' },
  { taxable_income: 1_000_000, age: NaN },
  { taxable_income: 1_000_000, first_time_filer: 'yes' },
  { taxable_income: 1_000_000, first_time_filer: 0 },
  { taxable_income: -1 },
  { taxable_income: '1000' },
  { taxable_income: NaN },
  { taxable_income: Infinity },
  { taxable_income: 9007199254740991 },
  { taxable_income: 9007199254740992 },
  { taxable_income: 1e300 },
  { taxable_income: -0 },
  { taxable_income: null },
  {},
  { taxable_income: 1, income: { basic: 1 } },
  { income: null },
  { income: 5 },
  { income: 'x' },
  { income: [] },
  { income: {} },
  { income: { period: 'weekly', basic: 1 } },
  { income: { period: '', basic: 1 } },
  { income: { gross_salary: 1, basic: 1 } },
  { income: { gross_salary: null, basic: null, bonus: 1 } },
  { income: { bonus: null } },
  { income: { bonus2: 0 } },
  { income: { additional_income: 1 } },
  { income: { gross_salary: -1 } },
  { income: { gross_salary: '1' } },
  { income: { gross_salary: 9007199254740991, period: 'monthly' } },
  { income: { gross_salary: 9007199254740990, bonus: 9 } },
  { income: { basic: -5 } },
  { income: { basic: 1, bonus: -5 } },
  { income: { basic: 9007199254740991, house: 9007199254740991 } },
  { income: { basic: 1e15, period: 'monthly' } },
  { taxable_income: 1_000_000, tds: -1 },
  { taxable_income: 1_000_000, tds: '5' },
  { taxable_income: 1_000_000, tds: null },
  { taxable_income: 1_000_000, tds: 9007199254740991, investments: 9007199254740991 },
  { taxable_income: 1_000_000, tds: 2_000_000 },
  { taxable_income: 1_000_000, investments: -1 },
  { taxable_income: 1_000_000, investments: '5' },
  { taxable_income: 1_000_000, investments: true },
  { taxable_income: 1_000_000, investments: [] },
  { taxable_income: 1_000_000, investments: null },
  { taxable_income: 1_000_000, investments: {} },
  { taxable_income: 1_000_000, investments: { total: 5, dps: 1 } },
  { taxable_income: 1_000_000, investments: { total: -5 } },
  { taxable_income: 1_000_000, investments: { total: null, dps: 5 } },
  { taxable_income: 1_000_000, investments: { dps: 5, apply_instrument_caps: false } },
  { taxable_income: 1_000_000, investments: { dps: 5, apply_instrument_caps: true } },
  { taxable_income: 1_000_000, investments: { life_insurance: 5 } },
  { taxable_income: 1_000_000, investments: { life_insurance: 0, life_insurance_policy_value: 100 } },
  { taxable_income: 1_000_000, investments: { life_insurance: 5, life_insurance_policy_value: -1 } },
  { taxable_income: 1_000_000, investments: { life_insurance: 500_000, life_insurance_policy_value: 15 } },
  { taxable_income: 1_000_000, investments: { dps: '5' } },
  { taxable_income: 1_000_000, investments: { dps: 9007199254740991, stocks: 9007199254740991 } },
];
for (const year of YEARS) {
  for (const b of BAD) {
    add('calculateTaxForYear', { year, ...b }, 'bad-input');
    if (year === '2025-26') add('compareTaxYears', b, 'bad-input');
  }
}
for (const fn of ['getRulesForYear', 'calculateTaxForYear', 'compareTaxYears']) {
  for (const args of [undefined, null, 5, 'x', [], true]) add(fn, args, 'bad-args');
}

// 10. Default fiscal year resolution across dates (UTC midnight, on both sides of 1 July).
const dateCases = [];
for (let y = 2020; y <= 2031; y++) {
  for (const md of ['01-01', '06-30', '07-01', '12-31']) dateCases.push(Date.parse(`${y}-${md}T00:00:00Z`));
}

function run(c) {
  try {
    return { out: tag(FUNCS[c.fn](c.args)) };
  } catch (err) {
    return { error: { name: err.name, message: err.message } };
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const fd = fs.openSync(outPath, 'w');
const meta = {
  default_year: engine.DEFAULT_FISCAL_YEAR,
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  cases: cases.length,
  dates: dateCases.map((ms) => ({ ms, out: engine.resolveDefaultFiscalYear(new Date(ms), YEARS) })),
};
fs.writeSync(fd, JSON.stringify({ meta }) + '\n');
for (const c of cases) {
  fs.writeSync(fd, JSON.stringify({ fn: c.fn, source: c.source, args: tag(c.args), ...run(c) }) + '\n');
}
fs.closeSync(fd);
console.log(`wrote ${cases.length} cases to ${outPath}`);
