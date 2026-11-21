import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import { migratePersistedState } from '@/store';
import {
  calculateCappedInvestmentFromList,
  calculateFinalTaxSummary,
  calculateInvestmentRebateForYear,
  calculateMaxRebateableInvestment,
  getInvestmentCapForType,
  getTaxFreeThresholdForYear,
  resolveEffectiveProfile,
} from '@/utils/taxEngine';
import { getTaxFreeThreshold2025, calculateInvestmentRebate2025Statutory } from '@/utils/taxSlabs2025';
import {
  getTaxFreeThreshold2026,
  calculateInvestmentRebate2026,
  TAX_FREE_THRESHOLDS_2026,
} from '@/utils/taxSlabs2026';
import { TAX_FREE_THRESHOLDS_2025 } from '@/utils/taxSlabs2025';
import {
  calculateRebateIncomeBase,
  calculateSolarElectricityRebate,
  normalizeDisabledDependentCount,
  resolveDisabledDependentCount,
  PHILANTHROPIC_INSTITUTIONS,
  DONATION_ROW_NAME,
} from '@/utils/fa2026Rules';

const makeStore = () =>
  createStore({ modules: { salaries: { ...salariesStore, namespaced: false } } });

describe('FA 2026 audit gaps', () => {
  describe('1. s.78 rebate base (booklet s.1.4 p.4)', () => {
    test('base excludes exempt, reduced-rate, partnership and final-settlement income', () => {
      expect(
        calculateRebateIncomeBase(2000000, {
          exemptIncome: 100000,
          reducedRateIncome: 200000,
          partnershipShare: 300000,
          finalSettlementIncome: 400000,
        })
      ).toBe(1000000);
    });

    test('base never goes below zero', () => {
      expect(calculateRebateIncomeBase(100000, { partnershipShare: 500000 })).toBe(0);
    });

    test('salary-only input keeps the old 3% of taxable income result in both years', () => {
      for (const year of ['2025-26', '2026-27']) {
        expect(calculateInvestmentRebateForYear(year, 1000000, 10000000)).toBe(30000);
      }
      expect(calculateInvestmentRebate2025Statutory(1000000, 10000000)).toBe(30000);
      expect(calculateInvestmentRebate2026(1000000, 10000000)).toBe(30000);
    });

    test('3% limb uses the reduced base in both new years', () => {
      const exclusions = { partnershipShare: 400000 };
      expect(calculateInvestmentRebate2025Statutory(1000000, 10000000, exclusions)).toBe(18000);
      expect(calculateInvestmentRebate2026(1000000, 10000000, exclusions)).toBe(18000);
      expect(calculateInvestmentRebateForYear('2025-26', 1000000, 10000000, exclusions)).toBe(18000);
      expect(calculateInvestmentRebateForYear('2026-27', 1000000, 10000000, exclusions)).toBe(18000);
    });

    test('FY 2024-25 ignores the new base exclusions', () => {
      expect(
        calculateInvestmentRebateForYear('2024-25', 1000000, 10000000, { partnershipShare: 400000 })
      ).toBe(30000);
    });

    test('max rebateable investment follows the base for new years only', () => {
      const exclusions = { finalSettlementIncome: 400000 };
      expect(calculateMaxRebateableInvestment(1000000, '2026-27', exclusions)).toBe(180000);
      expect(calculateMaxRebateableInvestment(1000000, '2024-25', exclusions)).toBe(200000);
    });
  });

  describe('2. early-redemption clawback (booklet s.1.43 p.22)', () => {
    const above = { taxableIncome: 600000, taxFreeThreshold: 400000 };

    test('repayable rebate is added to total tax and payable', () => {
      const result = calculateFinalTaxSummary(20000, 5000, 4000, 0, { ...above, rebateClawback: 3000 });
      expect(result.rebateClawback).toBe(3000);
      expect(result.totalTax).toBe(23000);
      expect(result.payable).toBe(19000);
    });

    test('is added after the minimum-tax floor', () => {
      const result = calculateFinalTaxSummary(10000, 5000, 0, 9000, { ...above, rebateClawback: 2000 });
      expect(result.isMinimumTaxApplied).toBe(true);
      expect(result.totalTax).toBe(7000);
    });

    test('is owed even when income is below the tax-free level', () => {
      const result = calculateFinalTaxSummary(0, 5000, 0, 0, {
        taxableIncome: 300000,
        taxFreeThreshold: 400000,
        rebateClawback: 1500,
      });
      expect(result.totalTax).toBe(1500);
      expect(result.payable).toBe(1500);
    });

    test('defaults to zero and ignores negative input', () => {
      expect(calculateFinalTaxSummary(20000, 5000, 0, 0, above).totalTax).toBe(20000);
      expect(calculateFinalTaxSummary(20000, 5000, 0, 0, { ...above, rebateClawback: -50 }).totalTax).toBe(20000);
    });

    test('store applies it to FY 2025-26 and FY 2026-27 but not FY 2024-25', () => {
      const store = makeStore();
      store.commit('setEarlyRedemptionRebateRepayable', 4000);
      expect(store.getters.payableTax2025).toBe(4000);
      expect(store.getters.payableTax2026).toBe(4000);
      expect(store.getters.payableTax2024).toBe(0);
    });

    test('active-year summary follows the selected year', () => {
      const store = makeStore();
      store.commit('setEarlyRedemptionRebateRepayable', 4000);
      store.commit('setCurrentYear', '2024-25');
      expect(store.getters.activeRebateClawback).toBe(0);
      store.commit('setCurrentYear', '2026-27');
      expect(store.getters.activeRebateClawback).toBe(4000);
    });

    test('negative or invalid input is clamped to zero', () => {
      const store = makeStore();
      store.commit('setEarlyRedemptionRebateRepayable', -5);
      expect(store.state.salaries.earlyRedemptionRebateRepayable).toBe(0);
      store.commit('setEarlyRedemptionRebateRepayable', 'abc');
      expect(store.state.salaries.earlyRedemptionRebateRepayable).toBe(0);
    });
  });

  describe('3. per-child disabled dependent allowance (booklet s.1.3 p.3)', () => {
    test('normalizes booleans and counts', () => {
      expect(normalizeDisabledDependentCount(true)).toBe(1);
      expect(normalizeDisabledDependentCount(false)).toBe(0);
      expect(normalizeDisabledDependentCount(undefined)).toBe(0);
      expect(normalizeDisabledDependentCount(null)).toBe(0);
      expect(normalizeDisabledDependentCount(3)).toBe(3);
      expect(normalizeDisabledDependentCount(2.9)).toBe(2);
      expect(normalizeDisabledDependentCount(-4)).toBe(0);
      expect(normalizeDisabledDependentCount('2')).toBe(2);
      expect(normalizeDisabledDependentCount('abc')).toBe(0);
    });

    test('legacy category parent_disabled counts as one dependent', () => {
      expect(resolveDisabledDependentCount({ category: 'parent_disabled' })).toBe(1);
      expect(resolveDisabledDependentCount({ category: 'parent_disabled', disabledDependentCount: 2 })).toBe(2);
    });

    test.each([
      ['FY 2025-26', getTaxFreeThreshold2025, TAX_FREE_THRESHOLDS_2025],
      ['FY 2026-27', getTaxFreeThreshold2026, TAX_FREE_THRESHOLDS_2026],
    ])('%s adds BDT 50,000 per dependent', (_label, getThreshold, table) => {
      const base = table.general;
      expect(getThreshold({ category: 'general' })).toBe(base);
      expect(getThreshold({ category: 'general', disabledDependentCount: 1 })).toBe(base + 50000);
      expect(getThreshold({ category: 'general', disabledDependentCount: 3 })).toBe(base + 150000);
      expect(getThreshold({ category: 'female', disabledDependentCount: 2 })).toBe(table.female + 100000);
    });

    test.each([
      ['FY 2025-26', getTaxFreeThreshold2025],
      ['FY 2026-27', getTaxFreeThreshold2026],
    ])('%s still accepts the previous boolean flag', (_label, getThreshold) => {
      const withFlag = getThreshold({ category: 'general', parentOfDisabled: true });
      const withCount = getThreshold({ category: 'general', disabledDependentCount: 1 });
      expect(withFlag).toBe(withCount);
      expect(getThreshold({ category: 'general', parentOfDisabled: false })).toBe(withCount - 50000);
    });

    test('FY 2024-25 stays a single flat allowance whatever the count', () => {
      const one = getTaxFreeThresholdForYear('2024-25', { category: 'general', parentOfDisabled: true });
      const three = getTaxFreeThresholdForYear('2024-25', { category: 'general', disabledDependentCount: 3 });
      expect(three).toBe(one);
      expect(one).toBe(getTaxFreeThresholdForYear('2024-25', { category: 'general' }) + 50000);
    });

    test('resolveEffectiveProfile carries the count', () => {
      expect(resolveEffectiveProfile({ disabledDependentCount: 2 }).disabledDependentCount).toBe(2);
      expect(resolveEffectiveProfile({ parent_of_disabled: true }).disabledDependentCount).toBe(1);
      expect(resolveEffectiveProfile({}).parentOfDisabled).toBe(false);
    });

    test('store profile normalizes legacy boolean and keeps count in sync', () => {
      const store = makeStore();
      store.commit('updateTaxpayerProfile', { category: 'general', parentOfDisabled: true });
      expect(store.state.salaries.taxpayerProfile.disabledDependentCount).toBe(1);
      store.commit('updateTaxpayerProfile', { category: 'general', disabledDependentCount: 2 });
      expect(store.state.salaries.taxpayerProfile.parentOfDisabled).toBe(true);
      expect(store.getters.taxFreeThreshold2026).toBe(500000);
      store.commit('updateTaxpayerProfile', { category: 'general', disabledDependentCount: 0 });
      expect(store.getters.taxFreeThreshold2026).toBe(400000);
    });

    test('persisted state with the old boolean migrates to a count of 1', () => {
      const migrated = migratePersistedState({
        salaries: { taxpayerProfile: { category: 'female', parentOfDisabled: true } },
      });
      expect(migrated.salaries.taxpayerProfile.disabledDependentCount).toBe(1);
      expect(migrated.salaries.earlyRedemptionRebateRepayable).toBe(0);
    });
  });

  describe('4. unit certificates, ETFs and collective investment schemes (booklet s.1.43 p.22)', () => {
    const rows = [
      { name: 'Mutual fund', amount: 300000 },
      { name: 'ETF', amount: 300000 },
      { name: 'Unit certificate', amount: 400000 },
      { name: 'Collective investment scheme', amount: 500000 },
    ];

    test.each(['2025-26', '2026-27'])('%s: no BDT 500,000 limit', (year) => {
      expect(calculateCappedInvestmentFromList(rows, year)).toBe(1500000);
      expect(getInvestmentCapForType('ETF', year)).toBeNull();
      expect(getInvestmentCapForType('Unit certificate', year)).toBeNull();
      expect(getInvestmentCapForType('Collective investment scheme', year)).toBeNull();
    });

    test.each(['2023-24', '2024-25'])('%s: group still shares the old BDT 500,000 limit', (year) => {
      expect(calculateCappedInvestmentFromList(rows, year)).toBe(500000);
      expect(getInvestmentCapForType('ETF', year)).toBe(500000);
    });

    test('store lists the new rows by default', () => {
      const names = salariesStore.state().investments.map((row) => row.name);
      expect(names).toEqual(expect.arrayContaining(['Unit certificate', 'ETF', 'Collective investment scheme']));
    });

    test('legacy six-row list migrates without copying Others into a new row', () => {
      const legacy = [
        { name: 'DPS', amount: 20000, maximum: 120000 },
        { name: 'Life insurance premium', amount: 0, policyValue: null, maximum: 99999999 },
        { name: 'Stocks', amount: 0, maximum: 99999999 },
        { name: 'Savings certificate', amount: 30000, maximum: 500000 },
        { name: 'Mutual fund', amount: 40000, maximum: 99999999 },
        { name: 'Others', amount: 100000, maximum: 99999999 },
      ];
      const migrated = migratePersistedState({ salaries: { investments: legacy } }).salaries.investments;
      const amountOf = (name) => migrated.find((row) => row.name === name).amount;
      expect(amountOf('Others')).toBe(100000);
      expect(amountOf('Mutual fund')).toBe(40000);
      for (const name of ['Unit certificate', 'ETF', 'Collective investment scheme', DONATION_ROW_NAME]) {
        expect(amountOf(name)).toBe(0);
      }
      for (const year of ['2024-25', '2025-26', '2026-27']) {
        expect(calculateCappedInvestmentFromList(migrated, year)).toBe(
          calculateCappedInvestmentFromList(legacy, year)
        );
      }
    });

    test('a previously saved investment list gains the new rows on migration', () => {
      const migrated = migratePersistedState({
        salaries: { investments: [{ name: 'DPS', amount: 50000, maximum: 120000 }] },
      });
      const names = migrated.salaries.investments.map((row) => row.name);
      expect(names).toEqual(expect.arrayContaining(['ETF', 'Unit certificate', DONATION_ROW_NAME]));
      expect(migrated.salaries.investments.find((row) => row.name === 'DPS').amount).toBe(50000);
    });
  });

  describe('5. FY 2026-27 solar rebate and philanthropic donations (booklet s.1.44(b), s.1.46)', () => {
    test('solar rebate is 5% of the bill', () => {
      expect(calculateSolarElectricityRebate(100000)).toBe(5000);
      expect(calculateSolarElectricityRebate(-1)).toBe(0);
      expect(calculateSolarElectricityRebate('abc')).toBe(0);
    });

    test('solar rebate reduces tax only in FY 2026-27', () => {
      const store = makeStore();
      store.commit('setSolarElectricityBill', 120000);
      expect(store.getters.solarRebate2026).toBe(6000);
      expect(store.getters._finalSummary2026.otherRebate).toBe(6000);
      expect(store.getters._finalSummary2025.otherRebate).toBe(0);
      store.commit('setCurrentYear', '2024-25');
      expect(store.getters.activeSolarRebate).toBe(0);
      store.commit('setCurrentYear', '2026-27');
      expect(store.getters.activeSolarRebate).toBe(6000);
      store.commit('setCurrentYear', '2025-26');
      expect(store.getters.activeSolarRebate).toBe(0);
    });

    test('summary subtracts the solar rebate before the minimum-tax floor', () => {
      const result = calculateFinalTaxSummary(20000, 5000, 0, 10000, {
        taxableIncome: 600000,
        taxFreeThreshold: 400000,
        otherRebate: 4000,
      });
      expect(result.taxAfterRebate).toBe(6000);
      expect(result.totalTax).toBe(6000);
      const floored = calculateFinalTaxSummary(20000, 5000, 0, 10000, {
        taxableIncome: 600000,
        taxFreeThreshold: 400000,
        otherRebate: 9000,
      });
      expect(floored.totalTax).toBe(5000);
      expect(floored.isMinimumTaxApplied).toBe(true);
    });

    test('donations to listed institutions count as eligible investment in FY 2026-27 only', () => {
      const list = [{ name: DONATION_ROW_NAME, amount: 200000 }];
      expect(calculateCappedInvestmentFromList(list, '2026-27')).toBe(200000);
      expect(calculateCappedInvestmentFromList(list, '2025-26')).toBe(0);
      expect(calculateCappedInvestmentFromList(list, '2024-25')).toBe(0);
      expect(calculateCappedInvestmentFromList(list, '2023-24')).toBe(0);
    });

    test('donation rebate follows the normal s.78 limits (no separate cap invented)', () => {
      const eligible = calculateCappedInvestmentFromList([{ name: DONATION_ROW_NAME, amount: 100000 }], '2026-27');
      expect(calculateInvestmentRebateForYear('2026-27', 2000000, eligible)).toBe(10000);
    });

    test('lists the eleven institutions named in the booklet', () => {
      expect(PHILANTHROPIC_INSTITUTIONS).toHaveLength(11);
      expect(PHILANTHROPIC_INSTITUTIONS).toContain('BRAC');
    });
  });

  describe('6. comments match current law (booklet s.1.3 / s.1.4)', () => {
    test('FY 2026-27 thresholds equal FY 2025-26 (one column for AY 2026-27 & 2027-28)', () => {
      expect(TAX_FREE_THRESHOLDS_2026).toEqual(TAX_FREE_THRESHOLDS_2025);
    });

    test('FY 2026-27 rebate uses 10% / BDT 750,000, same as FY 2025-26', () => {
      expect(calculateInvestmentRebate2026(50000000, 100000000)).toBe(750000);
      expect(calculateInvestmentRebate2026(50000000, 1000000)).toBe(100000);
    });
  });
});
