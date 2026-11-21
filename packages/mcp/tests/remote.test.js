import test from 'node:test';
import assert from 'node:assert/strict';
import { createRemoteHandler, createRateLimiter } from '../src/remote.js';
import handlerModule from '../../../api/mcp.mjs';

const MCP_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

function rpc(handler, body, { headers = MCP_HEADERS, method = 'POST', ip } = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return handler(
    new Request('https://tax.nadimtuhin.com/mcp', {
      method,
      headers: { ...headers, ...(ip ? { 'x-forwarded-for': ip } : {}) },
      body: method === 'GET' || method === 'DELETE' || method === 'OPTIONS' ? undefined : payload,
    })
  );
}

async function readRpc(res) {
  const text = await res.text();
  const dataLine = text.split('\n').find((line) => line.startsWith('data: '));
  return JSON.parse(dataLine ? dataLine.slice('data: '.length) : text);
}

async function callTool(handler, name, args) {
  const res = await rpc(handler, {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name, arguments: args },
  });
  assert.equal(res.status, 200);
  const json = await readRpc(res);
  assert.equal(json.result.isError ?? false, false);
  return JSON.parse(json.result.content[0].text);
}

test('initialize returns a result with CORS and no session id', async () => {
  const handler = createRemoteHandler();
  const res = await rpc(handler, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    },
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json|text\/event-stream/);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal(res.headers.get('mcp-session-id'), null);
  const json = await readRpc(res);
  assert.equal(json.result.serverInfo.name, 'bangladesh-tax-calculator');
});

test('tools/list exposes the four read-only tools', async () => {
  const handler = createRemoteHandler();
  const res = await rpc(handler, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const json = await readRpc(res);
  assert.deepEqual(json.result.tools.map((t) => t.name).sort(), [
    'calculate_tax',
    'compare_years',
    'get_rules',
    'list_years',
  ]);
  for (const tool of json.result.tools) assert.equal(tool.annotations.readOnlyHint, true);
});

test('calculate_tax FY 2026-27 and FY 2025-26 stay separate', async () => {
  const handler = createRemoteHandler();
  const args = { category: 'general', taxable_income: 1500000, investments: 200000 };

  const fy2627 = await callTool(handler, 'calculate_tax', { ...args, year: '2026-27' });
  assert.equal(fy2627.fiscal_year, '2026-27');
  assert.equal(fy2627.payable_tax_bdt, 150000);

  const fy2526 = await callTool(handler, 'calculate_tax', { ...args, year: '2025-26' });
  assert.equal(fy2526.fiscal_year, '2025-26');
  assert.equal(fy2526.assessment_year, '2026-27');
  assert.equal(fy2526.payable_tax_bdt, 150000);
});

test('invalid tool input is rejected by the zod schema', async () => {
  const handler = createRemoteHandler();
  const res = await rpc(handler, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'calculate_tax', arguments: { year: '2026-27', taxable_income: -5 } },
  });
  const json = await readRpc(res);
  assert.ok(json.error || json.result?.isError, 'negative income must be rejected');
});

test('GET and DELETE get 405 with Allow: POST (stateless server)', async () => {
  const handler = createRemoteHandler();
  for (const method of ['GET', 'DELETE', 'PUT']) {
    const res = await rpc(handler, '', { method, headers: { accept: 'text/event-stream' } });
    assert.equal(res.status, 405, method);
    assert.match(res.headers.get('allow'), /POST/);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  }
});

test('OPTIONS preflight returns 204 with CORS headers', async () => {
  const handler = createRemoteHandler();
  const res = await rpc(handler, '', { method: 'OPTIONS', headers: {} });
  assert.equal(res.status, 204);
  assert.match(res.headers.get('access-control-allow-headers'), /Mcp-Protocol-Version/i);
  assert.match(res.headers.get('access-control-allow-methods'), /POST/);
});

test('malformed JSON -> 400, wrong content type -> 415', async () => {
  const handler = createRemoteHandler();
  assert.equal((await rpc(handler, 'not json')).status, 400);
  const res = await rpc(handler, '{}', { headers: { 'content-type': 'text/plain' } });
  assert.equal(res.status, 415);
});

test('oversized body is rejected with 413 (declared and streamed)', async () => {
  const handler = createRemoteHandler({ maxBodyBytes: 1024 });
  const big = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', pad: 'x'.repeat(4096) });
  assert.equal((await rpc(handler, big)).status, 413);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(big));
      controller.close();
    },
  });
  const res = await handler(
    new Request('https://tax.nadimtuhin.com/mcp', {
      method: 'POST',
      headers: MCP_HEADERS,
      body: stream,
      duplex: 'half',
    })
  );
  assert.equal(res.status, 413);
});

test('rate limiter blocks after the limit per client and recovers after the window', async () => {
  let t = 0;
  const handler = createRemoteHandler({ rateLimit: { limit: 2, windowMs: 1000 }, now: () => t });
  const call = (ip) => rpc(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list' }, { ip });
  assert.equal((await call('1.1.1.1')).status, 200);
  assert.equal((await call('1.1.1.1')).status, 200);
  const limited = await call('1.1.1.1');
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get('retry-after'));
  assert.equal((await call('2.2.2.2')).status, 200);
  t = 1500;
  assert.equal((await call('1.1.1.1')).status, 200);
});

test('rate limiter bounds memory', () => {
  const isLimited = createRateLimiter({ limit: 1, windowMs: 1000, maxTrackedClients: 3 }, () => 0);
  for (let i = 0; i < 20; i += 1) isLimited(`ip-${i}`);
  assert.equal(isLimited('ip-19'), true);
});

test('Vercel entrypoint api/mcp.mjs exports a fetch handler', async () => {
  const res = await handlerModule.fetch(
    new Request('https://tax.nadimtuhin.com/mcp', {
      method: 'POST',
      headers: MCP_HEADERS,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
  );
  assert.equal(res.status, 200);
});
