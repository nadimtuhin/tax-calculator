# v2 final status (post PR #102 review fixes)

Branch: `cursor/build-v2-tax-calculator-34d2` · Draft PR **#102**

## Review fixes (by finding)

| # | Change |
|---|--------|
| **HIGH 1** | `clampJobChain`, `pickJobMonth`, `addJobToChain`; `buildScenario` uses per-month employer ownership (no `+=` double count); new employer starts at `prev.to + 1`. |
| **HIGH 2** | `tests/v2/scenarioParity.test.js` replaced with pinned payable fixtures (missed 850k, raise months 0/6/11, combo 1.08M+bonuses, bonus field mapping, overlap/add-employer). |
| **MEDIUM 3** | `EmployerName` inline edit (blur/Enter); removed `window.prompt`. |
| **MEDIUM 4** | Bend `slab_cut` uses `((amount*rate)+50)/100` to match `Math.round`; added taxable **400006**; spot checks fail harness on mismatch; `yarn v2:verify-bend` in CI (exit 0 skip if no `bend`). |
| **MEDIUM 5** | `createInitialState().year` from `DEFAULT_FISCAL_YEAR` in tax engine. |
| **MEDIUM 6** | FY tabs `role=tab` + `aria-selected`; month chips `aria-pressed`; slider `aria-*` + `:focus-visible` ring; timeline 2×6 grid, 44px cells. |
| **LOW 7** | Removed unused `@tanstack/react-router`, `motion`, `vitest`, testing-library, `jsdom`; dropped unused vite alias; page title set; removed `editing` from scenario state. |
| **LOW 8** | Engine errors surface via `computeTax().error` and result `role=alert` panel. |

## Verification

| Check | Result |
|--------|--------|
| `yarn test` | 572 passed (+ 9 v2 fixture tests) |
| `npm --prefix apps/web-v2 run build` | OK |
| `yarn lint` / `apps/web-v2` oxlint | OK (warnings only) |
| `yarn v2:verify-bend` | 10/10 slab + 3 spot checks OK |

## Screenshots

Re-shot **jobchange** and **missed** at 390px in `.agent-run/v2-shots/` (employer chain + unpaid-month grid).

## Unchanged constraints

- No tax logic/rate edits; Vue `src/` app, `/mcp`, `packages/mcp`, referrals behavior untouched.