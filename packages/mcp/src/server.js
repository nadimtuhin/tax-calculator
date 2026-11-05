import http from 'node:http';
import {
  McpServer,
  createMcpHandler,
  validateHostHeader,
  validateOriginHeader,
  localhostAllowedHostnames,
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  ALL_ACCEPTED_CATEGORIES,
  LOCATIONS,
  DEFAULT_FISCAL_YEAR,
  listSupportedYears,
  getRulesForYear,
  calculateTaxForYear,
  compareTaxYears,
} from './engine.js';

export const SERVER_NAME = 'bangladesh-tax-calculator';
export const SERVER_VERSION = '1.0.0';
export const DEFAULT_MAX_HTTP_BODY_BYTES = 256 * 1024; // 256 KiB

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const categorySchema = z
  .enum(ALL_ACCEPTED_CATEGORIES)
  .default('general')
  .describe(
    'Taxpayer category: "general", "female", "senior" (65+), "disabled", "third_gender", "freedom_fighter" (gazetted war-wounded / July Warrior), or legacy "parent_disabled".'
  );

const locationSchema = z
  .enum(LOCATIONS)
  .default('dhaka')
  .describe(
    'Taxpayer location for minimum tax rules: "dhaka", "chittagong", "other_city" (other city corporations), or "district" (non-city-corporation areas).'
  );

const ageSchema = z
  .number()
  .int()
  .min(0)
  .max(150)
  .optional()
  .describe(
    'Taxpayer age in whole years (optional; age >= 65 promotes general/female to senior threshold in FY 2025-26 and FY 2026-27).'
  );

const incomeSchema = z
  .object({
    period: z
      .enum(['annual', 'monthly'])
      .default('annual')
      .describe(
        'Whether recurring salary fields (basic, house, medical, transport, lfa, others, or gross_salary) are monthly (multiplied by 12) or annual. Bonus fields are always annual.'
      ),
    gross_salary: z
      .number()
      .nonnegative()
      .optional()
      .describe(
        'Unitemized gross employment salary in BDT (mutually exclusive with basic/house/medical/transport/lfa/employer_rpf/others). Receives the ITA 2023 Sixth Schedule Part 1 Para 27 single-pool exemption min(1/3 of gross, cap) unless apply_exemption is false.'
      ),
    use_standard_breakdown: z
      .boolean()
      .optional()
      .describe(
        'When true alongside gross_salary, populates illustrative 60% basic, 25% house, 10% medical, 5% transport components.'
      ),
    apply_exemption: z
      .boolean()
      .optional()
      .describe(
        'When true (default), deducts the ITA 2023 Sixth Schedule Part 1 Para 27 single-pool employment exemption min(1/3 of gross employment income, BDT 500,000; BDT 450,000 in FY 2023-24).'
      ),
    basic: z.number().nonnegative().optional().describe('Basic salary in BDT (part of gross employment income pool).'),
    house: z.number().nonnegative().optional().describe('House rent allowance in BDT (part of gross employment income pool).'),
    medical: z.number().nonnegative().optional().describe('Medical allowance in BDT (part of gross employment income pool).'),
    transport: z.number().nonnegative().optional().describe('Conveyance/transport allowance in BDT (part of gross employment income pool).'),
    lfa: z.number().nonnegative().optional().describe('Leave fare assistance in BDT (part of gross employment income pool).'),
    employer_rpf: z.number().nonnegative().optional().describe('Employer contribution to Recognized Provident Fund (RPF) in BDT (part of gross employment income pool).'),
    others: z.number().nonnegative().optional().describe('Other recurring taxable allowances in BDT.'),
    bonus: z.number().nonnegative().optional().describe('Annual festival/performance bonus in BDT (always annual, fully taxable).'),
    bonus2: z.number().nonnegative().optional().describe('Second annual bonus in BDT (always annual, fully taxable).'),
    additional_income: z.number().nonnegative().optional().describe('Additional annual lump-sum taxable salary income in BDT.'),
  })
  .strict()
  .describe('Salary components in BDT. Mutually exclusive with top-level taxable_income.');

const investmentsSchema = z
  .union([
    z.number().nonnegative().describe('Total eligible investment in BDT.'),
    z
      .object({
        total: z.number().nonnegative().optional().describe('Total eligible investment in BDT (mutually exclusive with itemized fields).'),
        dps: z.number().nonnegative().optional().describe('Deposit Pension Scheme (DPS) contribution in BDT (instrument cap BDT 120,000).'),
        life_insurance: z.number().nonnegative().optional().describe('Life insurance premium in BDT.'),
        stocks: z.number().nonnegative().optional().describe('Listed shares/stocks investment in BDT.'),
        savings_certificate: z.number().nonnegative().optional().describe('Sanchayapatra / savings certificate investment in BDT (instrument cap BDT 500,000).'),
        mutual_fund: z.number().nonnegative().optional().describe('Mutual fund / unit certificate investment in BDT (cap BDT 500,000 through FY 2024-25; uncapped from FY 2025-26 onward per Finance Act 2026).'),
        others: z.number().nonnegative().optional().describe('Other qualifying investment in BDT.'),
        apply_instrument_caps: z
          .boolean()
          .optional()
          .describe(
            'When true (default), enforces year-aware Sixth Schedule Part 3 caps (DPS <= 120,000, savings_certificate <= 500,000, mutual_fund <= 500,000 through FY 2024-25 and uncapped in FY 2025-26/2026-27).'
          ),
      })
      .strict(),
  ])
  .optional()
  .describe('Eligible tax-rebate investments in BDT (number or itemized object).');

function okResult(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function errResult(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

export function validateEndpointPath(endpoint) {
  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('/') ||
    endpoint.startsWith('//') ||
    endpoint === '/health' ||
    /[\s?#]/.test(endpoint)
  ) {
    throw new Error(
      `Invalid endpoint path "${endpoint}". Must start with "/", contain no query/fragment/whitespace, and not equal "/health".`
    );
  }
  return endpoint;
}

/**
 * Create a fresh McpServer instance wired to the shared Bangladesh tax engine.
 */
export function createServer() {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    'list_years',
    {
      title: 'List Supported Bangladesh Tax Years',
      description:
        'List supported Bangladesh fiscal/income years (FY 2023-24 through FY 2026-27), corresponding assessment years, slab rates, general thresholds, taxpayer categories, locations, salary exemption rules, and investment instrument caps.',
      inputSchema: z.object({}).strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      try {
        return okResult(listSupportedYears());
      } catch (err) {
        return errResult(err);
      }
    }
  );

  server.registerTool(
    'get_rules',
    {
      title: 'Get Bangladesh Tax Rules for Fiscal Year',
      description:
        'Return thresholds, parent-of-disabled allowance, progressive tax slabs, investment rebate formula/caps, minimum tax by location, and salary exemption caps for a Bangladesh Fiscal Year without calculating tax on an income.',
      inputSchema: z
        .object({
          year: z
            .string()
            .default(DEFAULT_FISCAL_YEAR)
            .describe('Fiscal/Income Year, e.g. "2025-26", "2026-27", "2024-25", or "2023-24".'),
          category: categorySchema.optional(),
          age: ageSchema,
          parent_of_disabled: z
            .boolean()
            .optional()
            .describe('True if parent or legal guardian of a person with disability (+BDT 50,000 threshold).'),
        })
        .strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        return okResult(getRulesForYear(args));
      } catch (err) {
        return errResult(err);
      }
    }
  );

  server.registerTool(
    'calculate_tax',
    {
      title: 'Calculate Bangladesh Personal Income Tax',
      description:
        'Calculate Bangladesh salaried personal income tax for a Fiscal Year (2023-24, 2024-25, 2025-26, or 2026-27). Accepts either post-exemption taxable_income OR salary income components (annual or monthly), taxpayer profile (category, age, parent_of_disabled, location, first_time_filer), investments, and TDS. Returns threshold used, taxable income, slab-by-slab breakdown, gross tax, rebate, minimum tax, and final payable tax.',
      inputSchema: z
        .object({
          year: z
            .string()
            .default(DEFAULT_FISCAL_YEAR)
            .describe('Fiscal/Income Year, e.g. "2025-26", "2026-27", "2024-25", or "2023-24".'),
          category: categorySchema.optional(),
          age: ageSchema,
          parent_of_disabled: z
            .boolean()
            .optional()
            .describe('True if parent or legal guardian of a person with disability (+BDT 50,000 additive threshold).'),
          location: locationSchema.optional(),
          first_time_filer: z
            .boolean()
            .optional()
            .describe('True if first-time tax return filer (applies BDT 1,000 minimum tax in FY 2025-26 and FY 2026-27 when above threshold).'),
          taxable_income: z
            .number()
            .nonnegative()
            .optional()
            .describe('Annual post-exemption taxable income in BDT. Mutually exclusive with income.'),
          income: incomeSchema.optional(),
          investments: investmentsSchema,
          tds: z
            .number()
            .nonnegative()
            .default(0)
            .describe('Total annual Tax Deducted at Source (TDS) already withheld in BDT.'),
        })
        .strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        return okResult(calculateTaxForYear(args));
      } catch (err) {
        return errResult(err);
      }
    }
  );

  server.registerTool(
    'compare_years',
    {
      title: 'Compare Bangladesh Income Tax Across Two Fiscal Years',
      description:
        'Run side-by-side Bangladesh income tax calculations for two Fiscal Years (defaults to 2025-26 vs 2026-27) using identical taxpayer profile, income, investments, and TDS. Returns full breakdowns for both years plus threshold, gross tax, rebate, total tax, and payable tax differences.',
      inputSchema: z
        .object({
          from_year: z
            .string()
            .default('2025-26')
            .describe('Baseline Fiscal/Income Year, e.g. "2024-25" or "2025-26".'),
          to_year: z
            .string()
            .default('2026-27')
            .describe('Comparison Fiscal/Income Year, e.g. "2025-26" or "2026-27".'),
          category: categorySchema.optional(),
          age: ageSchema,
          parent_of_disabled: z
            .boolean()
            .optional()
            .describe('True if parent or legal guardian of a person with disability (+BDT 50,000 additive threshold).'),
          location: locationSchema.optional(),
          first_time_filer: z
            .boolean()
            .optional()
            .describe('True if first-time tax return filer (applies BDT 1,000 minimum tax in FY 2025-26 and FY 2026-27 when above threshold).'),
          taxable_income: z
            .number()
            .nonnegative()
            .optional()
            .describe('Annual post-exemption taxable income in BDT. Mutually exclusive with income.'),
          income: incomeSchema.optional(),
          investments: investmentsSchema,
          tds: z
            .number()
            .nonnegative()
            .default(0)
            .describe('Total annual Tax Deducted at Source (TDS) in BDT.'),
        })
        .strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        return okResult(compareTaxYears(args));
      } catch (err) {
        return errResult(err);
      }
    }
  );

  return server;
}

/**
 * Create a Web-standard Streamable HTTP / SSE MCP handler (`{ fetch, close, notify, bus }`).
 */
export function createHttpHandler(options = {}) {
  return createMcpHandler(createServer, options);
}

class PayloadTooLargeError extends Error {
  constructor(limitBytes) {
    super(`Request body exceeds ${limitBytes} byte limit.`);
    this.name = 'PayloadTooLargeError';
  }
}

function readBoundedBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const contentLength = req.headers['content-length'];
    if (contentLength !== undefined) {
      const declared = Number(contentLength);
      if (!Number.isFinite(declared) || declared < 0) {
        reject(new Error('Invalid Content-Length header.'));
        return;
      }
      if (declared > maxBytes) {
        req.resume();
        reject(new PayloadTooLargeError(maxBytes));
        return;
      }
    }

    const chunks = [];
    let received = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      received += chunk.length;
      if (received > maxBytes) {
        settled = true;
        req.resume();
        reject(new PayloadTooLargeError(maxBytes));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

function buildWebRequestFromParts(req, trustedBaseOrigin, bodyBuffer) {
  let url;
  try {
    url = new URL(req.url || '/', trustedBaseOrigin);
  } catch {
    return null;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? bodyBuffer : undefined,
  });
}

async function writeWebResponseToNode(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (!webRes.body) {
    res.end();
    return;
  }
  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
}

function normalizeAllowedHostname(entry) {
  const trimmed = String(entry).trim();
  if (!trimmed) return '';
  const candidate = trimmed.includes('://')
    ? trimmed
    : trimmed.split(':').length > 2 && !trimmed.startsWith('[')
      ? `http://[${trimmed}]`
      : `http://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Invalid allowed host/origin entry: "${entry}"`);
  }
  if (!parsed.hostname || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`Invalid allowed host/origin entry: "${entry}"`);
  }
  return parsed.hostname;
}

function sendJsonRpcError(res, statusCode, code, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code, message },
      id: null,
    })
  );
}

/**
 * Start a Streamable HTTP / SSE MCP server on Node's built-in `node:http`.
 * Enforces DNS-rebinding Host/Origin validation, timeouts, and request body byte limits.
 */
export async function startHttpServer({
  port = 3000,
  host = '127.0.0.1',
  endpoint = '/mcp',
  allowedHostnames,
  allowedOrigins,
  maxBodyBytes = DEFAULT_MAX_HTTP_BODY_BYTES,
} = {}) {
  validateEndpointPath(endpoint);

  const isLoopback = LOOPBACK_HOSTS.has(host);
  const explicitHosts = Array.isArray(allowedHostnames)
    ? allowedHostnames.map(normalizeAllowedHostname).filter(Boolean)
    : [];
  const explicitOriginHostnames = Array.isArray(allowedOrigins)
    ? allowedOrigins.map(normalizeAllowedHostname).filter(Boolean)
    : [];

  if (!isLoopback && explicitHosts.length === 0) {
    throw new Error(
      `Refusing to bind non-loopback host "${host}" without explicit allowedHostnames (--allow-hosts / MCP_ALLOWED_HOSTS).`
    );
  }

  // Note: @modelcontextprotocol/server validateHostHeader and validateOriginHeader
  // both compare parsed URL hostnames (e.g. "example.local" or "[::1]"), so normalizing
  // origins/host:port inputs to canonical hostnames satisfies both checks cleanly.
  const effectiveAllowedHosts =
    explicitHosts.length > 0 ? explicitHosts : localhostAllowedHostnames();
  const effectiveAllowedOriginHostnames =
    explicitOriginHostnames.length > 0
      ? explicitOriginHostnames
      : explicitHosts.length > 0
        ? explicitHosts
        : localhostAllowedHostnames();

  const mcpHandler = createHttpHandler();

  let boundPort = port;
  const httpServer = http.createServer(async (req, res) => {
    try {
      const rawHost = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
      const hostCheck = validateHostHeader(rawHost ?? null, effectiveAllowedHosts);
      if (!hostCheck.ok) {
        sendJsonRpcError(res, 403, -32000, hostCheck.message);
        return;
      }

      if (req.headers.origin !== undefined) {
        const rawOrigin = Array.isArray(req.headers.origin)
          ? req.headers.origin[0]
          : req.headers.origin;
        const originCheck = validateOriginHeader(rawOrigin ?? null, effectiveAllowedOriginHostnames);
        if (!originCheck.ok) {
          sendJsonRpcError(res, 403, -32000, originCheck.message);
          return;
        }
      }

      const firstHost = effectiveAllowedHosts[0];
      const authorityHost =
        firstHost.includes(':') && !firstHost.startsWith('[')
          ? `[${firstHost}]`
          : firstHost;
      const trustedBaseOrigin = `http://${authorityHost}:${boundPort}`;

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      let bodyBuffer = Buffer.alloc(0);
      if (hasBody) {
        try {
          bodyBuffer = await readBoundedBody(req, maxBodyBytes);
        } catch (bodyErr) {
          if (bodyErr instanceof PayloadTooLargeError) {
            sendJsonRpcError(res, 413, -32000, bodyErr.message);
            return;
          }
          sendJsonRpcError(res, 400, -32700, bodyErr.message);
          return;
        }
      }

      const webReq = buildWebRequestFromParts(req, trustedBaseOrigin, bodyBuffer);
      if (!webReq) {
        sendJsonRpcError(res, 400, -32600, 'Malformed request URL.');
        return;
      }

      const pathname = new URL(webReq.url).pathname;
      if (req.method === 'GET' && pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            name: SERVER_NAME,
            version: SERVER_VERSION,
            endpoint,
          })
        );
        return;
      }

      if (pathname !== endpoint) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Not found. MCP endpoint is at ${endpoint}` }));
        return;
      }

      const webRes = await mcpHandler.fetch(webReq);
      await writeWebResponseToNode(webRes, res);
    } catch (err) {
      if (!res.headersSent) {
        sendJsonRpcError(
          res,
          500,
          -32603,
          err instanceof Error ? err.message : String(err)
        );
      } else {
        res.end();
      }
    }
  });

  httpServer.headersTimeout = 10_000;
  httpServer.requestTimeout = 30_000;
  httpServer.keepAliveTimeout = 5_000;

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => {
      const address = httpServer.address();
      boundPort = typeof address === 'object' && address ? address.port : port;
      resolve({
        server: httpServer,
        mcpHandler,
        port: boundPort,
        host,
        url: `http://${host}:${boundPort}${endpoint}`,
        close: () =>
          new Promise((resClose) => {
            mcpHandler.close().finally(() => {
              httpServer.close(() => resClose());
            });
          }),
      });
    });
  });
}
