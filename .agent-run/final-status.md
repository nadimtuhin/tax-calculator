# v2 final status (post PR #102 re-review — 2 MEDIUM)

Branch: `cursor/build-v2-tax-calculator-34d2` · Draft PR **#102**

## Re-review fixes (this pass)

| # | Change |
|---|--------|
| **MEDIUM 1 (June overlap)** | `clampJobChain` drops jobs with `from > 11` and loops until stable; `pickJobMonth` removes trailing employers when June tap leaves no room; `canAddJobToChain` + hide/disable **+ Add employer** when the chain ends in June; tests for June tap and add-no-op. |
| **MEDIUM 2 (Bend rounding)** | Generated `verify/js_slab_exceptions.bend` (2567 JS float slab-cut overrides, `scripts/gen-bend-slab-cut.mjs`); Bend harness concatenates exceptions + batch; taxable **700410** in batch; U24 high-income exclusion unchanged in harness. |

## Earlier review fixes (still in place)

| # | Summary |
|---|---------|
| HIGH 1–2, MEDIUM 3–6, LOW 7–8 | Employer chain guards, pinned v2 fixtures, EmployerName a11y, DEFAULT_FISCAL_YEAR, UI a11y, dep cleanup, engine error panel. |

## Verification (this pass)

| Check | Result |
|--------|--------|
| `npm test` | 574 passed (incl. 2 new employer-chain tests) |
| `npm --prefix apps/web-v2 run build` | OK |
| `apps/web-v2` oxlint | OK (warnings only) |
| `yarn v2:verify-bend` | **SKIP** — `bend` not on PATH in this VM (`cargo install bend-lang` needs newer Cargo for edition2024); CI installs bend when available |

## Bend maintenance

```bash
npm run v2:gen-bend-slab   # regenerate verify/js_slab_exceptions.bend after slab/year changes
npm run v2:verify-bend     # compares Bend batch to JS gross slab tax
```

## Unchanged constraints

- No `src/utils/taxEngine.js` tax logic/rate edits; Vue `src/`, MCP, referrals untouched.