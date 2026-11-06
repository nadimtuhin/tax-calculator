# Resolution: FY 2025-26 (Income Year 2025-26 / AY 2026-27) Tax-Free Thresholds

**Date:** 5 November 2026  
**Question:** Should the app's **FY 2025-26** column (Income Year 1 July 2025 – 30 June 2026, assessed in **Assessment Year 2026-27**) use the **400k-family** thresholds or remain at the **375k-family** thresholds?

## Verdict: **YES — Raise FY 2025-26 to the 400k-family thresholds**

### Statutory Chain & Why 375k Was Superseded
1. **Finance Ordinance 2025 (June 2025, effective 1 July 2025):** Kept AY 2025-26 (Income Year 2024-25) at Tk 3,50,000 general and *prospectively* scheduled Tk 3,75,000 general (Tk 4,25,000 women/65+; Tk 5,00,000 disabled/third gender; Tk 5,25,000 gazetted war-wounded freedom fighters & July Warriors) for **AY 2026-27 and AY 2027-28**.
2. **Finance Bill 2026 (tabled 11 June 2026):** Initially retained those prospective Tk 3,75,000 thresholds for AY 2026-27 and AY 2027-28.
3. **Enacted Finance Act 2026 (passed by Parliament 29 June 2026, effective 1 July 2026):** Before AY 2026-27 commenced on 1 July 2026, Parliament amended **Schedule 1** so that **both Assessment Year 2026-2027 (Income Year 2025-26) and Assessment Year 2027-2028 (Income Year 2026-27)** use the **400k-family thresholds**:

| Taxpayer Category | Superseded FO 2025 / Bill | Enacted Finance Act 2026 (AY 2026-27 & AY 2027-28) |
|---|---:|---:|
| General taxpayer | Tk 3,75,000 | **Tk 4,00,000** |
| Women & senior citizens (65+) | Tk 4,25,000 | **Tk 4,50,000** |
| Persons with disabilities | Tk 5,00,000 | **Tk 5,25,000** |
| Third-gender taxpayers | Tk 5,00,000 | **Tk 5,25,000** |
| Gazetted war-wounded freedom fighters & gazetted July Warriors | Tk 5,25,000 | **Tk 5,50,000** |
| Parent / legal guardian of a person with disability | +Tk 50,000 | **+Tk 50,000** (additive, one parent) |

### Why PwC Grouped "FY 2025/26 and FY 2026/27" Together
In PwC Worldwide Tax Summaries terminology, **FY = Financial / Income Year**. Thus **FY 2025/26** = Income Year 2025-26 (**AY 2026-27**) and **FY 2026/27** = Income Year 2026-27 (**AY 2027-28**) — the exact two assessment years grouped in **Schedule 1 of the Finance Act 2026**. There is no conflict between PwC and the Finance Act / NBR; both reflect the enacted Schedule 1.

### Sources Verified
1. **ACNABIN Chartered Accountants — *Important Changes Introduced by the Finance Act, 2026* (Final Book, Sections 1.1 & 1.3, pp. 1–3):** Explicitly heads the enacted column **"Assessment years 2026-2027 & 2027-2028"** with General **400,000**, Women & 65+ **450,000**, Third gender & physically challenged **525,000**, Gazetted war-wounded freedom fighters **550,000**, Gazetted "July Warriors" **550,000**, and Parent/guardian **+50,000**.  
   URL: https://bti-global.files.svdcdn.com/production/network/bangladesh/documents/Reports/ACNABIN-Important-Changes-Introduced-by-the-Finance-Act-2026-Book-Final.pdf
2. **Tuhin & Partners — *The Finance Act 2026: A Practitioner's Guide* (July 2026, p. 24, citing Finance Act 2026, Schedule 1):** Explicitly heads the enacted column **"AY 2026-27 & 2027-28"** with First Tk **4,00,000** (0%), Women/65+ **4,50,000**, Third gender/disabilities **5,25,000**, Gazetted freedom fighters/July fighters **5,50,000**, Parent of child with disability **+Tk 50,000**.  
   URL: https://tnp.legal/wp-content/uploads/2026/07/TNP_Finance_Act_2026_Briefing.pdf
3. **PwC Worldwide Tax Summaries — Bangladesh Individual Taxes on Personal Income:** Lists **"FY 2025/26 and FY 2026/27"** with General **BDT 400,000**, Women/65+ **BDT 450,000**, Physically challenged / Third-gender **BDT 525,000**, War-wounded gazetted freedom fighters **BDT 550,000**, Parent/guardian **+BDT 50,000**.  
   URL: https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income
4. **PwC Bangladesh — *Finance Act 2026 Key Amendments* & NBR *আয়কর পরিপত্র ২০২৬–২০২৭* (2 Sept 2026):** Confirm **BDT 400,000** general threshold for AY 2026-27 returns (see `docs/research/v-ay2026-27.md`).  
   URLs: https://www.pwc.com/bd/en/assets/pdfs/budget/finance-act-2026-key-amendments.pdf · https://nbr.gov.bd/taxtypes/income-tax/income-tax-paripatra/eng
5. **Parliamentary Enactment Coverage (29 June 2026):** *The Daily Star* and *Prothom Alo* report Parliament passing Finance Bill 2026 with revised thresholds raising Tk 3,75,000 → **Tk 4,00,000** for the first two-year block (AY 2026-27 and AY 2027-28).  
   URLs: https://www.thedailystar.net/business/bangladesh-budget-2025-26/news/finance-bill-passed-tax-free-income-threshold-set-tk-4-lakh-fy2026-27-4211511 · https://en.prothomalo.com/bangladesh/hrn64bcuy0

### Remaining Nuances Out of Scope for This Fix
1. **Section 78 Investment Rebate Timing:** Finance Act 2026 amended ITA 2023 Section 78 (`min(3% taxable income, 10% investment, Tk 7,50,000)`, down from `15%` / `Tk 10,00,000`) with general effective date **1 July 2026** (the start of AY 2026-27). Several practitioner analyses treat the 10% / Tk 7.5L rebate rule as already governing AY 2026-27 returns (Income Year 2025-26), while the calculator currently retains 15% / Tk 10L in the FY 2025-26 column to contrast pre-FA2026 vs FA2026 investment rebate rules. If FY 2025-26 also adopts 10% / Tk 7.5L, both columns become identical across all modeled parameters.
2. **Employment Exemption Formula:** The calculator's shared `taxableSalary` breakdown still uses legacy component-wise exemptions (house max Tk 3L + medical max Tk 1.2L + transport max Tk 30k = Tk 4.5L) across all years rather than the ITA 2023 Sixth Schedule single-pool rule (`min(1/3 gross employment income, Tk 5,00,000)` from AY 2026-27 onward; Tk 4,50,000 in AY 2025-26).
