/**
 * Salary component builders.
 * Each returns a partial salary object; pass as an array to calculateTax*.
 *
 * Example:
 *   salary: [
 *     INCOME.BASIC(50000 * 12),
 *     INCOME.HOUSE(25000 * 12),
 *     INCOME.MEDICAL(5000 * 12),
 *     INCOME.TRANSPORT(3000 * 12),
 *     INCOME.BONUS(50000),
 *   ]
 */
export const INCOME = {
  BASIC:     (amount) => ({ basic: amount }),
  HOUSE:     (amount) => ({ house: amount }),
  MEDICAL:   (amount) => ({ medical: amount }),
  TRANSPORT: (amount) => ({ transport: amount }),
  OTHERS:    (amount) => ({ others: amount }),
  BONUS:     (amount) => ({ bonus: amount }),
};

/**
 * Investment builders.
 * Each returns an investment entry; pass as an array to calculateTax*.
 *
 * Example:
 *   investments: [
 *     INVESTMENT.DPS(120000),
 *     INVESTMENT.LIFE_INSURANCE(50000),
 *   ]
 */
export const INVESTMENT = {
  DPS:                (amount) => ({ name: 'DPS', amount }),
  LIFE_INSURANCE:     (amount) => ({ name: 'Life insurance premium', amount }),
  STOCKS:             (amount) => ({ name: 'Stocks', amount }),
  SAVINGS_CERTIFICATE:(amount) => ({ name: 'Savings certificate', amount }),
  MUTUAL_FUND:        (amount) => ({ name: 'Mutual fund', amount }),
  OTHERS:             (amount) => ({ name: 'Others', amount }),
};
