# Full Statutory Audit of Bangladesh Tax Calculator Rules (7-Pass `pwm` + Primary PDF Verification)

**Date:** 5 November 2026  
**Audited Commit:** `fed71a2` (`master` after PR #85)  
**Scope:** Line-by-line verification of every tax rule encoded in `src/store/salaries.js`, `src/utils/taxSlabs*.js`, `src/calculateTaxBreakdown*.js`, and Vue UI components against the **Income Tax Act 2023 (ITA 2023)**, **Finance Act 2024**, **Finance Ordinance 2025**, **Finance Act 2026** (enacted 29–30 June 2026, effective 1 July 2026), **NBR *আয়কর পরিপত্র ২০২৫–২০২৬* & *২০২৬–২০২৭***, **NBR *আয়কর নির্দেশিকা ২০২৫–২০২৬* & *২০২৬–২০২৭***, **Return Form IT-11GA(2023)**, and practitioner briefings (**ACNABIN**, **PwC**, **KPMG**, **Tuhin & Partners**).

---

## Executive Summary

Across **7 multi-model `pwm` research passes** (`gpt6_sol` thinking, `claude_opus55` thinking, `gemini_pro`, `gpt56_sol` thinking, and a 3-model `pwm council` synthesis) cross-checked directly against extracted pages of the **ACNABIN Finance Act 2026 Final Book**, **PwC Finance Act 2026 Key Amendments**, **Tuhin & Partners Finance Act 2026 Guide**, and **NBR Bangla *আয়কর নির্দেশিকা ২০২৬–২০২৭***:

- **What is 100% accurate today:**
  1. **Tax-free thresholds** across `FY 2024-25` (`3.5L / 4.0L / 4.75L / 5.0L`), `FY 2025-26` (`4.0L / 4.5L / 5.25L / 5.5L`), and `FY 2026-27` (`4.0L / 4.5L / 5.25L / 5.5L`).
  2. **Progressive slab bands & rates** across all three years (`FY 2024-25`: `1L@5%, 4L@10%, 5L@15%, 5L@20%, 20L@25%, rest@30%` per FA 2024 Schedule 3 for AY 2025-26; `FY 2025-26` & `FY 2026-27`: `3L@10%, 4L@15%, 5L@20%, 20L@25%, rest@30%`, 5% band abolished).
  3. **Base minimum tax amounts** (`FY 2024-25`: location-based `Tk 5,000 / 4,000 / 3,000`; `FY 2025-26` & `FY 2026-27`: nationwide flat `Tk 5,000`, `Tk 1,000` for first-time filers, though first-time filer toggle is not yet wired into the UI).

- **7 Verified Discrepancies / Bugs Found in Current Code:**
  1. **[HIGH — Provable Formula Bug] Employment Income Exemption (`salaries.js:270-298`, `TaxableIncome.vue`):** Still uses **repealed ITO 1984 component-wise caps** (`House min(50% basic, 3L) + Medical min(10% basic, 1.2L) + Transport 30k = max 4.5L`). ITA 2023 Sixth Schedule Part 1 Para 27 abolished component exemptions and replaced them with a **single pool: `min(1/3 of gross employment income, Tk 5,00,000)`** across **all three** supported years (`AY 2025-26`, `AY 2026-27`, `AY 2027-28`; raised from `Tk 4,50,000` to `Tk 5,00,000` by Finance Ordinance 2025).
  2. **[HIGH — Provable Formula Bug] Minimum Tax Charged When Income ≤ Threshold (`salaries.js:377, 418, 456`):** `totalTax = Math.max(calculatedTax, minimumTax)` imposes `Tk 5,000` minimum tax even when `taxableSalary === 0` or `taxableSalary <= taxFreeThreshold`. Statutorily, minimum tax is **strictly `Tk 0`** unless taxable income **exceeds** the applicable tax-free threshold (even for mandatory PSR returns u/s 264).
  3. **[HIGH — Provable Formula Bug] Section 78 Rebate Allowed to Push Tax Below Minimum Tax Floor (`salaries.js:385, 426, 464`):** `payableTax = Math.max(0, totalTax - totalTds - investmentRebate)` deducts `investmentRebate` *after* the minimum-tax check. Per Return Form **IT-11GA(2023) Lines 12–16**, pre-TDS liability when `taxableSalary > threshold` is **`max(calculatedTax - investmentRebate, minimumTax)`** — Section 78 rebate **cannot** reduce tax below `Tk 5,000` minimum tax; only **Section 86 salary TDS / advance tax** can reduce net balance payable to `0` (or a refund).
  4. **[HIGH — Statutory Timing Conflict] Section 78 `10% / Tk 7,50,000` Already Governs `FY 2025-26 (AY 2026-27)` (`salaries.js:401-407`):** Finance Act 2026 took effect **1 July 2026** (start of **AY 2026-27**, which assesses **Income Year / FY 2025-26**). Both **NBR *আয়কর নির্দেশিকা ২০২৬–২০২৭*** and **NBR *আয়কর পরিপত্র ২০২৬–২০২৭* (p. 61)** apply `min(3% taxable income, 10% eligible investment, Tk 7,50,000)` to **AY 2026-27 (FY 2025-26)** as well as **AY 2027-28 (FY 2026-27)**. Currently `investmentRebate2025` still uses `15% / Tk 10,00,000` (the AY 2025-26 / superseded FO 2025 figure). *Product implication:* Updating FY 2025-26 to `10% / 7.5L` makes FY 2025-26 and FY 2026-27 100% identical unless the comparison view shifts to **FY 2024-25 (AY 2025-26) vs FY 2025-26/2026-27**.
  5. **[MEDIUM — Provable Formula Bug] Sixth Schedule Part 3 Per-Instrument Caps Ignored in Rebate Getters (`salaries.js:320, 404, 444`, `Investment.vue`):** `state.investments` defines `DPS (max 1,20,000)`, `Savings certificate (max 5,00,000)`, and `Mutual fund (max 5,00,000)`, yet `investmentRebate`, `investmentRebate2025`, and `investmentRebate2026` multiply **uncapped `getters.totalInvestment`** instead of the Part 3 capped sum! Additionally:
     - Finance Act 2026 **removed the `Tk 5,00,000` sub-limit on Mutual Funds / Unit Certificates / ETFs** from AY 2026-27 onward (subject only to the overall Section 78 ceiling, i.e., effective investment up to `Tk 75,00,000`).
     - Life insurance premium is statutorily capped at **10% of policy sum assured** (currently `infinity` in store).
     - `Investment.vue` hardcodes `15%` in the summary table and displays the obsolete pre-2023 `20% of taxable income` (`taxableSalary / 5`) limit.
  6. **[LOW-MEDIUM — Granularity Gap] Parent/Guardian of Disabled Person (`+Tk 50,000` per child):** UI/store models `parentOfDisabled` as a boolean (`+Tk 50,000` once), whereas Schedule 1 grants **`+Tk 50,000` for *each* disabled child/dependent** (claimable by one taxpayer parent if both parents are taxpayers).
  7. **[LOW — Mutation Bug + Missing Optional Concessions]:**
     - `resetSalaries()` (`salaries.js:168-173`) resets breakdown keys to `{ basic, house, medical, transport, lfa }` instead of `others: 0`, leaving `month.breakdown.others === undefined` (`NaN` in `totalOthersBreakdown`).
     - First-time filer `Tk 1,000` minimum tax (`getMinimumTax2026(location, isFirstTime)` exists in `taxSlabs2026.js:131` but has no UI toggle and is missing in `taxSlabs2025.js`).
     - New **Finance Act 2026 Section 173 Early-Filing Rebate** (`5% of payable tax, max Tk 25,000` when filed `1 July – 30 September`) is not modeled.

---

## Detailed Rule-by-Rule Verification Matrix

### 1. Year Mapping Terminology (Why Sources Appear to Conflict)
In Bangladesh tax statutes:
- **Income Year / Financial Year (`FY YYYY-(YY+1)`)**: `1 July YYYY – 30 June (YYYY+1)`, when salary is earned and investments are made.
- **Assessment Year (`AY (YYYY+1)-(YY+2)`)**: `1 July (YYYY+1) – 30 June (YYYY+2)`, when that income is assessed and the return is filed.

| App Label | Income Year (Earned) | Assessment Year (Filed) | Governing Enacted Statute |
|---|---|---|---|
| **FY 2024-2025** | 1 Jul 2024 – 30 Jun 2025 | **AY 2025-26** | Finance Act 2024 (Schedule 3) + Finance Ordinance 2025 (substantive amendments effective 1 Jul 2025) |
| **FY 2025-2026** | 1 Jul 2025 – 30 Jun 2026 | **AY 2026-27** | **Finance Act 2026** (enacted 29–30 Jun 2026, effective **1 Jul 2026**, superseding FO 2025's prospective schedule) |
| **FY 2026-2027** | 1 Jul 2026 – 30 Jun 2027 | **AY 2027-28** | **Finance Act 2026** (5-year rate card covering AY 2026-27 through AY 2030-31) |

> **Source Conflict Explained:** Some AI models and June 2025 / early June 2026 summaries cite `Tk 3,75,000` general threshold, `Tk 5,25,000` FF threshold, `15% / Tk 10L` rebate, and `Tk 5L` mutual fund cap for `AY 2026-27` because they read **Finance Ordinance 2025** or the **11 June 2026 Finance Bill** rather than the **enacted Finance Act 2026** (passed 29 June 2026, effective 1 July 2026) and **NBR *আয়কর নির্দেশিকা ২০২৬–২০২৭***. Furthermore, a stray `Tk 5,75,000` figure in some blog posts comes from misreading the **AY 2028-29 & 2029-30** column for disabled/third-gender taxpayers in FA 2026 Schedule 1.

---

### 2. Tax-Free Thresholds & Taxpayer Categories

| Category | Statutory Qualification | FY 2024-25 (AY 2025-26) | FY 2025-26 (AY 2026-27) | FY 2026-27 (AY 2027-28) | App Status |
|---|---|---:|---:|---:|---|
| **General** | Default individual / HUF | Tk 3,50,000 | Tk 4,00,000 | Tk 4,00,000 | ✅ Matches |
| **Woman** | Female individual taxpayer | Tk 4,00,000 | Tk 4,50,000 | Tk 4,50,000 | ✅ Matches |
| **Senior Citizen (65+)** | Aged **65 or above on or before 30 June** of the income year | Tk 4,00,000 | Tk 4,50,000 | Tk 4,50,000 | ✅ Matches (auto-upgrades if `age >= 65` unless higher category selected) |
| **Person with Disability** | Registered/certified by Dept. of Social Services under *Rights and Protection of Persons with Disabilities Act 2013* | Tk 4,75,000 | Tk 5,25,000 | Tk 5,25,000 | ✅ Matches |
| **Third Gender** | Legally recognized third-gender (*Hijra*) taxpayer | Tk 4,75,000 | Tk 5,25,000 | Tk 5,25,000 | ✅ Matches |
| **Gazetted War-Wounded FF** | Gazetted by Ministry of Liberation War Affairs | Tk 5,00,000 | Tk 5,50,000 | Tk 5,50,000 | ✅ Matches |
| **Gazetted July Warrior** | Injured in July 2024 mass uprising & officially gazetted (*গেজেটভুক্ত জুলাই যোদ্ধা*) | *Not enacted in AY 25-26* | Tk 5,50,000 | Tk 5,50,000 | ⚠️ Combined into `freedom_fighter` chip (`5,00,000` if FY 2024-25 selected, though category did not exist in AY 25-26) |
| **Parent / Guardian of Disabled** | **+Tk 50,000 per disabled child/dependent**; if both parents are taxpayers, **only one** may claim per child | +Tk 50,000 / child | +Tk 50,000 / child | +Tk 50,000 / child | ⚠️ Boolean toggle only (`+50,000` flat, cannot enter 2+ disabled children) |

*(Note: Finance Act 2026 Schedule 1 also pre-legislates **AY 2028-29 & 2029-30** at `4.50L / 5.00L / 5.75L / 6.00L` and **AY 2030-31** at `5.00L / 5.50L / 6.25L / 6.50L`.)*

---

### 3. Progressive Tax Slabs & Rates

| Successive Income Band | FY 2024-25 (AY 2025-26, FA 2024 Sch. 3) | FY 2025-26 (AY 2026-27, FA 2026 Sch. 1) | FY 2026-27 (AY 2027-28, FA 2026 Sch. 1) | App Status |
|---|---:|---:|---:|---|
| Up to applicable threshold | 0% | 0% | 0% | ✅ Matches |
| Next Tk 1,00,000 | 5% | — *(abolished)* | — *(abolished)* | ✅ Matches (`taxSlabs.js` vs `taxSlabs2025/2026.js`) |
| Next Tk 3,00,000 | — | 10% | 10% | ✅ Matches |
| Next Tk 4,00,000 | 10% | 15% | 15% | ✅ Matches |
| Next Tk 5,00,000 | 15% | 20% | 20% | ✅ Matches |
| Next Tk 5,00,000 | 20% | — | — | ✅ Matches |
| Next Tk 20,00,000 | 25% | 25% | 25% | ✅ Matches |
| Balance | 30% | 30% | 30% | ✅ Matches |

*(Note: `taxSlabs.js` `[1, 4, 5, 5, 20]` @ `0/5/10/15/20/25/30%` is exact for FY 2024-25 / AY 2025-26 under FA 2024 Schedule 3; it would only be inaccurate for legacy FY 2023-24 / AY 2024-25, which is no longer exposed in `fiscalYearOptions`.)*

---

### 4. Minimum Tax & Computation Sequence (IT-11GA2023 Lines 12–16)

| Rule Aspect | Statutory Law (Schedule 1 + IT-11GA2023) | Current App (`salaries.js`) | Verdict |
|---|---|---|---|
| **Base rate (AY 2025-26)** | Dhaka North/South & Chattogram CC: `Tk 5,000`; Other CC: `Tk 4,000`; Outside CC: `Tk 3,000` | `5000 / 5000 / 4000 / 3000` | ✅ Matches |
| **Base rate (AY 2026-27 & 2027-28)** | Flat `Tk 5,000` nationwide; **`Tk 1,000` for first-time return filers** (*নতুন করদাতা*) | Flat `5000` (`MINIMUM_TAX_FIRST_TIME_2026 = 1000` defined in `taxSlabs2026.js` but unused) | ⚠️ Missing UI toggle for first-time filer |
| **When `taxableSalary <= threshold`** | **`Tk 0`** (even if filing a mandatory PSR zero-return u/s 264; the proposed `Tk 2,000` PSR tax in Bill 2023 was never enacted) | Charges **`Tk 5,000`** (`Math.max(0, 5000) = 5000`)! | ❌ **BUG** |
| **Rebate vs Minimum Tax floor** | **Line 16 = `max(Gross Slab Tax - Rebate, Minimum Tax)`** when `taxableSalary > threshold`. Section 78 rebate **cannot** push liability below `Tk 5,000`. | `totalTax = max(slabTax, minTax)`, then `payable = max(0, totalTax - tds - rebate)` — lets rebate wipe `Tk 5,000` floor to `0`! | ❌ **BUG** |
| **Salary TDS (Section 86) credit** | Section 86 salary TDS is **not** in the old Section 163(2) final/minimum withholding list; it is a payment credit deducted *after* Line 16 and can reduce balance payable to `0` (or create a refundable excess). | Subtracted from `totalTax`, clamped at `0` (`Math.max(0, ...)`). | ✅ `0` clamp fine for "Payable", though excess refund isn't displayed |

**Exact Correct Formula for Salaried Individual:**
```js
const effectiveMinTax = taxableSalary > taxFreeThreshold ? minimumTax : 0;
const taxAfterRebate = Math.max(0, calculatedTax - investmentRebate);
const netTaxLiability = Math.max(taxAfterRebate, effectiveMinTax); // IT-11GA2023 Line 16
const netPayable = Math.max(0, netTaxLiability - totalTds);
const refundableTds = Math.max(0, totalTds - netTaxLiability);
```

---

### 5. Section 78 Investment Rebate & Sixth Schedule Part 3 Caps

#### A. Section 78 Formula & Effective Assessment Year
- **Statutory Formula:** Lowest of `(a) 3% of taxable income` (excluding exempt, reduced-rate, AoP/partnership share, and final-tax income), `(b) X% of eligible Part 3 investment`, or `(c) absolute cap`.
- **AY 2025-26 (FY 2024-25):** `X = 15%`, cap = `Tk 10,00,000`.
- **AY 2026-27 (FY 2025-26) & AY 2027-28 (FY 2026-27):** Finance Act 2026 amended Section 78 effective **1 July 2026** to **`X = 10%`, cap = `Tk 7,50,000`**. Verified verbatim in **ACNABIN FA 2026 Book (Sec 1.4, p. 4)**, **PwC FA 2026 Key Amendments (p. 6)**, **NBR *আয়কর পরিপত্র ২০২৬–২০২৭* (p. 61)**, and **NBR *আয়কর নির্দেশিকা ২০২৬–২০২৭***.
- **Current App Conflict:** `investmentRebate2025` (`salaries.js:401-407`) still uses `15% / Tk 10,00,000`.

#### B. Sixth Schedule Part 3 Per-Instrument Caps
| Investment Instrument | Statutory Cap (AY 2025-26) | Statutory Cap (AY 2026-27 & 2027-28) | Current App (`salaries.js`) | Verdict |
|---|---|---|---|---|
| **DPS / Approved Monthly Deposit Scheme** | `Tk 1,20,000` / yr (`Tk 10,000`/mo) | `Tk 1,20,000` / yr | `maximum: 120000` in state, **but ignored** in `investmentRebate*`! | ❌ **BUG** (cap ignored in math) |
| **Sanchaypatra & Govt Securities / T-Bonds** | `Tk 5,00,000` **aggregate** | `Tk 5,00,000` **aggregate** | `maximum: 500000` in state, **but ignored** in `investmentRebate*`! | ❌ **BUG** (cap ignored in math) |
| **Mutual Funds / Unit Certificates / ETFs / CIS** | `Tk 5,00,000` | **Sub-limit removed** by FA 2026 (eligible up to overall rebate cap, i.e., `Tk 75L` investment) | `maximum: 500000` in state (and ignored in `investmentRebate*`) | ❌ **Stale cap in UI + ignored in math** |
| **Listed Shares / Stocks** | No Part 3 sub-limit | No Part 3 sub-limit | `maximum: infinity` | ✅ |
| **Life Insurance Premium** | **10% of policy sum assured** | **10% of policy sum assured** | `maximum: infinity` (no policy value input/note) | ⚠️ Missing 10% policy-sum note/cap |
| **Recognized Provident Fund (Employee + Employer)** | No flat sub-limit (subject to 2nd Sch. recognition; FA 2026 requires PF recognition for rebate) | Same | Not listed separately (lumped into `Others`) | ⚠️ UX gap |

*(Note: Finance Act 2026 also enforces rebate clawback as additional tax if DPS, Sanchaypatra, or Mutual Fund units are encashed before the prescribed holding period.)*

---

### 6. Employment Income Exemption (Sixth Schedule Part 1 Para 27)

- **Repealed Law (ITO 1984 — currently implemented in `salaries.js:270-298`):**
  - House rent: `min(50% of basic, actual, Tk 3,00,000)`
  - Medical: `min(10% of basic, actual, Tk 1,20,000)`
  - Conveyance: `min(actual, Tk 30,000)`
  - LFA: `0`
- **Enacted Law (ITA 2023 Sections 32–34 & Sixth Schedule Part 1 Para 27):**
  - Gross employment income includes basic, house rent, medical, conveyance, bonuses, overtime, leave fare assistance (LFA), perquisites, **and employer's contribution to Recognized Provident Fund (RPF)**.
  - Separate component exemptions are **repealed**. Instead, a **single consolidated exemption** applies:
    $$\text{Exempt Salary} = \min\left(\frac{1}{3} \times \text{Gross Employment Income},\ \text{Monetary Cap}\right)$$
  - **Monetary Cap:**
    - `AY 2024-25 (FY 2023-24)`: `Tk 4,50,000`
    - `AY 2025-26 (FY 2024-25)`, `AY 2026-27 (FY 2025-26)`, and `AY 2027-28 (FY 2026-27)`: **`Tk 5,00,000`** (amended by Finance Ordinance 2025; confirmed verbatim in NBR *Nirdeshika 2025-26* & *Nirdeshika 2026-27*).
  - **Separate Specific Exclusions (outside the `1/3` or `Tk 5L` pool):**
    - Reimbursed hospital/surgery expenses for heart, kidney, eye, liver, brain, cancer, or artificial organ replacement (non-shareholder director employees).
    - Group insurance policy benefits/reimbursements received by an employee (explicitly exempted in Sixth Schedule Part 1 by Finance Act 2026).
    - Workers' Profit Participation Fund (WPPF) receipts up to `Tk 50,000`.

- **Impact Example:**
  - Employee earning `Tk 12,00,000` consolidated salary (`Basic = 12,00,000`, `House/Medical/Transport = 0`):
    - **Statutory ITA 2023 exemption:** `min(12,00,000 / 3, 5,00,000) = Tk 4,00,000` → Taxable = `Tk 8,00,000`.
    - **Current calculator:** `Tk 0` exemption → Taxable = `Tk 12,00,000` (**overstates taxable income by `Tk 4,00,000`**!).
  - Employee earning `Tk 18,00,000` split salary (`Basic = 9L, House = 4.5L, Medical = 1.8L, Transport = 0.6L, Bonus = 2.1L`):
    - **Statutory ITA 2023 exemption:** `min(18,00,000 / 3, 5,00,000) = Tk 5,00,000` → Taxable = `Tk 13,00,000`.
    - **Current calculator:** `3,00,000 + 90,000 + 30,000 = Tk 4,20,000` → Taxable = `Tk 13,80,000` (**overstates taxable income by `Tk 80,000`**!).

---

## Primary Sources & `pwm` Verification Trail

1. **NBR *আয়কর নির্দেশিকা ২০২৬–২০২৭* (Individual Tax Return Guide, AY 2026-27):**  
   https://nbr.gov.bd/uploads/publications/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0_%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A7%8D%E0%A6%A6%E0%A7%87%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A6%BE_%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf
2. **NBR *আয়কর পরিপত্র ২০২৬–২০২৭* (Income Tax Circular, AY 2026-27):**  
   https://nbr.gov.bd/uploads/paripatra/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0_%E0%A6%AA%E0%A6%B0%E0%A6%BF%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0_%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf
3. **NBR *আয়কর নির্দেশিকা ২০২৫–২০২৬* & *পরিপত্র ২০২৫–২০২৬*:**  
   https://nbr.gov.bd/uploads/publications/Nirdeshika_2025-26.pdf · https://nbr.gov.bd/uploads/paripatra/Income-tax_Paripatra_2025-20261.pdf
4. **NBR Individual Return Form IT-11GA(2023):**  
   https://nbr.gov.bd/uploads/form/Individual_Return_IT-11Ga(2023)3.pdf
5. **Laws of Bangladesh — Income Tax Act 2023 (Act No. XII of 2023), Sec. 32–34, 78, 86, 163, 173 & Sixth Schedule:**  
   http://bdlaws.minlaw.gov.bd/act-1429.html · http://bdlaws.minlaw.gov.bd/act-1429/section-51908.html
6. **ACNABIN Chartered Accountants — *Important Changes Introduced by the Finance Act, 2026* (Final Book, Sec. 1.1–1.5, 1.43, pp. 3–4, 22–23):**  
   https://bti-global.files.svdcdn.com/production/network/bangladesh/documents/Reports/ACNABIN-Important-Changes-Introduced-by-the-Finance-Act-2026-Book-Final.pdf
7. **PwC Bangladesh — *Finance Act, 2026: Key Amendments* (pp. 5–7) & Worldwide Tax Summaries:**  
   https://www.pwc.com/bd/en/assets/pdfs/budget/finance-act-2026-key-amendments.pdf · https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income
8. **Tuhin & Partners — *The Finance Act 2026: A Practitioner's Guide* (July 2026, pp. 22, 24–25):**  
   https://tnp.legal/wp-content/uploads/2026/07/TNP_Finance_Act_2026_Briefing.pdf
9. **KPMG Bangladesh — *Salient Features of Finance Ordinance June 2025* & *Finance Bill 2026*:**  
   https://assets.kpmg.com/content/dam/kpmg/bd/pdf/TaxUpdate/Salient_features_of_Finance_Ordinance_June_2025.pdf · https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Salient_features_of_Finance_Bill_2026(Tax-and_VAT).pdf
