/**
 * v2 scenario builder must match the shared tax engine (no duplicated tax math).
 */
import { calculateTaxForYear } from '../../src/utils/taxEngine.js';
import {
  createInitialState,
  presetScenario,
  computeTax,
  buildScenario,
} from '../../apps/web-v2/src/lib/scenario.js';

describe('v2 scenario parity with tax engine', () => {
  const scenarios = ['none', 'raise', 'jobchange', 'missed', 'bonus', 'combo'];

  test.each(scenarios)('preset %s matches direct engine call', (id) => {
    const s = createInitialState();
    presetScenario(s, id);
    const { actual, result } = computeTax(s);
    expect(result).not.toBeNull();

    const direct = calculateTaxForYear({
      year: s.year,
      income: {
        gross_salary: actual.salaryTotal,
        period: 'annual',
        bonus: actual.extra.bonus,
        bonus2: actual.extra.bonus2,
        additional_income: actual.extra.additional_income,
      },
      investments: s.investments,
      tds: s.tds,
    });

    expect(result.payable_tax_bdt).toBe(direct.payable_tax_bdt);
    expect(result.taxable_income_bdt).toBe(direct.taxable_income_bdt);
    expect(result.gross_tax_bdt).toBe(direct.gross_tax_bdt);
    expect(result.total_tax_bdt).toBe(direct.total_tax_bdt);
  });

  test('unpaid months reduce gross passed to engine', () => {
    const s = createInitialState();
    presetScenario(s, 'missed');
    const actual = buildScenario(s, true);
    expect(actual.salaryTotal).toBeLessThan(85_000 * 12);
  });

  test.each(['2025-26', '2026-27'])('FY %s none scenario', (year) => {
    const s = createInitialState();
    s.year = year;
    presetScenario(s, 'none');
    const { result } = computeTax(s);
    expect(result.fiscal_year).toBe(year);
  });
});