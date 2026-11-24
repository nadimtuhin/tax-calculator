/**
 * Upper bound for any single money amount typed into the calculator (BDT 1 trillion).
 * Keeps totals finite and well inside Number.MAX_SAFE_INTEGER so tax maths and
 * localStorage persistence never see Infinity or lose integer precision.
 */
export const MAX_AMOUNT = 1e12;

const BANGLA_DIGIT_ZERO = 0x09e6; // '০'

/**
 * Convert Bangla digits (০-৯) to ASCII digits.
 * @param {string} text
 * @returns {string}
 */
export function normalizeDigits(text) {
  return text.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - BANGLA_DIGIT_ZERO));
}

/**
 * Parse a user-entered money amount into a safe, non-negative, finite number.
 *
 * - empty, null, undefined and non-numeric input -> 0
 * - Bangla digits are accepted ('৫০০০০' -> 50000)
 * - thousands separators, spaces and the taka sign are ignored ('1,00,000' -> 100000)
 * - negative values -> 0
 * - values above MAX_AMOUNT (including Infinity and '1e400') -> MAX_AMOUNT
 *
 * @param {unknown} value
 * @returns {number}
 */
export function parseAmount(value) {
  let number;
  if (typeof value === 'number') {
    number = value;
  } else if (typeof value === 'string') {
    const cleaned = normalizeDigits(value).replace(/[\s,৳]/g, '');
    if (cleaned === '') return 0;
    number = Number(cleaned);
  } else {
    return 0;
  }

  if (Number.isNaN(number) || number <= 0) return 0;
  if (number > MAX_AMOUNT) return MAX_AMOUNT;
  return number;
}
