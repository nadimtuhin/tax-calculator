import {
  DEFAULT_FISCAL_YEAR,
  FISCAL_YEAR_OPTIONS,
  INVESTMENT_INSTRUMENT_CAPS,
  calculateHouseExemption,
  calculateMedicalExemption,
  calculateTransportExemption,
  calculateLfaExemption,
  calculateMaxRebateableInvestment,
  getTaxFreeThresholdForYear,
  getMinimumTaxForYear,
  calculateTaxSlabsForYear,
  sumSlabTax,
  calculateInvestmentRebateForYear,
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

const salaries = {
  state: () => ({
    taxpayerProfile: {
      category: 'general',
      age: null,
      location: 'dhaka',
      parentOfDisabled: false,
    },
    currentYear: DEFAULT_FISCAL_YEAR,
    fiscalYearOptions: FISCAL_YEAR_OPTIONS.map((opt) => ({ ...opt })),
    investments: [
      { name: 'DPS', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.dps) },
      { name: 'Life insurance premium', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.life_insurance) },
      { name: 'Stocks', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.stocks) },
      { name: 'Savings certificate', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.savings_certificate) },
      { name: 'Mutual fund', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.mutual_fund) },
      { name: 'Others', amount: 0, maximum: capOrInfinity(INVESTMENT_INSTRUMENT_CAPS.others) },
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
          lfa: 0,
        },
      }));
    },
    resetInvestments(state) {
      state.investments = state.investments.map((investment) => ({
        ...investment,
        amount: 0,
      }));
    },
    changeInvestment(state, { index, value }) {
      state.investments[index].amount = +value;
    },
    updateTaxpayerProfile(state, profile) {
      state.taxpayerProfile = profile;
    },
    setCurrentYear(state, year) {
      state.currentYear = year;
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
      return state.months.reduceRight((carry, item) => carry + +item.salary, 0) + state.others + state.bonus + state.bonus2;
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
      return arraySum(months.map((month) => month.breakdown.others));
    },
    houseExempt(state, getters) {
      return calculateHouseExemption(getters.totalBasic, getters.totalHouse);
    },
    medicalExempt(state, getters) {
      return calculateMedicalExemption(getters.totalBasic, getters.totalMedical);
    },
    transportExempt(state, getters) {
      return calculateTransportExemption(getters.totalTransport);
    },
    lfaExempt() {
      return calculateLfaExemption();
    },
    totalExempt(state, getters) {
      const { medicalExempt, transportExempt, lfaExempt, houseExempt } = getters;
      return medicalExempt + transportExempt + lfaExempt + houseExempt;
    },
    taxableSalary(state, getters) {
      return getters.totalSalary - getters.totalExempt;
    },
    totalInvestment(state) {
      return state.investments.map((i) => i.amount).reduce((c, n) => c + n, 0);
    },
    totalRebateableInvestment(state, getters) {
      const rebateable = state.investments
        .map((i) => [i.amount, i.maximum])
        .reduceRight((c, arr) => c + Math.min(...arr), 0);

      return Math.min(getters.maxRebateableInvestment, rebateable);
    },
    maxRebateableInvestment(state, getters) {
      return calculateMaxRebateableInvestment(getters.taxableSalary);
    },
    rebatePercentage() {
      return 15;
    },
    investmentRebate(state, getters) {
      return calculateInvestmentRebateForYear('2024-25', getters.taxableSalary, getters.totalInvestment);
    },
    taxFreeThreshold(state) {
      return getTaxFreeThresholdForYear(state.currentYear, state.taxpayerProfile, { legacySharedGetter: true });
    },
    minimumTaxAmount(state) {
      return getMinimumTaxForYear(state.currentYear, state.taxpayerProfile.location);
    },
    taxSlabs(state, getters) {
      return calculateTaxSlabsForYear('2024-25', getters.taxFreeThreshold);
    },
    taxBreakdown(state, getters) {
      return calculateTaxBreakdown(getters.taxableSalary, getters.taxSlabs);
    },
    calculatedTax(state, getters) {
      return sumSlabTax(getters.taxBreakdown);
    },
    totalTax(state, getters) {
      return Math.max(getters.calculatedTax, getters.minimumTaxAmount);
    },
    isMinimumTaxApplied(state, getters) {
      return getters.calculatedTax < getters.minimumTaxAmount;
    },
    payableTax(state, getters) {
      return Math.max(0, getters.totalTax - getters.totalTds - getters.investmentRebate);
    },

    // FY 2025-2026 Getters
    taxFreeThreshold2025(state) {
      return getTaxFreeThresholdForYear('2025-26', state.taxpayerProfile);
    },
    minimumTaxAmount2025(state) {
      return getMinimumTaxForYear('2025-26', state.taxpayerProfile.location);
    },
    taxSlabs2025(state, getters) {
      return calculateTaxSlabsForYear('2025-26', getters.taxFreeThreshold2025);
    },
    investmentRebate2025(state, getters) {
      return calculateInvestmentRebateForYear('2025-26', getters.taxableSalary, getters.totalInvestment);
    },
    taxBreakdown2025(state, getters) {
      return calculateTaxBreakdown2025(getters.taxableSalary, getters.taxSlabs2025);
    },
    calculatedTax2025(state, getters) {
      return sumSlabTax(getters.taxBreakdown2025);
    },
    totalTax2025(state, getters) {
      return Math.max(getters.calculatedTax2025, getters.minimumTaxAmount2025);
    },
    isMinimumTaxApplied2025(state, getters) {
      return getters.calculatedTax2025 < getters.minimumTaxAmount2025;
    },
    payableTax2025(state, getters) {
      return Math.max(0, getters.totalTax2025 - getters.totalTds - getters.investmentRebate2025);
    },

    // FY 2026-2027 Getters
    taxFreeThreshold2026(state) {
      return getTaxFreeThresholdForYear('2026-27', state.taxpayerProfile);
    },
    minimumTaxAmount2026(state) {
      return getMinimumTaxForYear('2026-27', state.taxpayerProfile.location);
    },
    taxSlabs2026(state, getters) {
      return calculateTaxSlabsForYear('2026-27', getters.taxFreeThreshold2026);
    },
    investmentRebate2026(state, getters) {
      return calculateInvestmentRebateForYear('2026-27', getters.taxableSalary, getters.totalInvestment);
    },
    taxBreakdown2026(state, getters) {
      return calculateTaxBreakdown2026(getters.taxableSalary, getters.taxSlabs2026);
    },
    calculatedTax2026(state, getters) {
      return sumSlabTax(getters.taxBreakdown2026);
    },
    totalTax2026(state, getters) {
      return Math.max(getters.calculatedTax2026, getters.minimumTaxAmount2026);
    },
    isMinimumTaxApplied2026(state, getters) {
      return getters.calculatedTax2026 < getters.minimumTaxAmount2026;
    },
    payableTax2026(state, getters) {
      return Math.max(0, getters.totalTax2026 - getters.totalTds - getters.investmentRebate2026);
    },

    // Comparison getters: FY 2025-26 vs FY 2026-27
    taxDifference(state, getters) {
      return getters.totalTax2026 - getters.totalTax2025;
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
