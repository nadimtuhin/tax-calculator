import { calculateTaxSlabs } from './taxSlabs.js';
import {
  calculateTaxSlabs2025,
  getTaxFreeThreshold2025,
  getMinimumTax2025,
  TAX_FREE_THRESHOLDS_2025,
  PARENT_OF_DISABLED_ALLOWANCE_2025,
  MINIMUM_TAX_2025,
  MINIMUM_TAX_FIRST_TIME_2025,
} from './taxSlabs2025.js';
import {
  calculateTaxSlabs2026,
  getTaxFreeThreshold2026,
  getMinimumTax2026,
  calculateInvestmentRebate2026,
  TAX_FREE_THRESHOLDS_2026,
  PARENT_OF_DISABLED_ALLOWANCE_2026,
  MINIMUM_TAX_2026,
  MINIMUM_TAX_FIRST_TIME_2026,
} from './taxSlabs2026.js';

export const SUPPORTED_FISCAL_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];
export const DEFAULT_FISCAL_YEAR = '2025-26';
export const DEFAULT_COMPARISON_FROM_YEAR = '2025-26';
export const DEFAULT_COMPARISON_TO_YEAR = '2026-27';
export const MAX_SAFE_BDT_AMOUNT = Number.MAX_SAFE_INTEGER;

export const FISCAL_YEAR_OPTIONS = [
  { value: '2024-25', label: 'FY 2024-2025' },
  { value: '2025-26', label: 'FY 2025-2026' },
  { value: '2026-27', label: 'FY 2026-2027' },
];

export const FISCAL_YEAR_METADATA = {
  '2023-24': {
    fiscalYear: '2023-24',
    label: 'FY 2023-2024',
    assessmentYear: '2024-25',
    slabRatesPercent: [0, 5, 10, 15, 20, 25, 30],
    autoPromotesAge65: false,
    notes: 'Income Year 2023-24 (Assessment Year 2024-25). 7-slab progressive structure; ITA 2023 Para 27 single-pool employment exemption min(1/3 gross, BDT 4.5L); location-tiered minimum tax above threshold (BDT 3,000-5,000); Section 78 rebate min(3% taxable, 15% eligible investment, BDT 10L); Mutual Fund cap BDT 5L.',
  },
  '2024-25': {
    fiscalYear: '2024-25',
    label: 'FY 2024-2025',
    assessmentYear: '2025-26',
    slabRatesPercent: [0, 5, 10, 15, 20, 25, 30],
    autoPromotesAge65: false,
    notes: 'Income Year 2024-25 (Assessment Year 2025-26). 7 slabs (0%, 5%, 10%, 15%, 20%, 25%, 30%); Para 27 single-pool employment exemption min(1/3 gross, BDT 5L per Finance Ordinance 2025); location-tiered minimum tax above threshold (BDT 3,000-5,000); Section 78 rebate min(3% taxable, 15% eligible investment, BDT 10L); Mutual Fund cap BDT 5L.',
  },
  '2025-26': {
    fiscalYear: '2025-26',
    label: 'FY 2025-2026',
    assessmentYear: '2026-27',
    slabRatesPercent: [0, 10, 15, 20, 25, 30],
    autoPromotesAge65: true,
    notes: 'Income Year 2025-26 (Assessment Year 2026-27). Enacted Finance Act 2026 Schedule 1 400k-family thresholds; 6 slabs (5% bracket removed); Para 27 single-pool employment exemption min(1/3 gross, BDT 5L); unified BDT 5,000 minimum tax above threshold (BDT 1,000 for first-time filers); Section 78 rebate min(3% taxable, 10% eligible investment, BDT 7.5L); Mutual Fund BDT 5L sub-limit removed.',
  },
  '2026-27': {
    fiscalYear: '2026-27',
    label: 'FY 2026-2027',
    assessmentYear: '2027-28',
    slabRatesPercent: [0, 10, 15, 20, 25, 30],
    autoPromotesAge65: true,
    notes: 'Income Year 2026-27 (Assessment Year 2027-28). Finance Act 2026 400k-family thresholds; 6 slabs; Para 27 single-pool employment exemption min(1/3 gross, BDT 5L); unified BDT 5,000 minimum tax above threshold (BDT 1,000 for first-time filers); Section 78 rebate min(3% taxable, 10% eligible investment, BDT 7.5L); Mutual Fund uncapped.',
  },
};

export const TAXPAYER_CATEGORIES = [
  'general',
  'female',
  'senior',
  'disabled',
  'third_gender',
  'freedom_fighter',
];

export const ALL_ACCEPTED_CATEGORIES = [...TAXPAYER_CATEGORIES, 'parent_disabled'];

export const LOCATIONS = ['dhaka', 'chittagong', 'other_city', 'district'];

/**
 * ITA 2023 Sixth Schedule Part 1 Para 27 single-pool employment exemption rules by fiscal year.
 * Replaces repealed ITO 1984 component-wise house/medical/conveyance exemption caps.
 */
export const SALARY_EXEMPTION_RULES_BY_YEAR = {
  '2023-24': {
    model: 'single_pool',
    fraction: 1 / 3,
    maxAmount: 450000,
    rule: 'min(1/3 of gross employment income, BDT 450,000)',
  },
  '2024-25': {
    model: 'single_pool',
    fraction: 1 / 3,
    maxAmount: 500000,
    rule: 'min(1/3 of gross employment income, BDT 500,000)',
  },
  '2025-26': {
    model: 'single_pool',
    fraction: 1 / 3,
    maxAmount: 500000,
    rule: 'min(1/3 of gross employment income, BDT 500,000)',
  },
  '2026-27': {
    model: 'single_pool',
    fraction: 1 / 3,
    maxAmount: 500000,
    rule: 'min(1/3 of gross employment income, BDT 500,000)',
  },
};

export const SALARY_EXEMPTION_CAPS = {
  model: 'single_pool',
  fraction: 1 / 3,
  maxAmount: 500000,
  maxAmountByYear: {
    '2023-24': 450000,
    '2024-25': 500000,
    '2025-26': 500000,
    '2026-27': 500000,
  },
  rule: 'min(1/3 of gross employment income, BDT 500,000; BDT 450,000 in FY 2023-24) per ITA 2023 Sixth Schedule Part 1 Para 27',
};

export const STANDARD_SALARY_SPLIT = {
  basic: 0.6,
  house: 0.25,
  medical: 0.1,
  transport: 0.05,
  lfa: 0,
};

/**
 * ITA 2023 Sixth Schedule Part 3 per-instrument eligible investment caps by fiscal year (BDT).
 * Finance Act 2026 removed the BDT 500,000 Mutual Fund sub-limit from AY 2026-27 (FY 2025-26) onward.
 */
export const INVESTMENT_INSTRUMENT_CAPS_BY_YEAR = {
  '2023-24': {
    dps: 120000,
    life_insurance: null,
    stocks: null,
    savings_certificate: 500000,
    mutual_fund: 500000,
    others: null,
  },
  '2024-25': {
    dps: 120000,
    life_insurance: null,
    stocks: null,
    savings_certificate: 500000,
    mutual_fund: 500000,
    others: null,
  },
  '2025-26': {
    dps: 120000,
    life_insurance: null,
    stocks: null,
    savings_certificate: 500000,
    mutual_fund: null,
    others: null,
  },
  '2026-27': {
    dps: 120000,
    life_insurance: null,
    stocks: null,
    savings_certificate: 500000,
    mutual_fund: null,
    others: null,
  },
};

export const INVESTMENT_INSTRUMENT_CAPS = INVESTMENT_INSTRUMENT_CAPS_BY_YEAR[DEFAULT_FISCAL_YEAR];

export const TAX_FREE_THRESHOLDS_BY_YEAR = {
  '2023-24': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    parent_disabled: 50000,
    freedom_fighter: 500000,
    third_gender: 475000,
  },
  '2024-25': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    parent_disabled: 50000,
    freedom_fighter: 500000,
    third_gender: 475000,
  },
  '2025-26': {
    ...TAX_FREE_THRESHOLDS_2025,
    parent_disabled: PARENT_OF_DISABLED_ALLOWANCE_2025,
  },
  '2026-27': {
    ...TAX_FREE_THRESHOLDS_2026,
    parent_disabled: PARENT_OF_DISABLED_ALLOWANCE_2026,
  },
};

export const MINIMUM_TAX_BY_YEAR = {
  '2022-23': {
    dhaka: 5000,
    chittagong: 4000,
    other_city: 3000,
    district: 2000,
  },
  '2023-24': {
    dhaka: 5000,
    chittagong: 5000,
    other_city: 4000,
    district: 3000,
  },
  '2024-25': {
    dhaka: 5000,
    chittagong: 5000,
    other_city: 4000,
    district: 3000,
  },
  '2025-26': {
    ...MINIMUM_TAX_2025,
  },
  '2026-27': {
    ...MINIMUM_TAX_2026,
  },
};

export const REBATE_RULES_BY_YEAR = {
  '2023-24': {
    taxableIncomeRate: 0.03,
    investmentRate: 0.15,
    maxCap: 1000000,
    formula: 'min(3% of taxable income, 15% of eligible investment, BDT 1,000,000)',
  },
  '2024-25': {
    taxableIncomeRate: 0.03,
    investmentRate: 0.15,
    maxCap: 1000000,
    formula: 'min(3% of taxable income, 15% of eligible investment, BDT 1,000,000)',
  },
  '2025-26': {
    taxableIncomeRate: 0.03,
    investmentRate: 0.10,
    maxCap: 750000,
    formula: 'min(3% of taxable income, 10% of eligible investment, BDT 750,000)',
  },
  '2026-27': {
    taxableIncomeRate: 0.03,
    investmentRate: 0.10,
    maxCap: 750000,
    formula: 'min(3% of taxable income, 10% of eligible investment, BDT 750,000)',
  },
};

const YEAR_ALIASES = {
  '2023': '2023-24',
  '2023-24': '2023-24',
  '2023-2024': '2023-24',
  '2024': '2024-25',
  '2024-25': '2024-25',
  '2024-2025': '2024-25',
  '2025': '2025-26',
  '2025-26': '2025-26',
  '2025-2026': '2025-26',
  '2026': '2026-27',
  '2026-27': '2026-27',
  '2026-2027': '2026-27',
};

/**
 * Normalize a fiscal year string into canonical 'YYYY-YY' format.
 * Rejects Assessment Year ('AY ...') strings explicitly to avoid off-by-one confusion.
 */
export function normalizeFiscalYear(yearInput = DEFAULT_FISCAL_YEAR) {
  if (yearInput === undefined || yearInput === null || yearInput === '') {
    return DEFAULT_FISCAL_YEAR;
  }
  const raw = String(yearInput).trim();
  if (/^ay\b|^assessment\s*year\b/i.test(raw)) {
    throw new Error(
      `Received Assessment Year "${raw}". Pass the Fiscal/Income Year instead — e.g. "2025-26" (for AY 2026-27) or "2026-27" (for AY 2027-28).`
    );
  }
  const cleaned = raw
    .replace(/^(fy|fiscal\s*year|income\s*year|iy)\s*[:=-]?\s*/i, '')
    .replace(/\s+/g, '')
    .replace(/[–—/]/g, '-');

  const resolved = YEAR_ALIASES[cleaned];
  if (!resolved) {
    throw new Error(
      `Unsupported fiscal year "${raw}". Supported fiscal years: ${SUPPORTED_FISCAL_YEARS.join(', ')}.`
    );
  }
  return resolved;
}

/**
 * Get employment exemption rule for a fiscal year (ITA 2023 Sixth Schedule Part 1 Para 27).
 */
export function getSalaryExemptionRuleForYear(year = DEFAULT_FISCAL_YEAR) {
  return SALARY_EXEMPTION_RULES_BY_YEAR[year] || SALARY_EXEMPTION_RULES_BY_YEAR[DEFAULT_FISCAL_YEAR];
}

/**
 * Calculate single-pool employment exemption under ITA 2023 Sixth Schedule Part 1 Para 27:
 * `min(round(grossSalary / 3), maxAmount)` — BDT 450,000 in FY 2023-24 and BDT 500,000 in
 * FY 2024-25, FY 2025-26, and FY 2026-27.
 */
export function calculateEmploymentExemption(grossSalary, year = DEFAULT_FISCAL_YEAR) {
  const safeGross = Math.max(0, Number(grossSalary) || 0);
  if (safeGross <= 0) return 0;
  const rule = getSalaryExemptionRuleForYear(year);
  return Math.min(Math.round(safeGross / 3), rule.maxAmount);
}

// Repealed ITO 1984 component-specific exemption helpers retained returning 0 for API compatibility.
export function calculateHouseExemption() {
  return 0;
}

export function calculateMedicalExemption() {
  return 0;
}

export function calculateTransportExemption() {
  return 0;
}

export function calculateLfaExemption() {
  return 0;
}

export function calculateSalaryExemptions(
  {
    basic = 0,
    house = 0,
    medical = 0,
    transport = 0,
    lfa = 0,
    employerRpf = 0,
    others = 0,
    bonus = 0,
    bonus2 = 0,
    additionalIncome = 0,
  } = {},
  year = DEFAULT_FISCAL_YEAR
) {
  const grossSalary =
    basic +
    house +
    medical +
    transport +
    lfa +
    employerRpf +
    others +
    bonus +
    bonus2 +
    additionalIncome;
  const rule = getSalaryExemptionRuleForYear(year);
  const totalExempt = calculateEmploymentExemption(grossSalary, year);
  const taxableSalary = Math.max(0, grossSalary - totalExempt);

  return {
    grossSalary,
    exemptionCap: rule.maxAmount,
    singlePoolExempt: totalExempt,
    houseExempt: 0,
    medicalExempt: 0,
    transportExempt: 0,
    lfaExempt: 0,
    totalExempt,
    taxableSalary,
  };
}

/**
 * Get Sixth Schedule Part 3 per-instrument investment caps for a fiscal year.
 */
export function getInvestmentInstrumentCapsForYear(year = DEFAULT_FISCAL_YEAR) {
  return (
    INVESTMENT_INSTRUMENT_CAPS_BY_YEAR[year] ||
    INVESTMENT_INSTRUMENT_CAPS_BY_YEAR[DEFAULT_FISCAL_YEAR]
  );
}

/**
 * Map a UI investment row name (`DPS`, `Life insurance premium`, `Stocks`, `Savings certificate`,
 * `Mutual fund`, `Others`) to its canonical instrument key.
 */
export function normalizeInvestmentTypeKey(name) {
  const key = String(name || '')
    .trim()
    .toLowerCase();
  if (key === 'dps') return 'dps';
  if (key.startsWith('life insurance') || key === 'life_insurance') return 'life_insurance';
  if (key === 'stocks' || key === 'listed_shares') return 'stocks';
  if (key === 'savings certificate' || key === 'savings_certificate' || key === 'sanchaypatra') {
    return 'savings_certificate';
  }
  if (key === 'mutual fund' || key === 'mutual_fund') return 'mutual_fund';
  return 'others';
}

/**
 * Return statutory cap (number in BDT or `null` for unlimited) for a UI investment row in a fiscal year.
 */
export function getInvestmentCapForType(name, year = DEFAULT_FISCAL_YEAR) {
  const caps = getInvestmentInstrumentCapsForYear(year);
  const key = normalizeInvestmentTypeKey(name);
  return caps[key] ?? null;
}

/**
 * Compute total Sixth Schedule Part 3 capped eligible investment from a UI `investments` array.
 */
export function calculateCappedInvestmentFromList(investmentsList = [], year = DEFAULT_FISCAL_YEAR) {
  const caps = getInvestmentInstrumentCapsForYear(year);
  const rawByKey = {
    dps: 0,
    life_insurance: 0,
    stocks: 0,
    savings_certificate: 0,
    mutual_fund: 0,
    others: 0,
  };

  for (const item of investmentsList) {
    if (!item) continue;
    const key = normalizeInvestmentTypeKey(item.name || item.type);
    const amount = Math.max(0, Number(item.amount) || 0);
    rawByKey[key] = (rawByKey[key] || 0) + amount;
  }

  let eligible = 0;
  for (const key of Object.keys(rawByKey)) {
    const raw = Math.round(rawByKey[key]);
    const cap = caps[key];
    eligible += cap === null ? raw : Math.min(raw, cap);
  }
  return eligible;
}

/**
 * Optimal eligible investment ceiling beyond which Section 78 yields no extra rebate:
 *   - FY 2023-24 & FY 2024-25 (3% income / 15% investment, cap 10L): min(20% of taxable, BDT 6,666,667)
 *   - FY 2025-26 & FY 2026-27 (3% income / 10% investment, cap 7.5L): min(30% of taxable, BDT 7,500,000)
 */
export function calculateMaxRebateableInvestment(taxableIncome, year = DEFAULT_FISCAL_YEAR) {
  const safeIncome = Math.max(0, Number(taxableIncome) || 0);
  if (safeIncome <= 0) return 0;
  const rule = REBATE_RULES_BY_YEAR[year] || REBATE_RULES_BY_YEAR[DEFAULT_FISCAL_YEAR];
  return Math.round(
    Math.min(
      (rule.taxableIncomeRate * safeIncome) / rule.investmentRate,
      rule.maxCap / rule.investmentRate
    )
  );
}

/**
 * Compute tax-free threshold for a fiscal year and taxpayer profile.
 */
export function getTaxFreeThresholdForYear(year, taxpayerProfile = {}) {
  if (year === '2025-26') {
    return getTaxFreeThreshold2025(taxpayerProfile);
  }
  if (year === '2026-27') {
    return getTaxFreeThreshold2026(taxpayerProfile);
  }

  const { category, parentOfDisabled } = taxpayerProfile;
  const thresholds = TAX_FREE_THRESHOLDS_BY_YEAR[year] || TAX_FREE_THRESHOLDS_BY_YEAR['2024-25'];
  const isLegacyParent = category === 'parent_disabled';
  const parentExtra = Number(thresholds.parent_disabled) || 0;

  let baseThreshold = isLegacyParent
    ? thresholds.general
    : thresholds[category] || thresholds.general;

  if (parentOfDisabled || isLegacyParent) {
    baseThreshold += parentExtra;
  }

  return baseThreshold;
}

export function getMinimumTaxForYear(year, location = 'dhaka', { firstTimeFiler = false } = {}) {
  if (year === '2025-26') {
    return getMinimumTax2025(location, firstTimeFiler);
  }
  if (year === '2026-27') {
    return getMinimumTax2026(location, firstTimeFiler);
  }

  const taxRates = MINIMUM_TAX_BY_YEAR[year] || MINIMUM_TAX_BY_YEAR['2024-25'];
  return taxRates[location] || taxRates.dhaka;
}

export function calculateTaxSlabsForYear(year, taxFreeThreshold) {
  if (year === '2026-27') {
    return calculateTaxSlabs2026(taxFreeThreshold);
  }
  if (year === '2025-26') {
    return calculateTaxSlabs2025(taxFreeThreshold);
  }
  return calculateTaxSlabs(taxFreeThreshold);
}

export function calculateSlabBreakdown(taxableSalary, slabs, idPrefix = 'slab') {
  return slabs.map((slab, index) => {
    const slabTitle = slab[0];
    const slabLower = slab[1];
    const slabUpper = slab[2];
    const slabPercentage = slab[3];
    let slabAmount = 0;

    if (taxableSalary >= slabLower && taxableSalary <= slabUpper) {
      slabAmount = taxableSalary - slabLower;
    } else if (taxableSalary >= slabLower && taxableSalary >= slabUpper) {
      slabAmount = slabUpper - slabLower;
    }

    const slabCut = Math.round((slabAmount / 100) * slabPercentage);
    const id = `${idPrefix}-${index}-${slabLower}-${slabUpper}-${slabPercentage}`;

    return {
      id,
      slabTitle,
      slabUpper,
      slabLower,
      slabPercentage,
      slabAmount,
      slabCut,
    };
  });
}

export function sumSlabTax(breakdown) {
  return Math.round(breakdown.reduceRight((carry, item) => carry + +item.slabCut, 0));
}

export function calculateInvestmentRebateForYear(year, taxableIncome, eligibleInvestment) {
  if (year === '2026-27') {
    return calculateInvestmentRebate2026(taxableIncome, eligibleInvestment);
  }
  const rules = REBATE_RULES_BY_YEAR[year] || REBATE_RULES_BY_YEAR['2024-25'];
  const incomeCap = taxableIncome * rules.taxableIncomeRate;
  const investmentShare = eligibleInvestment * rules.investmentRate;
  return Math.round(Math.max(0, Math.min(incomeCap, investmentShare, rules.maxCap)));
}

/**
 * Compute final tax liability and payable balance per Return Form IT-11GA(2023) Lines 12-16
 * and ITA 2023 s.163:
 *   - If `taxableIncome <= taxFreeThreshold` (or `calculatedTax <= 0` when threshold is omitted):
 *     minimum tax does NOT apply (`minimumTaxAmount = 0`, `totalTax = 0`, `payable = 0`).
 *   - If `taxableIncome > taxFreeThreshold`:
 *     1. `taxAfterRebate = max(0, calculatedTax - investmentRebate)` (Lines 12-14)
 *     2. `totalTax = max(taxAfterRebate, minimumTax)` (Line 16: Section 78 rebate cannot push
 *        net tax liability below the minimum tax floor)
 *     3. `payable = max(0, totalTax - totalTds)` (Line 20: TDS reduces balance payable)
 */
export function calculateFinalTaxSummary(
  calculatedTax,
  minimumTax,
  totalTds = 0,
  investmentRebate = 0,
  options = {}
) {
  const { taxableIncome, taxFreeThreshold } = options;
  const isAboveThreshold =
    typeof taxableIncome === 'number' && typeof taxFreeThreshold === 'number'
      ? taxableIncome > taxFreeThreshold
      : calculatedTax > 0;

  const effectiveMinimumTax = isAboveThreshold ? minimumTax : 0;
  const taxAfterRebate = Math.max(0, calculatedTax - investmentRebate);
  const totalTax = isAboveThreshold ? Math.max(taxAfterRebate, effectiveMinimumTax) : 0;
  const isMinimumTaxApplied = isAboveThreshold && taxAfterRebate < effectiveMinimumTax;
  const payable = Math.max(0, totalTax - totalTds);
  const excessTds = Math.max(0, totalTds - totalTax);

  return {
    calculatedTax,
    taxAfterRebate,
    totalTax,
    isMinimumTaxApplied,
    minimumTaxAmount: effectiveMinimumTax,
    statutoryMinimumTax: minimumTax,
    payable,
    totalTds,
    investmentRebate,
    excessTds,
  };
}

function assertSafeAmount(value, fieldName) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`"${fieldName}" must be a finite non-negative number (received ${value}).`);
  }
  if (value > MAX_SAFE_BDT_AMOUNT) {
    throw new Error(
      `"${fieldName}" exceeds maximum safe BDT amount (${MAX_SAFE_BDT_AMOUNT}).`
    );
  }
}

export function resolveEffectiveProfile(
  {
    category = 'general',
    age = null,
    parent_of_disabled = false,
    parentOfDisabled,
    location = 'dhaka',
    first_time_filer = false,
    firstTimeFiler,
  } = {},
  fiscalYear = DEFAULT_FISCAL_YEAR
) {
  if (!ALL_ACCEPTED_CATEGORIES.includes(category)) {
    throw new Error(
      `Unsupported category "${category}". Supported categories: ${ALL_ACCEPTED_CATEGORIES.join(', ')}.`
    );
  }
  if (!LOCATIONS.includes(location)) {
    throw new Error(
      `Unsupported location "${location}". Supported locations: ${LOCATIONS.join(', ')}.`
    );
  }
  if (age !== null && age !== undefined) {
    if (typeof age !== 'number' || !Number.isInteger(age) || age < 0 || age > 150) {
      throw new Error(`"age" must be an integer between 0 and 150 (received ${age}).`);
    }
  }

  const isLegacyParent = category === 'parent_disabled';
  const baseCategory = isLegacyParent ? 'general' : category;
  const parentFlag = Boolean(parentOfDisabled ?? parent_of_disabled) || isLegacyParent;
  const firstTime = Boolean(firstTimeFiler ?? first_time_filer);
  const autoPromotesAge = Boolean(FISCAL_YEAR_METADATA[fiscalYear]?.autoPromotesAge65);

  let effectiveCategory = baseCategory;
  if (
    autoPromotesAge &&
    age !== null &&
    age !== undefined &&
    age >= 65 &&
    baseCategory !== 'disabled' &&
    baseCategory !== 'freedom_fighter' &&
    baseCategory !== 'third_gender'
  ) {
    effectiveCategory = 'senior';
  }

  return {
    category,
    effectiveCategory,
    age: age ?? null,
    parentOfDisabled: parentFlag,
    location,
    firstTimeFiler: firstTime,
  };
}

export function resolveIncomeInputs(
  { taxable_income, taxableIncome, income } = {},
  fiscalYear = DEFAULT_FISCAL_YEAR
) {
  const resolvedYear = normalizeFiscalYear(fiscalYear);
  const exemptionRule = getSalaryExemptionRuleForYear(resolvedYear);
  const directTaxable = taxableIncome ?? taxable_income;

  if (directTaxable !== undefined && directTaxable !== null && income !== undefined && income !== null) {
    throw new Error('Provide either "taxable_income" or "income" components, not both.');
  }
  if ((directTaxable === undefined || directTaxable === null) && (!income || typeof income !== 'object')) {
    throw new Error('Provide either "taxable_income" (annual BDT) or "income" (salary components / gross_salary).');
  }

  if (directTaxable !== undefined && directTaxable !== null) {
    assertSafeAmount(directTaxable, 'taxable_income');
    return {
      mode: 'taxable_income',
      period: 'annual',
      gross_income_bdt: directTaxable,
      exemptions_bdt: {
        single_pool: 0,
        max_cap_bdt: exemptionRule.maxAmount,
        house: 0,
        medical: 0,
        transport: 0,
        lfa: 0,
        total: 0,
      },
      components_annual_bdt: null,
      taxable_income_bdt: directTaxable,
    };
  }

  const period = income.period || 'annual';
  if (period !== 'annual' && period !== 'monthly') {
    throw new Error(`Unsupported income.period "${period}". Expected "annual" or "monthly".`);
  }
  const multiplier = period === 'monthly' ? 12 : 1;

  const hasGross = income.gross_salary !== undefined && income.gross_salary !== null;
  const componentKeys = ['basic', 'house', 'medical', 'transport', 'lfa', 'employer_rpf', 'others'];
  const hasComponents = componentKeys.some((k) => income[k] !== undefined && income[k] !== null);

  if (hasGross && hasComponents) {
    throw new Error(
      'Provide either "income.gross_salary" OR itemized components ("basic", "house", "medical", "transport", "lfa", "employer_rpf", "others"), not both.'
    );
  }
  if (
    !hasGross &&
    !hasComponents &&
    income.bonus === undefined &&
    income.bonus2 === undefined &&
    income.additional_income === undefined
  ) {
    throw new Error(
      'Income object is empty. Provide "gross_salary" or itemized salary components ("basic", "house", "medical", "transport", "others", "bonus").'
    );
  }

  const bonus = income.bonus ?? 0;
  const bonus2 = income.bonus2 ?? 0;
  const additionalIncome = income.additional_income ?? 0;
  assertSafeAmount(bonus, 'income.bonus');
  assertSafeAmount(bonus2, 'income.bonus2');
  assertSafeAmount(additionalIncome, 'income.additional_income');

  const applyExemption = income.apply_exemption !== false;

  if (hasGross) {
    assertSafeAmount(income.gross_salary, 'income.gross_salary');
    const annualBaseSalary = income.gross_salary * multiplier;
    assertSafeAmount(annualBaseSalary, 'annualized income.gross_salary');

    const totalGross = annualBaseSalary + bonus + bonus2 + additionalIncome;
    assertSafeAmount(totalGross, 'computed gross_income_bdt');
    const totalExempt = applyExemption ? calculateEmploymentExemption(totalGross, resolvedYear) : 0;
    const taxableSalary = Math.max(0, totalGross - totalExempt);
    assertSafeAmount(taxableSalary, 'computed taxable_income_bdt');

    if (income.use_standard_breakdown) {
      const basic = Math.round(annualBaseSalary * STANDARD_SALARY_SPLIT.basic);
      const house = Math.round(annualBaseSalary * STANDARD_SALARY_SPLIT.house);
      const medical = Math.round(annualBaseSalary * STANDARD_SALARY_SPLIT.medical);
      const transport = annualBaseSalary - basic - house - medical;

      return {
        mode: 'gross_salary_standard_split',
        period,
        gross_income_bdt: totalGross,
        exemptions_bdt: {
          single_pool: totalExempt,
          max_cap_bdt: exemptionRule.maxAmount,
          house: 0,
          medical: 0,
          transport: 0,
          lfa: 0,
          total: totalExempt,
        },
        components_annual_bdt: {
          basic,
          house,
          medical,
          transport,
          lfa: 0,
          employer_rpf: 0,
          others: 0,
          bonus,
          bonus2,
          additional_income: additionalIncome,
        },
        taxable_income_bdt: taxableSalary,
      };
    }

    return {
      mode: 'gross_salary_unsplit',
      period,
      gross_income_bdt: totalGross,
      exemptions_bdt: {
        single_pool: totalExempt,
        max_cap_bdt: exemptionRule.maxAmount,
        house: 0,
        medical: 0,
        transport: 0,
        lfa: 0,
        total: totalExempt,
      },
      components_annual_bdt: {
        gross_salary: annualBaseSalary,
        bonus,
        bonus2,
        additional_income: additionalIncome,
      },
      taxable_income_bdt: taxableSalary,
    };
  }

  const annualComponents = {};
  componentKeys.forEach((key) => {
    const rawVal = income[key] ?? 0;
    assertSafeAmount(rawVal, `income.${key}`);
    const annualized = rawVal * multiplier;
    assertSafeAmount(annualized, `annualized income.${key}`);
    annualComponents[key] = annualized;
  });

  const calc = calculateSalaryExemptions(
    {
      basic: annualComponents.basic,
      house: annualComponents.house,
      medical: annualComponents.medical,
      transport: annualComponents.transport,
      lfa: annualComponents.lfa,
      employerRpf: annualComponents.employer_rpf,
      others: annualComponents.others,
      bonus,
      bonus2,
      additionalIncome,
    },
    resolvedYear
  );
  const totalExempt = applyExemption ? calc.totalExempt : 0;
  const taxableSalary = Math.max(0, calc.grossSalary - totalExempt);
  assertSafeAmount(calc.grossSalary, 'computed gross_income_bdt');
  assertSafeAmount(taxableSalary, 'computed taxable_income_bdt');

  return {
    mode: 'components',
    period,
    gross_income_bdt: calc.grossSalary,
    exemptions_bdt: {
      single_pool: totalExempt,
      max_cap_bdt: exemptionRule.maxAmount,
      house: 0,
      medical: 0,
      transport: 0,
      lfa: 0,
      total: totalExempt,
    },
    components_annual_bdt: {
      ...annualComponents,
      bonus,
      bonus2,
      additional_income: additionalIncome,
    },
    taxable_income_bdt: taxableSalary,
  };
}

export function resolveInvestmentInputs(
  investments = 0,
  taxableIncome = 0,
  fiscalYear = DEFAULT_FISCAL_YEAR
) {
  const resolvedYear = normalizeFiscalYear(fiscalYear);
  const caps = getInvestmentInstrumentCapsForYear(resolvedYear);
  const optimalCeiling = calculateMaxRebateableInvestment(taxableIncome, resolvedYear);

  if (investments === undefined || investments === null) {
    return {
      total_investment_bdt: 0,
      instrument_capped_investment_bdt: 0,
      eligible_investment_bdt: 0,
      max_rebateable_investment_bdt: optimalCeiling,
      apply_instrument_caps: true,
      breakdown_bdt: null,
    };
  }

  if (typeof investments === 'number') {
    assertSafeAmount(investments, 'investments');
    return {
      total_investment_bdt: investments,
      instrument_capped_investment_bdt: investments,
      eligible_investment_bdt: investments,
      max_rebateable_investment_bdt: optimalCeiling,
      apply_instrument_caps: false,
      breakdown_bdt: null,
    };
  }

  if (typeof investments !== 'object' || Array.isArray(investments)) {
    throw new Error('"investments" must be a non-negative number (BDT) or an investment breakdown object.');
  }

  const instrumentKeys = Object.keys(caps);
  const hasTotal = investments.total !== undefined && investments.total !== null;
  const hasInstruments = instrumentKeys.some((k) => investments[k] !== undefined && investments[k] !== null);

  if (hasTotal && hasInstruments) {
    throw new Error('Provide either "investments.total" OR itemized investment fields, not both.');
  }

  if (hasTotal) {
    assertSafeAmount(investments.total, 'investments.total');
    return {
      total_investment_bdt: investments.total,
      instrument_capped_investment_bdt: investments.total,
      eligible_investment_bdt: investments.total,
      max_rebateable_investment_bdt: optimalCeiling,
      apply_instrument_caps: false,
      breakdown_bdt: null,
    };
  }

  const breakdown = {};
  let rawTotal = 0;
  let cappedTotal = 0;

  instrumentKeys.forEach((key) => {
    const val = investments[key] ?? 0;
    assertSafeAmount(val, `investments.${key}`);
    breakdown[key] = val;
    rawTotal += val;
    const cap = caps[key];
    cappedTotal += cap === null ? val : Math.min(val, cap);
  });

  assertSafeAmount(rawTotal, 'total_investment_bdt');
  assertSafeAmount(cappedTotal, 'instrument_capped_investment_bdt');

  const applyCaps = investments.apply_instrument_caps !== false;
  const eligible = applyCaps ? cappedTotal : rawTotal;

  return {
    total_investment_bdt: rawTotal,
    instrument_capped_investment_bdt: cappedTotal,
    eligible_investment_bdt: eligible,
    max_rebateable_investment_bdt: optimalCeiling,
    apply_instrument_caps: applyCaps,
    breakdown_bdt: breakdown,
  };
}

export function formatSlabForOutput(slab, index) {
  const [title, lower, upper, rate] = slab;
  const unbounded = upper === Infinity;
  return {
    index,
    title,
    lower_bdt: lower,
    upper_bdt: unbounded ? null : upper,
    unbounded,
    width_bdt: unbounded ? null : upper - lower,
    rate_percent: rate,
  };
}

export function listSupportedYears() {
  return {
    default_year: DEFAULT_FISCAL_YEAR,
    default_comparison: {
      from_year: DEFAULT_COMPARISON_FROM_YEAR,
      to_year: DEFAULT_COMPARISON_TO_YEAR,
    },
    supported_years: SUPPORTED_FISCAL_YEARS.map((fy) => {
      const meta = FISCAL_YEAR_METADATA[fy];
      const thresholds = TAX_FREE_THRESHOLDS_BY_YEAR[fy];
      const rebate = REBATE_RULES_BY_YEAR[fy];
      const minTax = MINIMUM_TAX_BY_YEAR[fy];
      const exemptionRule = getSalaryExemptionRuleForYear(fy);
      const instrumentCaps = getInvestmentInstrumentCapsForYear(fy);
      return {
        fiscal_year: fy,
        label: meta.label,
        assessment_year: meta.assessmentYear,
        general_threshold_bdt: thresholds.general,
        parent_of_disabled_allowance_bdt: thresholds.parent_disabled,
        slab_count: meta.slabRatesPercent.length,
        rates_percent: meta.slabRatesPercent,
        salary_exemption_formula: exemptionRule.rule,
        salary_exemption_cap_bdt: exemptionRule.maxAmount,
        rebate_formula: rebate.formula,
        investment_instrument_caps_bdt: instrumentCaps,
        minimum_tax_bdt: minTax,
        first_time_filer_minimum_tax_bdt:
          fy === '2026-27'
            ? MINIMUM_TAX_FIRST_TIME_2026
            : fy === '2025-26'
              ? MINIMUM_TAX_FIRST_TIME_2025
              : null,
        notes: meta.notes,
      };
    }),
    categories: TAXPAYER_CATEGORIES.map((cat) => ({
      value: cat,
      notes:
        cat === 'senior'
          ? 'Applies automatically in FY 2025-26 and FY 2026-27 when age >= 65 unless taxpayer has a higher threshold category (disabled, third_gender, freedom_fighter); pass category: "senior" explicitly for FY 2023-24 / FY 2024-25.'
          : undefined,
    })),
    legacy_category_aliases: ['parent_disabled'],
    locations: LOCATIONS,
    salary_exemption_caps: SALARY_EXEMPTION_CAPS,
    investment_instrument_caps_by_year_bdt: INVESTMENT_INSTRUMENT_CAPS_BY_YEAR,
    investment_instrument_caps_bdt: INVESTMENT_INSTRUMENT_CAPS,
  };
}

export function getRulesForYear({
  year = DEFAULT_FISCAL_YEAR,
  category = 'general',
  age = null,
  parent_of_disabled = false,
} = {}) {
  const fiscalYear = normalizeFiscalYear(year);
  const profile = resolveEffectiveProfile({ category, age, parent_of_disabled }, fiscalYear);
  const meta = FISCAL_YEAR_METADATA[fiscalYear];
  const rawThresholds = TAX_FREE_THRESHOLDS_BY_YEAR[fiscalYear];
  const { parent_disabled: parentAllowance, ...categoryThresholds } = rawThresholds;
  const effectiveThreshold = getTaxFreeThresholdForYear(fiscalYear, {
    category: profile.category,
    age: profile.age,
    parentOfDisabled: profile.parentOfDisabled,
  });
  const slabs = calculateTaxSlabsForYear(fiscalYear, effectiveThreshold).map(formatSlabForOutput);
  const rebate = REBATE_RULES_BY_YEAR[fiscalYear];
  const minTax = MINIMUM_TAX_BY_YEAR[fiscalYear];
  const salaryExemptionRule = getSalaryExemptionRuleForYear(fiscalYear);
  const instrumentCaps = getInvestmentInstrumentCapsForYear(fiscalYear);

  return {
    fiscal_year: fiscalYear,
    assessment_year: meta.assessmentYear,
    label: meta.label,
    notes: meta.notes,
    thresholds_bdt: categoryThresholds,
    parent_of_disabled_allowance_bdt: parentAllowance,
    requested_profile: {
      category: profile.category,
      effective_category: profile.effectiveCategory,
      age: profile.age,
      parent_of_disabled: profile.parentOfDisabled,
      effective_threshold_bdt: effectiveThreshold,
    },
    slabs,
    rebate_rules: {
      taxable_income_rate_percent: rebate.taxableIncomeRate * 100,
      investment_rate_percent: rebate.investmentRate * 100,
      max_cap_bdt: rebate.maxCap,
      formula: rebate.formula,
    },
    minimum_tax_bdt: {
      ...minTax,
      first_time_filer_bdt:
        fiscalYear === '2026-27'
          ? MINIMUM_TAX_FIRST_TIME_2026
          : fiscalYear === '2025-26'
            ? MINIMUM_TAX_FIRST_TIME_2025
            : null,
      applicable_only_above_threshold: true,
    },
    salary_exemption_rule: salaryExemptionRule,
    salary_exemption_caps: SALARY_EXEMPTION_CAPS,
    investment_instrument_caps_bdt: instrumentCaps,
  };
}

export function calculateTaxForYear({
  year = DEFAULT_FISCAL_YEAR,
  category = 'general',
  age = null,
  parent_of_disabled = false,
  location = 'dhaka',
  first_time_filer = false,
  taxable_income,
  income,
  investments = 0,
  tds = 0,
} = {}) {
  const fiscalYear = normalizeFiscalYear(year);
  assertSafeAmount(tds, 'tds');

  const profile = resolveEffectiveProfile(
    {
      category,
      age,
      parent_of_disabled,
      location,
      first_time_filer,
    },
    fiscalYear
  );

  const incomeSummary = resolveIncomeInputs({ taxable_income, income }, fiscalYear);
  const taxableIncomeBdt = incomeSummary.taxable_income_bdt;

  const threshold = getTaxFreeThresholdForYear(fiscalYear, {
    category: profile.category,
    age: profile.age,
    parentOfDisabled: profile.parentOfDisabled,
  });

  const statutoryMinTax = getMinimumTaxForYear(fiscalYear, profile.location, {
    firstTimeFiler: profile.firstTimeFiler,
  });

  const slabs = calculateTaxSlabsForYear(fiscalYear, threshold);
  const idPrefix =
    fiscalYear === '2026-27' ? 'slab-2026' : fiscalYear === '2025-26' ? 'slab-2025' : 'slab';
  const rawBreakdown = calculateSlabBreakdown(taxableIncomeBdt, slabs, idPrefix);
  const grossTax = sumSlabTax(rawBreakdown);

  const investmentDetails = resolveInvestmentInputs(investments, taxableIncomeBdt, fiscalYear);
  const rebate = calculateInvestmentRebateForYear(
    fiscalYear,
    taxableIncomeBdt,
    investmentDetails.eligible_investment_bdt
  );

  const finalSummary = calculateFinalTaxSummary(grossTax, statutoryMinTax, tds, rebate, {
    taxableIncome: taxableIncomeBdt,
    taxFreeThreshold: threshold,
  });
  assertSafeAmount(tds + rebate, 'tds + rebate');

  const rebateRules = REBATE_RULES_BY_YEAR[fiscalYear];
  const meta = FISCAL_YEAR_METADATA[fiscalYear];
  const belowThreshold = taxableIncomeBdt <= threshold;

  return {
    fiscal_year: fiscalYear,
    assessment_year: meta.assessmentYear,
    label: meta.label,
    profile: {
      category: profile.category,
      effective_category: profile.effectiveCategory,
      age: profile.age,
      parent_of_disabled: profile.parentOfDisabled,
      location: profile.location,
      first_time_filer: profile.firstTimeFiler,
    },
    tax_free_threshold_bdt: threshold,
    income_summary: incomeSummary,
    taxable_income_bdt: taxableIncomeBdt,
    slab_breakdown: rawBreakdown.map((item, index) => {
      const unbounded = item.slabUpper === Infinity;
      return {
        index,
        id: item.id,
        title: item.slabTitle,
        lower_bdt: item.slabLower,
        upper_bdt: unbounded ? null : item.slabUpper,
        unbounded,
        rate_percent: item.slabPercentage,
        taxable_amount_bdt: item.slabAmount,
        tax_bdt: item.slabCut,
      };
    }),
    gross_tax_bdt: grossTax,
    rebate_bdt: rebate,
    tax_after_rebate_bdt: finalSummary.taxAfterRebate,
    statutory_minimum_tax_bdt: statutoryMinTax,
    minimum_tax_bdt: finalSummary.minimumTaxAmount,
    is_minimum_tax_applied: finalSummary.isMinimumTaxApplied,
    below_tax_free_threshold: belowThreshold,
    total_tax_bdt: finalSummary.totalTax,
    investment_summary: {
      ...investmentDetails,
      rebate_bdt: rebate,
      formula: rebateRules.formula,
    },
    tds_bdt: tds,
    payable_tax_bdt: finalSummary.payable,
    excess_tds_bdt: finalSummary.excessTds,
    excess_tds_or_rebate_bdt: finalSummary.excessTds,
  };
}

export function compareTaxYears({
  from_year = DEFAULT_COMPARISON_FROM_YEAR,
  to_year = DEFAULT_COMPARISON_TO_YEAR,
  ...sharedInputs
} = {}) {
  const fromResult = calculateTaxForYear({ ...sharedInputs, year: from_year });
  const toResult = calculateTaxForYear({ ...sharedInputs, year: to_year });

  const thresholdDiff = toResult.tax_free_threshold_bdt - fromResult.tax_free_threshold_bdt;
  const grossTaxDiff = toResult.gross_tax_bdt - fromResult.gross_tax_bdt;
  const rebateDiff = toResult.rebate_bdt - fromResult.rebate_bdt;
  const totalTaxDiff = toResult.total_tax_bdt - fromResult.total_tax_bdt;
  const payableDiff = toResult.payable_tax_bdt - fromResult.payable_tax_bdt;

  const taxSavings = totalTaxDiff < 0 ? Math.abs(totalTaxDiff) : 0;
  const additionalTax = totalTaxDiff > 0 ? totalTaxDiff : 0;

  let verdict = 'no_change';
  let summary = `Total tax remains BDT ${toResult.total_tax_bdt.toLocaleString('en-US')} across ${fromResult.label} and ${toResult.label}`;
  if (taxSavings > 0) {
    verdict = 'savings';
    summary = `Total tax decreases by BDT ${taxSavings.toLocaleString('en-US')} in ${toResult.label} vs ${fromResult.label}`;
  } else if (additionalTax > 0) {
    verdict = 'increase';
    summary = `Total tax increases by BDT ${additionalTax.toLocaleString('en-US')} in ${toResult.label} vs ${fromResult.label}`;
  }

  if (payableDiff > 0) {
    summary += `; final payable after rebate and TDS increases by BDT ${payableDiff.toLocaleString('en-US')} (BDT ${fromResult.payable_tax_bdt.toLocaleString('en-US')} -> BDT ${toResult.payable_tax_bdt.toLocaleString('en-US')}).`;
  } else if (payableDiff < 0) {
    summary += `; final payable after rebate and TDS decreases by BDT ${Math.abs(payableDiff).toLocaleString('en-US')} (BDT ${fromResult.payable_tax_bdt.toLocaleString('en-US')} -> BDT ${toResult.payable_tax_bdt.toLocaleString('en-US')}).`;
  } else {
    summary += `; final payable after rebate and TDS stays BDT ${toResult.payable_tax_bdt.toLocaleString('en-US')}.`;
  }

  return {
    from_year: fromResult.fiscal_year,
    to_year: toResult.fiscal_year,
    from: fromResult,
    to: toResult,
    comparison: {
      threshold_diff_bdt: thresholdDiff,
      gross_tax_diff_bdt: grossTaxDiff,
      rebate_diff_bdt: rebateDiff,
      total_tax_diff_bdt: totalTaxDiff,
      payable_tax_diff_bdt: payableDiff,
      tax_savings_bdt: taxSavings,
      additional_tax_bdt: additionalTax,
      verdict,
      summary,
    },
  };
}
