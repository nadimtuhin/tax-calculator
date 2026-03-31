import {
  getTaxFreeThreshold2025,
  getMinimumTax2025,
  calculateTaxSlabs2025,
  calculateInvestmentRebate2025FromIncome
} from '../utils/taxSlabs2025';
import {
  getTaxFreeThreshold2026,
  getMinimumTax2026,
  calculateInvestmentRebate2026FromIncome
} from '../utils/taxSlabs2026';
import calculateTaxBreakdown2025, {
  calculateFinalTax2025
} from '../calculateTaxBreakdown2025';
import calculateTaxBreakdown2026 from '../calculateTaxBreakdown2026';
import { calculateTaxSlabs } from '../utils/taxSlabs';
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
  }
}

function arraySum(arr) {
  return arr.reduceRight((c, i) => (c + +i), 0);
}

const infinity = 99999999999999999999999999; // Inifiny has persist issues in localStorage

const taxFreeThresholds = {
  '2023-24': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    parent_disabled: 50000, // additional amount
    freedom_fighter: 500000,
    third_gender: 475000,
  },
  '2024-25': {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    parent_disabled: 50000, // additional amount
    freedom_fighter: 500000,
    third_gender: 475000,
  },
  '2025-26': {
    general: 375000,
    female: 425000,
    senior: 425000,
    disabled: 500000,
    parent_disabled: 50000, // additional amount
    freedom_fighter: 525000,
    third_gender: 500000,
  },
  '2026-27': {
    general: 375000,
    female: 425000,
    senior: 425000,
    disabled: 500000,
    parent_disabled: 50000, // additional amount
    freedom_fighter: 525000,
    third_gender: 500000,
    july_warrior: 525000, // NEW in FY 2026-27 per Finance Ordinance 2025
  },
};

const minimumTax = {
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
    dhaka: 5000,
    chittagong: 5000,
    other_city: 5000,
    district: 5000,
  },
  '2026-27': {
    dhaka: 5000,
    chittagong: 5000,
    other_city: 5000,
    district: 5000,
  },
};

const salaries = {
  state: () => ({
    taxpayerProfile: {
      category: 'general',
      age: null,
      location: 'dhaka',
    },
    currentYear: '2025-26',
    fiscalYearOptions: [
      { value: '2025-26', label: '2025-2026' },
      { value: '2026-27', label: '2026-2027' },
    ],
    investments: [
      { name: 'DPS', amount: 0,  maximum: 120000 },
      { name: 'Life insurance premium', amount: 0,  maximum: infinity },
      { name: 'Stocks', amount: 0,  maximum: infinity },
      { name: 'Savings certificate', amount: 0,  maximum: 500000 },
      { name: 'Mutual fund', amount: 0,  maximum: 500000 },
      { name: 'Others', amount: 0,  maximum: infinity },
    ],
    parts: ['basic', 'house', 'medical', 'transport', 'others'],
    months: [
      { id: "July",  ...monthlyDefault() },
      { id: "August",  ...monthlyDefault() },
      { id: "September",  ...monthlyDefault() },
      { id: "October",  ...monthlyDefault() },
      { id: "November",  ...monthlyDefault() },
      { id: "December",  ...monthlyDefault() },
      { id: "January",  ...monthlyDefault() },
      { id: "February",  ...monthlyDefault() },
      { id: "March",  ...monthlyDefault() },
      { id: "April",  ...monthlyDefault() },
      { id: "May",  ...monthlyDefault() },
      { id: "June",  ...monthlyDefault() },
    ],
    bonus: 0,
    bonus2: 0,
    showBonus2: false,
    others: 0,
  }),
  mutations: {
    loadSalaries(state, salaries) {
      state.months = salaries;
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
      state.investments = state.investments.map(investment => ({
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
      // window.history.pushState(value, "Tax for monthly salary "+value, "/?salary="+value);
      const { months, parts } = state;

      months[index].salary = +value;

      // change subsequent salaries
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
      const { months, parts } = state;
      months[index].breakdown[part] = +value;

      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].breakdown[part] = months[index].breakdown[part];
      }

      // calculate monthly salary from breakdowns
      months.forEach(month => {
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
    setMonthBreakdownPart(state, { index, part, value }) {
      state.months[index].breakdown[part] = +value;
      state.months[index].salary = Object.values(state.months[index].breakdown).reduce((c, v) => c + +v, 0);
    },
    setMonthTds(state, { index, value }) {
      state.months[index].tds = +value;
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
      return arraySum(months.map(month => month.breakdown.basic));
    },
    totalHouse({ months }) {
      return arraySum(months.map(month => month.breakdown.house));
    },
    totalMedical({ months }) {
      return arraySum(months.map(month => month.breakdown.medical));
    },
    totalTransport({ months }) {
      return arraySum(months.map(month => month.breakdown.transport));
    },
    totalOthersBreakdown({ months }) {
      return arraySum(months.map(month => month.breakdown.others));
    },
    totalExempt(state, getters) {
      // Under Income Tax Act 2023 (effective FY 2023-24 onward), the old separate
      // house rent / medical / transport caps are replaced by a single consolidated
      // allowance exemption: min(total allowances, 1/3 of gross salary, annual cap).
      // FY 2024-25 cap: 4,50,000 BDT | FY 2025-26 cap: 5,00,000 BDT
      const { totalHouse, totalMedical, totalTransport, totalSalary } = getters;
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      const cap = (state.currentYear === '2025-26' || state.currentYear === '2026-27') ? 500000 : 450000;
      return Math.min(totalAllowances, Math.round(totalSalary / 3), cap);
    },
    houseExempt(state, getters) {
      // Proportional share of consolidated exemption for display purposes
      const { totalHouse, totalMedical, totalTransport, totalExempt } = getters;
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      if (totalAllowances === 0) return 0;
      return Math.round(totalExempt * totalHouse / totalAllowances);
    },
    medicalExempt(state, getters) {
      const { totalHouse, totalMedical, totalTransport, totalExempt } = getters;
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      if (totalAllowances === 0) return 0;
      return Math.round(totalExempt * totalMedical / totalAllowances);
    },
    transportExempt(state, getters) {
      const { totalHouse, totalMedical, totalTransport, totalExempt } = getters;
      const totalAllowances = totalHouse + totalMedical + totalTransport;
      if (totalAllowances === 0) return 0;
      return Math.round(totalExempt * totalTransport / totalAllowances);
    },
    lfaExempt(state, getters) {
      return 0;
    },
    taxableSalary(state, getters) {
      return getters.totalSalary - getters.totalExempt;
    },
    totalInvestment(state, getters) {
      return state.investments.map(i => i.amount).reduce((c, n) => c+n, 0);
    },
    totalRebateableInvestment(state, getters) {
      const rebateable = state.investments
        .map(i => [i.amount, i.maximum])
        .reduceRight((c, arr) => {
          return c+(Math.min(...arr))
        }, 0);

      return Math.min(getters.maxRebateableInvestment, rebateable);
    },
    maxRebateableInvestment(state, getters) {
      // Allowable investment = min(20% of taxable income, 10,000,000 BDT)
      // per Finance Act 2024 / Income Tax Act 2023 Sixth Schedule Part 3
      const twentyPercentOfIncome = Math.round(getters.taxableSalary / 5);
      const maxCap = 10000000; // 1 crore BDT
      return Math.min(twentyPercentOfIncome, maxCap);
    },
    rebatePercentage(state, getters) {
      return 15;
    },
    investmentRebate(state, getters) {
      // Rebate = 15% × min(actual investment, 20% of income, 1 crore)
      // per Finance Act 2024 / Income Tax Act 2023 Sixth Schedule Part 3
      const allowable = Math.min(getters.totalInvestment, getters.maxRebateableInvestment);
      return Math.round(allowable * 0.15);
    },
    
    taxFreeThreshold(state) {
      const year = state.currentYear;
      const category = state.taxpayerProfile.category;
      const thresholds = taxFreeThresholds[year] || taxFreeThresholds['2024-25'];
      
      let baseThreshold = thresholds[category] || thresholds.general;
      
      // Add additional amount for parent of disabled child
      if (category === 'parent_disabled') {
        baseThreshold = thresholds.general + thresholds.parent_disabled;
      }
      
      return baseThreshold;
    },
    
    minimumTaxAmount(state) {
      const year = state.currentYear;
      const location = state.taxpayerProfile.location;
      const taxRates = minimumTax[year] || minimumTax['2024-25'];
      
      return taxRates[location] || taxRates.dhaka;
    },
    
    taxSlabs(state, getters) {
      return calculateTaxSlabs(getters.taxFreeThreshold);
    },
    
    taxBreakdown(state, getters) {
      return calculateTaxBreakdown(getters.taxableSalary, getters.taxSlabs);
    },
    
    calculatedTax(state, getters) {
      return Math.round(getters.taxBreakdown.reduceRight((c,i)=>c+ +i.slabCut, 0));
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
      return getTaxFreeThreshold2025(state.taxpayerProfile);
    },

    minimumTaxAmount2025(state) {
      return getMinimumTax2025(state.taxpayerProfile.location);
    },

    taxSlabs2025(state, getters) {
      return calculateTaxSlabs2025(getters.taxFreeThreshold2025);
    },

    investmentRebate2025(state, getters) {
      // Rebate = lowest of: (a) 3% of total income, (b) 15% of qualifying investment, (c) 10 lakh
      // per Finance Ordinance 2025 Section 78 / NBR Paripatra 2025-2026 Section 19
      return calculateInvestmentRebate2025FromIncome(
        getters.taxableSalary,
        getters.totalInvestment
      );
    },
    
    taxBreakdown2025(state, getters) {
      return calculateTaxBreakdown2025(getters.taxableSalary, getters.taxSlabs2025);
    },
    
    calculatedTax2025(state, getters) {
      return Math.round(getters.taxBreakdown2025.reduceRight((c,i)=>c+ +i.slabCut, 0));
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
      return getTaxFreeThreshold2026(state.taxpayerProfile);
    },

    minimumTaxAmount2026(state) {
      return getMinimumTax2026(state.taxpayerProfile.location);
    },

    taxSlabs2026(state, getters) {
      // 2026-27 uses same slab structure as 2025-26 (no 5% bracket)
      return calculateTaxSlabs2025(getters.taxFreeThreshold2026);
    },

    investmentRebate2026(state, getters) {
      return calculateInvestmentRebate2026FromIncome(
        getters.taxableSalary,
        getters.totalInvestment
      );
    },

    taxBreakdown2026(state, getters) {
      return calculateTaxBreakdown2026(getters.taxableSalary, getters.taxSlabs2026);
    },

    calculatedTax2026(state, getters) {
      return Math.round(getters.taxBreakdown2026.reduceRight((c,i)=>c+ +i.slabCut, 0));
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

    // 2025-26 vs 2026-27 comparison getters
    taxDifference2026(state, getters) {
      return getters.totalTax2026 - getters.totalTax2025;
    },

    taxSavings2026(state, getters) {
      const difference = getters.taxDifference2026;
      return difference < 0 ? Math.abs(difference) : 0;
    },

    additionalTax2026(state, getters) {
      const difference = getters.taxDifference2026;
      return difference > 0 ? difference : 0;
    }
  }
};

export default salaries;
