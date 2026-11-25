import {
  calculateCappedInvestmentFromList,
  calculateInvestmentRebateForYear,
  calculateMaxRebateableInvestment,
  calculateTaxForYear,
  compareTaxYears,
} from '@/utils/taxEngine';
import { DONATION_ROW_NAME } from '@/utils/fa2026Rules';

// Hand-checked Section 78 rebate figures against the slab tax the engine charges.
// Amounts below are literals. A change to a rate, cap, or rounding step fails a test.
// Slab schedules (general taxpayer, Dhaka unless a test says otherwise):
//   FY 2023-24: 3.5L @0%, 1L @5%, 3L @10%, 4L @15%, 5L @20%, rest @25%
//   FY 2024-25: 3.5L @0%, 1L @5%, 4L @10%, 5L @15%, 5L @20%, 20L @25%, rest @30%
//   FY 2025-26 and FY 2026-27: 4L @0%, 3L @10%, 4L @15%, 5L @20%, 20L @25%, rest @30%
// Rebate: min(3% of the rebate base, investment rate, absolute cap), then half-up to the nearest taka.
//   FY 2023-24 and FY 2024-25: 15% of eligible investment, cap Tk 10,00,000
//   FY 2025-26 and FY 2026-27: 10% of eligible investment, cap Tk 7,50,000

const LARGE_INCOME = 10000000;
const LARGE_INVESTMENT = 100000000;

describe('Section 78 rebate limbs and half-up rounding', () => {
  test.each([
    ['2023-24', 1000000],
    ['2024-25', 1000000],
    ['2025-26', 750000],
    ['2026-27', 750000],
  ])('%s absolute cap is Tk %i when both other limbs are higher', (year, cap) => {
    expect(calculateInvestmentRebateForYear(year, 40000000, LARGE_INVESTMENT)).toBe(cap);
  });

  test.each([
    ['2023-24', 30000],
    ['2024-25', 30000],
    ['2025-26', 20000],
    ['2026-27', 20000],
  ])('%s investment limb binds on Tk 2,00,000 against a Tk 10,00,000 income', (year, rebate) => {
    // 3% of 10L is 30,000. 15% of 2L is 30,000. 10% of 2L is 20,000.
    expect(calculateInvestmentRebateForYear(year, 1000000, 200000)).toBe(rebate);
  });

  test('the 3% limb binds once eligible investment is large', () => {
    expect(calculateInvestmentRebateForYear('2024-25', 1000000, LARGE_INVESTMENT)).toBe(30000);
    expect(calculateInvestmentRebateForYear('2026-27', 1000000, LARGE_INVESTMENT)).toBe(30000);
  });

  test('half-up rounding on a single limb', () => {
    // 15% of 10 = 1.5 → 2; 15% of 4 = 0.6 → 1; 15% of 3 = 0.45 → 0
    expect(calculateInvestmentRebateForYear('2024-25', LARGE_INCOME, 10)).toBe(2);
    expect(calculateInvestmentRebateForYear('2023-24', LARGE_INCOME, 4)).toBe(1);
    expect(calculateInvestmentRebateForYear('2024-25', LARGE_INCOME, 3)).toBe(0);

    // 10% of 5 = 0.5 → 1; 10% of 4 = 0.4 → 0; 10% of 2 = 0.2 → 0
    expect(calculateInvestmentRebateForYear('2025-26', LARGE_INCOME, 5)).toBe(1);
    expect(calculateInvestmentRebateForYear('2026-27', LARGE_INCOME, 4)).toBe(0);
    expect(calculateInvestmentRebateForYear('2025-26', LARGE_INCOME, 2)).toBe(0);

    // 3% of 50 = 1.5 → 2; 3% of 17 = 0.51 → 1; 3% of 16 = 0.48 → 0
    expect(calculateInvestmentRebateForYear('2024-25', 50, LARGE_INVESTMENT)).toBe(2);
    expect(calculateInvestmentRebateForYear('2026-27', 17, LARGE_INVESTMENT)).toBe(1);
    expect(calculateInvestmentRebateForYear('2025-26', 16, LARGE_INVESTMENT)).toBe(0);
  });

  test('a fractional investment under the cap rounds the investment limb, not each taka', () => {
    // 4,99,994 × 10% = 49,999.4 → 49,999. One more taka is 49,999.5 → 50,000.
    // 3% of 20L is 60,000, so the investment limb is the one that moves.
    expect(calculateInvestmentRebateForYear('2025-26', 2000000, 499994)).toBe(49999);
    expect(calculateInvestmentRebateForYear('2026-27', 2000000, 499995)).toBe(50000);
    // 5,00,003 × 15% = 75,000.45 → 75,000. One more taka is 75,000.6 → 75,001.
    // 3% of 30L is 90,000, above that limb and under the Tk 10,00,000 cap.
    expect(calculateInvestmentRebateForYear('2023-24', 3000000, 500003)).toBe(75000);
    expect(calculateInvestmentRebateForYear('2024-25', 3000000, 500004)).toBe(75001);
  });

  test('zero, negative, and empty investment produce no rebate', () => {
    for (const year of ['2023-24', '2024-25', '2025-26', '2026-27']) {
      expect(calculateInvestmentRebateForYear(year, 1000000, 0)).toBe(0);
      expect(calculateInvestmentRebateForYear(year, 1000000, -5000)).toBe(0);
      expect(calculateInvestmentRebateForYear(year, 0, 500000)).toBe(0);
      expect(calculateInvestmentRebateForYear(year, -100000, 500000)).toBe(0);
    }
  });

  test('a negative exclusion does not enlarge the 3% base', () => {
    const exclusions = { exemptIncome: -500000, partnershipShare: -1 };
    expect(calculateInvestmentRebateForYear('2025-26', 1000000, LARGE_INVESTMENT, exclusions)).toBe(30000);
    expect(calculateInvestmentRebateForYear('2026-27', 1000000, LARGE_INVESTMENT, exclusions)).toBe(30000);
  });

  test('the optimal investment ceiling is the income limb divided by the investment rate, then the cap', () => {
    expect(calculateMaxRebateableInvestment(0, '2025-26')).toBe(0);
    expect(calculateMaxRebateableInvestment(1, '2026-27')).toBe(0);
    expect(calculateMaxRebateableInvestment(2, '2025-26')).toBe(1);
    expect(calculateMaxRebateableInvestment(1000000, '2024-25')).toBe(200000);
    expect(calculateMaxRebateableInvestment(1000000, '2023-24')).toBe(200000);
    expect(calculateMaxRebateableInvestment(1000000, '2025-26')).toBe(300000);
    expect(calculateMaxRebateableInvestment(1000000, '2026-27')).toBe(300000);
    // 10,00,000 / 15% rounds half-up to 66,66,667. 7,50,000 / 10% is 75,00,000 exactly.
    expect(calculateMaxRebateableInvestment(100000000, '2024-25')).toBe(6666667);
    expect(calculateMaxRebateableInvestment(100000000, '2026-27')).toBe(7500000);
  });
});

describe('instrument caps change the rebate that meets the slab tax', () => {
  // Same books in every year. Caps and the investment rate are what move the rebate.
  // Eligible before the rate:
  //   DPS 2,00,000 → 1,20,000
  //   life premium 80,000 on a 5,00,000 policy → 50,000 (10% of sum assured)
  //   stocks 50,000
  //   savings certificate 6,00,000 → 5,00,000
  //   mutual fund 7,00,000 → 5,00,000 through FY 2024-25, uncapped after
  //   listed donation 1,00,000 → 0 until FY 2026-27, then uncapped
  //   FY 2023-24 / FY 2024-25 eligible 12,20,000 × 15% = 1,83,000
  //   FY 2025-26 eligible 14,20,000 × 10% = 1,42,000
  //   FY 2026-27 eligible 15,20,000 × 10% = 1,52,000
  // 3% of 80,00,000 is 2,40,000, above each of those and under both absolute caps.
  const investments = {
    dps: 200000,
    life_insurance: 80000,
    life_insurance_policy_value: 500000,
    stocks: 50000,
    savings_certificate: 600000,
    mutual_fund: 700000,
    philanthropic_donation: 100000,
  };

  const expected = {
    '2023-24': { eligible: 1220000, rebate: 183000, gross: 1782500, total: 1599500 },
    '2024-25': { eligible: 1220000, rebate: 183000, gross: 1965000, total: 1782000 },
    '2025-26': { eligible: 1420000, rebate: 142000, gross: 2010000, total: 1868000 },
    '2026-27': { eligible: 1520000, rebate: 152000, gross: 2010000, total: 1858000 },
  };

  test.each(Object.entries(expected))(
    '%s gross, rebate, and tax after rebate on Tk 80,00,000',
    (year, figures) => {
      const result = calculateTaxForYear({
        year,
        category: 'general',
        age: 40,
        taxable_income: 8000000,
        investments,
        tds: 100000,
      });

      expect(result.investment_summary.eligible_investment_bdt).toBe(figures.eligible);
      expect(result.investment_summary.total_investment_bdt).toBe(1730000);
      expect(result.rebate_bdt).toBe(figures.rebate);
      expect(result.gross_tax_bdt).toBe(figures.gross);
      expect(result.tax_after_rebate_bdt).toBe(figures.total);
      expect(result.total_tax_bdt).toBe(figures.total);
      expect(result.is_minimum_tax_applied).toBe(false);
      expect(result.payable_tax_bdt).toBe(figures.total - 100000);
      expect(result.slab_breakdown.reduce((sum, slab) => sum + slab.taxable_amount_bdt, 0)).toBe(8000000);
      expect(result.slab_breakdown.reduce((sum, slab) => sum + slab.tax_bdt, 0)).toBe(figures.gross);
    }
  );

  test('a fractional policy sum rounds the 10% life-insurance cap before the rebate', () => {
    const tiny = calculateTaxForYear({
      year: '2025-26',
      taxable_income: 1000000,
      investments: { life_insurance: 100, life_insurance_policy_value: 15 },
    });
    // Policy cap round(1.5) = 2. 10% of 2 = 0.2 → rebate 0. Slab tax on 10L stays 75,000.
    expect(tiny.investment_summary.life_insurance_cap_bdt).toBe(2);
    expect(tiny.investment_summary.eligible_investment_bdt).toBe(2);
    expect(tiny.rebate_bdt).toBe(0);
    expect(tiny.gross_tax_bdt).toBe(75000);
    expect(tiny.total_tax_bdt).toBe(75000);

    const oneTaka = calculateTaxForYear({
      year: '2026-27',
      taxable_income: 1000000,
      investments: { life_insurance: 100, life_insurance_policy_value: 50 },
    });
    // Policy cap 5. 10% of 5 = 0.5 → rebate 1. Gross 75,000 becomes 74,999.
    expect(oneTaka.investment_summary.eligible_investment_bdt).toBe(5);
    expect(oneTaka.rebate_bdt).toBe(1);
    expect(oneTaka.total_tax_bdt).toBe(74999);
  });

  test('duplicate DPS rows share one Tk 1,20,000 cap, and a donation counts only in FY 2026-27', () => {
    const rows = [
      { name: 'DPS', amount: 80000 },
      { name: 'DPS', amount: 70000 },
      { name: 'sanchaypatra', amount: 1000 },
      { name: 'Gold', amount: 500 },
      { name: DONATION_ROW_NAME, amount: 9000 },
      { name: 'Stocks', amount: -100 },
    ];

    expect(calculateCappedInvestmentFromList(rows, '2024-25')).toBe(121500);
    expect(calculateCappedInvestmentFromList(rows, '2025-26')).toBe(121500);
    expect(calculateCappedInvestmentFromList(rows, '2026-27')).toBe(130500);
  });
});

describe('rebate against slab tax, minimum tax, and TDS', () => {
  test('an awkward taka amount is taxed on the open slice, then the rebate rounds on its own', () => {
    // Tk 12,34,567, eligible investment Tk 1,11,111.
    // FY 2024-25: 1L×5% + 4L×10% + 3,84,567×15% = 5,000 + 40,000 + 57,685 = 1,02,685
    //   rebate round(1,11,111 × 15%) = 16,667; tax after rebate 86,018
    // FY 2025-26: 3L×10% + 4L×15% + 1,34,567×20% = 30,000 + 60,000 + 26,913 = 1,16,913
    //   rebate round(1,11,111 × 10%) = 11,111; tax after rebate 1,05,802
    // FY 2023-24: 1L×5% + 3L×10% + 4L×15% + 84,567×20% = 5,000 + 30,000 + 60,000 + 16,913 = 1,11,913
    const cases = {
      '2023-24': { gross: 111913, rebate: 16667, total: 95246 },
      '2024-25': { gross: 102685, rebate: 16667, total: 86018 },
      '2025-26': { gross: 116913, rebate: 11111, total: 105802 },
      '2026-27': { gross: 116913, rebate: 11111, total: 105802 },
    };

    for (const [year, figures] of Object.entries(cases)) {
      const result = calculateTaxForYear({
        year,
        taxable_income: 1234567,
        investments: 111111,
      });
      expect(result.gross_tax_bdt).toBe(figures.gross);
      expect(result.rebate_bdt).toBe(figures.rebate);
      expect(result.tax_after_rebate_bdt).toBe(figures.total);
      expect(result.total_tax_bdt).toBe(figures.total);
      expect(result.slab_breakdown.reduce((sum, slab) => sum + slab.tax_bdt, 0)).toBe(figures.gross);
    }
  });

  test('a one-taka rebate pulls an exact area minimum back under the floor', () => {
    // FY 2024-25 other-city floor is 4,000. Tk 4,30,000 is 80,000 into the 5% band = 4,000 exactly.
    // Investment of 4: 15% = 0.6 → rebate 1, so tax after rebate is 3,999 and the floor returns.
    const result = calculateTaxForYear({
      year: '2024-25',
      location: 'other_city',
      taxable_income: 430000,
      investments: 4,
      tds: 1500,
    });
    expect(result.gross_tax_bdt).toBe(4000);
    expect(result.rebate_bdt).toBe(1);
    expect(result.tax_after_rebate_bdt).toBe(3999);
    expect(result.statutory_minimum_tax_bdt).toBe(4000);
    expect(result.is_minimum_tax_applied).toBe(true);
    expect(result.total_tax_bdt).toBe(4000);
    expect(result.payable_tax_bdt).toBe(2500);
  });

  test('district minimum survives a rebate that wipes a rounded 5% slice', () => {
    // FY 2023-24 district floor is 3,000. Tk 4,10,010 is 60,010 into the 5% band:
    // 3,000.50 rounds to 3,001. Investment of 10: 15% = 1.5 → rebate 2.
    const result = calculateTaxForYear({
      year: '2023-24',
      location: 'district',
      taxable_income: 410010,
      investments: 10,
      tds: 4000,
    });
    expect(result.gross_tax_bdt).toBe(3001);
    expect(result.rebate_bdt).toBe(2);
    expect(result.tax_after_rebate_bdt).toBe(2999);
    expect(result.total_tax_bdt).toBe(3000);
    expect(result.payable_tax_bdt).toBe(0);
    expect(result.excess_tds_bdt).toBe(1000);
  });

  test('a first-time filer floor of Tk 1,000 remains after the rebate exceeds slab tax', () => {
    const shared = {
      year: '2026-27',
      taxable_income: 450000,
      investments: 200000,
    };
    // 50,000 × 10% = 5,000. 3% of 4,50,000 = 13,500, which is the rebate.
    const firstTime = calculateTaxForYear({ ...shared, first_time_filer: true, tds: 400 });
    expect(firstTime.gross_tax_bdt).toBe(5000);
    expect(firstTime.rebate_bdt).toBe(13500);
    expect(firstTime.tax_after_rebate_bdt).toBe(0);
    expect(firstTime.statutory_minimum_tax_bdt).toBe(1000);
    expect(firstTime.total_tax_bdt).toBe(1000);
    expect(firstTime.payable_tax_bdt).toBe(600);

    const refund = calculateTaxForYear({ ...shared, first_time_filer: true, tds: 1500 });
    expect(refund.payable_tax_bdt).toBe(0);
    expect(refund.excess_tds_bdt).toBe(500);

    const ordinary = calculateTaxForYear({ ...shared, first_time_filer: false });
    expect(ordinary.total_tax_bdt).toBe(5000);
    expect(ordinary.statutory_minimum_tax_bdt).toBe(5000);
  });

  test('income on the threshold still reports a rebate and charges nothing, including TDS', () => {
    const result = calculateTaxForYear({
      year: '2026-27',
      taxable_income: 400000,
      investments: 100000,
      tds: 500,
    });
    expect(result.below_tax_free_threshold).toBe(true);
    expect(result.gross_tax_bdt).toBe(0);
    expect(result.rebate_bdt).toBe(10000);
    expect(result.total_tax_bdt).toBe(0);
    expect(result.minimum_tax_bdt).toBe(0);
    expect(result.payable_tax_bdt).toBe(0);
    expect(result.excess_tds_bdt).toBe(500);
    expect(result.excess_tds_or_rebate_bdt).toBe(500);
  });

  test('a higher category threshold changes slab tax and leaves the rebate on the same income', () => {
    const shared = { year: '2025-26', taxable_income: 900000, investments: 100000, age: 40 };
    const general = calculateTaxForYear({ ...shared, category: 'general' });
    const female = calculateTaxForYear({ ...shared, category: 'female' });
    const fighter = calculateTaxForYear({ ...shared, category: 'freedom_fighter' });

    expect(general.gross_tax_bdt).toBe(60000);
    expect(female.gross_tax_bdt).toBe(52500);
    expect(fighter.gross_tax_bdt).toBe(37500);
    for (const result of [general, female, fighter]) {
      expect(result.rebate_bdt).toBe(10000);
    }
    expect(general.total_tax_bdt).toBe(50000);
    expect(female.total_tax_bdt).toBe(42500);
    expect(fighter.total_tax_bdt).toBe(27500);
  });

  test('moving FY 2024-25 to FY 2025-26 drops the rebate by Tk 10,000 and raises total tax by Tk 17,500', () => {
    const compared = compareTaxYears({
      from_year: '2024-25',
      to_year: '2025-26',
      taxable_income: 1000000,
      investments: 200000,
    });
    expect(compared.from.gross_tax_bdt).toBe(67500);
    expect(compared.to.gross_tax_bdt).toBe(75000);
    expect(compared.from.rebate_bdt).toBe(30000);
    expect(compared.to.rebate_bdt).toBe(20000);
    expect(compared.from.total_tax_bdt).toBe(37500);
    expect(compared.to.total_tax_bdt).toBe(55000);
    expect(compared.comparison).toMatchObject({
      threshold_diff_bdt: 50000,
      gross_tax_diff_bdt: 7500,
      rebate_diff_bdt: -10000,
      total_tax_diff_bdt: 17500,
      payable_tax_diff_bdt: 17500,
      tax_savings_bdt: 0,
      additional_tax_bdt: 17500,
      verdict: 'increase',
    });
  });
});

describe('salary exemption feeding slabs and the rebate', () => {
  test('gross Tk 6,00,002 exempts Tk 2,00,001 and the remaining taka still pays the minimum', () => {
    // round(6,00,002 / 3) = 2,00,001, so taxable income is 4,00,001.
    // One taka in the 10% band rounds to 0. The Tk 5,000 floor still applies.
    // Rebate on Tk 1,00,000 is 10,000 and does not remove the floor.
    const result = calculateTaxForYear({
      year: '2025-26',
      income: { gross_salary: 600002 },
      investments: 100000,
    });
    expect(result.income_summary.gross_income_bdt).toBe(600002);
    expect(result.income_summary.exemptions_bdt.total).toBe(200001);
    expect(result.taxable_income_bdt).toBe(400001);
    expect(result.gross_tax_bdt).toBe(0);
    expect(result.rebate_bdt).toBe(10000);
    expect(result.total_tax_bdt).toBe(5000);
    expect(result.is_minimum_tax_applied).toBe(true);
  });

  test('monthly salary is annualised before the exemption, slabs, and rebate', () => {
    // Tk 50,000 × 12 = 6,00,000. Exemption 2,00,000. Taxable 4,00,000.
    // FY 2024-25: 50,000 × 5% = 2,500, under the Dhaka floor of 5,000.
    const result = calculateTaxForYear({
      year: '2024-25',
      income: { period: 'monthly', basic: 40000, house: 10000 },
      investments: { total: 20000 },
    });
    expect(result.income_summary.gross_income_bdt).toBe(600000);
    expect(result.taxable_income_bdt).toBe(400000);
    expect(result.gross_tax_bdt).toBe(2500);
    expect(result.rebate_bdt).toBe(3000);
    expect(result.tax_after_rebate_bdt).toBe(0);
    expect(result.total_tax_bdt).toBe(5000);
  });

  test('turning the exemption off taxes the full gross, and a bonus shares the exemption cap', () => {
    const full = calculateTaxForYear({
      year: '2025-26',
      income: { gross_salary: 600000, apply_exemption: false },
    });
    expect(full.taxable_income_bdt).toBe(600000);
    expect(full.gross_tax_bdt).toBe(20000);

    // Gross 9,00,000 + bonus 6,00,000 = 15,00,000.
    // FY 2023-24 exemption cap is 4,50,000, so taxable is 10,50,000.
    // 1L×5% + 3L×10% + 3L×15% = 5,000 + 30,000 + 45,000 = 80,000.
    // Investment 2,00,000 × 15% = 30,000 (3% of 10,50,000 is 31,500).
    const withBonus = calculateTaxForYear({
      year: '2023-24',
      income: { gross_salary: 900000, bonus: 600000 },
      investments: { total: 200000 },
    });
    expect(withBonus.income_summary.gross_income_bdt).toBe(1500000);
    expect(withBonus.income_summary.exemptions_bdt.total).toBe(450000);
    expect(withBonus.taxable_income_bdt).toBe(1050000);
    expect(withBonus.gross_tax_bdt).toBe(80000);
    expect(withBonus.rebate_bdt).toBe(30000);
    expect(withBonus.total_tax_bdt).toBe(50000);

    // Same pay in FY 2025-26: exemption cap 5,00,000, taxable 10,00,000, slab tax 75,000.
    // Rebate is 10% of 2,00,000 = 20,000.
    const later = calculateTaxForYear({
      year: '2025-26',
      income: { gross_salary: 900000, bonus: 600000 },
      investments: { total: 200000 },
    });
    expect(later.taxable_income_bdt).toBe(1000000);
    expect(later.gross_tax_bdt).toBe(75000);
    expect(later.rebate_bdt).toBe(20000);
    expect(later.total_tax_bdt).toBe(55000);
  });
});

describe('rejected investment inputs', () => {
  const income = { year: '2025-26', taxable_income: 1000000 };

  test.each([
    [{ investments: [] }, 'array'],
    [{ investments: -1 }, 'negative total'],
    [{ investments: { total: 10, dps: 10 } }, 'both total and items'],
    [{ investments: { dps: 10, apply_instrument_caps: false } }, 'caps switched off'],
    [{ investments: { life_insurance: 10 } }, 'missing policy sum'],
    [{ investments: { dps: -1 } }, 'negative instrument'],
  ])('rejects %s', (extra) => {
    expect(() => calculateTaxForYear({ ...income, ...extra })).toThrow();
  });

  test('null and an empty breakdown are zero investment, not an error', () => {
    const absent = calculateTaxForYear({ ...income, investments: null });
    const empty = calculateTaxForYear({ ...income, investments: {} });
    expect(absent.rebate_bdt).toBe(0);
    expect(empty.rebate_bdt).toBe(0);
    expect(empty.investment_summary.eligible_investment_bdt).toBe(0);
    expect(absent.gross_tax_bdt).toBe(75000);
    expect(empty.total_tax_bdt).toBe(75000);
  });
});
