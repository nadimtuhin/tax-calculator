# v2 final status

Branch: `cursor/build-v2-tax-calculator-34d2`

## What works

- **`apps/web-v2/`** — approved ideas3 flow in React 19 + Vite 8: four yes/no questions → chips, sliders/chips only, scenarios (none, raise, jobchange, missed, bonus, combo), money-flow SVG bands, sticky tax payable, FY 2025-26 / 2026-27 toggle, “Ask a lawyer” → production `/referrals`.
- **Tax engine** — no logic changes; v2 imports `calculateTaxForYear` from `src/utils/taxEngine.js`.
- **Employer labels** — auto Previous job / Current job; optional rename via `prompt()` (tap name).
- **Raise month** — chips clamped to last employer’s range.

## Tests

| Suite | Result |
|--------|--------|
| `tests/v2/scenarioParity.test.js` | 9 passed |
| `scripts/bend-verify.mjs` | 9/9 Bend slab batch OK (+ 2 high incomes JS-only) |
| Full Jest suite (`yarn test`) | 26 suites, 572 passed (incl. 9 new parity tests) |

## Bend

- Installed: `bend-lang 0.2.38`, `hvm 2.0.22`.
- Caveat: U24 overflow on very large taxable incomes — documented in `stack.md`.

## Screenshots (390px)

`.agent-run/v2-shots/`:

- `none-mobile.png`, `raise-mobile.png`, `jobchange-mobile.png`, `missed-mobile.png`, `bonus-mobile.png`, `combo-mobile.png`
- Plus `questions-mobile.png` for the opening flow.

## Not touched

- `master`, `packages/mcp`, PR #100, production Vue app under `src/`.

## Unverified

- Desktop layout polish beyond responsive CSS (mobile-first priority per brief).
- Production deploy path for `/v2/` static assets (build outputs to `apps/web-v2/dist/` with `base: /v2/`).