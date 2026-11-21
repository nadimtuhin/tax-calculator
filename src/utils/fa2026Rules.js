// Finance Act 2026 rules shared by FY 2025-26 and FY 2026-27.
// Source: ACNABIN "Important Changes Introduced by the Finance Act 2026" (section numbers below
// refer to that booklet).

/** booklet s.1.3 p.3: tax-free level rises by BDT 50,000 for each physically challenged child/dependent. */
export const DISABLED_DEPENDENT_ALLOWANCE = 50000;

/** booklet s.1.44(b) p.23: rebate of 5% of the solar electricity bill incurred during the income year. */
export const SOLAR_ELECTRICITY_REBATE_RATE = 0.05;

/** Investment-table row for donations to the institutions below. */
export const DONATION_ROW_NAME = 'Donation to listed philanthropic institution';

/** booklet s.1.46 pp.23-24 (SRO 213/AIN/income tax-4/2026): institutions whose donations get the investment rebate. */
export const PHILANTHROPIC_INSTITUTIONS = [
  'ASHIC Foundation for childhood cancer',
  'Bangladesh Cancer Aid Trust (BANCAT)',
  'Al-Markazul Islami',
  'Disabled child Foundation (DCF)',
  'Sherpur Diabetic Samity',
  'Maona Diabetic Association',
  'Bangladesh Thalassemia Samity',
  'Autism Welfare Foundation',
  'BRAC',
  'Ramakrishna Math & Mission, Dhaka',
  'Chattogram Maa-O-Shishu Hospital',
];

/**
 * Turn a boolean (legacy `parentOfDisabled`) or a count into a whole number of dependents.
 * true -> 1, false/null/undefined/garbage -> 0, numbers are floored and clamped at 0.
 */
export function normalizeDisabledDependentCount(value) {
  if (value === true) return 1;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.floor(number);
}

/**
 * Dependents counted for the tax-free level. Reads the new `disabledDependentCount` and the legacy
 * boolean `parentOfDisabled`; the legacy category `parent_disabled` counts as one.
 */
export function resolveDisabledDependentCount(profile = {}) {
  const fromCount = normalizeDisabledDependentCount(profile.disabledDependentCount);
  const fromLegacyFlag = normalizeDisabledDependentCount(profile.parentOfDisabled);
  const fromLegacyCategory = profile.category === 'parent_disabled' ? 1 : 0;
  return Math.max(fromCount, fromLegacyFlag, fromLegacyCategory);
}

const nonNegative = (value) => Math.max(0, Number(value) || 0);

/**
 * booklet s.1.4 p.4 (s.78): the 3% limb applies to total assessed income excluding exempted income,
 * reduced-rate income, partnership/AoP profit share and final-settlement income.
 * `taxableIncome` is already net of exempt salary, so salary-only callers get it back unchanged.
 */
export function calculateRebateIncomeBase(taxableIncome, exclusions = {}) {
  const {
    exemptIncome = 0,
    reducedRateIncome = 0,
    partnershipShare = 0,
    finalSettlementIncome = 0,
  } = exclusions || {};
  const excluded =
    nonNegative(exemptIncome) +
    nonNegative(reducedRateIncome) +
    nonNegative(partnershipShare) +
    nonNegative(finalSettlementIncome);
  return Math.max(0, nonNegative(taxableIncome) - excluded);
}

/** booklet s.1.44(b) p.23: 5% of the total solar electricity bill. */
export function calculateSolarElectricityRebate(solarBill) {
  return Math.round(nonNegative(solarBill) * SOLAR_ELECTRICITY_REBATE_RATE);
}
