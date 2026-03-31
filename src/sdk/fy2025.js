import { calculateTaxSlabs2025, getTaxFreeThreshold2025, getMinimumTax2025, calculateInvestmentRebate2025FromIncome } from '../utils/taxSlabs2025';
import calculateTaxBreakdown2025, { calculateFinalTax2025 } from '../calculateTaxBreakdown2025';
import { normalizeSalary } from './normalize';

const SALARY_EXEMPTION_CAP = 500000;

function calcSalaryExemption(salary) {
  const allowances = salary.house + salary.medical + salary.transport;
  const gross = salary.basic + allowances + salary.others + salary.bonus;
  return Math.min(allowances, Math.round(gross / 3), SALARY_EXEMPTION_CAP);
}

/**
 * Calculate Bangladesh income tax for FY 2025-26
 * @param {Object} input
 * @param {Object} input.profile - { category, age, location, isFirstTimeTaxpayer? }
 * @param {Object} input.salary - { basic, house, medical, transport, others, bonus }
 * @param {Array}  input.investments - [{ name, amount }] (optional)
 * @param {number} input.tds - total tax deducted at source (optional)
 * @returns {Object} Full tax calculation result
 */
export function calculateTax({ profile, salary, investments = [], tds = 0 }) {
  salary = normalizeSalary(salary);
  const threshold = getTaxFreeThreshold2025(profile);
  const salaryExemption = calcSalaryExemption(salary);
  const gross = salary.basic + salary.house + salary.medical + salary.transport + salary.others + salary.bonus;
  const taxableIncome = Math.max(0, gross - salaryExemption);

  const slabs = calculateTaxSlabs2025(threshold);
  const breakdown = calculateTaxBreakdown2025(taxableIncome, slabs);
  const calculatedTax = breakdown.reduce((sum, s) => sum + s.slabCut, 0);

  const minimumTax = getMinimumTax2025(profile.location);
  const totalInvestment = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const investmentRebate = calculateInvestmentRebate2025FromIncome(taxableIncome, totalInvestment);

  const taxableExceedsThreshold = taxableIncome > threshold;
  const effectiveMinimumTax = taxableExceedsThreshold ? minimumTax : 0;
  const finalTax = calculateFinalTax2025(calculatedTax, effectiveMinimumTax, tds, investmentRebate);

  return {
    threshold,
    salaryExemption,
    taxableIncome,
    slabs,
    breakdown,
    calculatedTax,
    minimumTax,
    investmentRebate,
    ...finalTax,
    isMinimumTaxApplied: taxableExceedsThreshold && finalTax.isMinimumTaxApplied,
    payableTax: finalTax.payable,
    tds,
  };
}
