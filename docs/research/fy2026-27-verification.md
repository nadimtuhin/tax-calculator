# FY 2026-27 Tax Rules — Research Notes and Source Verification

**Income year:** 1 July 2026 – 30 June 2027  
**Assessment year:** AY 2027-28  
**Enacted:** Finance Act 2026 (6 July 2026)

---

## Verification Status

| Rule | Implemented Value | Sources | Status |
|---|---|---|---|
| General threshold | Tk 4,00,000 | PwC FA2026, KPMG FB2026, Daily Star 2026 | ✅ Confirmed |
| Female / 65+ threshold | Tk 4,50,000 | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Disabled / third-gender threshold | Tk 5,25,000 | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Freedom fighter / July Warrior threshold | Tk 5,50,000 | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Parent of disabled child | +Tk 50,000 (one parent) | PwC FA2026 | ✅ Confirmed |
| Slab rates | 10/15/20/25/30% (unchanged) | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Slab bands | 3L/4L/5L/20L/rest (unchanged) | PwC FA2026 | ✅ Confirmed |
| Minimum tax | Flat Tk 5,000 | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Minimum tax (first-time) | Tk 1,000 | PwC FA2026 | ✅ Confirmed |
| Salary exemption | Lower of 1/3 salary or Tk 5,00,000 | Existing code (unchanged from FY 2025-26) | ✅ Confirmed (no change) |
| Investment rebate rate | 10% of investment (↓ from 15%) | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Investment rebate cap | Tk 7,50,000 (↓ from Tk 10,00,000) | PwC FA2026, KPMG FB2026 | ✅ Confirmed |
| Rebate formula | min(3% income, 10% investment, 7.5L) | PwC FA2026 | ✅ Confirmed |

---

## Primary Sources Used

1. **PwC Finance Act 2026 Key Amendments**  
   https://www.pwc.com/bd/en/assets/pdfs/budget/finance-act-2026-key-amendments.pdf  
   → Confirmed thresholds, slab rates, minimum tax, rebate formula (3%/10%/7.5L)

2. **PwC Tax Summaries — Bangladesh Individual Tax**  
   https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income  
   → Cross-check on thresholds and slab structure

3. **KPMG Salient Features of Finance Bill 2026 (Tax and VAT)**  
   https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Salient_features_of_Finance_Bill_2026(Tax-and_VAT).pdf  
   → Confirmed thresholds, minimum tax, rebate cap change

4. **The Daily Star — Finance Bill passed (FY 2026-27)**  
   https://www.thedailystar.net/business/bangladesh-budget-2025-26/news/finance-bill-passed-tax-free-income-threshold-set-tk-4-lakh-fy2026-27-4211511  
   → Confirmed Tk 4,00,000 general threshold enacted

5. **Perplexity Research (fy2026-27-rules.md in this repo)**  
   Used as starting point; all numbers cross-checked against primary sources above.

---

## Contradictions Found in Research Notes

The research notes (docs/research/fy2026-27-rules.md) stated for FY 2025-26 investment rebate:
> "lowest of 3% of income, **15%** of investment, Tk **10,00,000**"

But the existing `taxSlabs2025.js` had a *tiered* rebate percentage function (`getRebatePercentage2025`) with rates 10–20% depending on income. That getter was not used consistently — the Vuex store's `investmentRebate` getter (for FY 2024-25) already used `min(3%, 15%, 10L)`, and `investmentRebate2025` called the tiered function indirectly.

**Resolution:** Aligned FY 2025-26 rebate to `min(3% income, 15% investment, Tk 10L)` per PwC Tax Summaries and the ACNABIN Finance Ordinance 2025 summary. Removed the tiered `getRebatePercentage2025` and `maxRebateableInvestment2025` getters (these were internal to the old 2025 logic and inconsistent with NBR practice).

---

## Items Not Independently Verified

- **Salary exemption cap Tk 5,00,000**: Carried forward unchanged from FY 2025-26 implementation. Research notes confirm "continues for FY 2026-27" but no Finance Act 2026 PDF was directly read (the PwC briefing confirms continuity).
- **July Warrior category**: Added to `freedom_fighter` bucket per research notes citing Finance Act 2026. Confirmed in PwC briefing text but the specific gazette threshold (Tk 5,50,000) was verified against KPMG only as "gazetted war-wounded freedom fighter" without explicit mention of "July Warrior" in the numerical table. Treated as same category.
- **Wealth surcharge**: Not implemented (out of scope for this salaried-income calculator). Structure noted in research for completeness.

---

## FY 2025-26 Implementation Correctness Check

The existing FY 2025-26 (Finance Ordinance 2025, 3 June 2025) implementation was verified:

| Item | Implemented | Expected | Correct? |
|---|---|---|---|
| General threshold | 375,000 | 375,000 | ✅ |
| Female / 65+ | 425,000 | 425,000 | ✅ |
| Disabled / third-gender | 500,000 | 500,000 | ✅ |
| Freedom fighter | 525,000 | 525,000 | ✅ |
| Minimum tax (all locations) | 5,000 | 5,000 | ✅ |
| Slab rates | 0/10/15/20/25/30% | 0/10/15/20/25/30% | ✅ |
| Investment rebate | min(3%/15%/10L) | min(3%/15%/10L) | ✅ (after fix) |

Source for FY 2025-26 check: ACNABIN Finance Ordinance 2025 Summary (https://bti-global.files.svdcdn.com/production/network/bangladesh/documents/Reports/Summary-of-Important-Changes-Introduced-by-the-Finance-Ordinance-2025-of-BD-ACNABIN.pdf)
