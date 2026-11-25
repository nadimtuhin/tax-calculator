// Records request/response pairs from the JS remote MCP handler (packages/mcp/src/remote.js).
// mcp_test.go replays each request against the Go handler and compares status, headers and messages.
// Usage: node services/tax-go/parity/gen-mcp.mjs [out.jsonl]   (needs `npm --prefix packages/mcp ci`)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRemoteHandler } from '../../../packages/mcp/src/remote.js';
import { SUPPORTED_FISCAL_YEARS, ALL_ACCEPTED_CATEGORIES, LOCATIONS } from '../../../packages/mcp/src/engine.js';
import { TEST_INPUTS } from './test-inputs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? path.join(here, 'testdata', 'mcp.jsonl');

const ACCEPT = 'application/json, text/event-stream';
const JSON_HEADERS = { 'content-type': 'application/json', accept: ACCEPT };
const KEPT_HEADERS = [
  'content-type',
  'cache-control',
  'connection',
  'x-accel-buffering',
  'allow',
  'retry-after',
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'access-control-max-age',
];

const cases = [];
// limit: per-handler rate limit; the request is sent `repeat` times and only the last response is kept.
const add = (source, req, { limit = 1e9, repeat = 1 } = {}) => cases.push({ source, req, limit, repeat });
const post = (source, body, headers = JSON_HEADERS, opts) =>
  add(source, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }, opts);
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) });
const call = (source, name, args) => post(source, rpc('tools/call', { name, arguments: args }));
const callRaw = (source, name, argsJSON) =>
  post(source, `{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":${JSON.stringify(name)},"arguments":${argsJSON}}}`);

// --- HTTP layer (remote.js + SDK transport) ---
add('options', { method: 'OPTIONS', headers: {} });
add('get', { method: 'GET', headers: { accept: ACCEPT } });
add('delete', { method: 'DELETE', headers: {} });
add('put', { method: 'PUT', headers: JSON_HEADERS, body: '{}' });
post('content-type-text', rpc('ping'), { 'content-type': 'text/plain', accept: ACCEPT });
post('content-type-missing', rpc('ping'), { accept: ACCEPT });
post('content-type-charset', rpc('ping'), { 'content-type': 'application/json; charset=utf-8', accept: ACCEPT });
post('accept-json-only', rpc('ping'), { 'content-type': 'application/json', accept: 'application/json' });
post('accept-sse-only', rpc('ping'), { 'content-type': 'application/json', accept: 'text/event-stream' });
post('accept-missing', rpc('ping'), { 'content-type': 'application/json' });
post('accept-wildcard', rpc('ping'), { 'content-type': 'application/json', accept: '*/*' });
post('bad-json', '{"jsonrpc":');
post('bad-json-empty', '');
post('bad-json-accept', '{', { 'content-type': 'application/json', accept: 'application/json' });
post('too-large', JSON.stringify({ ...rpc('ping'), params: { pad: 'x'.repeat(262144) } }));
post('rate-limited', rpc('ping'), JSON_HEADERS, { limit: 2, repeat: 3 });
post('rate-limited-xff', rpc('ping'), { ...JSON_HEADERS, 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, { limit: 1, repeat: 2 });

// --- JSON-RPC shape ---
for (const body of [
  '[]',
  '5',
  'null',
  '"x"',
  '{}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","params":null}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","params":[]}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","params":5}',
  '{"jsonrpc":"2.0","id":null,"method":"ping"}',
  '{"jsonrpc":"1.0","id":1,"method":"ping"}',
  '{"id":1,"method":"ping"}',
  '{"jsonrpc":"2.0","id":1}',
  '{"jsonrpc":"2.0","id":1,"method":5}',
  '{"jsonrpc":"2.0","id":1.5,"method":"ping"}',
  '{"jsonrpc":"2.0","id":true,"method":"ping"}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","params":{"_meta":5}}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","params":{}}',
  '{"jsonrpc":"2.0","id":1,"method":"ping","extra":1}',
  '{"jsonrpc":"2.0","method":"notifications/initialized"}',
  '{"jsonrpc":"2.0","method":"notifications/whatever","params":{"a":1}}',
  '[{"jsonrpc":"2.0","id":1,"method":"tools/list"},{"jsonrpc":"2.0","id":2,"method":"ping"}]',
  '[{"jsonrpc":"2.0","method":"notifications/initialized"}]',
  '[5]',
]) post('shape', body);

// --- lifecycle and methods ---
const init = (protocolVersion) =>
  rpc('initialize', { protocolVersion, capabilities: {}, clientInfo: { name: 'parity', version: '0' } });
for (const v of ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '1999-01-01']) post('initialize', init(v));
post('initialize-empty-params', rpc('initialize', {}));
post('initialize-no-params', rpc('initialize'));
post('ping', rpc('ping'));
post('ping-string-id', rpc('ping', undefined, 'abc'));
post('tools-list', rpc('tools/list'));
post('tools-list-empty-params', rpc('tools/list', {}));
post('tools-list-cursor-number', rpc('tools/list', { cursor: 5 }));
for (const m of ['resources/list', 'resources/templates/list', 'prompts/list', 'logging/setLevel', 'completion/complete', 'foo/bar'])
  post('unknown-method', rpc(m, {}));
post('header-protocol-version', rpc('tools/list'), { ...JSON_HEADERS, 'mcp-protocol-version': '2025-06-18' });

// --- tools/call params ---
for (const p of [
  '{"name":"calculate_tax","arguments":{},"_meta":5}',
  '{"name":5,"arguments":5}',
  '{"arguments":null}',
  '{"name":"list_years","arguments":[]}',
  '{"name":"list_years","arguments":"x"}',
  '{"name":"list_years"}',
  '{"name":"nope","arguments":5}',
  '{"name":"nope","arguments":{}}',
  '{"name":"list_years","arguments":{},"extra":1}',
  '{"name":"list_years","arguments":{},"task":5}',
]) post('call-params', `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":${p}}`);
post('call-params-missing', rpc('tools/call'));

// --- argument validation (zod) ---
for (const [name, a] of [
  ['calculate_tax', '{"taxable_income":-1,"age":-1.5,"category":"bogus","bogus":1,"zzz":2}'],
  ['calculate_tax', '{"age":-1}'],
  ['calculate_tax', '{"age":1e20}'],
  ['calculate_tax', '{"age":-1e20}'],
  ['calculate_tax', '{"age":1e400}'],
  ['calculate_tax', '{"age":1e400,"tds":"x"}'],
  ['calculate_tax', '{"age":"30"}'],
  ['calculate_tax', '{"age":151,"taxable_income":1}'],
  ['calculate_tax', '{"tds":1e400}'],
  ['calculate_tax', '{"tds":-1e400}'],
  ['calculate_tax', '{"tds":-1,"taxable_income":1}'],
  ['calculate_tax', '{"taxable_income":-0}'],
  ['calculate_tax', '{"taxable_income":1e308}'],
  ['calculate_tax', '{"taxable_income":1,"tds":-0}'],
  ['calculate_tax', '{"investments":{"dps":-1,"zz":1}}'],
  ['calculate_tax', '{"investments":{"zz":1,"yy":2}}'],
  ['calculate_tax', '{"investments":{"dps":-1,"apply_instrument_caps":false}}'],
  ['calculate_tax', '{"investments":{"dps":-1,"apply_instrument_caps":true,"total":-2}}'],
  ['calculate_tax', '{"investments":{"total":1e400}}'],
  ['calculate_tax', '{"investments":{"dps":"1"}}'],
  ['calculate_tax', '{"investments":1e400}'],
  ['calculate_tax', '{"investments":-5}'],
  ['calculate_tax', '{"investments":"5"}'],
  ['calculate_tax', '{"investments":[]}'],
  ['calculate_tax', '{"investments":null}'],
  ['calculate_tax', '{"investments":true}'],
  ['calculate_tax', '{"taxable_income":1000000,"investments":{"dps":100000,"apply_instrument_caps":true}}'],
  ['calculate_tax', '{"income":{"period":"monthly","gross_salary":-1,"use_standard_breakdown":1,"apply_exemption":null}}'],
  ['calculate_tax', '{"income":{"zz":1,"aa":2,"period":null}}'],
  ['calculate_tax', '{"income":1e400}'],
  ['calculate_tax', '{"income":null}'],
  ['calculate_tax', '{"income":[1]}'],
  ['calculate_tax', '{"income":{"basic":100000,"period":"weekly"}}'],
  ['calculate_tax', '{"category":null,"location":5,"parent_of_disabled":"true"}'],
  ['calculate_tax', '{"z":1,"year":null,"income":{"x":1}}'],
  ['calculate_tax', '{"year":5,"first_time_filer":"yes"}'],
  ['calculate_tax', '{"__proto__":{"taxable_income":5000000}}'],
  ['calculate_tax', '{"__proto__":{"bogus":1}}'],
  ['calculate_tax', '{"income":{"__proto__":{"basic":1}}}'],
  ['calculate_tax', '{"income":{"basic":1,"__proto__":5}}'],
  ['calculate_tax', '{"investments":{"__proto__":{"dps":1}}}'],
  ['calculate_tax', '{"constructor":1}'],
  ['calculate_tax', '{"1":1,"b":2,"0":3}'],
  ['calculate_tax', '{"a\\"b":1}'],
  ['calculate_tax', '{}'],
  ['calculate_tax', '{"income":{}}'],
  ['calculate_tax', '{"taxable_income":1,"income":{"basic":1}}'],
  ['calculate_tax', '{"year":"2099-00","taxable_income":1}'],
  ['calculate_tax', '{"year":"fy2025","taxable_income":1}'],
  ['get_rules', '{"year":"2025-26","category":"general","age":65,"parent_of_disabled":true,"location":"dhaka"}'],
  ['get_rules', '{}'],
  ['get_rules', '{"year":"1999-00"}'],
  ['compare_years', '{}'],
  ['compare_years', '{"from_year":"2026-27","to_year":"2023-24","taxable_income":2500000}'],
  ['compare_years', '{"from_year":5,"to_year":null,"taxable_income":-1,"bogus":1}'],
  ['list_years', '{}'],
  ['list_years', '{"a":1,"b":2}'],
  ['list_years', '{"__proto__":5}'],
]) callRaw('zod', name, a);

// The acceptance check: ৳1,00,000/month basic, FY 2025-26, general.
call('acceptance', 'calculate_tax', { year: '2025-26', category: 'general', income: { period: 'monthly', basic: 100000 } });

// --- engine sample through the tools ---
const TOOL = { calculateTaxForYear: 'calculate_tax', getRulesForYear: 'get_rules', compareTaxYears: 'compare_years' };
for (const c of TEST_INPUTS) {
  if (TOOL[c.fn] && c.args && typeof c.args === 'object' && !Array.isArray(c.args)) call(c.source, TOOL[c.fn], c.args);
}
for (const year of SUPPORTED_FISCAL_YEARS) {
  for (const category of ALL_ACCEPTED_CATEGORIES) {
    call('rules-grid', 'get_rules', { year, category });
    call('rules-grid', 'get_rules', { year, category, age: 70, parent_of_disabled: true });
  }
}

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
const rand = rng(20261127);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const money = () => pick([0, 1, 999, 50_000, 120_000, 350_000, 1_000_000, 3_500_000, 12_345_678.9, Math.round(rand() * 5e6)]);
const maybe = (v) => (rand() < 0.5 ? undefined : v);
function profile() {
  return {
    category: maybe(pick(ALL_ACCEPTED_CATEGORIES)),
    age: maybe(pick([0, 30, 64, 65, 90])),
    parent_of_disabled: maybe(rand() < 0.5),
    location: maybe(pick(LOCATIONS)),
    first_time_filer: maybe(rand() < 0.5),
    investments: maybe(
      rand() < 0.5
        ? money()
        : { dps: maybe(money()), stocks: maybe(money()), savings_certificate: maybe(money()), mutual_fund: maybe(money()), life_insurance: maybe(money()), life_insurance_policy_value: maybe(money()) }
    ),
    tds: maybe(money()),
  };
}
function income() {
  if (rand() < 0.3) return { taxable_income: money() * 4 };
  const period = maybe(pick(['annual', 'monthly']));
  if (rand() < 0.4) return { income: { period, gross_salary: money(), use_standard_breakdown: maybe(rand() < 0.5), apply_exemption: maybe(rand() < 0.5) } };
  return { income: { period, basic: money(), house: maybe(money()), medical: maybe(money()), transport: maybe(money()), lfa: maybe(money()), employer_rpf: maybe(money()), bonus: maybe(money()), additional_income: maybe(money()) } };
}
for (let i = 0; i < 600; i++) {
  const args = JSON.parse(JSON.stringify({ year: maybe(pick(SUPPORTED_FISCAL_YEARS)), ...profile(), ...income() }));
  call('random', 'calculate_tax', args);
  if (i % 4 === 0) {
    const { year, ...rest } = args;
    call('random', 'compare_years', { from_year: maybe(pick(SUPPORTED_FISCAL_YEARS)), to_year: maybe(pick(SUPPORTED_FISCAL_YEARS)), ...rest });
  }
}

// --- record ---
async function record(c) {
  const handler = createRemoteHandler({ rateLimit: { limit: c.limit, windowMs: 60_000 } });
  let res;
  for (let i = 0; i < c.repeat; i++) {
    const { method, headers, body } = c.req;
    res = await handler(new Request('http://localhost/mcp', { method, headers, body }));
  }
  const headers = {};
  for (const h of KEPT_HEADERS) {
    const v = res.headers.get(h);
    if (v !== null) headers[h] = v;
  }
  return { source: c.source, req: c.req, limit: c.limit, repeat: c.repeat, status: res.status, headers, body: await res.text() };
}

const fd = fs.openSync(outPath, 'w');
fs.writeSync(fd, JSON.stringify({ meta: { cases: cases.length } }) + '\n');
for (const c of cases) fs.writeSync(fd, JSON.stringify(await record(c)) + '\n');
fs.closeSync(fd);
console.log(`wrote ${cases.length} MCP cases to ${outPath}`);
