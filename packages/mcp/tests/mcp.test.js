import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { startHttpServer } from '../src/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const binPath = path.join(pkgRoot, 'bin', 'tax-calculator-mcp.js');

function parseToolJson(result) {
  assert.ok(Array.isArray(result.content), 'Expected content array');
  assert.equal(result.content[0]?.type, 'text');
  return JSON.parse(result.content[0].text);
}

test('CLI --version and --help exit cleanly', () => {
  const versionOut = execFileSync(process.execPath, [binPath, '--version'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(versionOut, '1.0.0');

  const helpOut = execFileSync(process.execPath, [binPath, '--help'], {
    encoding: 'utf8',
  });
  assert.match(helpOut, /bangladesh-tax-calculator/);
  assert.match(helpOut, /--http/);
});

test('Stdio MCP server exposes all 4 tools and matches known Bangladesh tax fixtures', async (t) => {
  const client = new Client({ name: 'mcp-test-client', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [binPath],
    stderr: 'pipe',
  });

  await client.connect(transport);
  t.after(async () => {
    await client.close();
  });

  const { tools } = await client.listTools();
  const toolNames = tools.map((tool) => tool.name).sort();
  assert.deepEqual(toolNames, ['calculate_tax', 'compare_years', 'get_rules', 'list_years']);

  // 1. list_years
  const listYearsRes = await client.callTool({ name: 'list_years', arguments: {} });
  assert.ok(!listYearsRes.isError);
  const yearsPayload = parseToolJson(listYearsRes);
  assert.equal(yearsPayload.default_year, '2025-26');
  assert.deepEqual(
    yearsPayload.supported_years.map((y) => y.fiscal_year),
    ['2023-24', '2024-25', '2025-26', '2026-27']
  );

  // 2. get_rules: female + parent_of_disabled on FY 2025-26 -> 450k + 50k = 500k
  const rulesRes = await client.callTool({
    name: 'get_rules',
    arguments: {
      year: 'FY 2025-26',
      category: 'female',
      parent_of_disabled: true,
    },
  });
  assert.ok(!rulesRes.isError);
  const rules = parseToolJson(rulesRes);
  assert.equal(rules.fiscal_year, '2025-26');
  assert.equal(rules.assessment_year, '2026-27');
  assert.equal(rules.thresholds_bdt.general, 400000);
  assert.equal(rules.thresholds_bdt.female, 450000);
  assert.equal(rules.parent_of_disabled_allowance_bdt, 50000);
  assert.equal(rules.requested_profile.effective_threshold_bdt, 500000);
  assert.equal(rules.slabs.length, 6);
  assert.equal(rules.slabs[0].upper_bdt, 500000);
  assert.equal(rules.slabs[5].upper_bdt, null);
  assert.equal(rules.slabs[5].unbounded, true);
  assert.equal(rules.rebate_rules.investment_rate_percent, 10);
  assert.equal(rules.rebate_rules.max_cap_bdt, 750000);
  assert.equal(rules.investment_instrument_caps_bdt.mutual_fund, null);
  assert.equal(rules.salary_exemption_rule.maxAmount, 500000);

  // 3. calculate_tax fixture: FY 2026-27 general, taxable 15L, investment 2L -> gross 170k, rebate 20k, total 150k, payable 150k
  const calc2026Res = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2026-27',
      category: 'general',
      taxable_income: 1500000,
      investments: 200000,
    },
  });
  assert.ok(!calc2026Res.isError);
  const calc2026 = parseToolJson(calc2026Res);
  assert.equal(calc2026.tax_free_threshold_bdt, 400000);
  assert.equal(calc2026.gross_tax_bdt, 170000);
  assert.equal(calc2026.rebate_bdt, 20000);
  assert.equal(calc2026.total_tax_bdt, 150000);
  assert.equal(calc2026.minimum_tax_bdt, 5000);
  assert.equal(calc2026.is_minimum_tax_applied, false);
  assert.equal(calc2026.payable_tax_bdt, 150000);

  // 3b. At or below threshold -> minimum_tax_bdt = 0, total_tax_bdt = 0, payable_tax_bdt = 0
  const belowThreshRes = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'general',
      taxable_income: 400000,
    },
  });
  const belowThresh = parseToolJson(belowThreshRes);
  assert.equal(belowThresh.below_tax_free_threshold, true);
  assert.equal(belowThresh.minimum_tax_bdt, 0);
  assert.equal(belowThresh.is_minimum_tax_applied, false);
  assert.equal(belowThresh.total_tax_bdt, 0);
  assert.equal(belowThresh.payable_tax_bdt, 0);

  // 3c. IT-11GA(2023) order: rebate cannot push Line 16 below minimum tax when taxable > threshold, TDS reduces payable
  const minFloorRes = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'general',
      taxable_income: 480000, // 80k @ 10% = 8,000 slab tax
      investments: 100000,    // min(3% * 480k = 14,400, 10% * 100k = 10,000) = 10,000 rebate -> taxAfterRebate = 0 < 5,000 min tax
      tds: 2000,
    },
  });
  const minFloor = parseToolJson(minFloorRes);
  assert.equal(minFloor.gross_tax_bdt, 8000);
  assert.equal(minFloor.rebate_bdt, 10000);
  assert.equal(minFloor.tax_after_rebate_bdt, 0);
  assert.equal(minFloor.total_tax_bdt, 5000);
  assert.equal(minFloor.is_minimum_tax_applied, true);
  assert.equal(minFloor.payable_tax_bdt, 3000);

  // 4. calculate_tax with monthly salary breakdown + Para 27 single-pool exemption + Part 3 caps + TDS + age 67 + parent_of_disabled
  // Monthly: basic 60k (720k/yr), house 30k (360k/yr), medical 8k (96k/yr), transport 5k (60k/yr), bonus 100k
  // Gross = 720k + 360k + 96k + 60k + 100k = 1,336,000
  // Para 27 single-pool exemption = min(round(1,336,000 / 3) = 445,333, 500,000) = 445,333 -> Taxable = 890,667
  // Age 67 general + parent_of_disabled -> senior 450k + 50k = 500k threshold
  // FY 2025-26 slabs from 500k: [0-500k@0%=0, 500k-800k@10%=30,000, 800k-890,667 (90,667)@15%=13,600] -> gross 43,600
  // Investments (caps default to true): dps 150k->120k, savings_certificate 600k->500k, mutual_fund 700k->700k (uncapped in 2025-26) = 1,320,000
  // Rebate 2025-26: min(3% * 890,667 = 26,720, 10% * 1,320,000 = 132,000, 750,000) = 26,720
  // Line 16 totalTax = max(43,600 - 26,720 = 16,880, 5,000) = 16,880; TDS = 15,000 -> Payable = 1,880
  const monthlyRes = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'general',
      age: 67,
      parent_of_disabled: true,
      income: {
        period: 'monthly',
        basic: 60000,
        house: 30000,
        medical: 8000,
        transport: 5000,
        bonus: 100000,
      },
      investments: {
        dps: 150000,
        savings_certificate: 600000,
        mutual_fund: 700000,
      },
      tds: 15000,
    },
  });
  assert.ok(!monthlyRes.isError);
  const monthly = parseToolJson(monthlyRes);
  assert.equal(monthly.profile.effective_category, 'senior');
  assert.equal(monthly.tax_free_threshold_bdt, 500000);
  assert.equal(monthly.income_summary.gross_income_bdt, 1336000);
  assert.deepEqual(monthly.income_summary.exemptions_bdt, {
    single_pool: 445333,
    max_cap_bdt: 500000,
    house: 0,
    medical: 0,
    transport: 0,
    lfa: 0,
    total: 445333,
  });
  assert.equal(monthly.taxable_income_bdt, 890667);
  assert.equal(monthly.gross_tax_bdt, 43600);
  assert.equal(monthly.investment_summary.eligible_investment_bdt, 1320000);
  assert.equal(monthly.rebate_bdt, 26720);
  assert.equal(monthly.total_tax_bdt, 16880);
  assert.equal(monthly.payable_tax_bdt, 1880);

  // 5. First-time filer minimum tax in FY 2025-26 & FY 2026-27 vs district minimum tax in FY 2024-25
  const firstTimeRes = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'general',
      first_time_filer: true,
      taxable_income: 405000, // 5,000 @ 10% = 500 < 1,000 first-time min tax
    },
  });
  const firstTime = parseToolJson(firstTimeRes);
  assert.equal(firstTime.gross_tax_bdt, 500);
  assert.equal(firstTime.minimum_tax_bdt, 1000);
  assert.equal(firstTime.is_minimum_tax_applied, true);
  assert.equal(firstTime.total_tax_bdt, 1000);

  const district2024Res = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2024-25',
      category: 'general',
      location: 'district',
      taxable_income: 360000, // 10,000 @ 5% = 500 < 3,000 district min tax
    },
  });
  const district2024 = parseToolJson(district2024Res);
  assert.equal(district2024.tax_free_threshold_bdt, 350000);
  assert.equal(district2024.gross_tax_bdt, 500);
  assert.equal(district2024.minimum_tax_bdt, 3000);
  assert.equal(district2024.total_tax_bdt, 3000);

  // 6. compare_years: FY 2025-26 vs FY 2026-27 match under enacted FA 2026, while FY 2024-25 vs FY 2025-26 shows statutory delta
  const cmpSameRes = await client.callTool({
    name: 'compare_years',
    arguments: {
      from_year: '2025-26',
      to_year: '2026-27',
      category: 'general',
      taxable_income: 3600000,
      investments: { mutual_fund: 800000 },
    },
  });
  assert.ok(!cmpSameRes.isError);
  const cmpSame = parseToolJson(cmpSameRes);
  assert.equal(cmpSame.from.rebate_bdt, 80000); // 10% of uncapped 8L MF
  assert.equal(cmpSame.to.rebate_bdt, 80000);
  assert.equal(cmpSame.comparison.total_tax_diff_bdt, 0);
  assert.equal(cmpSame.comparison.payable_tax_diff_bdt, 0);
  assert.equal(cmpSame.comparison.verdict, 'no_change');

  const cmp24to25Res = await client.callTool({
    name: 'compare_years',
    arguments: {
      from_year: '2024-25',
      to_year: '2025-26',
      category: 'general',
      taxable_income: 3600000,
      investments: { mutual_fund: 800000 },
    },
  });
  assert.ok(!cmp24to25Res.isError);
  const cmp24to25 = parseToolJson(cmp24to25Res);
  assert.equal(cmp24to25.from.investment_summary.eligible_investment_bdt, 500000); // 2024-25 MF capped at 5L
  assert.equal(cmp24to25.from.rebate_bdt, 75000); // 15% of 5L
  assert.equal(cmp24to25.to.investment_summary.eligible_investment_bdt, 800000); // 2025-26 MF uncapped
  assert.equal(cmp24to25.to.rebate_bdt, 80000); // 10% of 8L

  // 7. Validation errors return isError: true with actionable messages
  const ayErr = await client.callTool({
    name: 'get_rules',
    arguments: { year: 'AY 2026-27' },
  });
  assert.equal(ayErr.isError, true);
  assert.match(parseToolJson(ayErr).error, /Assessment Year/);

  // Life insurance 10% of policy sum assured cap via MCP
  const lifeCapRes = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'general',
      taxable_income: 1500000,
      investments: {
        life_insurance: 500000,
        life_insurance_policy_value: 1000000,
      },
    },
  });
  assert.ok(!lifeCapRes.isError);
  const lifeCap = parseToolJson(lifeCapRes);
  assert.equal(lifeCap.investment_summary.eligible_investment_bdt, 100000);
  assert.equal(lifeCap.rebate_bdt, 10000);

  const missingPolicyErr = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      taxable_income: 1500000,
      investments: { life_insurance: 500000 },
    },
  });
  assert.equal(missingPolicyErr.isError, true);
  assert.match(parseToolJson(missingPolicyErr).error, /life_insurance_policy_value/);

  const bothIncomeErr = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      taxable_income: 800000,
      income: { basic: 500000 },
    },
  });
  assert.equal(bothIncomeErr.isError, true);
  assert.match(parseToolJson(bothIncomeErr).error, /not both/);
});

test('Legacy 2025-era MCP initialize handshake over stdio succeeds (Claude Desktop / OpenCode / Hermes compatibility)', async () => {
  const child = spawn(process.execPath, [binPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const responses = [];
  let buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) responses.push(JSON.parse(line));
    }
  });

  const waitForId = (id) =>
    new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error(`Timeout waiting for id=${id}`)), 5000);
      const poll = setInterval(() => {
        const match = responses.find((r) => r.id === id);
        if (match) {
          clearInterval(poll);
          clearTimeout(deadline);
          resolve(match);
        }
      }, 20);
    });

  try {
    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'legacy-claude-desktop', version: '1.0.0' },
        },
      })}\n`
    );

    const initRes = await waitForId(1);
    assert.equal(initRes.result.serverInfo.name, 'bangladesh-tax-calculator');

    child.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`
    );
    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'calculate_tax',
          arguments: { year: '2025-26', category: 'disabled', taxable_income: 825000 },
        },
      })}\n`
    );

    const callRes = await waitForId(2);
    const parsed = JSON.parse(callRes.result.content[0].text);
    assert.equal(parsed.tax_free_threshold_bdt, 525000);
    assert.equal(parsed.gross_tax_bdt, 30000); // 300k above 525k @ 10%
  } finally {
    child.kill();
  }
});

test('Streamable HTTP server serves MCP requests, health check, and localhost Host protection', async (t) => {
  const running = await startHttpServer({ port: 0, host: '127.0.0.1', endpoint: '/mcp' });
  t.after(async () => {
    await running.close();
  });

  // Health check
  const healthRes = await fetch(`http://127.0.0.1:${running.port}/health`);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.status, 'ok');


  // Default loopback server accepts valid localhost Origin header
  const defaultOriginOk = await fetch(`http://127.0.0.1:${running.port}/health`, {
    headers: { Origin: 'http://localhost:3000' },
  });
  assert.equal(defaultOriginOk.status, 200);

  // Spoofed Host header rejected with 403
  const spoofedStatus = await new Promise((resolve, reject) => {
    import('node:http').then(({ default: http }) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: running.port,
          path: '/mcp',
          method: 'POST',
          headers: {
            Host: 'evil.example.com',
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );
      req.on('error', reject);
      req.end('{}');
    });
  });
  assert.equal(spoofedStatus, 403);


  // Malformed Host header returns 403 (never 500)
  const malformedHostStatus = await new Promise((resolve, reject) => {
    import('node:http').then(({ default: http }) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: running.port,
          path: '/mcp',
          method: 'POST',
          headers: {
            Host: 'bad host%%%value',
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );
      req.on('error', reject);
      req.end('{}');
    });
  });
  assert.equal(malformedHostStatus, 403);

  // Oversized payload returns 413
  const oversizedRes = await fetch(`http://127.0.0.1:${running.port}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'x'.repeat(300 * 1024),
  });
  assert.equal(oversizedRes.status, 413);

  // StreamableHTTPClientTransport round-trip
  const client = new Client({ name: 'http-test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(running.url));
  await client.connect(transport);
  t.after(async () => {
    await client.close();
  });

  const calc = await client.callTool({
    name: 'calculate_tax',
    arguments: {
      year: '2025-26',
      category: 'freedom_fighter',
      parent_of_disabled: true,
      taxable_income: 900000,
    },
  });
  const payload = parseToolJson(calc);
  assert.equal(payload.tax_free_threshold_bdt, 600000); // 550k + 50k
  assert.equal(payload.gross_tax_bdt, 30000); // 300k @ 10%
});

test('Packed npm tarball runs standalone outside the repository via vendor/utils', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-tax-mcp-pack-'));
  try {
    const tarballName = execFileSync('npm', ['pack', '--ignore-scripts=false', '--pack-destination', tmpDir], {
      cwd: pkgRoot,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .pop();

    // Ensure postpack cleaned vendor/ inside repo
    assert.equal(fs.existsSync(path.join(pkgRoot, 'vendor')), false);

    const extractDir = path.join(tmpDir, 'extracted');
    fs.mkdirSync(extractDir);
    execFileSync('tar', ['-xzf', path.join(tmpDir, tarballName), '-C', extractDir]);

    // Symlink node_modules so standalone extracted package can resolve @modelcontextprotocol/server
    fs.symlinkSync(
      path.join(pkgRoot, 'node_modules'),
      path.join(extractDir, 'package', 'node_modules'),
      'dir'
    );

    const standaloneCheck = execFileSync(
      process.execPath,
      [
        '-e',
        `import('./src/index.js').then(m => {
          const r = m.calculateTaxForYear({ year: '2026-27', category: 'female', taxable_income: 750000 });
          console.log(JSON.stringify({ threshold: r.tax_free_threshold_bdt, gross: r.gross_tax_bdt }));
        })`,
      ],
      {
        cwd: path.join(extractDir, 'package'),
        encoding: 'utf8',
      }
    ).trim();

    assert.deepEqual(JSON.parse(standaloneCheck), { threshold: 450000, gross: 30000 });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});


test('Security & input hardening: rejects unguarded non-loopback bind, malformed --path, fractional age, and numeric overflow', async () => {
  await assert.rejects(
    () => startHttpServer({ port: 0, host: '0.0.0.0', endpoint: '/mcp' }),
    /Refusing to bind non-loopback host/
  );
  await assert.rejects(
    () => startHttpServer({ port: 0, host: '127.0.0.1', endpoint: 'relative/path' }),
    /Invalid endpoint path/
  );
  await assert.rejects(
    () => startHttpServer({ port: 0, host: '127.0.0.1', endpoint: '/mcp?foo=1' }),
    /Invalid endpoint path/
  );
  await assert.rejects(
    () => startHttpServer({ port: 0, host: '127.0.0.1', endpoint: '/health' }),
    /Invalid endpoint path/
  );

  const engine = await import('../src/engine.js');
  assert.throws(
    () => engine.calculateTaxForYear({ year: '2025-26', age: 64.9, taxable_income: 500000 }),
    /integer between 0 and 150/
  );
  assert.throws(
    () =>
      engine.calculateTaxForYear({
        year: '2025-26',
        income: { period: 'monthly', basic: Number.MAX_SAFE_INTEGER },
      }),
    /exceeds maximum safe BDT amount/
  );
});


test('Custom allowedHostnames/allowedOrigins accepts matching Origin URL and rejects foreign Origin', async (t) => {
  const custom = await startHttpServer({
    port: 0,
    host: '127.0.0.1',
    endpoint: '/mcp',
    allowedHostnames: ['http://tax.internal:8080', '127.0.0.1'],
  });
  t.after(async () => {
    await custom.close();
  });

  const okOriginRes = await fetch(`http://127.0.0.1:${custom.port}/health`, {
    headers: { Origin: 'http://tax.internal:8080' },
  });
  assert.equal(okOriginRes.status, 200);

  const badOriginRes = await fetch(`http://127.0.0.1:${custom.port}/health`, {
    headers: { Origin: 'http://attacker.example.com' },
  });
  assert.equal(badOriginRes.status, 403);
});


test('IPv6 loopback (::1) HTTP bind handles bracketed Host and Origin cleanly without double-bracketing', async (t) => {
  let ipv6Server;
  try {
    ipv6Server = await startHttpServer({ port: 0, host: '::1', endpoint: '/mcp' });
  } catch (err) {
    if (err && (err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT')) {
      t.skip('IPv6 loopback not available on this host');
      return;
    }
    throw err;
  }
  t.after(async () => {
    await ipv6Server.close();
  });

  const res = await fetch(`http://[::1]:${ipv6Server.port}/health`, {
    headers: { Origin: `http://[::1]:${ipv6Server.port}` },
  });
  assert.equal(res.status, 200);
});
