import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import {
  listSupportedYears,
  getRulesForYear,
  calculateTaxForYear,
  compareTaxYears,
  normalizeFiscalYear,
} from '@/utils/taxEngine';

describe('Shared Tax Engine <-> Vuex Store Parity', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false,
        },
      },
    });
  });

  test('normalizeFiscalYear accepts common FY spellings and rejects AY strings', () => {
    expect(normalizeFiscalYear('2025-26')).toBe('2025-26');
    expect(normalizeFiscalYear('FY 2025-2026')).toBe('2025-26');
    expect(normalizeFiscalYear('FY2026-27')).toBe('2026-27');
    expect(normalizeFiscalYear('2024')).toBe('2024-25');
    expect(normalizeFiscalYear('2023-2024')).toBe('2023-24');
    expect(() => normalizeFiscalYear('AY 2026-27')).toThrow(/Assessment Year/);
    expect(() => normalizeFiscalYear('2019-20')).toThrow(/Unsupported fiscal year/);
  });

  test('listSupportedYears returns all four fiscal years and metadata', () => {
    const data = listSupportedYears();
    expect(data.default_year).toBe('2025-26');
    expect(data.supported_years.map((y) => y.fiscal_year)).toEqual([
      '2023-24',
      '2024-25',
      '2025-26',
      '2026-27',
    ]);
  });

  test('getRulesForYear matches thresholds, slabs, minimum tax, and rebate rules', () => {
    const rules2024 = getRulesForYear({ year: '2024-25', category: 'general' });
    expect(rules2024.thresholds_bdt.general).toBe(350000);
    expect(rules2024.slabs).toHaveLength(7);
    expect(rules2024.minimum_tax_bdt.district).toBe(3000);
    expect(rules2024.rebate_rules.investment_rate_percent).toBe(15);
    expect(rules2024.rebate_rules.max_cap_bdt).toBe(1000000);

    const rules2026 = getRulesForYear({
      year: '2026-27',
      category: 'disabled',
      parent_of_disabled: true,
    });
    expect(rules2026.requested_profile.effective_threshold_bdt).toBe(575000);
    expect(rules2026.slabs).toHaveLength(6);
    expect(rules2026.slabs[0].upper_bdt).toBe(575000);
    expect(rules2026.minimum_tax_bdt.first_time_filer_bdt).toBe(1000);
    expect(rules2026.rebate_rules.investment_rate_percent).toBe(10);
    expect(rules2026.rebate_rules.max_cap_bdt).toBe(750000);
  });

  test.each([
    {
      name: 'general Dhaka mid-income with salary breakdown, bonus, investment, and TDS',
      profile: { category: 'general', age: 32, location: 'dhaka', parentOfDisabled: false },
      monthlyParts: { basic: 60000, house: 28000, medical: 7000, transport: 4000, others: 3000 },
      bonus: 120000,
      others: 20000,
      investments: [120000, 80000],
      monthlyTds: 3000,
    },
    {
      name: 'female + parentOfDisabled high-income investment-capped scenario',
      profile: { category: 'female', age: 41, location: 'chittagong', parentOfDisabled: true },
      monthlyParts: { basic: 200000, house: 80000, medical: 15000, transport: 10000, others: 0 },
      bonus: 400000,
      others: 0,
      investments: [120000, 500000, 400000],
      monthlyTds: 25000,
    },
    {
      name: 'age-68 auto-promoted senior in district with low income triggering minimum tax',
      profile: { category: 'general', age: 68, location: 'district', parentOfDisabled: false },
      monthlyParts: { basic: 25000, house: 10000, medical: 2500, transport: 2000, others: 0 },
      bonus: 0,
      others: 0,
      investments: [0],
      monthlyTds: 0,
    },
    {
      name: 'freedom fighter aged 72 + parentOfDisabled keeps freedom fighter threshold + 50k',
      profile: { category: 'freedom_fighter', age: 72, location: 'other_city', parentOfDisabled: true },
      monthlyParts: { basic: 100000, house: 40000, medical: 10000, transport: 5000, others: 5000 },
      bonus: 200000,
      others: 50000,
      investments: [100000, 200000],
      monthlyTds: 5000,
    },
  ])('matches Vuex store getters across 2024-25, 2025-26, and 2026-27: $name', (scenario) => {
    store.commit('updateTaxpayerProfile', scenario.profile);
    Object.entries(scenario.monthlyParts).forEach(([part, value]) => {
      store.commit('changeParts', { part, index: 0, value });
    });
    store.commit('changeBonus', scenario.bonus);
    store.commit('changeOthers', scenario.others);
    scenario.investments.forEach((value, index) => {
      store.commit('changeInvestment', { index, value });
    });
    store.commit('changeSubsequentTds', { index: 0, value: scenario.monthlyTds });

    const totalInvestment = scenario.investments.reduce((a, b) => a + b, 0);
    const totalTds = scenario.monthlyTds * 12;

    const sharedArgs = {
      category: scenario.profile.category,
      age: scenario.profile.age,
      parent_of_disabled: scenario.profile.parentOfDisabled,
      location: scenario.profile.location,
      income: {
        period: 'monthly',
        ...scenario.monthlyParts,
        bonus: scenario.bonus,
        additional_income: scenario.others,
      },
      investments: totalInvestment,
      tds: totalTds,
    };

    // Check 2024-25 parity against base store getters
    store.commit('setCurrentYear', '2024-25');
    const res2024 = calculateTaxForYear({ ...sharedArgs, year: '2024-25' });
    expect(res2024.income_summary.gross_income_bdt).toBe(store.getters.totalSalary);
    expect(res2024.income_summary.exemptions_bdt.total).toBe(store.getters.totalExempt);
    expect(res2024.taxable_income_bdt).toBe(store.getters.taxableSalary);
    expect(res2024.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold);
    expect(res2024.minimum_tax_bdt).toBe(store.getters.minimumTaxAmount);
    expect(res2024.gross_tax_bdt).toBe(store.getters.calculatedTax);
    expect(res2024.total_tax_bdt).toBe(store.getters.totalTax);
    expect(res2024.rebate_bdt).toBe(store.getters.investmentRebate);
    expect(res2024.payable_tax_bdt).toBe(store.getters.payableTax);

    // Check 2025-26 vs 2026-27 comparison parity against store 2025/2026 getters
    const cmp = compareTaxYears({
      ...sharedArgs,
      from_year: '2025-26',
      to_year: '2026-27',
    });

    expect(cmp.from.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold2025);
    expect(cmp.from.gross_tax_bdt).toBe(store.getters.calculatedTax2025);
    expect(cmp.from.total_tax_bdt).toBe(store.getters.totalTax2025);
    expect(cmp.from.rebate_bdt).toBe(store.getters.investmentRebate2025);
    expect(cmp.from.payable_tax_bdt).toBe(store.getters.payableTax2025);

    expect(cmp.to.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold2026);
    expect(cmp.to.gross_tax_bdt).toBe(store.getters.calculatedTax2026);
    expect(cmp.to.total_tax_bdt).toBe(store.getters.totalTax2026);
    expect(cmp.to.rebate_bdt).toBe(store.getters.investmentRebate2026);
    expect(cmp.to.payable_tax_bdt).toBe(store.getters.payableTax2026);

    expect(cmp.comparison.total_tax_diff_bdt).toBe(store.getters.taxDifference);
    expect(cmp.comparison.tax_savings_bdt).toBe(store.getters.taxSavings);
    expect(cmp.comparison.additional_tax_bdt).toBe(store.getters.additionalTax);
  });

  test('preserves exact master age-65 behavior across 2023-24/2024-25 (explicit category) and 2025-26/2026-27 (auto-promoted)', () => {
    store.commit('updateTaxpayerProfile', {
      category: 'general',
      age: 70,
      location: 'dhaka',
      parentOfDisabled: false,
    });

    store.commit('setCurrentYear', '2024-25');
    expect(store.getters.taxFreeThreshold).toBe(350000);
    expect(calculateTaxForYear({ year: '2024-25', category: 'general', age: 70, taxable_income: 500000 }).tax_free_threshold_bdt).toBe(350000);

    store.commit('setCurrentYear', '2025-26');
    expect(store.getters.taxFreeThreshold).toBe(450000);
    expect(store.getters.taxFreeThreshold2025).toBe(450000);
    expect(calculateTaxForYear({ year: '2025-26', category: 'general', age: 70, taxable_income: 500000 }).tax_free_threshold_bdt).toBe(450000);

    store.commit('setCurrentYear', '2026-27');
    expect(store.getters.taxFreeThreshold).toBe(400000); // legacy shared getter preserved
    expect(store.getters.taxFreeThreshold2026).toBe(450000);
    expect(calculateTaxForYear({ year: '2026-27', category: 'general', age: 70, taxable_income: 500000 }).tax_free_threshold_bdt).toBe(450000);
  });
});
