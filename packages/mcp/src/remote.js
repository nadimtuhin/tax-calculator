import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer, DEFAULT_MAX_HTTP_BODY_BYTES } from './server.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

const DEFAULT_RATE_LIMIT = { limit: 60, windowMs: 60_000, maxTrackedClients: 5000 };

function jsonRpcError(status, code, message, extraHeaders = {}) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function withPublicHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, headers });
}

function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip'))?.trim() || 'unknown';
}

// Best-effort per-instance limiter: serverless instances do not share memory, so this only
// blunts bursts. Real enforcement belongs in Vercel Firewall rate-limit rules (see README).
export function createRateLimiter({ limit, windowMs, maxTrackedClients }, now = Date.now) {
  const hits = new Map();
  return function isLimited(key) {
    const t = now();
    if (hits.size >= maxTrackedClients) {
      for (const [k, entry] of hits) if (t - entry.start >= windowMs) hits.delete(k);
      if (hits.size >= maxTrackedClients) hits.clear();
    }
    const entry = hits.get(key);
    if (!entry || t - entry.start >= windowMs) {
      hits.set(key, { start: t, count: 1 });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  };
}

async function readBodyWithLimit(request, maxBytes) {
  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) return null;
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Stateless, public, read-only Streamable HTTP MCP endpoint for serverless hosts.
 * Returns `(Request) => Promise<Response>`.
 */
export function createRemoteHandler({
  maxBodyBytes = DEFAULT_MAX_HTTP_BODY_BYTES,
  rateLimit = DEFAULT_RATE_LIMIT,
  now,
} = {}) {
  const mcp = createMcpHandler(createServer, {
    legacy: 'stateless',
    maxRequestBodySize: maxBodyBytes,
  });
  const isLimited = createRateLimiter({ ...DEFAULT_RATE_LIMIT, ...rateLimit }, now);

  async function handle(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (request.method !== 'POST') {
      // Stateless server: no standalone SSE stream (GET) and no session to terminate (DELETE).
      return jsonRpcError(405, -32000, 'Method not allowed.', { Allow: 'POST, OPTIONS' });
    }
    if (isLimited(clientKey(request))) {
      return jsonRpcError(429, -32000, 'Too many requests. Try again shortly.', {
        'Retry-After': String(Math.ceil((rateLimit.windowMs ?? DEFAULT_RATE_LIMIT.windowMs) / 1000)),
      });
    }
    const body = await readBodyWithLimit(request, maxBodyBytes);
    if (body === null) {
      return jsonRpcError(413, -32000, `Request body exceeds ${maxBodyBytes} byte limit.`);
    }
    const bounded = new Request(request.url, { method: 'POST', headers: request.headers, body });
    return mcp.fetch(bounded);
  }

  return async function fetchHandler(request) {
    try {
      return withPublicHeaders(await handle(request));
    } catch {
      return withPublicHeaders(jsonRpcError(500, -32603, 'Internal server error.'));
    }
  };
}
