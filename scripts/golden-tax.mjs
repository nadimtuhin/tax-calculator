// Golden snapshot of tax outputs. Run before and after build-tool changes and diff:
//   node scripts/golden-tax.mjs > /tmp/golden-before.json
import { register } from 'node:module';
import { createHash } from 'node:crypto';

// src/store uses extensionless relative imports (bundler style); resolve them for plain Node.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (e) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\\.[cm]?js$/.test(spec)) return next(spec + '.js', ctx);
    throw e;
  }
}`)
);

const engine = await import('../src/utils/taxEngine.js');
const { default: salaries } = await import('../src/store/salaries.js');
const { SUPPORTED_FISCAL_YEARS, TAXPAYER_CATEGORIES, LOCATIONS, TAX_FREE_THRESHOLDS_BY_YEAR, calculateTaxForYear } = engine;

// Deterministic PRNG so "random" incomes are stable across runs.
let seed = 0x5eed1234;
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);

const incomes = new Set([0, 1, 15000000]);
for (let i = 0; i <= 15000000; i += 50000) incomes.add(i);
const anchors = new Set();
for (const year of Object.values(TAX_FREE_THRESHOLDS_BY_YEAR)) for (const v of Object.values(year)) anchors.add(v);
for (const year of SUPPORTED_FISCAL_YEARS) {
  for (const cat of [...TAXPAYER_CATEGORIES, 'parent_disabled']) {
    const t = engine.getTaxFreeThresholdForYear(year, { category: cat });
    anchors.add(t);
    for (const [, lower, upper] of engine.calculateTaxSlabsForYear(year, t)) {
      anchors.add(lower);
      if (Number.isFinite(upper)) anchors.add(upper);
    }
  }
}
for (const a of anchors) for (const d of [-1000, -1, 0, 1, 1000]) if (a + d >= 0 && a + d <= 15000000) incomes.add(a + d);
for (let i = 0; i < 300; i++) incomes.add(Math.floor(rand() * 15000000));
const incomeList = [...incomes].sort((a, b) => a - b);

const investmentsList = [0, 50000, 250000, 1000000];
const safe = (fn) => { try { return fn(); } catch (e) { return { error: e.message }; } };

const engineOut = [];
for (const year of SUPPORTED_FISCAL_YEARS)
  for (const category of engine.ALL_ACCEPTED_CATEGORIES)
    for (const first_time_filer of [false, true])
      for (const location of LOCATIONS)
        for (const investments of investmentsList)
          for (const taxable_income of incomeList) {
            const r = safe(() => calculateTaxForYear({ year, category, location, first_time_filer, investments, taxable_income }));
            const digest = createHash('sha256').update(JSON.stringify(r)).digest('hex').slice(0, 16);
            engineOut.push([year, category, first_time_filer, location, investments, taxable_income, digest]);
          }

// Store getters, evaluated lazily over a fresh state.
function evalGetters(state) {
  const cache = {};
  const getters = new Proxy({}, { get: (_, k) => (k in cache ? cache[k] : (cache[k] = salaries.getters[k](state, getters))) });
  const out = {};
  for (const k of Object.keys(salaries.getters)) out[k] = safe(() => getters[k]);
  return out;
}
const storeOut = [];
const monthly = [0, 20000, 41667, 60000, 100000, 250000, 1000000];
for (const year of SUPPORTED_FISCAL_YEARS)
  for (const category of TAXPAYER_CATEGORIES)
    for (const firstTimeFiler of [false, true])
      for (const location of LOCATIONS)
        for (const inv of [0, 100000])
          for (const m of monthly) {
            const state = salaries.state();
            state.currentYear = year;
            salaries.mutations.updateTaxpayerProfile(state, { category, location, firstTimeFiler });
            salaries.mutations.changeSubsequentSalaries(state, { index: 0, value: m });
            salaries.mutations.changeBonus(state, m);
            salaries.mutations.changeInvestment(state, { index: 0, value: inv });
            storeOut.push({ key: [year, category, firstTimeFiler, location, inv, m], getters: evalGetters(state) });
          }

const result = { engineSample: calculateTaxForYear({ year: '2026-27', taxable_income: 1234567 }), engineOut, storeOut };
process.stdout.write(JSON.stringify(result, (_, v) => (v === Infinity ? 'Infinity' : v)));
process.stdout.write('\n');
