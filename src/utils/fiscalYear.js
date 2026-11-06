/**
 * Bangladesh fiscal year runs 1 July–30 June.
 * Returns and filing use the most recently completed year:
 * on or after 1 July of calendar year Y that is (Y-1)–Y;
 * before 1 July it is (Y-2)–(Y-1).
 * 5 Nov 2026 → "2025-26" (FY 2025-2026). 1 Jul 2027 → "2026-27".
 *
 * The key is the app's canonical form ("2025-26"), which
 * normalizeFiscalYear also accepts as "2025-2026".
 * The calendar month comes from the Date's local timezone,
 * which is the system date for the browser and for tests.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function getDefaultFiscalYear(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('getDefaultFiscalYear expects a valid Date');
  }

  const calendarYear = date.getFullYear();
  const julyIndex = 6;
  const endYear = date.getMonth() >= julyIndex ? calendarYear : calendarYear - 1;
  const startYear = endYear - 1;
  const endSuffix = String(endYear % 100).padStart(2, '0');
  return `${startYear}-${endSuffix}`;
}

/**
 * Pick a fiscal year this build can calculate.
 * Uses the completed year when it is supported, otherwise the nearest
 * supported year that is not later than it (or the earliest, if every
 * supported year is still in the future).
 *
 * @param {Date} [date]
 * @param {string[]} [supportedYears]
 * @returns {string}
 */
export function resolveDefaultFiscalYear(date = new Date(), supportedYears) {
  const preferred = getDefaultFiscalYear(date);
  if (!Array.isArray(supportedYears) || supportedYears.length === 0) {
    return preferred;
  }
  if (supportedYears.includes(preferred)) {
    return preferred;
  }

  const sorted = [...supportedYears].sort();
  const notLater = sorted.filter((year) => year <= preferred);
  return notLater.length > 0 ? notLater[notLater.length - 1] : sorted[0];
}
