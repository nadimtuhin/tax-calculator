import { calculateTaxSlabs } from '../utils/taxSlabs';
import calculateTaxBreakdown from '../calculateTaxBreakdown';
import { normalizeSalary } from './normalize';

const THRESHOLDS = {
  general: 350000,
  female: 400000,
  senior: 400000,
  disabled: 475000,
  third_gender: 475000,
  freedom_fighter: 500000,
  parent_disabled: 400000, // 350k base + 50k additional
};

const MINIMUM_TAX = {
  dhaka: 5000,
  chittagong: 5000,
  other_city: 4000,
  district: 3000,
};

const SALARY_EXEMPTION_CAP = 450000;

function getTaxFreeThreshold(profile) {
  const { category, age } = profile;
  if (age >= 65 && category !== 'disabled' && category !== 'freedom_fighter' && category !== 'third_gender') {
    return THRESHOLDS.senior;
  }
  return THRESHOLDS[category] || THRESHOLDS.general;
}

function getMinimumTax(location) {
  return MINIMUM_TAX[location] || MINIMUM_TAX.district;
}

function calcSalaryExemption(salary) {
  const allowances = salary.house + salary.medical + salary.transport;
  const gross = salary.basic + allowances + salary.others + salary.bonus;
  return Math.min(allowances, Math.round(gross / 3), SALARY_EXEMPTION_CAP);
}

function calcInvestmentRebate(taxableIncome, totalInvestment) {
  const allowable = Math.min(totalInvestment, Math.round(taxableIncome * 0.20), 10000000);
  return Math.round(allowable * 0.15);
}

/**
 * Calculate Bangladesh income tax for FY 2024-25
 * @param {Object} input
 * @param {Object} input.profile - { category, age, location, isFirstTimeTaxpayer? }
 * @param {Object} input.salary - { basic, house, medical, transport, others, bonus }
 * @param {Array}  input.investments - [{ name, amount }] (optional)
 * @param {number} input.tds - total tax deducted at source (optional)
 * @returns {Object} Full tax calculation result
 */
export function calculateTax({ profile, salary, investments = [], tds = 0 }) {
  salary = normalizeSalary(salary);
  const threshold = getTaxFreeThreshold(profile);
  const salaryExemption = calcSalaryExemption(salary);
  const gross = salary.basic + salary.house + salary.medical + salary.transport + salary.others + salary.bonus;
  const taxableIncome = Math.max(0, gross - salaryExemption);

  const slabs = calculateTaxSlabs(threshold);
  const breakdown = calculateTaxBreakdown(taxableIncome, slabs);
  const calculatedTax = breakdown.reduce((sum, s) => sum + s.slabCut, 0);

  const minimumTax = getMinimumTax(profile.location);
  const totalInvestment = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const investmentRebate = calcInvestmentRebate(taxableIncome, totalInvestment);

  const taxableExceedsThreshold = taxableIncome > threshold;
  const effectiveMinimumTax = taxableExceedsThreshold ? minimumTax : 0;
  const totalTax = Math.max(calculatedTax, effectiveMinimumTax);
  const isMinimumTaxApplied = taxableExceedsThreshold && calculatedTax < minimumTax;
  const payableTax = Math.max(0, totalTax - tds - investmentRebate);

  return {
    threshold,
    salaryExemption,
    taxableIncome,
    slabs,
    breakdown,
    calculatedTax,
    minimumTax,
    investmentRebate,
    totalTax,
    isMinimumTaxApplied,
    payableTax,
    tds,
  };
}
