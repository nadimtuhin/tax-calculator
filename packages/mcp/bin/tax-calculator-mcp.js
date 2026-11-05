#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import {
  createServer,
  startHttpServer,
  validateEndpointPath,
  SERVER_NAME,
  SERVER_VERSION,
} from '../src/server.js';

export function parseArgs(argv) {
  const envAllowHosts = process.env.MCP_ALLOWED_HOSTS
    ? process.env.MCP_ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
    : [];

  const opts = {
    mode: 'stdio',
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '127.0.0.1',
    endpoint: process.env.MCP_ENDPOINT || '/mcp',
    allowedHostnames: envAllowHosts,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' || arg === '-v') {
      opts.version = true;
    } else if (arg === '--stdio') {
      opts.mode = 'stdio';
    } else if (arg === '--http') {
      opts.mode = 'http';
    } else if (arg === '--port' && argv[i + 1] !== undefined) {
      opts.port = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith('--port=')) {
      opts.port = Number(arg.slice('--port='.length));
    } else if (arg === '--host' && argv[i + 1] !== undefined) {
      opts.host = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--host=')) {
      opts.host = arg.slice('--host='.length);
    } else if (arg === '--path' && argv[i + 1] !== undefined) {
      opts.endpoint = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--path=')) {
      opts.endpoint = arg.slice('--path='.length);
    } else if (arg === '--allow-hosts' && argv[i + 1] !== undefined) {
      opts.allowedHostnames = argv[i + 1]
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      i += 1;
    } else if (arg.startsWith('--allow-hosts=')) {
      opts.allowedHostnames = arg
        .slice('--allow-hosts='.length)
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}. Pass --help for usage.`);
    }
  }

  if (!Number.isInteger(opts.port) || opts.port < 0 || opts.port > 65535) {
    throw new Error(`Invalid --port value: ${opts.port}`);
  }
  validateEndpointPath(opts.endpoint);
  return opts;
}

const HELP_TEXT = `${SERVER_NAME} v${SERVER_VERSION}
Bangladesh salaried personal income tax MCP server (FY 2023-24 through FY 2026-27)

Usage:
  tax-calculator-mcp [--stdio]
  tax-calculator-mcp --http [--port 3000] [--host 127.0.0.1] [--path /mcp] [--allow-hosts example.local]

Options:
  --stdio                   Serve MCP over stdin/stdout (default)
  --http                    Serve Streamable HTTP / SSE MCP server
  --port <number>           HTTP listen port (default: 3000 or $PORT)
  --host <host>             HTTP bind address (default: 127.0.0.1 or $HOST)
  --path <path>             HTTP MCP endpoint path (default: /mcp or $MCP_ENDPOINT)
  --allow-hosts <h1,h2>     Allowed Host/Origin hostnames (required for non-loopback --host)
  -v, --version             Print version and exit
  -h, --help                Print this help message and exit
`;

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (opts.help) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return;
  }

  if (opts.version) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  if (opts.mode === 'http') {
    const running = await startHttpServer({
      port: opts.port,
      host: opts.host,
      endpoint: opts.endpoint,
      allowedHostnames: opts.allowedHostnames,
    });
    console.error(`${SERVER_NAME} v${SERVER_VERSION} listening on ${running.url}`);
    const shutdown = async () => {
      await running.close();
      process.exit(0);
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
    return;
  }

  serveStdio(createServer);
}

function checkIsMain() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

const isMain = checkIsMain();

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
