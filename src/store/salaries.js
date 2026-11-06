import {
  DEFAULT_FISCAL_YEAR,
  DEFAULT_COMPARISON_FROM_YEAR,
  DEFAULT_COMPARISON_TO_YEAR,
  FISCAL_YEAR_OPTIONS,
  SUPPORTED_FISCAL_YEARS,
  resolveDefaultFiscalYear,
  INVESTMENT_INSTRUMENT_CAPS_BY_YEAR,
  REBATE_RULES_BY_YEAR,
  getSalaryExemptionRuleForYear,
  calculateEmploymentExemption,
  calculateCappedInvestmentFromList,
  calculateMaxRebateableInvestment,
  getTaxFreeThresholdForYear,
  getMinimumTaxForYear,
  calculateTaxSlabsForYear,
  sumSlabTax,
  calculateInvestmentRebateForYear,
  calculateFinalTaxSummary,
} from '../utils/taxEngine.js';
import calculateTaxBreakdown2025 from '../calculateTaxBreakdown2025';
import calculateTaxBreakdown2026 from '../calculateTaxBreakdown2026';
import calculateTaxBreakdown from '../calculateTaxBreakdown';

function monthlyDefault() {
  return {
    salary: 0,
    tds: 0,
    breakdown: {
      basic: 0,
      house: 0,
      medical: 0,
      transport: 0,
      others: 0,
    },
  };
}

function arraySum(arr) {
  return arr.reduceRight((c, i) => c + +i, 0);
}

const infinity = 99999999999999999999999999; // Infinity has persist issues in localStorage

const capOrInfinity = (cap) => (cap === null ? infinity : cap);

const defaultCaps = INVESTMENT_INSTRUMENT_CAPS_BY_YEAR[DEFAULT_FISCAL_YEAR];

const salaries = {
  state: () => ({
    taxpayerProfile: {
      category: 'general',
      age: null,
      location: 'dhaka',
      parentOfDisabled: false,
      firstTimeFiler: false,
    },
    currentYear: resolveDefaultFiscalYear(new Date(), SUPPORTED_FISCAL_YEARS),
    comparisonFromYear: DEFAULT_COMPARISON_FROM_YEAR,
    comparisonToYear: DEFAULT_COMPARISON_TO_YEAR,
    fiscalYearOptions: FISCAL_YEAR_OPTIONS.map((opt) => ({ ...opt })),
    investments: [
      { name: 'DPS', amount: 0, maximum: capOrInfinity(defaultCaps.dps) },
      { name: 'Life insurance premium', amount: 0, policyValue: null, maximum: capOrInfinity(defaultCaps.life_insurance) },
      { name: 'Stocks', amount: 0, maximum: capOrInfinity(defaultCaps.stocks) },
      { name: 'Savings certificate', amount: 0, maximum: capOrInfinity(defaultCaps.savings_certificate) },
      { name: 'Mutual fund', amount: 0, maximum: capOrInfinity(defaultCaps.mutual_fund) },
      { name: 'Others', amount: 0, maximum: capOrInfinity(defaultCaps.others) },
    ],
    parts: ['basic', 'house', 'medical', 'transport', 'others'],
    months: [
      { id: 'July', ...monthlyDefault() },
      { id: 'August', ...monthlyDefault() },
      { id: 'September', ...monthlyDefault() },
      { id: 'October', ...monthlyDefault() },
      { id: 'November', ...monthlyDefault() },
      { id: 'December', ...monthlyDefault() },
      { id: 'January', ...monthlyDefault() },
      { id: 'February', ...monthlyDefault() },
      { id: 'March', ...monthlyDefault() },
      { id: 'April', ...monthlyDefault() },
      { id: 'May', ...monthlyDefault() },
      { id: 'June', ...monthlyDefault() },
    ],
    bonus: 0,
    bonus2: 0,
    showBonus2: false,
    others: 0,
  }),
  mutations: {
    loadSalaries(state, salariesList) {
      state.months = salariesList;
    },
    loadInvestments(state, investments) {
      state.investments = investments;
    },
    resetSalaries(state) {
      state.months = state.months.map((month) => ({
        id: month.id,
        salary: 0,
        tds: 0,
        breakdown: {
          basic: 0,
          house: 0,
          medical: 0,
          transport: 0,
          others: 0,
        },
      }));
    },
    resetInvestments(state) {
      state.investments = state.investments.map((investment) => ({
        ...investment,
        amount: 0,
        ...(Object.prototype.hasOwnProperty.call(investment, 'policyValue') ? { policyValue: null } : {}),
      }));
    },
    changeInvestment(state, { index, value }) {
      state.investments[index].amount = +value;
    },
    changeInvestmentPolicyValue(state, { index, value }) {
      const cleaned = value === '' || value === null || value === undefined ? null : Math.max(0, +value || 0);
      state.investments[index].policyValue = cleaned;
    },
    updateTaxpayerProfile(state, profile) {
      state.taxpayerProfile = {
        category: 'general',
        age: null,
        location: 'dhaka',
        parentOfDisabled: false,
        firstTimeFiler: false,
        ...profile,
      };
    },
    setCurrentYear(state, year) {
      state.currentYear = year;
    },
    setComparisonFromYear(state, year) {
      state.comparisonFromYear = year;
    },
    setComparisonToYear(state, year) {
      state.comparisonToYear = year;
    },
    changeSubsequentSalaries(state, { index, value }) {
      const { months } = state;
      months[index].salary = +value;
      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].salary = months[index].salary;
      }
    },
    changeSubsequentTds(state, { index, value }) {
      const { months } = state;
      months[index].tds = +value;
      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].tds = months[index].tds;
      }
    },
    changeParts(state, { part, index, value }) {
      const { months } = state;
      months[index].breakdown[part] = +value;
      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].breakdown[part] = months[index].breakdown[part];
      }
      months.forEach((month) => {
        month.salary = arraySum(Object.values(month.breakdown));
      });
    },
    changeOthers(state, value) {
      state.others = +value;
    },
    changeBonus(state, value) {
      state.bonus = +value;
    },
    changeBonus2(state, value) {
      state.bonus2 = +value;
    },
    setShowBonus2(state, value) {
      state.showBonus2 = value;
    },
  },
  getters: {
    fiscalYearOptions(state) {
      return state.fiscalYearOptions;
    },
    currentYear(state) {
      return state.currentYear;
    },
    totalSalary(state) {
      return (
        state.months.reduceRight((carry, item) => carry + +item.salary, 0) +
        state.others +
        state.bonus +
        state.bonus2
      );
    },
    totalTds(state) {
      return state.months.reduceRight((carry, item) => carry + +item.tds, 0);
    },
    totalBasic({ months }) {
      return arraySum(months.map((month) => month.breakdown.basic));
    },
    totalHouse({ months }) {
      return arraySum(months.map((month) => month.breakdown.house));
    },
    totalMedical({ months }) {
      return arraySum(months.map((month) => month.breakdown.medical));
    },
    totalTransport({ months }) {
      return arraySum(months.map((month) => month.breakdown.transport));
    },
    totalOthersBreakdown({ months }) {
      return arraySum(months.map((month) => month.breakdown.others || 0));
    },

    // ITA 2023 Sixth Schedule Part 1 Para 27 single-pool employment exemption
    houseExempt() {
      return 0;
    },
    medicalExempt() {
      return 0;
    },
    transportExempt() {
      return 0;
    },
    lfaExempt() {
      return 0;
    },
    exemptionCap(state) {
      return getSalaryExemptionRuleForYear(state.currentYear).maxAmount;
    },
    totalExempt(state, getters) {
      return calculateEmploymentExemption(getters.totalSalary, state.currentYear);
    },
    taxableSalary(state, getters) {
      return Math.max(0, getters.totalSalary - getters.totalExempt);
    },

    // Sixth Schedule Part 3 investments & Section 78 rebate (year-aware)
    totalInvestment(state) {
      return state.investments.map((i) => +i.amount || 0).reduce((c, n) => c + n, 0);
    },
    eligibleInvestment(state) {
      return calculateCappedInvestmentFromList(state.investments, state.currentYear);
    },
    eligibleInvestment2024(state) {
      return calculateCappedInvestmentFromList(state.investments, '2024-25');
    },
    eligibleInvestment2025(state) {
      return calculateCappedInvestmentFromList(state.investments, '2025-26');
    },
    eligibleInvestment2026(state) {
      return calculateCappedInvestmentFromList(state.investments, '2026-27');
    },
    maxRebateableInvestment(state, getters) {
      return calculateMaxRebateableInvestment(getters.taxableSalary, state.currentYear);
    },
    totalRebateableInvestment(state, getters) {
      return Math.min(getters.maxRebateableInvestment, getters.eligibleInvestment);
    },
    rebatePercentage(state) {
      const rule = REBATE_RULES_BY_YEAR[state.currentYear] || REBATE_RULES_BY_YEAR[DEFAULT_FISCAL_YEAR];
      return Math.round(rule.investmentRate * 100);
    },
    rebateMaxCap(state) {
      const rule = REBATE_RULES_BY_YEAR[state.currentYear] || REBATE_RULES_BY_YEAR[DEFAULT_FISCAL_YEAR];
      return rule.maxCap;
    },
    investmentRebate(state, getters) {
      return calculateInvestmentRebateForYear(
        state.currentYear,
        getters.taxableSalary,
        getters.eligibleInvestment
      );
    },

    // Active fiscal year (`state.currentYear`) getters
    taxFreeThreshold(state) {
      return getTaxFreeThresholdForYear(state.currentYear, state.taxpayerProfile);
    },
    minimumTaxAmount(state) {
      return getMinimumTaxForYear(state.currentYear, state.taxpayerProfile.location, {
        firstTimeFiler: Boolean(state.taxpayerProfile?.firstTimeFiler),
      });
    },
    taxSlabs(state, getters) {
      return calculateTaxSlabsForYear(state.currentYear, getters.taxFreeThreshold);
    },
    taxBreakdown(state, getters) {
      if (state.currentYear === '2026-27') {
        return calculateTaxBreakdown2026(getters.taxableSalary, getters.taxSlabs);
      }
      if (state.currentYear === '2025-26') {
        return calculateTaxBreakdown2025(getters.taxableSalary, getters.taxSlabs);
      }
      return calculateTaxBreakdown(getters.taxableSalary, getters.taxSlabs);
    },
    calculatedTax(state, getters) {
      return sumSlabTax(getters.taxBreakdown);
    },
    _finalSummaryCurrent(state, getters) {
      return calculateFinalTaxSummary(
        getters.calculatedTax,
        getters.minimumTaxAmount,
        getters.totalTds,
        getters.investmentRebate,
        {
          taxableIncome: getters.taxableSalary,
          taxFreeThreshold: getters.taxFreeThreshold,
        }
      );
    },
    effectiveMinimumTax(state, getters) {
      return getters._finalSummaryCurrent.minimumTaxAmount;
    },
    totalTax(state, getters) {
      return getters._finalSummaryCurrent.totalTax;
    },
    isMinimumTaxApplied(state, getters) {
      return getters._finalSummaryCurrent.isMinimumTaxApplied;
    },
    payableTax(state, getters) {
      return getters._finalSummaryCurrent.payable;
    },

    // FY 2024-2025 Getters
    taxFreeThreshold2024(state) {
      return getTaxFreeThresholdForYear('2024-25', state.taxpayerProfile);
    },
    minimumTaxAmount2024(state) {
      return getMinimumTaxForYear('2024-25', state.taxpayerProfile.location);
    },
    taxSlabs2024(state, getters) {
      return calculateTaxSlabsForYear('2024-25', getters.taxFreeThreshold2024);
    },
    investmentRebate2024(state, getters) {
      return calculateInvestmentRebateForYear(
        '2024-25',
        getters.taxableSalary,
        getters.eligibleInvestment2024
      );
    },
    taxBreakdown2024(state, getters) {
      return calculateTaxBreakdown(getters.taxableSalary, getters.taxSlabs2024);
    },
    calculatedTax2024(state, getters) {
      return sumSlabTax(getters.taxBreakdown2024);
    },
    _finalSummary2024(state, getters) {
      return calculateFinalTaxSummary(
        getters.calculatedTax2024,
        getters.minimumTaxAmount2024,
        getters.totalTds,
        getters.investmentRebate2024,
        {
          taxableIncome: getters.taxableSalary,
          taxFreeThreshold: getters.taxFreeThreshold2024,
        }
      );
    },
    effectiveMinimumTax2024(state, getters) {
      return getters._finalSummary2024.minimumTaxAmount;
    },
    totalTax2024(state, getters) {
      return getters._finalSummary2024.totalTax;
    },
    isMinimumTaxApplied2024(state, getters) {
      return getters._finalSummary2024.isMinimumTaxApplied;
    },
    payableTax2024(state, getters) {
      return getters._finalSummary2024.payable;
    },

    // FY 2025-2026 Getters
    taxFreeThreshold2025(state) {
      return getTaxFreeThresholdForYear('2025-26', state.taxpayerProfile);
    },
    minimumTaxAmount2025(state) {
      return getMinimumTaxForYear('2025-26', state.taxpayerProfile.location, {
        firstTimeFiler: Boolean(state.taxpayerProfile?.firstTimeFiler),
      });
    },
    taxSlabs2025(state, getters) {
      return calculateTaxSlabsForYear('2025-26', getters.taxFreeThreshold2025);
    },
    investmentRebate2025(state, getters) {
      return calculateInvestmentRebateForYear(
        '2025-26',
        getters.taxableSalary,
        getters.eligibleInvestment2025
      );
    },
    taxBreakdown2025(state, getters) {
      return calculateTaxBreakdown2025(getters.taxableSalary, getters.taxSlabs2025);
    },
    calculatedTax2025(state, getters) {
      return sumSlabTax(getters.taxBreakdown2025);
    },
    _finalSummary2025(state, getters) {
      return calculateFinalTaxSummary(
        getters.calculatedTax2025,
        getters.minimumTaxAmount2025,
        getters.totalTds,
        getters.investmentRebate2025,
        {
          taxableIncome: getters.taxableSalary,
          taxFreeThreshold: getters.taxFreeThreshold2025,
        }
      );
    },
    effectiveMinimumTax2025(state, getters) {
      return getters._finalSummary2025.minimumTaxAmount;
    },
    totalTax2025(state, getters) {
      return getters._finalSummary2025.totalTax;
    },
    isMinimumTaxApplied2025(state, getters) {
      return getters._finalSummary2025.isMinimumTaxApplied;
    },
    payableTax2025(state, getters) {
      return getters._finalSummary2025.payable;
    },

    // FY 2026-2027 Getters
    taxFreeThreshold2026(state) {
      return getTaxFreeThresholdForYear('2026-27', state.taxpayerProfile);
    },
    minimumTaxAmount2026(state) {
      return getMinimumTaxForYear('2026-27', state.taxpayerProfile.location, {
        firstTimeFiler: Boolean(state.taxpayerProfile?.firstTimeFiler),
      });
    },
    taxSlabs2026(state, getters) {
      return calculateTaxSlabsForYear('2026-27', getters.taxFreeThreshold2026);
    },
    investmentRebate2026(state, getters) {
      return calculateInvestmentRebateForYear(
        '2026-27',
        getters.taxableSalary,
        getters.eligibleInvestment2026
      );
    },
    taxBreakdown2026(state, getters) {
      return calculateTaxBreakdown2026(getters.taxableSalary, getters.taxSlabs2026);
    },
    calculatedTax2026(state, getters) {
      return sumSlabTax(getters.taxBreakdown2026);
    },
    _finalSummary2026(state, getters) {
      return calculateFinalTaxSummary(
        getters.calculatedTax2026,
        getters.minimumTaxAmount2026,
        getters.totalTds,
        getters.investmentRebate2026,
        {
          taxableIncome: getters.taxableSalary,
          taxFreeThreshold: getters.taxFreeThreshold2026,
        }
      );
    },
    effectiveMinimumTax2026(state, getters) {
      return getters._finalSummary2026.minimumTaxAmount;
    },
    totalTax2026(state, getters) {
      return getters._finalSummary2026.totalTax;
    },
    isMinimumTaxApplied2026(state, getters) {
      return getters._finalSummary2026.isMinimumTaxApplied;
    },
    payableTax2026(state, getters) {
      return getters._finalSummary2026.payable;
    },

    // Comparison getters: defaults to FY 2025-26 vs FY 2026-27; user can pick any pair via dual-year dropdowns
    comparisonFromYear(state) {
      return state.comparisonFromYear || DEFAULT_COMPARISON_FROM_YEAR;
    },
    comparisonToYear(state) {
      return state.comparisonToYear || DEFAULT_COMPARISON_TO_YEAR;
    },
    comparisonFromThreshold(state, getters) {
      const y = getters.comparisonFromYear;
      if (y === '2026-27') return getters.taxFreeThreshold2026;
      if (y === '2025-26') return getters.taxFreeThreshold2025;
      return getters.taxFreeThreshold2024;
    },
    comparisonToThreshold(state, getters) {
      const y = getters.comparisonToYear;
      if (y === '2026-27') return getters.taxFreeThreshold2026;
      if (y === '2025-26') return getters.taxFreeThreshold2025;
      return getters.taxFreeThreshold2024;
    },
    comparisonFromTax(state, getters) {
      const y = getters.comparisonFromYear;
      if (y === '2026-27') return getters.totalTax2026;
      if (y === '2025-26') return getters.totalTax2025;
      return getters.totalTax2024;
    },
    comparisonToTax(state, getters) {
      const y = getters.comparisonToYear;
      if (y === '2026-27') return getters.totalTax2026;
      if (y === '2025-26') return getters.totalTax2025;
      return getters.totalTax2024;
    },
    comparisonFromPayable(state, getters) {
      const y = getters.comparisonFromYear;
      if (y === '2026-27') return getters.payableTax2026;
      if (y === '2025-26') return getters.payableTax2025;
      return getters.payableTax2024;
    },
    comparisonToPayable(state, getters) {
      const y = getters.comparisonToYear;
      if (y === '2026-27') return getters.payableTax2026;
      if (y === '2025-26') return getters.payableTax2025;
      return getters.payableTax2024;
    },
    taxDifference(state, getters) {
      return getters.comparisonToTax - getters.comparisonFromTax;
    },
    taxSavings(state, getters) {
      const difference = getters.taxDifference;
      return difference < 0 ? Math.abs(difference) : 0;
    },
    additionalTax(state, getters) {
      const difference = getters.taxDifference;
      return difference > 0 ? difference : 0;
    },
  },
};

export default salaries;
