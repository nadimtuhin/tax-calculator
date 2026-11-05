# @nadimtuhin/tax-calculator-mcp

Model Context Protocol (MCP) server wrapping the Bangladesh salaried income tax engine behind [tax.nadimtuhin.com](https://tax.nadimtuhin.com).

Instead of prompting an LLM to guess Bangladesh slab widths, category thresholds, salary exemptions, or Section 78 rebate caps, connect this MCP server and let Claude Desktop, Claude Code, Hermes, or OpenCode call the exact same pure functions used by the web app.

## Architecture & Shared Logic

Zero tax constants or formulas are duplicated in this package:

- `src/utils/taxSlabs.js`, `src/utils/taxSlabs2025.js`, `src/utils/taxSlabs2026.js`, and `src/utils/taxEngine.js` hold the canonical rules, exemptions, slabs, rebates, and minimum tax logic.
- Both the Vue/Vuex web app (`src/store/salaries.js`, `src/calculateTaxBreakdown*.js`) and this MCP server (`packages/mcp/src/engine.js`) import directly from `src/utils/taxEngine.js`.
- When packed for npm (`npm pack` / `npm publish`), `scripts/sync-vendor.js` copies `src/utils/*.js` into `vendor/utils/` so the published tarball runs standalone while keeping git single-sourced.

## Requirements

- Node.js 20 or newer

## Install

### Option A: Run from local clone (works immediately, no npm publish needed)

```bash
git clone https://github.com/nadimtuhin/tax-calculator.git
cd tax-calculator/packages/mcp
npm install
```

Your entrypoint path is:

```text
/ABSOLUTE/PATH/TO/tax-calculator/packages/mcp/bin/tax-calculator-mcp.js
```

### Option B: Run via `npx` (when published to npm)

```bash
npx -y @nadimtuhin/tax-calculator-mcp
```

---

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bangladesh-tax": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/tax-calculator/packages/mcp/bin/tax-calculator-mcp.js"
      ]
    }
  }
}
```

Or via `npx` if published:

```json
{
  "mcpServers": {
    "bangladesh-tax": {
      "command": "npx",
      "args": ["-y", "@nadimtuhin/tax-calculator-mcp"]
    }
  }
}
```

### Claude Code

```bash
# Local clone
claude mcp add bangladesh-tax -- node /ABSOLUTE/PATH/TO/tax-calculator/packages/mcp/bin/tax-calculator-mcp.js

# Or via npx (if published)
claude mcp add bangladesh-tax -- npx -y @nadimtuhin/tax-calculator-mcp
```

### Hermes Agent

Add to `~/.hermes/config.yaml` under `mcp_servers`:

```yaml
mcp_servers:
  bangladesh_tax:
    command: "node"
    args:
      - "/ABSOLUTE/PATH/TO/tax-calculator/packages/mcp/bin/tax-calculator-mcp.js"
```

Or via `npx` if published:

```yaml
mcp_servers:
  bangladesh_tax:
    command: "npx"
    args: ["-y", "@nadimtuhin/tax-calculator-mcp"]
```

### OpenCode

Add to `~/.config/opencode/opencode.json` (global) or `opencode.json` (project root). Note that OpenCode expects `"type": "local"` and `command` as an array:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "bangladesh-tax": {
      "type": "local",
      "command": [
        "node",
        "/ABSOLUTE/PATH/TO/tax-calculator/packages/mcp/bin/tax-calculator-mcp.js"
      ],
      "enabled": true
    }
  }
}
```

Or via `npx` if published:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "bangladesh-tax": {
      "type": "local",
      "command": ["npx", "-y", "@nadimtuhin/tax-calculator-mcp"],
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

---

## Optional Streamable HTTP / SSE Mode

By default the binary serves stdio. Pass `--http` to run a Streamable HTTP / SSE MCP endpoint with localhost `Host` and `Origin` DNS-rebinding guards:

```bash
node packages/mcp/bin/tax-calculator-mcp.js --http --port 3000
# MCP endpoint: http://127.0.0.1:3000/mcp
# Health check: http://127.0.0.1:3000/health
```

Connect from OpenCode (`"type": "remote", "url": "http://127.0.0.1:3000/mcp", "enabled": true`) or Hermes (`url: "http://127.0.0.1:3000/mcp"`).

---

## Tools Reference & Examples

All tools are pure, stateless, read-only calculations (`readOnlyHint: true`, `idempotentHint: true`).

### 1. `list_years`

Returns supported fiscal/income years (`2023-24`, `2024-25`, `2025-26`, `2026-27`), assessment years, slab rates, categories, locations, salary exemption rules, and investment caps.

**Input:**

```json
{}
```

### 2. `get_rules`

Returns category thresholds, additive parent-of-disabled allowance, progressive slab bands, rebate formula/caps, and minimum tax for a fiscal year without calculating tax on an income.

**Input:**

```json
{
  "year": "2026-27",
  "category": "female",
  "parent_of_disabled": true
}
```

**Output (excerpt):**

```json
{
  "fiscal_year": "2026-27",
  "assessment_year": "2027-28",
  "thresholds_bdt": {
    "general": 400000,
    "female": 450000,
    "senior": 450000,
    "disabled": 525000,
    "third_gender": 525000,
    "freedom_fighter": 550000
  },
  "parent_of_disabled_allowance_bdt": 50000,
  "requested_profile": {
    "category": "female",
    "effective_category": "female",
    "age": null,
    "parent_of_disabled": true,
    "effective_threshold_bdt": 500000
  },
  "rebate_rules": {
    "taxable_income_rate_percent": 3,
    "investment_rate_percent": 10,
    "max_cap_bdt": 750000,
    "formula": "min(3% of taxable income, 10% of eligible investment, BDT 750,000)"
  }
}
```

### 3. `calculate_tax`

Calculates tax from either post-exemption `taxable_income` OR itemized `income` components (`period: "monthly"` or `"annual"`).

**Example A — Direct taxable income:**

```json
{
  "year": "2026-27",
  "category": "general",
  "taxable_income": 1500000,
  "investments": 200000,
  "tds": 30000
}
```

**Output (excerpt):**

```json
{
  "fiscal_year": "2026-27",
  "assessment_year": "2027-28",
  "tax_free_threshold_bdt": 400000,
  "taxable_income_bdt": 1500000,
  "gross_tax_bdt": 170000,
  "minimum_tax_bdt": 5000,
  "is_minimum_tax_applied": false,
  "total_tax_bdt": 170000,
  "rebate_bdt": 20000,
  "tds_bdt": 30000,
  "payable_tax_bdt": 120000
}
```

**Example B — Monthly salary components + itemized investments:**

```json
{
  "year": "2025-26",
  "category": "general",
  "age": 67,
  "parent_of_disabled": true,
  "location": "dhaka",
  "income": {
    "period": "monthly",
    "basic": 60000,
    "house": 30000,
    "medical": 8000,
    "transport": 5000,
    "bonus": 100000
  },
  "investments": {
    "dps": 150000,
    "savings_certificate": 600000,
    "apply_instrument_caps": true
  },
  "tds": 15000
}
```

### 4. `compare_years`

Side-by-side comparison across two fiscal years (defaults to `2025-26` vs `2026-27`) with identical inputs.

**Input:**

```json
{
  "from_year": "2024-25",
  "to_year": "2025-26",
  "category": "general",
  "taxable_income": 3600000,
  "investments": { "mutual_fund": 800000 }
}
```

**Output (`comparison` block):**

```json
{
  "threshold_diff_bdt": 50000,
  "gross_tax_diff_bdt": 10000,
  "rebate_diff_bdt": 5000,
  "total_tax_diff_bdt": 5000,
  "payable_tax_diff_bdt": 5000,
  "tax_savings_bdt": 0,
  "additional_tax_bdt": 5000,
  "verdict": "increase",
  "summary": "Total tax increases by BDT 5,000 in FY 2025-2026 vs FY 2024-2025; final payable after rebate and TDS increases by BDT 5,000 (BDT 625,000 -> BDT 630,000)."
}
```

## Testing & Publishing

```bash
# Run MCP unit + protocol (stdio, legacy handshake, HTTP, tarball) tests
cd packages/mcp
npm test

# Publish to npm (when authenticated)
npm publish --access public --ignore-scripts=false
```
