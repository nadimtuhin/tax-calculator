import { calculateTaxSlabs2025 } from '../utils/taxSlabs2025';
import { getTaxFreeThreshold2026, getMinimumTax2026, calculateInvestmentRebate2026FromIncome } from '../utils/taxSlabs2026';
import calculateTaxBreakdown2026 from '../calculateTaxBreakdown2026';
import { calculateFinalTax2025 } from '../calculateTaxBreakdown2025';
import { normalizeSalary } from './normalize';

const SALARY_EXEMPTION_CAP = 500000;

function calcSalaryExemption(salary) {
  const allowances = salary.house + salary.medical + salary.transport;
  const gross = salary.basic + allowances + salary.others + salary.bonus;
  return Math.min(allowances, Math.round(gross / 3), SALARY_EXEMPTION_CAP);
}

/**
 * Calculate Bangladesh income tax for FY 2026-27
 * @param {Object} input
 * @param {Object} input.profile - { category, age, location, isFirstTimeTaxpayer? }
 *   category includes 'july_warrior' (new in FY 2026-27, threshold BDT 5,25,000)
 * @param {Object} input.salary - { basic, house, medical, transport, others, bonus }
 * @param {Array}  input.investments - [{ name, amount }] (optional)
 * @param {number} input.tds - total tax deducted at source (optional)
 * @returns {Object} Full tax calculation result
 */
export function calculateTax({ profile, salary, investments = [], tds = 0 }) {
  salary = normalizeSalary(salary);
  const threshold = getTaxFreeThreshold2026(profile);
  const salaryExemption = calcSalaryExemption(salary);
  const gross = salary.basic + salary.house + salary.medical + salary.transport + salary.others + salary.bonus;
  const taxableIncome = Math.max(0, gross - salaryExemption);

  const slabs = calculateTaxSlabs2025(threshold);
  const breakdown = calculateTaxBreakdown2026(taxableIncome, slabs);
  const calculatedTax = breakdown.reduce((sum, s) => sum + s.slabCut, 0);

  const minimumTax = getMinimumTax2026(profile.location);
  const totalInvestment = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const investmentRebate = calculateInvestmentRebate2026FromIncome(taxableIncome, totalInvestment);

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
