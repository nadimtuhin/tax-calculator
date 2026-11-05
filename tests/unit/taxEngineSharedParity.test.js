import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import {
  listSupportedYears,
  getRulesForYear,
  calculateTaxForYear,
  compareTaxYears,
  normalizeFiscalYear,
  calculateEmploymentExemption,
  calculateFinalTaxSummary,
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

  test('listSupportedYears returns all four fiscal years and statutory metadata', () => {
    const data = listSupportedYears();
    expect(data.default_year).toBe('2025-26');
    expect(data.default_comparison).toEqual({
      from_year: '2025-26',
      to_year: '2026-27',
    });
    expect(data.supported_years.map((y) => y.fiscal_year)).toEqual([
      '2023-24',
      '2024-25',
      '2025-26',
      '2026-27',
    ]);
  });

  test('Para 27 employment exemption uses 4.5L cap in FY 2023-24 and 5L cap in FY 2024-25 through FY 2026-27', () => {
    expect(calculateEmploymentExemption(1200000, '2023-24')).toBe(400000);
    expect(calculateEmploymentExemption(1800000, '2023-24')).toBe(450000);
    expect(calculateEmploymentExemption(1800000, '2024-25')).toBe(500000);
    expect(calculateEmploymentExemption(1800000, '2025-26')).toBe(500000);
    expect(calculateEmploymentExemption(1800000, '2026-27')).toBe(500000);
  });

  test('IT-11GA(2023) Lines 12-16 order and <= threshold zero minimum tax', () => {
    // At or below threshold -> min tax and payable are 0
    const below = calculateFinalTaxSummary(0, 5000, 0, 0, {
      taxableIncome: 400000,
      taxFreeThreshold: 400000,
    });
    expect(below.minimumTaxAmount).toBe(0);
    expect(below.totalTax).toBe(0);
    expect(below.isMinimumTaxApplied).toBe(false);
    expect(below.payable).toBe(0);

    // Above threshold: rebate cannot push Line 16 totalTax below minimum tax floor, but TDS reduces payable
    const floorHit = calculateFinalTaxSummary(8000, 5000, 2000, 5000, {
      taxableIncome: 480000,
      taxFreeThreshold: 400000,
    });
    expect(floorHit.taxAfterRebate).toBe(3000);
    expect(floorHit.totalTax).toBe(5000);
    expect(floorHit.isMinimumTaxApplied).toBe(true);
    expect(floorHit.payable).toBe(3000);
  });

  test('getRulesForYear matches thresholds, slabs, minimum tax, S78 rebate, and year-aware MF caps', () => {
    const rules2024 = getRulesForYear({ year: '2024-25', category: 'general' });
    expect(rules2024.thresholds_bdt.general).toBe(350000);
    expect(rules2024.slabs).toHaveLength(7);
    expect(rules2024.minimum_tax_bdt.district).toBe(3000);
    expect(rules2024.rebate_rules.investment_rate_percent).toBe(15);
    expect(rules2024.rebate_rules.max_cap_bdt).toBe(1000000);
    expect(rules2024.investment_instrument_caps_bdt.mutual_fund).toBe(500000);
    expect(rules2024.salary_exemption_rule.maxAmount).toBe(500000);

    const rules2025 = getRulesForYear({ year: '2025-26', category: 'general' });
    expect(rules2025.rebate_rules.investment_rate_percent).toBe(10);
    expect(rules2025.rebate_rules.max_cap_bdt).toBe(750000);
    expect(rules2025.investment_instrument_caps_bdt.mutual_fund).toBeNull();
    expect(rules2025.minimum_tax_bdt.first_time_filer_bdt).toBe(1000);

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
    expect(rules2026.investment_instrument_caps_bdt.mutual_fund).toBeNull();
  });

  test.each([
    {
      name: 'general Dhaka mid-income with salary breakdown, bonus, investment, and TDS',
      profile: { category: 'general', age: 32, location: 'dhaka', parentOfDisabled: false },
      monthlyParts: { basic: 60000, house: 28000, medical: 7000, transport: 4000, others: 3000 },
      bonus: 120000,
      others: 20000,
      investments: [150000, 80000, 0, 600000, 700000, 0], // tests DPS, Sanchaypatra, and MF year-aware caps!
      monthlyTds: 3000,
    },
    {
      name: 'female + parentOfDisabled high-income investment-capped scenario',
      profile: { category: 'female', age: 41, location: 'chittagong', parentOfDisabled: true },
      monthlyParts: { basic: 200000, house: 80000, medical: 15000, transport: 10000, others: 0 },
      bonus: 400000,
      others: 0,
      investments: [120000, 500000, 400000, 0, 800000, 0],
      monthlyTds: 25000,
    },
    {
      name: 'age-68 auto-promoted senior in district with low income triggering minimum tax',
      profile: { category: 'general', age: 68, location: 'district', parentOfDisabled: false },
      monthlyParts: { basic: 35000, house: 15000, medical: 4000, transport: 3000, others: 0 },
      bonus: 0,
      others: 0,
      investments: [0, 0, 0, 0, 0, 0],
      monthlyTds: 0,
    },
    {
      name: 'freedom fighter aged 72 + parentOfDisabled keeps freedom fighter threshold + 50k',
      profile: { category: 'freedom_fighter', age: 72, location: 'other_city', parentOfDisabled: true },
      monthlyParts: { basic: 100000, house: 40000, medical: 10000, transport: 5000, others: 5000 },
      bonus: 200000,
      others: 50000,
      investments: [100000, 200000, 0, 0, 0, 0],
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

    const totalTds = scenario.monthlyTds * 12;
    const itemizedInvestments = {
      dps: scenario.investments[0] || 0,
      life_insurance: scenario.investments[1] || 0,
      stocks: scenario.investments[2] || 0,
      savings_certificate: scenario.investments[3] || 0,
      mutual_fund: scenario.investments[4] || 0,
      others: scenario.investments[5] || 0,
    };

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
      investments: itemizedInvestments,
      tds: totalTds,
    };

    // Check 2024-25 parity against base & 2024 store getters
    store.commit('setCurrentYear', '2024-25');
    const res2024 = calculateTaxForYear({ ...sharedArgs, year: '2024-25' });
    expect(res2024.income_summary.gross_income_bdt).toBe(store.getters.totalSalary);
    expect(res2024.income_summary.exemptions_bdt.total).toBe(store.getters.totalExempt);
    expect(res2024.taxable_income_bdt).toBe(store.getters.taxableSalary);
    expect(res2024.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold);
    expect(res2024.statutory_minimum_tax_bdt).toBe(store.getters.minimumTaxAmount);
    expect(res2024.minimum_tax_bdt).toBe(store.getters.effectiveMinimumTax);
    expect(res2024.gross_tax_bdt).toBe(store.getters.calculatedTax);
    expect(res2024.rebate_bdt).toBe(store.getters.investmentRebate);
    expect(res2024.total_tax_bdt).toBe(store.getters.totalTax);
    expect(res2024.payable_tax_bdt).toBe(store.getters.payableTax);

    // Check 2025-26 vs 2026-27 comparison parity against store 2025/2026 getters
    const cmp = compareTaxYears({
      ...sharedArgs,
      from_year: '2025-26',
      to_year: '2026-27',
    });

    expect(cmp.from.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold2025);
    expect(cmp.from.gross_tax_bdt).toBe(store.getters.calculatedTax2025);
    expect(cmp.from.rebate_bdt).toBe(store.getters.investmentRebate2025);
    expect(cmp.from.total_tax_bdt).toBe(store.getters.totalTax2025);
    expect(cmp.from.payable_tax_bdt).toBe(store.getters.payableTax2025);

    expect(cmp.to.tax_free_threshold_bdt).toBe(store.getters.taxFreeThreshold2026);
    expect(cmp.to.gross_tax_bdt).toBe(store.getters.calculatedTax2026);
    expect(cmp.to.rebate_bdt).toBe(store.getters.investmentRebate2026);
    expect(cmp.to.total_tax_bdt).toBe(store.getters.totalTax2026);
    expect(cmp.to.payable_tax_bdt).toBe(store.getters.payableTax2026);

    expect(cmp.comparison.total_tax_diff_bdt).toBe(store.getters.taxDifference);
    expect(cmp.comparison.tax_savings_bdt).toBe(store.getters.taxSavings);
    expect(cmp.comparison.additional_tax_bdt).toBe(store.getters.additionalTax);
  });

  test('preserves age-65 behavior across 2024-25 (explicit category) and 2025-26/2026-27 (auto-promoted)', () => {
    store.commit('updateTaxpayerProfile', {
      category: 'general',
      age: 70,
      location: 'dhaka',
      parentOfDisabled: false,
    });

    store.commit('setCurrentYear', '2024-25');
    expect(store.getters.taxFreeThreshold).toBe(350000);
    expect(
      calculateTaxForYear({ year: '2024-25', category: 'general', age: 70, taxable_income: 500000 })
        .tax_free_threshold_bdt
    ).toBe(350000);

    store.commit('setCurrentYear', '2025-26');
    expect(store.getters.taxFreeThreshold).toBe(450000);
    expect(store.getters.taxFreeThreshold2025).toBe(450000);
    expect(
      calculateTaxForYear({ year: '2025-26', category: 'general', age: 70, taxable_income: 500000 })
        .tax_free_threshold_bdt
    ).toBe(450000);

    store.commit('setCurrentYear', '2026-27');
    expect(store.getters.taxFreeThreshold).toBe(450000);
    expect(store.getters.taxFreeThreshold2026).toBe(450000);
    expect(
      calculateTaxForYear({ year: '2026-27', category: 'general', age: 70, taxable_income: 500000 })
        .tax_free_threshold_bdt
    ).toBe(450000);
  });

  test('resetSalaries resets breakdown.others to 0 so totalOthersBreakdown never becomes NaN', () => {
    store.commit('changeParts', { part: 'others', index: 0, value: 15000 });
    expect(store.getters.totalOthersBreakdown).toBe(180000);

    store.commit('resetSalaries');
    expect(Number.isNaN(store.getters.totalOthersBreakdown)).toBe(false);
    expect(store.getters.totalOthersBreakdown).toBe(0);
    expect(store.state.salaries.months[0].breakdown).toEqual({
      basic: 0,
      house: 0,
      medical: 0,
      transport: 0,
      others: 0,
    });
  });
});
