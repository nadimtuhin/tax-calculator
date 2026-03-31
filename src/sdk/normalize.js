const DEFAULT_SALARY = { basic: 0, house: 0, medical: 0, transport: 0, others: 0, bonus: 0 };

/**
 * Accept salary as either:
 *   - plain object: { basic: 600000, house: 300000, ... }
 *   - array of INCOME.* results: [{ basic: 600000 }, { house: 300000 }, ...]
 */
export function normalizeSalary(salary) {
  if (Array.isArray(salary)) {
    return Object.assign({}, DEFAULT_SALARY, ...salary);
  }
  return Object.assign({}, DEFAULT_SALARY, salary);
}
