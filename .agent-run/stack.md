# v2 stack rationale (November 2026)

## Frontend: `apps/web-v2/`

| Piece | Choice | Why |
|--------|--------|-----|
| Build | **Vite 8** (Rolldown-backed) | Fast HMR, small SPA bundle; no SSR needed for an interactive calculator |
| UI | **React 19** | Mature ecosystem for SVG/money-flow components; pairs well with Vite |
| Language | **TypeScript** | Safer props for slab/band components; scenario logic stays in plain JS for Jest sharing |
| Animation | **CSS + SVG** (prototype bands) | Keeps bundle light; view transitions not required for parity with ideas3 |

**Why not Next.js:** v2 is a client-only scenario UI that imports the existing ESM tax engine from `src/utils/`. A server framework adds routing/build complexity without SEO benefit for this sandbox (`/v2/`).

**Tax math:** unchanged — `calculateTaxForYear` from `src/utils/taxEngine.js`. v2 only maps salary scenarios → engine inputs.

## Bend (HigherOrderCO `bend-lang` 0.2.38)

- **Install:** `cargo install hvm bend-lang` (Rust **stable 1.100+**; system Cargo 1.83 is too old for current crates).
- **Use:** `verify/slab_batch.bend` independently recomputes FY 2026-27 **gross slab tax** for a batch of taxable incomes; `scripts/bend-verify.mjs` compares to `calculateSlabBreakdown` + `sumSlabTax` from the JS engine.
- **Runner:** `bend run-c` (parallel C backend). `slab_cut` uses `((amount*rate)+50)/100` to match JS `Math.round`. Verified **10/10** in-range cases (includes taxable **400006**); full-engine spot checks **assert/fail**.
- **Limit:** Bend 0.2.x **U24** integers overflow above ~1.7M BDT in multi-slab sums; incomes **2.5M** and **5.0M** are checked in JS only (logged by the harness, not faked).

## Commands

```bash
yarn v2:dev          # http://127.0.0.1:5174/v2/
yarn v2:build
yarn v2:verify-bend
yarn test tests/v2/scenarioParity.test.js
node scripts/v2-journey-shots.mjs
```